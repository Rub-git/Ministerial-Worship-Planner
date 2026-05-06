/**
 * Doctrinal Profile System
 * Phase 7: Denomination-aware scoring weights for the Smart Generator
 * 
 * This module defines how different denominations influence hymn scoring.
 * The Smart Generator reads the organization's denomination to apply
 * appropriate doctrinal weights.
 */

import { Denomination } from '@prisma/client';

// ============ TYPES ============

export interface DoctrinalProfile {
  denomination: Denomination | string;
  
  // SABBATH-specific settings
  sabbathPriority: boolean;           // Enable SABBATH section mappings
  sabbathSecondComingBonus: number;   // Bonus for SECOND_COMING on SABBATH programs
  
  // SECOND_COMING eschatology settings
  secondComingBaseWeight: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  adventSeasonBonus: number;          // Bonus during Nov-Dec
  
  // Apocalyptic/eschatological tracking
  apocalypticTracking: boolean;       // Track doctrinal category rotation
  
  // Closing hymn priority order
  closingHymnPriority: string[];      // Category priority for closing hymns
  
  // Special emphasis categories for this denomination
  emphasisCategories: string[];
}

// ============ WEIGHT VALUES ============

const WEIGHT_VALUES = {
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
  NONE: 0,
};

// ============ DENOMINATION PROFILES ============

/**
 * SDA (Seventh-day Adventist) Profile
 * - Full SABBATH priority
 * - Strong SECOND_COMING emphasis
 * - Apocalyptic tracking enabled
 */
const SDA_PROFILE: DoctrinalProfile = {
  denomination: 'SDA',
  sabbathPriority: true,
  sabbathSecondComingBonus: 10,
  secondComingBaseWeight: 'HIGH',
  adventSeasonBonus: 15,
  apocalypticTracking: true,
  closingHymnPriority: ['SECOND_COMING', 'HOPE', 'DEDICATION'],
  emphasisCategories: ['SECOND_COMING', 'SABBATH', 'PROPHECY', 'ADVENT'],
};

/**
 * Generic CHRISTIAN Profile
 * - No SABBATH-specific priority
 * - Medium SECOND_COMING weight
 * - No apocalyptic tracking
 */
const CHRISTIAN_PROFILE: DoctrinalProfile = {
  denomination: 'CHRISTIAN',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 10,
  apocalypticTracking: false,
  closingHymnPriority: ['HOPE', 'DEDICATION', 'PRAISE'],
  emphasisCategories: ['PRAISE', 'WORSHIP', 'GRACE'],
};

/**
 * BAPTIST Profile
 * - No SABBATH priority
 * - Medium SECOND_COMING
 * - Emphasis on salvation/evangelism
 */
const BAPTIST_PROFILE: DoctrinalProfile = {
  denomination: 'BAPTIST',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 10,
  apocalypticTracking: false,
  closingHymnPriority: ['SALVATION', 'HOPE', 'DEDICATION'],
  emphasisCategories: ['SALVATION', 'CALL', 'MISSION'],
};

/**
 * METHODIST Profile
 * - No SABBATH priority
 * - Emphasis on grace and service
 */
const METHODIST_PROFILE: DoctrinalProfile = {
  denomination: 'METHODIST',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'LOW',
  adventSeasonBonus: 8,
  apocalypticTracking: false,
  closingHymnPriority: ['GRACE', 'HOPE', 'SERVICE'],
  emphasisCategories: ['GRACE', 'SERVICE', 'HOLINESS'],
};

/**
 * PENTECOSTAL Profile
 * - No SABBATH priority
 * - Strong HOLY_SPIRIT emphasis
 */
const PENTECOSTAL_PROFILE: DoctrinalProfile = {
  denomination: 'PENTECOSTAL',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 10,
  apocalypticTracking: false,
  closingHymnPriority: ['HOLY_SPIRIT', 'PRAISE', 'HOPE'],
  emphasisCategories: ['HOLY_SPIRIT', 'PRAISE', 'HEALING'],
};

/**
 * PRESBYTERIAN Profile
 */
const PRESBYTERIAN_PROFILE: DoctrinalProfile = {
  denomination: 'PRESBYTERIAN',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'LOW',
  adventSeasonBonus: 8,
  apocalypticTracking: false,
  closingHymnPriority: ['SOVEREIGNTY', 'HOPE', 'DEDICATION'],
  emphasisCategories: ['SOVEREIGNTY', 'GRACE', 'COVENANT'],
};

/**
 * LUTHERAN Profile
 */
const LUTHERAN_PROFILE: DoctrinalProfile = {
  denomination: 'LUTHERAN',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 12,  // Strong liturgical tradition
  apocalypticTracking: false,
  closingHymnPriority: ['GRACE', 'FAITH', 'HOPE'],
  emphasisCategories: ['GRACE', 'FAITH', 'REFORMATION'],
};

/**
 * CATHOLIC Profile
 */
const CATHOLIC_PROFILE: DoctrinalProfile = {
  denomination: 'CATHOLIC',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 15,  // Strong liturgical calendar
  apocalypticTracking: false,
  closingHymnPriority: ['MARY', 'SAINTS', 'HOPE', 'DEDICATION'],
  emphasisCategories: ['EUCHARIST', 'MARY', 'SAINTS'],
};

/**
 * NON_DENOMINATIONAL Profile (default)
 */
const NON_DENOMINATIONAL_PROFILE: DoctrinalProfile = {
  denomination: 'NON_DENOMINATIONAL',
  sabbathPriority: false,
  sabbathSecondComingBonus: 0,
  secondComingBaseWeight: 'MEDIUM',
  adventSeasonBonus: 10,
  apocalypticTracking: false,
  closingHymnPriority: ['HOPE', 'PRAISE', 'DEDICATION'],
  emphasisCategories: ['PRAISE', 'WORSHIP', 'CONTEMPORARY'],
};

// ============ PROFILE REGISTRY ============

const PROFILES: Record<string, DoctrinalProfile> = {
  SDA: SDA_PROFILE,
  CHRISTIAN: CHRISTIAN_PROFILE,
  BAPTIST: BAPTIST_PROFILE,
  METHODIST: METHODIST_PROFILE,
  PENTECOSTAL: PENTECOSTAL_PROFILE,
  PRESBYTERIAN: PRESBYTERIAN_PROFILE,
  LUTHERAN: LUTHERAN_PROFILE,
  CATHOLIC: CATHOLIC_PROFILE,
  NON_DENOMINATIONAL: NON_DENOMINATIONAL_PROFILE,
  // OTHER uses CHRISTIAN profile as base (user-specified traditions without custom doctrinal logic)
  OTHER: CHRISTIAN_PROFILE,
};

// Legacy string mappings
const DENOMINATION_ALIASES: Record<string, string> = {
  'Seventh-day Adventist': 'SDA',
  'Adventist': 'SDA',
  'Seventh Day Adventist': 'SDA',
  'Baptist': 'BAPTIST',
  'Southern Baptist': 'BAPTIST',
  'Methodist': 'METHODIST',
  'United Methodist': 'METHODIST',
  'Pentecostal': 'PENTECOSTAL',
  'Assembly of God': 'PENTECOSTAL',
  'Presbyterian': 'PRESBYTERIAN',
  'Lutheran': 'LUTHERAN',
  'ELCA': 'LUTHERAN',
  'Catholic': 'CATHOLIC',
  'Roman Catholic': 'CATHOLIC',
  'Non-denominational': 'NON_DENOMINATIONAL',
  'Nondenominational': 'NON_DENOMINATIONAL',
  'Christian': 'CHRISTIAN',
  'OTHER': 'OTHER',       // User-specified tradition (uses CHRISTIAN profile)
  'Other': 'OTHER',
  'other': 'OTHER',
};

// ============ PUBLIC FUNCTIONS ============

/**
 * Get the doctrinal profile for an organization's denomination
 */
export function getDoctrinalProfile(denomination: string | null | undefined): DoctrinalProfile {
  if (!denomination) {
    return CHRISTIAN_PROFILE; // Default
  }
  
  // Check direct match
  const upperDenom = denomination.toUpperCase().replace(/[^A-Z_]/g, '_');
  if (PROFILES[upperDenom]) {
    return PROFILES[upperDenom];
  }
  
  // Check aliases
  const alias = DENOMINATION_ALIASES[denomination];
  if (alias && PROFILES[alias]) {
    return PROFILES[alias];
  }
  
  // Check partial matches
  const lowerDenom = denomination.toLowerCase();
  if (lowerDenom.includes('adventist') || lowerDenom.includes('sda')) {
    return SDA_PROFILE;
  }
  if (lowerDenom.includes('baptist')) {
    return BAPTIST_PROFILE;
  }
  if (lowerDenom.includes('methodist')) {
    return METHODIST_PROFILE;
  }
  if (lowerDenom.includes('pentecostal') || lowerDenom.includes('assembly')) {
    return PENTECOSTAL_PROFILE;
  }
  if (lowerDenom.includes('presbyterian')) {
    return PRESBYTERIAN_PROFILE;
  }
  if (lowerDenom.includes('lutheran')) {
    return LUTHERAN_PROFILE;
  }
  if (lowerDenom.includes('catholic')) {
    return CATHOLIC_PROFILE;
  }
  
  // Default to generic Christian
  return CHRISTIAN_PROFILE;
}

/**
 * Get the SECOND_COMING base score weight
 */
export function getSecondComingWeight(profile: DoctrinalProfile): number {
  return WEIGHT_VALUES[profile.secondComingBaseWeight];
}

/**
 * Check if SABBATH-specific scoring should apply
 */
export function shouldApplySabbathPriority(profile: DoctrinalProfile): boolean {
  return profile.sabbathPriority;
}

/**
 * Check if apocalyptic/doctrinal tracking should be enabled
 */
export function shouldTrackApocalyptic(profile: DoctrinalProfile): boolean {
  return profile.apocalypticTracking;
}

/**
 * Get closing hymn category priority for a profile
 */
export function getClosingPriority(profile: DoctrinalProfile): string[] {
  return profile.closingHymnPriority;
}

/**
 * Check if this is an SDA organization
 */
export function isSDAOrganization(denomination: string | null | undefined): boolean {
  if (!denomination) return false;
  const lowerDenom = denomination.toLowerCase();
  return lowerDenom.includes('adventist') || 
         lowerDenom.includes('sda') || 
         lowerDenom === 'seventh-day adventist';
}

/**
 * Get section categories based on denomination profile and program type
 * For non-SDA: Returns generic mappings instead of SABBATH-specific ones
 */
export function getSectionCategoriesForProfile(
  profile: DoctrinalProfile,
  programType: string,
  sectionKey: string
): string[] {
  // SABBATH-specific mappings only for SDA
  if (programType === 'SABBATH' && profile.sabbathPriority) {
    const SABBATH_SECTION_CATEGORIES: Record<string, string[]> = {
      'opening_hymn': ['PRAISE', 'WORSHIP', 'SABBATH'],
      'first_hymn': ['PRAISE', 'WORSHIP'],
      'dw_closing_hymn': profile.closingHymnPriority,
    };
    return SABBATH_SECTION_CATEGORIES[sectionKey] ?? ['GENERAL'];
  }
  
  // Generic section mappings for all other cases
  const GENERIC_SECTION_CATEGORIES: Record<string, string[]> = {
    'opening_hymn': ['PRAISE', 'WORSHIP'],
    'first_hymn': ['PRAISE', 'WORSHIP'],
    'offertory_hymn': ['OFFERING', 'DEDICATION', 'STEWARDSHIP'],
    'closing_hymn': profile.closingHymnPriority,
    'farewell_song': ['HOPE', ...profile.closingHymnPriority.slice(0, 2)],
    'congregation_hymn': ['PRAISE', 'WORSHIP', 'FAITH'],
    'special_music': ['WORSHIP', 'MEDITATION', 'GENERAL'],
  };
  
  return GENERIC_SECTION_CATEGORIES[sectionKey] ?? ['GENERAL'];
}

/**
 * Log doctrinal profile info for debugging
 */
export function logDoctrinalProfile(profile: DoctrinalProfile): void {
  console.log('[DoctrinalProfile]', {
    denomination: profile.denomination,
    sabbathPriority: profile.sabbathPriority,
    secondComingWeight: profile.secondComingBaseWeight,
    apocalypticTracking: profile.apocalypticTracking,
    closingPriority: profile.closingHymnPriority.join(' > '),
  });
}
