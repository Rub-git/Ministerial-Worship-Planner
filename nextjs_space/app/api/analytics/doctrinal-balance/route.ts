/**
 * =============================================================================
 * PHASE 7 + 7C: DOCTRINAL BALANCE API
 * /api/analytics/doctrinal-balance?year=2026
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  DoctrinalBalanceResult,
  MonthlyEmphasisBreakdown,
  SpecialEventsCount,
  SeriesCoverage,
  BiblicalDistribution,
  BookCategoryDistribution,
  CategoryInactivity,
  YearlyBiblicalTrend,
  calculatePercentageDistribution,
  countsToDistribution,
  generateAdvisoryInsights,
  MONTH_NAMES,
  SPECIAL_THEME_LABELS,
} from '@/lib/doctrinal-analytics';
import {
  classifyScripture,
  getAllCategories,
  CATEGORY_LABELS,
} from '@/lib/scripture-classifier';
import { HymnCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationId;

    // Parse year from query
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    // Date range for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // =============================================================================
    // 1. FETCH ALL PROGRAMS FOR THE YEAR
    // =============================================================================
    const programs = await prisma.program.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            hymnPair: {
              select: {
                id: true,
                category: true,
                numberEn: true,
                titleEn: true,
                numberEs: true,
                titleEs: true,
              },
            },
          },
        },
        series: true,
      },
      orderBy: { date: 'asc' },
    });

    const totalPrograms = programs.length;

    // =============================================================================
    // 2. AGGREGATE HYMN CATEGORIES
    // =============================================================================
    const categoryCounts: Record<string, number> = {};
    const closingCategoryCounts: Record<string, number> = {};
    let totalHymnsUsed = 0;

    for (const program of programs) {
      for (const item of program.items) {
        if (item.hymnPair?.category) {
          const cat = item.hymnPair.category;
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          totalHymnsUsed++;

          // Check if this is a closing hymn
          if (
            item.sectionKey === 'CLOSING_HYMN' ||
            item.sectionKey === 'closingHymn' ||
            item.sectionKey.toLowerCase().includes('closing')
          ) {
            closingCategoryCounts[cat] = (closingCategoryCounts[cat] || 0) + 1;
          }
        }
      }
    }

    const categoryDistribution = calculatePercentageDistribution(categoryCounts);
    const categoryDetails = countsToDistribution(categoryCounts);
    
    const closingCategoryDistribution = calculatePercentageDistribution(closingCategoryCounts);
    const closingCategoryDetails = countsToDistribution(closingCategoryCounts);

    // =============================================================================
    // 3. MONTHLY EMPHASIS BREAKDOWN
    // =============================================================================
    const monthlyEmphases = await prisma.monthlyEmphasis.findMany({
      where: {
        organizationId,
        year,
      },
      orderBy: { month: 'asc' },
    });

    const monthlyEmphasisBreakdown: MonthlyEmphasisBreakdown[] = [];
    let monthsWithEmphasis = 0;

    for (let month = 1; month <= 12; month++) {
      const emphasis = monthlyEmphases.find((e: { month: number }) => e.month === month);
      const programsInMonth = programs.filter((p: { date: Date }) => {
        const d = new Date(p.date);
        return d.getMonth() + 1 === month;
      });

      if (emphasis) monthsWithEmphasis++;

      monthlyEmphasisBreakdown.push({
        month,
        monthName: MONTH_NAMES.en[month - 1],
        emphasisKey: emphasis?.emphasisKey || null,
        emphasisTitle: emphasis?.title || null,
        programCount: programsInMonth.length,
      });
    }

    const emphasisUsageRate = Math.round((monthsWithEmphasis / 12) * 100);

    // =============================================================================
    // 4. SPECIAL EVENTS COUNT
    // =============================================================================
    const specialEventCounts: Record<string, number> = {};
    let totalSpecialEvents = 0;

    for (const program of programs) {
      if (program.isSpecialEvent && program.specialTheme) {
        specialEventCounts[program.specialTheme] = 
          (specialEventCounts[program.specialTheme] || 0) + 1;
        totalSpecialEvents++;
      }
    }

    const specialEventsDetails: SpecialEventsCount[] = Object.entries(specialEventCounts)
      .map(([theme, count]) => ({
        theme,
        labelEn: SPECIAL_THEME_LABELS[theme]?.en || theme,
        labelEs: SPECIAL_THEME_LABELS[theme]?.es || theme,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // =============================================================================
    // 5. SERIES COVERAGE
    // =============================================================================
    const seriesMap = new Map<string, {
      seriesId: string;
      seriesTitle: string;
      theme: string | null;
      totalWeeks: number;
      completedWeeks: Set<number>;
    }>();

    for (const program of programs) {
      if (program.seriesId && program.seriesWeek) {
        if (!seriesMap.has(program.seriesId)) {
          seriesMap.set(program.seriesId, {
            seriesId: program.seriesId,
            seriesTitle: program.seriesTitle || program.series?.title || 'Unknown Series',
            theme: program.series?.theme || null,
            totalWeeks: program.seriesTotal || program.series?.totalWeeks || 4,
            completedWeeks: new Set(),
          });
        }
        seriesMap.get(program.seriesId)!.completedWeeks.add(program.seriesWeek);
      }
    }

    const seriesCoverage: SeriesCoverage[] = Array.from(seriesMap.values()).map(s => ({
      seriesId: s.seriesId,
      seriesTitle: s.seriesTitle,
      theme: s.theme,
      totalWeeks: s.totalWeeks,
      completedWeeks: s.completedWeeks.size,
      completionRate: Math.round((s.completedWeeks.size / s.totalWeeks) * 100),
    }));

    const totalSeriesPrograms = programs.filter((p: { seriesId: string | null }) => p.seriesId).length;
    const avgCompletionRate = seriesCoverage.length > 0
      ? Math.round(seriesCoverage.reduce((sum, s) => sum + s.completionRate, 0) / seriesCoverage.length)
      : 0;

    // =============================================================================
    // 6. PHASE 7C (PASTORAL LEVEL): BIBLICAL DISTRIBUTION ANALYSIS
    // =============================================================================
    let otCount = 0;
    let ntCount = 0;
    const bookCategoryCounts: Record<string, number> = {};
    let totalScriptureReferences = 0;
    
    // Track last usage date for PROPHETS and APOCALYPTIC only
    const criticalCategoryLastUsed: Record<string, Date> = {};

    for (const program of programs) {
      // Analyze main scripture reference
      if (program.mainScriptureReference) {
        const classification = classifyScripture(program.mainScriptureReference);
        if (classification) {
          totalScriptureReferences++;
          
          // Testament count
          if (classification.testament === 'OT') {
            otCount++;
          } else {
            ntCount++;
          }
          
          // Category count
          bookCategoryCounts[classification.category] = 
            (bookCategoryCounts[classification.category] || 0) + 1;
          
          // Track last usage for PROPHETS and APOCALYPTIC
          if (classification.category === 'PROPHETS' || classification.category === 'APOCALYPTIC') {
            const programDate = new Date(program.date);
            if (!criticalCategoryLastUsed[classification.category] || 
                programDate > criticalCategoryLastUsed[classification.category]) {
              criticalCategoryLastUsed[classification.category] = programDate;
            }
          }
        }
      }
      
      // Also check cover verses for scripture references
      const coverVerse = program.coverVerseEn || program.coverVerseEs;
      if (coverVerse) {
        const coverClass = classifyScripture(coverVerse);
        if (coverClass) {
          totalScriptureReferences++;
          
          if (coverClass.testament === 'OT') {
            otCount++;
          } else {
            ntCount++;
          }
          
          bookCategoryCounts[coverClass.category] = 
            (bookCategoryCounts[coverClass.category] || 0) + 1;
          
          // Track last usage for PROPHETS and APOCALYPTIC
          if (coverClass.category === 'PROPHETS' || coverClass.category === 'APOCALYPTIC') {
            const programDate = new Date(program.date);
            if (!criticalCategoryLastUsed[coverClass.category] || 
                programDate > criticalCategoryLastUsed[coverClass.category]) {
              criticalCategoryLastUsed[coverClass.category] = programDate;
            }
          }
        }
      }
    }

    // Calculate biblical distribution
    const totalTestamentRefs = otCount + ntCount;
    const biblicalDistribution: BiblicalDistribution = {
      OT: totalTestamentRefs > 0 ? Math.round((otCount / totalTestamentRefs) * 1000) / 10 : 0,
      NT: totalTestamentRefs > 0 ? Math.round((ntCount / totalTestamentRefs) * 1000) / 10 : 0,
      otCount,
      ntCount,
    };

    // Book category distribution
    const allCategories = getAllCategories();
    const bookCategoryDetails: BookCategoryDistribution[] = allCategories.map(cat => {
      const count = bookCategoryCounts[cat] || 0;
      return {
        category: cat,
        count,
        percentage: totalScriptureReferences > 0 
          ? Math.round((count / totalScriptureReferences) * 1000) / 10 
          : 0,
      };
    }).sort((a, b) => b.count - a.count);

    const bookCategoryDistribution: Record<string, number> = {};
    for (const detail of bookCategoryDetails) {
      bookCategoryDistribution[detail.category] = detail.percentage;
    }

    // =============================================================================
    // 7. 18-MONTH INACTIVITY FOR PROPHETS AND APOCALYPTIC ONLY
    // =============================================================================
    const now = new Date();
    const criticalCategoryInactivity: CategoryInactivity[] = ['PROPHETS', 'APOCALYPTIC'].map(cat => {
      const lastUsed = criticalCategoryLastUsed[cat] || null;
      let monthsInactive = 0;
      
      if (!lastUsed) {
        // Never used - count from start of year
        monthsInactive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      } else {
        monthsInactive = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30));
      }
      
      return {
        category: cat,
        lastUsedDate: lastUsed,
        monthsInactive: Math.max(0, monthsInactive),
      };
    });

    // =============================================================================
    // 8. 3-YEAR ROLLING TREND
    // =============================================================================
    const threeYearTrend: YearlyBiblicalTrend[] = [];
    
    for (let trendYear = year - 2; trendYear <= year; trendYear++) {
      const trendStart = new Date(trendYear, 0, 1);
      const trendEnd = new Date(trendYear, 11, 31, 23, 59, 59);
      
      const trendPrograms = await prisma.program.findMany({
        where: {
          organizationId,
          date: { gte: trendStart, lte: trendEnd },
        },
        select: {
          mainScriptureReference: true,
          coverVerseEn: true,
          coverVerseEs: true,
        },
      });
      
      let trendOT = 0, trendNT = 0;
      const trendCategoryCounts: Record<string, number> = {};
      let trendTotal = 0;
      
      for (const prog of trendPrograms) {
        const refs = [prog.mainScriptureReference, prog.coverVerseEn, prog.coverVerseEs].filter(Boolean);
        for (const ref of refs) {
          const cls = classifyScripture(ref as string);
          if (cls) {
            trendTotal++;
            if (cls.testament === 'OT') trendOT++;
            else trendNT++;
            trendCategoryCounts[cls.category] = (trendCategoryCounts[cls.category] || 0) + 1;
          }
        }
      }
      
      threeYearTrend.push({
        year: trendYear,
        otPercentage: trendTotal > 0 ? Math.round((trendOT / trendTotal) * 1000) / 10 : 0,
        ntPercentage: trendTotal > 0 ? Math.round((trendNT / trendTotal) * 1000) / 10 : 0,
        epistlesPercentage: trendTotal > 0 ? Math.round(((trendCategoryCounts['EPISTLES'] || 0) / trendTotal) * 1000) / 10 : 0,
        gospelsPercentage: trendTotal > 0 ? Math.round(((trendCategoryCounts['GOSPELS'] || 0) / trendTotal) * 1000) / 10 : 0,
        totalReferences: trendTotal,
      });
    }

    // =============================================================================
    // 9. GENERATE ADVISORY INSIGHTS (with biblical data)
    // =============================================================================
    const advisoryInsights = generateAdvisoryInsights(
      categoryDetails, 
      closingCategoryDetails,
      {
        biblicalDistribution,
        bookCategoryDetails,
        criticalCategoryInactivity,
      }
    );

    // =============================================================================
    // BUILD RESPONSE
    // =============================================================================
    const result: DoctrinalBalanceResult = {
      year,
      organizationId,
      totalPrograms,
      totalHymnsUsed,
      
      categoryDistribution,
      categoryDetails,
      
      closingCategoryDistribution,
      closingCategoryDetails,
      
      monthlyEmphasisBreakdown,
      emphasisUsageRate,
      
      specialEventsCount: specialEventCounts,
      specialEventsDetails,
      totalSpecialEvents,
      
      seriesCoverage,
      totalSeriesPrograms,
      seriesCompletionRate: avgCompletionRate,
      
      // Phase 7C (Pastoral Level): Biblical data
      biblicalDistribution,
      bookCategoryDistribution,
      bookCategoryDetails,
      totalScriptureReferences,
      
      // 18-month inactivity (PROPHETS and APOCALYPTIC only)
      criticalCategoryInactivity,
      
      // 3-year rolling trend
      threeYearTrend,
      
      advisoryInsights,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Doctrinal Balance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctrinal balance data' },
      { status: 500 }
    );
  }
}
