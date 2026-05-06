/**
 * Phase 4: Sermon Series Engine - Test Script
 * 
 * Demonstrates the 4-week "Living by Faith in the Last Days" sermon series
 * with thematic progression and scoring analysis.
 */

import { PrismaClient } from '@prisma/client';
import {
  getSeriesConfig,
  getProgressionCategoryForWeek,
  isPrimaryCategoryForSeries,
  isRelatedCategoryForSeries,
  matchesSeriesProgression,
  SERIES_PRIMARY_BOOST,
  SERIES_RELATED_BOOST,
  SERIES_PROGRESSION_BOOST,
  SERIES_CONTINUITY_PENALTY,
} from '../lib/sermon-series';

const prisma = new PrismaClient();

// Scoring constants
const ADVENTIST_SABBATH_SECOND_COMING_BONUS = 10;
const CATEGORY_MATCH_BONUS = 20;
const BILINGUAL_BONUS = 10;

interface HymnData {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
  category: string | null;
}

interface ScoredHymn extends HymnData {
  score: number;
  reasons: string[];
}

function scoreHymnForSeries(
  hymn: HymnData,
  sectionKey: string,
  seriesTheme: string,
  seriesWeek: number,
  seriesTotal: number,
  previousWeekCategory: string | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const category = hymn.category?.toUpperCase() ?? 'GENERAL';
  const seriesConfig = getSeriesConfig(seriesTheme);
  const isClosing = sectionKey.includes('closing');

  // Adventist SABBATH bonus for SECOND_COMING
  if (category === 'SECOND_COMING') {
    score += ADVENTIST_SABBATH_SECOND_COMING_BONUS;
    reasons.push(`SDA_SABBATH(+${ADVENTIST_SABBATH_SECOND_COMING_BONUS})`);
  }

  // Section category match (closing hymn priorities)
  const closingCategories = ['SECOND_COMING', 'HOPE', 'DEDICATION'];
  if (isClosing && closingCategories.includes(category)) {
    score += CATEGORY_MATCH_BONUS;
    reasons.push(`CATEGORY(+${CATEGORY_MATCH_BONUS})`);
  }

  // SERIES ENGINE SCORING
  if (seriesConfig) {
    // Primary category boost
    if (isPrimaryCategoryForSeries(category, seriesConfig)) {
      score += SERIES_PRIMARY_BOOST;
      reasons.push(`SERIES_1ST(+${SERIES_PRIMARY_BOOST})`);
    }
    // Related category boost
    else if (isRelatedCategoryForSeries(category, seriesConfig)) {
      score += SERIES_RELATED_BOOST;
      reasons.push(`SERIES_2ND(+${SERIES_RELATED_BOOST})`);
    }

    // Week progression match
    if (matchesSeriesProgression(category, seriesConfig, seriesWeek, seriesTotal)) {
      score += SERIES_PROGRESSION_BOOST;
      reasons.push(`SERIES_PROG(+${SERIES_PROGRESSION_BOOST})`);
    }

    // Continuity penalty (avoid same category as previous week)
    if (previousWeekCategory && seriesWeek > 1 && category === previousWeekCategory.toUpperCase()) {
      score += SERIES_CONTINUITY_PENALTY;
      reasons.push(`SERIES_REPEAT(${SERIES_CONTINUITY_PENALTY})`);
    }
  }

  // Bilingual bonus
  if (hymn.numberEn && hymn.titleEn) {
    score += BILINGUAL_BONUS;
    reasons.push(`BILINGUAL(+${BILINGUAL_BONUS})`);
  }

  return { score, reasons };
}

async function generateWeekProgram(
  hymns: HymnData[],
  seriesTheme: string,
  seriesWeek: number,
  seriesTotal: number,
  previousWeekCategory: string | null
): Promise<{ closingHymn: ScoredHymn; topCandidates: ScoredHymn[] }> {
  // Score all hymns for closing section
  const scored: ScoredHymn[] = hymns.map(h => {
    const { score, reasons } = scoreHymnForSeries(
      h,
      'dw_closing_hymn',
      seriesTheme,
      seriesWeek,
      seriesTotal,
      previousWeekCategory
    );
    return { ...h, score, reasons };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  return {
    closingHymn: scored[0],
    topCandidates: scored.slice(0, 5),
  };
}

async function runSeriesTest() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     PHASE 4: SERMON SERIES ENGINE - TEST REPORT               ║');
  console.log('║     "Living by Faith in the Last Days" (4 Weeks)              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`Generated: ${new Date().toISOString()}`);

  // Fetch hymns
  const hymns: HymnData[] = await prisma.hymnPair.findMany({
    select: {
      id: true,
      numberEs: true,
      titleEs: true,
      numberEn: true,
      titleEn: true,
      category: true,
    },
  });

  const seriesTheme = 'FAITH';
  const seriesTotal = 4;
  const seriesConfig = getSeriesConfig(seriesTheme);

  console.log('\n📖 SERIES CONFIGURATION:');
  console.log('─'.repeat(70));
  console.log(`  Title: "Living by Faith in the Last Days"`);
  console.log(`  Theme: ${seriesTheme}`);
  console.log(`  Total Weeks: ${seriesTotal}`);
  console.log(`  Primary Categories: ${seriesConfig?.primaryCategories.join(', ')}`);
  console.log(`  Related Categories: ${seriesConfig?.relatedCategories.join(', ')}`);
  console.log(`  Week Progression: ${seriesConfig?.weekProgression.join(' → ')}`);

  console.log('\n📈 SCORING WEIGHTS:');
  console.log('─'.repeat(70));
  console.log(`  Primary Category Boost: +${SERIES_PRIMARY_BOOST}`);
  console.log(`  Related Category Boost: +${SERIES_RELATED_BOOST}`);
  console.log(`  Progression Match Boost: +${SERIES_PROGRESSION_BOOST}`);
  console.log(`  Continuity Penalty (same as prev week): ${SERIES_CONTINUITY_PENALTY}`);
  console.log(`  Adventist SABBATH SECOND_COMING: +${ADVENTIST_SABBATH_SECOND_COMING_BONUS}`);
  console.log(`  Bilingual Bonus: +${BILINGUAL_BONUS}`);

  console.log('\n' + '='.repeat(70));
  console.log('  WEEK-BY-WEEK PROGRAM GENERATION');
  console.log('='.repeat(70));

  let previousWeekCategory: string | null = null;
  const weekResults: Array<{ week: number; expectedCat: string | null; selected: ScoredHymn }> = [];

  for (let week = 1; week <= seriesTotal; week++) {
    const expectedCategory = getProgressionCategoryForWeek(seriesConfig, week, seriesTotal);
    
    console.log(`\n📅 WEEK ${week}: Expected Category = ${expectedCategory}`);
    console.log('-'.repeat(60));
    
    if (previousWeekCategory) {
      console.log(`  Previous week closing category: ${previousWeekCategory}`);
      console.log(`  (Continuity penalty applies if same category selected)`);
    }

    const { closingHymn, topCandidates } = await generateWeekProgram(
      hymns,
      seriesTheme,
      week,
      seriesTotal,
      previousWeekCategory
    );

    console.log('\n  Top 5 Closing Hymn Candidates:');
    topCandidates.forEach((h, idx) => {
      const enInfo = h.numberEn ? `#${h.numberEn} ${h.titleEn}` : '(ES only)';
      const marker = idx === 0 ? '✅' : '  ';
      console.log(`  ${marker} ${idx + 1}. [${h.category ?? 'N/A'}] #${h.numberEs} ${h.titleEs}`);
      console.log(`       ${enInfo}`);
      console.log(`       Score: ${h.score} | ${h.reasons.join(' ')}`);
    });

    console.log(`\n  ✅ SELECTED CLOSING HYMN: #${closingHymn.numberEs} ${closingHymn.titleEs}`);
    console.log(`     Category: ${closingHymn.category} | Total Score: ${closingHymn.score}`);

    weekResults.push({
      week,
      expectedCat: expectedCategory,
      selected: closingHymn,
    });

    // Update previous week category for continuity
    previousWeekCategory = closingHymn.category;
  }

  // Summary Table
  console.log('\n' + '='.repeat(70));
  console.log('  SERIES SUMMARY: "Living by Faith in the Last Days"');
  console.log('='.repeat(70));
  console.log('\n  Week | Expected  | Selected  | Hymn Title                    | Score');
  console.log('  ' + '-'.repeat(66));
  
  weekResults.forEach(({ week, expectedCat, selected }) => {
    const matchIcon = selected.category?.toUpperCase() === expectedCat ? '✅' : '⚠️';
    const title = selected.titleEs.substring(0, 28).padEnd(28);
    console.log(
      `  ${week.toString().padStart(4)} | ${(expectedCat ?? 'N/A').padEnd(9)} | ${(selected.category ?? 'N/A').padEnd(9)} | ${title} | ${selected.score}`
    );
  });

  // Progression Analysis
  const progressionMatch = weekResults.filter(
    r => r.selected.category?.toUpperCase() === r.expectedCat
  ).length;
  
  console.log('\n📊 PROGRESSION ANALYSIS:');
  console.log('─'.repeat(70));
  console.log(`  • Expected Progression: ${seriesConfig?.weekProgression.join(' → ')}`);
  console.log(`  • Actual Progression: ${weekResults.map(r => r.selected.category).join(' → ')}`);
  console.log(`  • Progression Match: ${progressionMatch}/${seriesTotal} weeks (${Math.round(progressionMatch / seriesTotal * 100)}%)`);
  
  // Check for continuity issues
  let continuityViolations = 0;
  for (let i = 1; i < weekResults.length; i++) {
    if (weekResults[i].selected.category === weekResults[i - 1].selected.category) {
      continuityViolations++;
    }
  }
  console.log(`  • Category Repetitions: ${continuityViolations} (same category in consecutive weeks)`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Phase 4 Test Complete');
  console.log('\nKey Observations:');
  console.log('  • Series engine layers ON TOP of Adventist doctrinal weighting');
  console.log('  • Primary categories receive +15 boost');
  console.log('  • Week progression matching adds +10 additional boost');
  console.log('  • Continuity penalty (-12) discourages same category in consecutive weeks');
  console.log('  • 28-day history filter still applies (not shown in this simulation)');
  console.log('='.repeat(70));

  await prisma.$disconnect();
}

runSeriesTest().catch(console.error);
