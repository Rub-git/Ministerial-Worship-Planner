/**
 * =============================================================================
 * PHASE 6: MONTHLY EMPHASIS ENGINE
 * =============================================================================
 * 
 * Priority Order (layered scoring):
 * 1. Base Adventist Identity (existing doctrinal weights)
 * 2. Permanent Evangelism boost (+8 for MISSION, SALVATION, CALL, SECOND_COMING)
 * 3. Monthly Emphasis boost (+15 for preferred categories, +18 with override)
 * 4. Series boost (from series-library)
 * 5. SpecialEvent boost (from special-themes)
 * 6. Balanced logic
 * 7. History filter (-50 for recently used)
 * 
 * NOTE: Evangelism is NOT a monthly emphasis. It is a permanent base boost.
 * 
 * OVERRIDE PROTECTION (Phase 6.1):
 * When MonthlyEmphasis is active (and no Series/SpecialEvent override):
 * - Monthly Emphasis primary boost is multiplied by 1.2 (15 → 18)
 * - Evangelism boost is reduced by 20% (8 → 6.4 → 6)
 * This ensures visible thematic influence during emphasis months.
 */

import { HymnCategory } from './types';

// =============================================================================
// PERMANENT EVANGELISM BASELINE
// Applied to ALL months, always active
// =============================================================================
export const EVANGELISM_BOOST = 8;
export const EVANGELISM_BOOST_REDUCED = 6; // When monthly emphasis is active (20% reduction)

export const EVANGELISM_CATEGORIES: HymnCategory[] = [
  'MISSION',
  'SALVATION',
  'CALL',
  'SECOND_COMING'
];

// =============================================================================
// MONTHLY EMPHASIS SCORING CONSTANTS
// =============================================================================
export const MONTHLY_EMPHASIS_BOOST = 15;
export const MONTHLY_EMPHASIS_BOOST_OVERRIDE = 18; // 1.2x multiplier when no Series/SpecialEvent
export const EMPHASIS_OVERRIDE_MULTIPLIER = 1.2;

// =============================================================================
// MONTHLY EMPHASIS CONFIGURATIONS
// These are the available emphases that can be assigned to any month
// =============================================================================
export interface MonthlyEmphasisConfig {
  key: string;
  labelEn: string;
  labelEs: string;
  preferredCategories: HymnCategory[];
  secondaryCategories?: HymnCategory[];
  description?: string;
}

export const MONTHLY_EMPHASIS_OPTIONS: MonthlyEmphasisConfig[] = [
  {
    key: 'STEWARDSHIP',
    labelEn: 'Stewardship',
    labelEs: 'Mayordomía',
    preferredCategories: ['DEDICATION', 'SERVICE', 'GRATITUDE', 'SACRIFICE'],
    secondaryCategories: ['FAITH', 'WORSHIP'],
    description: 'Financial faithfulness and resource management'
  },
  {
    key: 'FAMILY',
    labelEn: 'Family',
    labelEs: 'Familia',
    preferredCategories: ['LOVE', 'PRAYER', 'DEDICATION', 'HOPE'],
    secondaryCategories: ['GRATITUDE', 'FAITH'],
    description: 'Family worship and unity'
  },
  {
    key: 'REVIVAL',
    labelEn: 'Revival & Reformation',
    labelEs: 'Reavivamiento y Reforma',
    preferredCategories: ['HOLY_SPIRIT', 'PRAYER', 'DEDICATION', 'FAITH'],
    secondaryCategories: ['CALL', 'WORSHIP'],
    description: 'Spiritual renewal and recommitment'
  },
  {
    key: 'YOUTH',
    labelEn: 'Youth',
    labelEs: 'Juventud',
    preferredCategories: ['FAITH', 'DEDICATION', 'VICTORY', 'HOPE'],
    secondaryCategories: ['MISSION', 'SERVICE'],
    description: 'Young people and their spiritual growth'
  },
  {
    key: 'HEALTH',
    labelEn: 'Health',
    labelEs: 'Salud',
    preferredCategories: ['GRATITUDE', 'PRAISE', 'PRAYER', 'DEDICATION'],
    secondaryCategories: ['FAITH', 'SERVICE'],
    description: 'Physical and spiritual wellness'
  },
  {
    key: 'EDUCATION',
    labelEn: 'Adventist Education',
    labelEs: 'Educación Adventista',
    preferredCategories: ['SCRIPTURE', 'FAITH', 'DEDICATION', 'SERVICE'],
    secondaryCategories: ['HOPE', 'PRAYER'],
    description: 'Christian education and discipleship'
  },
  {
    key: 'WOMENS_MINISTRIES',
    labelEn: "Women's Ministries",
    labelEs: 'Ministerio de la Mujer',
    preferredCategories: ['PRAYER', 'SERVICE', 'FAITH', 'LOVE'],
    secondaryCategories: ['DEDICATION', 'HOPE'],
    description: "Women's spiritual leadership and service"
  },
  {
    key: 'MENS_MINISTRIES',
    labelEn: "Men's Ministries",
    labelEs: 'Ministerio del Hombre',
    preferredCategories: ['FAITH', 'DEDICATION', 'SERVICE', 'VICTORY'],
    secondaryCategories: ['PRAYER', 'MISSION'],
    description: "Men's spiritual leadership and service"
  },
  {
    key: 'COMMUNITY_SERVICE',
    labelEn: 'Community Service',
    labelEs: 'Servicio Comunitario',
    preferredCategories: ['SERVICE', 'MISSION', 'LOVE', 'DEDICATION'],
    secondaryCategories: ['CALL', 'PRAYER'],
    description: 'Outreach and community involvement'
  },
  {
    key: 'SABBATH',
    labelEn: 'Sabbath Observance',
    labelEs: 'Observancia del Sábado',
    preferredCategories: ['SABBATH', 'WORSHIP', 'PRAISE', 'GRATITUDE'],
    secondaryCategories: ['PRAYER', 'FAITH'],
    description: 'Honoring the Sabbath day'
  },
  {
    key: 'PRAYER',
    labelEn: 'Prayer Week',
    labelEs: 'Semana de Oración',
    preferredCategories: ['PRAYER', 'FAITH', 'HOLY_SPIRIT', 'DEDICATION'],
    secondaryCategories: ['HOPE', 'WORSHIP'],
    description: 'Dedicated prayer emphasis'
  },
  {
    key: 'MUSIC_MINISTRY',
    labelEn: 'Music Ministry',
    labelEs: 'Ministerio de Música',
    preferredCategories: ['PRAISE', 'WORSHIP', 'GRATITUDE', 'HOLY_SPIRIT'],
    secondaryCategories: ['DEDICATION', 'FAITH'],
    description: 'Celebrating sacred music'
  },
  {
    key: 'REFORMATION',
    labelEn: 'Reformation Heritage',
    labelEs: 'Herencia de la Reforma',
    preferredCategories: ['FAITH', 'SCRIPTURE', 'VICTORY', 'DEDICATION'],
    secondaryCategories: ['HOPE', 'SECOND_COMING'],
    description: 'Protestant Reformation anniversary'
  },
  {
    key: 'PATHFINDERS',
    labelEn: 'Pathfinder Day',
    labelEs: 'Día del Conquistador',
    preferredCategories: ['FAITH', 'DEDICATION', 'SERVICE', 'VICTORY'],
    secondaryCategories: ['MISSION', 'HOPE'],
    description: 'Pathfinder ministry celebration'
  },
  {
    key: 'RELIGIOUS_LIBERTY',
    labelEn: 'Religious Liberty',
    labelEs: 'Libertad Religiosa',
    preferredCategories: ['FAITH', 'PRAYER', 'VICTORY', 'HOPE'],
    secondaryCategories: ['SECOND_COMING', 'DEDICATION'],
    description: 'Freedom of worship and conscience'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get emphasis config by key
 */
export function getMonthlyEmphasisConfig(key: string): MonthlyEmphasisConfig | undefined {
  return MONTHLY_EMPHASIS_OPTIONS.find(e => e.key === key);
}

/**
 * Get all available emphasis options for dropdown
 */
export function getAvailableEmphases(): MonthlyEmphasisConfig[] {
  return MONTHLY_EMPHASIS_OPTIONS;
}

/**
 * Override protection context
 * Determines if monthly emphasis should override evangelism baseline
 */
export interface EmphasisOverrideContext {
  hasMonthlyEmphasis: boolean;
  hasSeriesOverride: boolean;      // Series engine active
  hasSpecialEventOverride: boolean; // Special event active
}

/**
 * Check if monthly emphasis should apply override protection
 * Override is applied when:
 * - Monthly emphasis IS active
 * - Series IS NOT active
 * - Special event IS NOT active
 */
export function shouldApplyOverrideProtection(context: EmphasisOverrideContext): boolean {
  return context.hasMonthlyEmphasis && 
         !context.hasSeriesOverride && 
         !context.hasSpecialEventOverride;
}

/**
 * Calculate evangelism boost for a hymn category
 * Applied permanently to all programs
 * 
 * OVERRIDE PROTECTION:
 * When monthly emphasis is active (no Series/SpecialEvent), reduce by 20%
 */
export function getEvangelismBoost(
  category: HymnCategory | null | undefined,
  overrideContext?: EmphasisOverrideContext
): number {
  if (!category) return 0;
  if (!EVANGELISM_CATEGORIES.includes(category)) return 0;
  
  // Apply reduced boost when override protection is active
  if (overrideContext && shouldApplyOverrideProtection(overrideContext)) {
    return EVANGELISM_BOOST_REDUCED; // 6 instead of 8
  }
  
  return EVANGELISM_BOOST; // Default 8
}

/**
 * Calculate monthly emphasis boost for a hymn category
 * 
 * OVERRIDE PROTECTION:
 * When no Series/SpecialEvent override, multiply primary boost by 1.2
 */
export function getMonthlyEmphasisBoostForCategory(
  category: HymnCategory | null | undefined,
  emphasisKey: string | null | undefined,
  overrideContext?: EmphasisOverrideContext
): number {
  if (!category || !emphasisKey) return 0;
  
  const config = getMonthlyEmphasisConfig(emphasisKey);
  if (!config) return 0;
  
  // Check if override protection applies
  const applyOverride = overrideContext && shouldApplyOverrideProtection(overrideContext);
  
  if (config.preferredCategories.includes(category)) {
    // Primary categories get boosted when override protection is active
    return applyOverride ? MONTHLY_EMPHASIS_BOOST_OVERRIDE : MONTHLY_EMPHASIS_BOOST;
  }
  
  if (config.secondaryCategories?.includes(category)) {
    // Secondary categories get half boost (7 or 9 with override)
    const baseBoost = applyOverride ? MONTHLY_EMPHASIS_BOOST_OVERRIDE : MONTHLY_EMPHASIS_BOOST;
    return Math.floor(baseBoost / 2);
  }
  
  return 0;
}

/**
 * Get preferred categories for an emphasis (for display/logging)
 */
export function getPreferredCategoriesForEmphasis(emphasisKey: string): HymnCategory[] {
  const config = getMonthlyEmphasisConfig(emphasisKey);
  return config?.preferredCategories || [];
}

/**
 * Check if a category receives permanent evangelism boost
 */
export function isEvangelismCategory(category: HymnCategory | null | undefined): boolean {
  if (!category) return false;
  return EVANGELISM_CATEGORIES.includes(category);
}

// =============================================================================
// SAMPLE ANNUAL CALENDAR (for reference/testing)
// This is a suggested assignment, organizations can customize
// =============================================================================
export const SAMPLE_ANNUAL_CALENDAR: Record<number, string> = {
  1: 'PRAYER',           // January - Week of Prayer
  2: 'FAMILY',           // February - Family emphasis
  3: 'YOUTH',            // March - Global Youth Day
  4: 'STEWARDSHIP',      // April - Stewardship emphasis
  5: 'HEALTH',           // May - Health emphasis
  6: 'EDUCATION',        // June - Education month
  7: 'COMMUNITY_SERVICE', // July - Community Service
  8: 'PATHFINDERS',      // August - Pathfinder emphasis
  9: 'REVIVAL',          // September - Revival
  10: 'REFORMATION',     // October - Reformation month
  11: 'MENS_MINISTRIES', // November - Men's ministries
  12: 'SABBATH'          // December - Sabbath rest
};
