/**
 * =============================================================================
 * PHASE 7: DOCTRINAL BALANCE ENGINE
 * =============================================================================
 * 
 * Provides aggregation logic for analyzing doctrinal distribution across:
 * - Hymn categories
 * - Closing hymn categories
 * - Monthly emphasis usage
 * - Special event distribution
 * - Series coverage
 * 
 * Advisory-only system - does NOT auto-adjust anything.
 */

import { HymnCategory } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface CategoryDistribution {
  category: HymnCategory;
  count: number;
  percentage: number;
}

export interface MonthlyEmphasisBreakdown {
  month: number;
  monthName: string;
  emphasisKey: string | null;
  emphasisTitle: string | null;
  programCount: number;
}

export interface SpecialEventsCount {
  theme: string;
  labelEn: string;
  labelEs: string;
  count: number;
}

export interface SeriesCoverage {
  seriesId: string;
  seriesTitle: string;
  theme: string | null;
  totalWeeks: number;
  completedWeeks: number;
  completionRate: number;
}

// Phase 7C (Pastoral Level): Biblical distribution types
export interface BiblicalDistribution {
  OT: number;  // percentage
  NT: number;  // percentage
  otCount: number;
  ntCount: number;
}

export interface BookCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

// 18-month inactivity tracking (PROPHETS and APOCALYPTIC only)
export interface CategoryInactivity {
  category: string;
  lastUsedDate: Date | null;
  monthsInactive: number;
}

// 3-year rolling trend
export interface YearlyBiblicalTrend {
  year: number;
  otPercentage: number;
  ntPercentage: number;
  epistlesPercentage: number;
  gospelsPercentage: number;
  totalReferences: number;
}

export interface DoctrinalBalanceResult {
  year: number;
  organizationId: string;
  totalPrograms: number;
  totalHymnsUsed: number;
  
  // Category distributions
  categoryDistribution: Record<string, number>; // percentage by category
  categoryDetails: CategoryDistribution[];
  
  // Closing hymn analysis
  closingCategoryDistribution: Record<string, number>;
  closingCategoryDetails: CategoryDistribution[];
  
  // Monthly emphasis breakdown
  monthlyEmphasisBreakdown: MonthlyEmphasisBreakdown[];
  emphasisUsageRate: number; // % of months with emphasis set
  
  // Special events
  specialEventsCount: Record<string, number>;
  specialEventsDetails: SpecialEventsCount[];
  totalSpecialEvents: number;
  
  // Series coverage
  seriesCoverage: SeriesCoverage[];
  totalSeriesPrograms: number;
  seriesCompletionRate: number;
  
  // Phase 7C (Pastoral Level): Biblical-Doctrinal Intelligence
  biblicalDistribution: BiblicalDistribution;
  bookCategoryDistribution: Record<string, number>; // percentage by scripture category
  bookCategoryDetails: BookCategoryDistribution[];
  totalScriptureReferences: number;
  
  // 18-month inactivity (PROPHETS and APOCALYPTIC only)
  criticalCategoryInactivity: CategoryInactivity[];
  
  // 3-year rolling trend
  threeYearTrend: YearlyBiblicalTrend[];
  
  // Advisory insights
  advisoryInsights: AdvisoryInsight[];
}

export interface AdvisoryInsight {
  type: 'WARNING' | 'INFO' | 'SUCCESS';
  category: string;
  messageEn: string;
  messageEs: string;
  percentage?: number;
  suggestion?: {
    en: string;
    es: string;
  };
}

// =============================================================================
// THRESHOLDS FOR BALANCE DETECTION
// =============================================================================

export const BALANCE_THRESHOLDS = {
  MIN_CATEGORY_PERCENTAGE: 5,   // Alert if any category < 5%
  MAX_CATEGORY_PERCENTAGE: 35,  // Alert if any category > 35%
  HEALTHY_MIN: 8,               // Ideal minimum
  HEALTHY_MAX: 25,              // Ideal maximum
};

// =============================================================================
// MONTH NAMES (Bilingual)
// =============================================================================

export const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 
       'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

// =============================================================================
// SPECIAL THEME LABELS (for display)
// =============================================================================

export const SPECIAL_THEME_LABELS: Record<string, { en: string; es: string }> = {
  EVANGELISM: { en: 'Evangelism', es: 'Evangelismo' },
  YOUTH_DAY: { en: 'Youth Day', es: 'Día de la Juventud' },
  REFORMATION: { en: 'Reformation', es: 'Reforma' },
  STEWARDSHIP: { en: 'Stewardship', es: 'Mayordomía' },
  WOMENS_DAY: { en: "Women's Day", es: 'Día de la Mujer' },
  MENS_DAY: { en: "Men's Day", es: 'Día del Hombre' },
  FAMILY_DAY: { en: 'Family Day', es: 'Día de la Familia' },
  COMMUNION: { en: 'Communion', es: 'Santa Cena' },
  HEALTH_EMPHASIS: { en: 'Health Emphasis', es: 'Énfasis en Salud' },
  EDUCATION: { en: 'Education', es: 'Educación' },
  MUSIC_MINISTRY: { en: 'Music Ministry', es: 'Ministerio de Música' },
};

// =============================================================================
// ADVISORY INSIGHT GENERATION
// =============================================================================

/**
 * Generate advisory insights based on category distribution and biblical data
 * PHASE 7C (Pastoral Level): Simplified, focused alerts
 */
export function generateAdvisoryInsights(
  categoryDetails: CategoryDistribution[],
  closingCategoryDetails: CategoryDistribution[],
  biblicalData?: {
    biblicalDistribution: BiblicalDistribution;
    bookCategoryDetails: BookCategoryDistribution[];
    criticalCategoryInactivity?: CategoryInactivity[];
  }
): AdvisoryInsight[] {
  const insights: AdvisoryInsight[] = [];
  
  // Check for over-represented categories (> 35%)
  for (const cat of categoryDetails) {
    if (cat.percentage > BALANCE_THRESHOLDS.MAX_CATEGORY_PERCENTAGE) {
      const alternatives = getBalancingCategories(cat.category);
      insights.push({
        type: 'WARNING',
        category: cat.category,
        messageEn: `${cat.category} emphasis is very high this year (${cat.percentage.toFixed(1)}%).`,
        messageEs: `El énfasis en ${cat.category} es muy alto este año (${cat.percentage.toFixed(1)}%).`,
        percentage: cat.percentage,
        suggestion: {
          en: `Consider balancing with ${alternatives.join(', ')} themes.`,
          es: `Considere equilibrar con temas de ${alternatives.join(', ')}.`,
        },
      });
    }
  }
  
  // Check for under-represented categories (< 5%)
  for (const cat of categoryDetails) {
    if (cat.percentage < BALANCE_THRESHOLDS.MIN_CATEGORY_PERCENTAGE && cat.count > 0) {
      insights.push({
        type: 'WARNING',
        category: cat.category,
        messageEn: `${cat.category} is under-represented this year (${cat.percentage.toFixed(1)}%).`,
        messageEs: `${cat.category} está sub-representado este año (${cat.percentage.toFixed(1)}%).`,
        percentage: cat.percentage,
        suggestion: {
          en: `Consider including more ${cat.category} hymns in upcoming programs.`,
          es: `Considere incluir más himnos de ${cat.category} en los próximos programas.`,
        },
      });
    }
  }
  
  // Check closing hymn diversity
  const closingSorted = [...closingCategoryDetails].sort((a, b) => b.percentage - a.percentage);
  if (closingSorted.length > 0 && closingSorted[0].percentage > 40) {
    insights.push({
      type: 'INFO',
      category: 'CLOSING_HYMNS',
      messageEn: `Closing hymns are predominantly ${closingSorted[0].category} (${closingSorted[0].percentage.toFixed(1)}%).`,
      messageEs: `Los himnos de cierre son predominantemente ${closingSorted[0].category} (${closingSorted[0].percentage.toFixed(1)}%).`,
      percentage: closingSorted[0].percentage,
      suggestion: {
        en: 'Consider varying closing hymn themes for doctrinal diversity.',
        es: 'Considere variar los temas de himnos de cierre para diversidad doctrinal.',
      },
    });
  }
  
  // Positive insight if well-balanced
  const withinHealthyRange = categoryDetails.filter(
    c => c.percentage >= BALANCE_THRESHOLDS.HEALTHY_MIN && 
         c.percentage <= BALANCE_THRESHOLDS.HEALTHY_MAX
  );
  
  if (withinHealthyRange.length >= 5) {
    insights.push({
      type: 'SUCCESS',
      category: 'OVERALL',
      messageEn: `Good doctrinal balance! ${withinHealthyRange.length} categories are within healthy range.`,
      messageEs: `¡Buen equilibrio doctrinal! ${withinHealthyRange.length} categorías están en rango saludable.`,
    });
  }
  
  // Check for missing core Adventist categories
  const coreCategories: HymnCategory[] = ['SECOND_COMING', 'SABBATH', 'FAITH', 'SALVATION', 'HOPE'];
  const missingCore = coreCategories.filter(
    core => !categoryDetails.find(c => c.category === core && c.count > 0)
  );
  
  if (missingCore.length > 0) {
    insights.push({
      type: 'WARNING',
      category: 'CORE_DOCTRINE',
      messageEn: `Core Adventist themes missing: ${missingCore.join(', ')}.`,
      messageEs: `Temas adventistas fundamentales ausentes: ${missingCore.join(', ')}.`,
      suggestion: {
        en: 'These are essential for maintaining Adventist identity in worship.',
        es: 'Estos son esenciales para mantener la identidad adventista en la adoración.',
      },
    });
  }
  
  // ==========================================================================
  // PHASE 7C (PASTORAL LEVEL): BIBLICAL DISTRIBUTION INSIGHTS
  // ==========================================================================
  if (biblicalData) {
    const { biblicalDistribution, bookCategoryDetails, criticalCategoryInactivity } = biblicalData;
    
    // 1. OT < 25%
    if (biblicalDistribution.OT < 25 && (biblicalDistribution.otCount + biblicalDistribution.ntCount) > 0) {
      insights.push({
        type: 'WARNING',
        category: 'BIBLICAL_BALANCE',
        messageEn: `Old Testament usage is low (${biblicalDistribution.OT.toFixed(1)}%).`,
        messageEs: `El uso del Antiguo Testamento es bajo (${biblicalDistribution.OT.toFixed(1)}%).`,
        percentage: biblicalDistribution.OT,
        suggestion: {
          en: 'Consider including more Psalms, Prophets, and Torah references to enrich worship.',
          es: 'Considere incluir más referencias de Salmos, Profetas y Torá para enriquecer la adoración.',
        },
      });
    }
    
    // 2. EPISTLES > 45% annual
    const epistlesData = bookCategoryDetails.find(c => c.category === 'EPISTLES');
    if (epistlesData && epistlesData.percentage > 45) {
      insights.push({
        type: 'WARNING',
        category: 'EPISTLES_OVERUSE',
        messageEn: `Epistles category is over-represented (${epistlesData.percentage.toFixed(1)}%).`,
        messageEs: `La categoría de Epístolas está sobre-representada (${epistlesData.percentage.toFixed(1)}%).`,
        percentage: epistlesData.percentage,
        suggestion: {
          en: 'Balance with Gospels, Prophets, and Psalms for broader biblical foundation.',
          es: 'Equilibre con Evangelios, Profetas y Salmos para una base bíblica más amplia.',
        },
      });
    }
    
    // 3. GOSPELS < 15%
    const gospelsData = bookCategoryDetails.find(c => c.category === 'GOSPELS');
    if (gospelsData && gospelsData.percentage < 15 && gospelsData.count > 0) {
      insights.push({
        type: 'WARNING',
        category: 'GOSPELS_LOW',
        messageEn: `Gospels usage is low (${gospelsData.percentage.toFixed(1)}%).`,
        messageEs: `El uso de los Evangelios es bajo (${gospelsData.percentage.toFixed(1)}%).`,
        percentage: gospelsData.percentage,
        suggestion: {
          en: 'The life and teachings of Jesus are central to worship. Consider more Gospel references.',
          es: 'La vida y enseñanzas de Jesús son centrales en la adoración. Considere más referencias de los Evangelios.',
        },
      });
    }
    
    // 4. PROPHETS or APOCALYPTIC unused for 18+ months
    if (criticalCategoryInactivity) {
      for (const inactivity of criticalCategoryInactivity) {
        if (inactivity.monthsInactive >= 18) {
          const categoryLabelEn = inactivity.category === 'PROPHETS' ? 'Prophets' : 'Apocalyptic';
          const categoryLabelEs = inactivity.category === 'PROPHETS' ? 'Profetas' : 'Apocalíptico';
          insights.push({
            type: 'WARNING',
            category: `${inactivity.category}_INACTIVE`,
            messageEn: `${categoryLabelEn} scriptures unused for ${inactivity.monthsInactive} months.`,
            messageEs: `Escrituras de ${categoryLabelEs} sin usar por ${inactivity.monthsInactive} meses.`,
            suggestion: {
              en: `${categoryLabelEn} literature is vital to Adventist eschatology. Consider incorporating Daniel, Isaiah, or Revelation.`,
              es: `La literatura ${categoryLabelEs === 'Profetas' ? 'profética' : 'apocalíptica'} es vital para la escatología adventista. Considere incorporar Daniel, Isaías o Apocalipsis.`,
            },
          });
        }
      }
    }
    
    // Positive insight if good biblical balance
    const hasGoodOT = biblicalDistribution.OT >= 30;
    const hasGoodNT = biblicalDistribution.NT >= 30;
    const epistlesOk = !epistlesData || epistlesData.percentage <= 45;
    const gospelsOk = !gospelsData || gospelsData.percentage >= 15 || gospelsData.count === 0;
    
    if (hasGoodOT && hasGoodNT && epistlesOk && gospelsOk) {
      insights.push({
        type: 'SUCCESS',
        category: 'BIBLICAL_BALANCE',
        messageEn: 'Good biblical balance between Old and New Testament references!',
        messageEs: '¡Buen equilibrio bíblico entre referencias del Antiguo y Nuevo Testamento!',
      });
    }
  }
  
  return insights;
}

/**
 * Get suggested balancing categories for an over-represented category
 */
function getBalancingCategories(overCategory: HymnCategory): string[] {
  const balanceMap: Record<string, string[]> = {
    SECOND_COMING: ['Faith', 'Holy Spirit', 'Prayer'],
    MISSION: ['Worship', 'Gratitude', 'Rest'],
    SALVATION: ['Sanctification', 'Holy Spirit', 'Victory'],
    FAITH: ['Hope', 'Love', 'Trust'],
    HOPE: ['Faith', 'Victory', 'Praise'],
    PRAISE: ['Prayer', 'Dedication', 'Service'],
    WORSHIP: ['Mission', 'Dedication', 'Call'],
    DEDICATION: ['Rest', 'Gratitude', 'Love'],
    PRAYER: ['Praise', 'Worship', 'Communion'],
    HOLY_SPIRIT: ['Faith', 'Mission', 'Victory'],
  };
  
  return balanceMap[overCategory] || ['Faith', 'Hope', 'Love'];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate percentage distribution from counts
 */
export function calculatePercentageDistribution(
  counts: Record<string, number>
): Record<string, number> {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (total === 0) return {};
  
  const percentages: Record<string, number> = {};
  for (const [key, count] of Object.entries(counts)) {
    percentages[key] = Math.round((count / total) * 1000) / 10; // 1 decimal
  }
  return percentages;
}

/**
 * Convert counts to CategoryDistribution array
 */
export function countsToDistribution(
  counts: Record<string, number>
): CategoryDistribution[] {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  
  return Object.entries(counts)
    .map(([category, count]) => ({
      category: category as HymnCategory,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
