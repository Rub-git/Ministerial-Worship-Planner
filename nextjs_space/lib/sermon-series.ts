/**
 * Phase 4: Sermon Series Engine
 * 
 * Provides sermon series configurations and category progression logic
 * for multi-week sermon series planning.
 * 
 * Key Features:
 * - Theme-to-category mapping for series boost
 * - Week-over-week category progression
 * - Continuity penalty to prevent repetition
 */

import type { HymnCategory } from './types';

export interface SeriesConfig {
  /** Main theme keyword for hymn matching */
  theme: string;
  /** Primary categories boosted for this series */
  primaryCategories: HymnCategory[];
  /** Related categories that also receive boost */
  relatedCategories: HymnCategory[];
  /** Suggested category progression by week */
  weekProgression: HymnCategory[];
}

/**
 * Series Theme to Category Mapping
 * 
 * Maps sermon series themes to hymn categories for scoring boost.
 * The theme field in SermonSeries should match one of these keys.
 */
export const SERIES_THEME_CATEGORIES: Record<string, SeriesConfig> = {
  // Faith-focused series
  FAITH: {
    theme: 'faith',
    primaryCategories: ['FAITH', 'HOPE', 'DEDICATION'],
    relatedCategories: ['PRAYER', 'SALVATION'],
    weekProgression: ['FAITH', 'PRAYER', 'DEDICATION', 'HOPE'],
  },
  
  // Second Coming / Eschatology series
  SECOND_COMING: {
    theme: 'second coming',
    primaryCategories: ['SECOND_COMING', 'HOPE', 'FAITH'],
    relatedCategories: ['DEDICATION', 'PRAISE'],
    weekProgression: ['SECOND_COMING', 'HOPE', 'FAITH', 'DEDICATION'],
  },
  
  // Salvation / Gospel series
  SALVATION: {
    theme: 'salvation',
    primaryCategories: ['SALVATION', 'FAITH', 'HOPE'],
    relatedCategories: ['PRAYER', 'DEDICATION'],
    weekProgression: ['SALVATION', 'FAITH', 'DEDICATION', 'HOPE'],
  },
  
  // Prayer & Devotion series
  PRAYER: {
    theme: 'prayer',
    primaryCategories: ['PRAYER', 'FAITH', 'DEDICATION'],
    relatedCategories: ['PRAISE', 'HOPE'],
    weekProgression: ['PRAYER', 'FAITH', 'PRAISE', 'DEDICATION'],
  },
  
  // Mission & Evangelism series
  MISSION: {
    theme: 'mission',
    primaryCategories: ['MISSION', 'DEDICATION', 'CALL'],
    relatedCategories: ['FAITH', 'HOPE'],
    weekProgression: ['CALL', 'DEDICATION', 'MISSION', 'HOPE'],
  },
  
  // Sanctification / Spiritual Growth series
  SANCTIFICATION: {
    theme: 'sanctification',
    primaryCategories: ['DEDICATION', 'FAITH', 'PRAYER'],
    relatedCategories: ['HOPE', 'PRAISE'],
    weekProgression: ['FAITH', 'DEDICATION', 'PRAYER', 'HOPE'],
  },
  
  // Holy Spirit series
  HOLY_SPIRIT: {
    theme: 'holy spirit',
    primaryCategories: ['HOLY_SPIRIT', 'PRAYER', 'DEDICATION'],
    relatedCategories: ['FAITH', 'PRAISE'],
    weekProgression: ['PRAYER', 'HOLY_SPIRIT', 'FAITH', 'DEDICATION'],
  },
  
  // Praise & Worship series
  PRAISE: {
    theme: 'praise',
    primaryCategories: ['PRAISE', 'GRATITUDE', 'WORSHIP'],
    relatedCategories: ['FAITH', 'HOPE'],
    weekProgression: ['PRAISE', 'GRATITUDE', 'FAITH', 'HOPE'],
  },
  
  // Resurrection / Easter series
  RESURRECTION: {
    theme: 'resurrection',
    primaryCategories: ['RESURRECTION', 'HOPE', 'SALVATION'],
    relatedCategories: ['FAITH', 'PRAISE'],
    weekProgression: ['SALVATION', 'RESURRECTION', 'HOPE', 'PRAISE'],
  },
  
  // Sabbath series
  SABBATH: {
    theme: 'sabbath',
    primaryCategories: ['SABBATH', 'PRAISE', 'DEDICATION'],
    relatedCategories: ['FAITH', 'HOPE'],
    weekProgression: ['SABBATH', 'PRAISE', 'FAITH', 'DEDICATION'],
  },
};

// Scoring constants
export const SERIES_PRIMARY_BOOST = 15;      // +15 for primary categories
export const SERIES_RELATED_BOOST = 8;       // +8 for related categories
export const SERIES_PROGRESSION_BOOST = 10;  // +10 for matching week progression
export const SERIES_CONTINUITY_PENALTY = -12; // -12 for same category as previous week

/**
 * Get series configuration by theme
 */
export function getSeriesConfig(theme: string | null | undefined): SeriesConfig | null {
  if (!theme) {
    console.log('[SeriesConfig] No theme provided');
    return null;
  }
  
  // Try exact match first
  const upperTheme = theme.toUpperCase().replace(/[\s_-]/g, '_');
  if (SERIES_THEME_CATEGORIES[upperTheme]) {
    console.log(`[SeriesConfig] Exact match found: ${upperTheme}`);
    return SERIES_THEME_CATEGORIES[upperTheme];
  }
  
  // Try key match (common case: theme is already a key like "FAITH")
  for (const key of Object.keys(SERIES_THEME_CATEGORIES)) {
    if (upperTheme === key || theme.toUpperCase() === key) {
      console.log(`[SeriesConfig] Key match found: ${key}`);
      return SERIES_THEME_CATEGORIES[key];
    }
  }
  
  // Try partial match with config.theme
  for (const [key, config] of Object.entries(SERIES_THEME_CATEGORIES)) {
    if (theme.toLowerCase().includes(config.theme.toLowerCase()) ||
        config.theme.toLowerCase().includes(theme.toLowerCase())) {
      console.log(`[SeriesConfig] Partial match found: ${key} via ${config.theme}`);
      return config;
    }
  }
  
  console.log(`[SeriesConfig] No match found for theme: ${theme}`);
  return null;
}

/**
 * Get recommended category for a specific week in a series
 */
export function getProgressionCategoryForWeek(
  seriesConfig: SeriesConfig | null,
  weekNumber: number,
  totalWeeks: number
): HymnCategory | null {
  if (!seriesConfig || weekNumber < 1) return null;
  
  const progression = seriesConfig.weekProgression;
  
  // Map week to progression index
  // For series longer than 4 weeks, cycle through progression
  const progressionIndex = (weekNumber - 1) % progression.length;
  
  return progression[progressionIndex] ?? null;
}

/**
 * Check if category matches series progression
 */
export function matchesSeriesProgression(
  category: string | null,
  seriesConfig: SeriesConfig | null,
  weekNumber: number,
  totalWeeks: number
): boolean {
  if (!category || !seriesConfig) return false;
  
  const expectedCategory = getProgressionCategoryForWeek(seriesConfig, weekNumber, totalWeeks);
  return category.toUpperCase() === expectedCategory;
}

/**
 * Check if category is primary for series
 */
export function isPrimaryCategoryForSeries(
  category: string | null,
  seriesConfig: SeriesConfig | null
): boolean {
  if (!category || !seriesConfig) return false;
  return seriesConfig.primaryCategories.includes(category.toUpperCase() as HymnCategory);
}

/**
 * Check if category is related for series
 */
export function isRelatedCategoryForSeries(
  category: string | null,
  seriesConfig: SeriesConfig | null
): boolean {
  if (!category || !seriesConfig) return false;
  return seriesConfig.relatedCategories.includes(category.toUpperCase() as HymnCategory);
}

/**
 * Get available series themes for UI dropdown
 */
export function getAvailableSeriesThemes(): Array<{ key: string; label: string; labelEs: string }> {
  return [
    { key: 'FAITH', label: 'Faith', labelEs: 'Fe' },
    { key: 'SECOND_COMING', label: 'Second Coming', labelEs: 'Segunda Venida' },
    { key: 'SALVATION', label: 'Salvation', labelEs: 'Salvación' },
    { key: 'PRAYER', label: 'Prayer & Devotion', labelEs: 'Oración y Devoción' },
    { key: 'MISSION', label: 'Mission & Evangelism', labelEs: 'Misión y Evangelismo' },
    { key: 'SANCTIFICATION', label: 'Sanctification', labelEs: 'Santificación' },
    { key: 'HOLY_SPIRIT', label: 'Holy Spirit', labelEs: 'Espíritu Santo' },
    { key: 'PRAISE', label: 'Praise & Worship', labelEs: 'Alabanza y Adoración' },
    { key: 'RESURRECTION', label: 'Resurrection', labelEs: 'Resurrección' },
    { key: 'SABBATH', label: 'Sabbath', labelEs: 'Sábado' },
  ];
}

/**
 * Generate suggested week titles for a series
 */
export function getSuggestedWeekTitles(
  seriesConfig: SeriesConfig | null,
  totalWeeks: number
): Array<{ weekEn: string; weekEs: string }> {
  const defaultTitles: Record<string, { en: string; es: string }> = {
    FAITH: { en: 'Living by Faith', es: 'Viviendo por Fe' },
    SECOND_COMING: { en: 'Ready for His Return', es: 'Listos para Su Regreso' },
    SALVATION: { en: 'The Gift of Salvation', es: 'El Don de la Salvación' },
    PRAYER: { en: 'Power of Prayer', es: 'El Poder de la Oración' },
    MISSION: { en: 'Called to Serve', es: 'Llamados a Servir' },
    SANCTIFICATION: { en: 'Growing in Grace', es: 'Creciendo en Gracia' },
    HOLY_SPIRIT: { en: 'Spirit-Filled Living', es: 'Viviendo Llenos del Espíritu' },
    PRAISE: { en: 'Songs of Praise', es: 'Cantos de Alabanza' },
    RESURRECTION: { en: 'Victory in Christ', es: 'Victoria en Cristo' },
    SABBATH: { en: 'Sabbath Rest', es: 'Descanso Sabático' },
  };
  
  const titles: Array<{ weekEn: string; weekEs: string }> = [];
  
  for (let week = 1; week <= totalWeeks; week++) {
    const category = seriesConfig ? 
      getProgressionCategoryForWeek(seriesConfig, week, totalWeeks) : 'FAITH';
    
    titles.push({
      weekEn: `Week ${week}: ${category?.charAt(0)}${category?.slice(1).toLowerCase().replace(/_/g, ' ') ?? ''}`,
      weekEs: `Semana ${week}: ${category?.charAt(0)}${category?.slice(1).toLowerCase().replace(/_/g, ' ') ?? ''}`,
    });
  }
  
  return titles;
}
