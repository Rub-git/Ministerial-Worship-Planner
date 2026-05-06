/**
 * Phase 3.8: Thematic Program Engine
 * 
 * Special themes for Annual Ecclesiastical Planning.
 * These themes LAYER ON TOP of Adventist doctrinal weighting,
 * they do NOT replace core identity scoring.
 * 
 * When isSpecialEvent = true:
 * - Apply theme category boost +20
 * - Maintain Adventist doctrinal weighting
 * - Still apply 28-day history filter
 */

import type { HymnCategory } from './types';

export interface SpecialThemeConfig {
  /** English display name */
  nameEn: string;
  /** Spanish display name */
  nameEs: string;
  /** Primary categories that receive +20 boost */
  preferredCategories: HymnCategory[];
  /** Priority order for closing hymns (overrides default if provided) */
  closingPriority?: HymnCategory[];
  /** Suggested cover verse keywords for this theme */
  verseKeywords?: string[];
  /** Description for planning UI */
  descriptionEn?: string;
  descriptionEs?: string;
}

export type SpecialThemeType = 
  | 'EVANGELISM'
  | 'YOUTH_DAY'
  | 'REFORMATION'
  | 'STEWARDSHIP'
  | 'WOMENS_DAY'
  | 'MENS_DAY'
  | 'FAMILY_DAY'
  | 'COMMUNION'
  | 'HEALTH_EMPHASIS'
  | 'EDUCATION'
  | 'MUSIC_MINISTRY';

/**
 * Special Theme Configuration Map
 * 
 * Each theme defines:
 * - preferredCategories: Categories that get +20 boost during scoring
 * - closingPriority: Optional override for closing hymn priority
 * - verseKeywords: Suggested keywords for verse selection
 */
export const SPECIAL_THEMES: Record<SpecialThemeType, SpecialThemeConfig> = {
  EVANGELISM: {
    nameEn: 'Evangelism Sabbath',
    nameEs: 'Sábado de Evangelismo',
    preferredCategories: ['MISSION', 'SALVATION', 'CALL', 'SECOND_COMING'],
    closingPriority: ['CALL', 'SECOND_COMING', 'HOPE'],
    verseKeywords: ['go', 'preach', 'gospel', 'nations', 'witness', 'harvest'],
    descriptionEn: 'Focus on outreach, mission, and sharing the gospel',
    descriptionEs: 'Enfoque en alcance, misión y compartir el evangelio',
  },

  YOUTH_DAY: {
    nameEn: 'Youth Day',
    nameEs: 'Día de la Juventud',
    preferredCategories: ['DEDICATION', 'MISSION', 'FAITH', 'CALL'],
    closingPriority: ['DEDICATION', 'FAITH', 'HOPE'],
    verseKeywords: ['young', 'strength', 'courage', 'serve', 'future', 'purpose'],
    descriptionEn: 'Celebrating and empowering young people in faith',
    descriptionEs: 'Celebrando y empoderando a los jóvenes en la fe',
  },

  REFORMATION: {
    nameEn: 'Reformation Day',
    nameEs: 'Día de la Reforma',
    preferredCategories: ['FAITH', 'SCRIPTURE', 'VICTORY', 'DEDICATION'],
    closingPriority: ['FAITH', 'VICTORY', 'HOPE'],
    verseKeywords: ['truth', 'faith', 'scripture', 'stand', 'word', 'reformation'],
    descriptionEn: 'Commemorating Protestant Reformation and faith foundations',
    descriptionEs: 'Conmemorando la Reforma Protestante y los fundamentos de fe',
  },

  STEWARDSHIP: {
    nameEn: 'Stewardship Sabbath',
    nameEs: 'Sábado de Mayordomía',
    preferredCategories: ['DEDICATION', 'GRATITUDE', 'SERVICE', 'FAITH'],
    closingPriority: ['DEDICATION', 'GRATITUDE', 'HOPE'],
    verseKeywords: ['steward', 'faithful', 'give', 'tithe', 'blessing', 'trust'],
    descriptionEn: 'Focus on faithful stewardship of time, talents, and treasure',
    descriptionEs: 'Enfoque en la mayordomía fiel del tiempo, talentos y tesoro',
  },

  WOMENS_DAY: {
    nameEn: "Women's Ministry Day",
    nameEs: 'Día del Ministerio de la Mujer',
    preferredCategories: ['FAITH', 'SERVICE', 'DEDICATION', 'PRAYER'],
    closingPriority: ['FAITH', 'HOPE', 'DEDICATION'],
    verseKeywords: ['woman', 'faith', 'strength', 'serve', 'love', 'virtue'],
    descriptionEn: 'Celebrating women in ministry and faith',
    descriptionEs: 'Celebrando a las mujeres en el ministerio y la fe',
  },

  MENS_DAY: {
    nameEn: "Men's Ministry Day",
    nameEs: 'Día del Ministerio de Hombres',
    preferredCategories: ['FAITH', 'DEDICATION', 'SERVICE', 'CALL'],
    closingPriority: ['DEDICATION', 'FAITH', 'HOPE'],
    verseKeywords: ['man', 'strength', 'courage', 'leader', 'serve', 'integrity'],
    descriptionEn: 'Empowering men in faith and spiritual leadership',
    descriptionEs: 'Empoderando a los hombres en la fe y liderazgo espiritual',
  },

  FAMILY_DAY: {
    nameEn: 'Family Emphasis Day',
    nameEs: 'Día de Énfasis en la Familia',
    preferredCategories: ['LOVE', 'FAITH', 'PRAYER', 'GRATITUDE'],
    closingPriority: ['LOVE', 'FAITH', 'HOPE'],
    verseKeywords: ['family', 'home', 'children', 'love', 'together', 'blessing'],
    descriptionEn: 'Celebrating and strengthening family bonds in Christ',
    descriptionEs: 'Celebrando y fortaleciendo los lazos familiares en Cristo',
  },

  COMMUNION: {
    nameEn: 'Communion Sabbath',
    nameEs: 'Sábado de Santa Cena',
    preferredCategories: ['COMMUNION', 'SALVATION', 'SACRIFICE', 'PRAYER'],
    closingPriority: ['COMMUNION', 'SALVATION', 'HOPE'],
    verseKeywords: ['communion', 'blood', 'body', 'remember', 'sacrifice', 'lamb'],
    descriptionEn: "Observance of the Lord's Supper",
    descriptionEs: 'Observancia de la Santa Cena del Señor',
  },

  HEALTH_EMPHASIS: {
    nameEn: 'Health Emphasis Day',
    nameEs: 'Día de Énfasis en la Salud',
    preferredCategories: ['GRATITUDE', 'PRAISE', 'SERVICE', 'DEDICATION'],
    closingPriority: ['GRATITUDE', 'DEDICATION', 'HOPE'],
    verseKeywords: ['health', 'body', 'temple', 'care', 'whole', 'life'],
    descriptionEn: 'Promoting whole-person health and wellness',
    descriptionEs: 'Promoviendo la salud integral de la persona',
  },

  EDUCATION: {
    nameEn: 'Education Sabbath',
    nameEs: 'Sábado de Educación',
    preferredCategories: ['SCRIPTURE', 'FAITH', 'DEDICATION', 'SERVICE'],
    closingPriority: ['FAITH', 'DEDICATION', 'HOPE'],
    verseKeywords: ['learn', 'wisdom', 'knowledge', 'teach', 'truth', 'study'],
    descriptionEn: 'Celebrating Christian education and learning',
    descriptionEs: 'Celebrando la educación cristiana y el aprendizaje',
  },

  MUSIC_MINISTRY: {
    nameEn: 'Music Ministry Day',
    nameEs: 'Día del Ministerio de Música',
    preferredCategories: ['PRAISE', 'WORSHIP', 'GRATITUDE', 'DEDICATION'],
    closingPriority: ['PRAISE', 'GRATITUDE', 'HOPE'],
    verseKeywords: ['sing', 'music', 'praise', 'worship', 'melody', 'hymn'],
    descriptionEn: 'Celebrating sacred music and worship ministry',
    descriptionEs: 'Celebrando la música sacra y el ministerio de adoración',
  },
};

/**
 * Get theme configuration by key
 */
export function getSpecialTheme(themeKey: string | null | undefined): SpecialThemeConfig | null {
  if (!themeKey) return null;
  return SPECIAL_THEMES[themeKey as SpecialThemeType] ?? null;
}

/**
 * Check if a category is preferred for a special theme
 */
export function isPreferredForTheme(
  category: string,
  themeKey: string | null | undefined
): boolean {
  const theme = getSpecialTheme(themeKey);
  if (!theme) return false;
  return theme.preferredCategories.includes(category as HymnCategory);
}

/**
 * Get closing priority for a theme (with Adventist defaults)
 */
export function getClosingPriorityForTheme(
  themeKey: string | null | undefined
): HymnCategory[] {
  const theme = getSpecialTheme(themeKey);
  if (theme?.closingPriority) {
    return theme.closingPriority;
  }
  // Default Adventist closing priority
  return ['SECOND_COMING', 'HOPE', 'DEDICATION'];
}

/**
 * Get all available theme keys for UI dropdown
 */
export function getAvailableThemes(): Array<{ key: SpecialThemeType; nameEn: string; nameEs: string }> {
  return Object.entries(SPECIAL_THEMES).map(([key, config]) => ({
    key: key as SpecialThemeType,
    nameEn: config.nameEn,
    nameEs: config.nameEs,
  }));
}

// Theme boost constant for Smart Generator
export const SPECIAL_THEME_CATEGORY_BOOST = 20;
