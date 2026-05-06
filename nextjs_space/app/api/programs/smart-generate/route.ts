export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ProgramType, ProgramBlock } from '@prisma/client';
import { PROGRAM_TEMPLATES, ProgramTemplate } from '@/lib/types';
import {
  detectSeason,
  getRandomCoverVerse,
  getKeywordsForDate,
} from '@/lib/verse-library';
import {
  getSpecialTheme,
  getClosingPriorityForTheme,
  SPECIAL_THEME_CATEGORY_BOOST,
  SpecialThemeConfig,
} from '@/lib/special-themes';
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
  SeriesConfig,
} from '@/lib/sermon-series';
import {
  getEvangelismBoost,
  getMonthlyEmphasisBoostForCategory,
  getMonthlyEmphasisConfig,
  isEvangelismCategory,
  shouldApplyOverrideProtection,
  EVANGELISM_BOOST,
  EVANGELISM_BOOST_REDUCED,
  MONTHLY_EMPHASIS_BOOST,
  MONTHLY_EMPHASIS_BOOST_OVERRIDE,
  EmphasisOverrideContext,
} from '@/lib/monthly-emphasis';
import type { HymnCategory } from '@/lib/types';
import {
  DoctrinalProfile,
  getDoctrinalProfile,
  getSecondComingWeight,
  shouldApplySabbathPriority,
  shouldTrackApocalyptic,
  getClosingPriority,
  isSDAOrganization,
  getSectionCategoriesForProfile,
  logDoctrinalProfile,
} from '@/lib/doctrinal-profile';

type LanguageMode = 'BILINGUAL' | 'EN' | 'ES';

// ============================================
// PHASE 3.7: ADVENTIST DOCTRINAL PRIORITIES
// ============================================

// Adventist doctrinal priority categories (emphasized in scoring)
const ADVENTIST_DOCTRINAL_CATEGORIES: HymnCategory[] = [
  'SECOND_COMING',  // Core Adventist identity
  'HOPE',           // Blessed Hope
  'FAITH',          // Righteousness by Faith
  'DEDICATION',     // Mission/Service
];

// Related category rotation map (for overuse prevention)
const RELATED_CATEGORY_ROTATION: Record<string, HymnCategory[]> = {
  'SECOND_COMING': ['HOPE', 'FAITH'],
  'HOPE': ['SECOND_COMING', 'FAITH'],
  'FAITH': ['HOPE', 'DEDICATION'],
  'DEDICATION': ['FAITH', 'HOPE'],
};

interface HymnData {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
  keywords: string[];
  theme: string | null;
  category: string | null;
  seasonTag: string | null;
  worshipSection: string | null;
  metadataVerified: boolean;
}

interface ScoredHymn extends HymnData {
  score: number;
  selectionReason: string;
}

interface SelectionLog {
  sectionKey: string;
  selectedHymn: number | null;
  reason: string;
  candidatesCount: number;
  fallbackUsed: boolean;
}

// Section-to-Category mapping for SABBATH programs
// Phase 3.7: dw_closing_hymn prioritizes SECOND_COMING → HOPE → DEDICATION
const SABBATH_SECTION_CATEGORIES: Record<string, HymnCategory[]> = {
  'ss_hymn': ['PRAISE', 'GENERAL'],
  'dw_doxology': ['PRAISE'],
  'dw_hymn': ['PRAISE', 'PRAYER'],
  'dw_closing_hymn': ['SECOND_COMING', 'HOPE', 'DEDICATION'], // Adventist priority order
};

// Generic section mappings for non-SABBATH programs
const GENERIC_SECTION_CATEGORIES: Record<string, HymnCategory[]> = {
  'opening_hymn': ['PRAISE', 'GENERAL'],
  'song': ['PRAISE', 'GENERAL'],
  'youth_song_1': ['PRAISE', 'GENERAL'],
  'youth_song_2': ['PRAISE', 'PRAYER'],
  'closing_hymn': ['SECOND_COMING', 'HOPE', 'DEDICATION'], // Adventist priority
  'farewell_song': ['HOPE', 'SECOND_COMING'],
};

// Minimum candidates before fallback
const MIN_CANDIDATES_THRESHOLD = 5;

/**
 * Check if date falls in Advent season (Nov-Dec)
 * Adventist churches emphasize Second Coming during this period
 */
function isAdventSeason(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed: 10 = Nov, 11 = Dec
  return month === 10 || month === 11;
}

/**
 * Extract keywords from verse text for hymn matching
 */
function extractVerseKeywords(verseText: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'that', 'this',
    'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'his', 'her', 'their', 'our', 'your', 'my', 'him', 'them', 'us', 'me',
    'who', 'whom', 'which', 'what', 'when', 'where', 'why', 'how', 'all',
    'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'also', 'now', 'here', 'there', 'then', 'once', 'unto', 'upon'
  ]);

  return verseText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

/**
 * Get expected categories for a section
 */
function getSectionCategories(
  sectionKey: string, 
  programType: ProgramType
): HymnCategory[] {
  if (programType === 'SABBATH') {
    return SABBATH_SECTION_CATEGORIES[sectionKey] ?? ['GENERAL'];
  }
  return GENERIC_SECTION_CATEGORIES[sectionKey] ?? ['GENERAL'];
}

// Weight reduction for unverified metadata (40% reduction)
const UNVERIFIED_WEIGHT_FACTOR = 0.6;

// Phase 3.7: Adventist Doctrinal Weight Constants
const ADVENTIST_SABBATH_SECOND_COMING_BONUS = 10;  // +10 for SECOND_COMING on SABBATH
const ADVENTIST_ADVENT_SEASON_BONUS = 15;          // +15 for SECOND_COMING during Nov-Dec
const ADVENTIST_CLOSING_FIRST_CHOICE_BONUS = 8;    // +8 for first priority category in closing
const ADVENTIST_CLOSING_SECOND_CHOICE_BONUS = 4;   // +4 for second priority category

/**
 * BALANCED Strategy Hymn Scoring with ADVENTIST DOCTRINAL WEIGHTING + SPECIAL THEME + SERIES CONTINUITY
 * 
 * Priority: 1) verse keywords → 2) season → 3) category → 4) Adventist doctrine → 5) Special theme → 6) Series
 * 
 * PHASE 3.7 ADDITIONS:
 * - SECOND_COMING +10 when programType = SABBATH
 * - SECOND_COMING +15 during Nov-Dec (Advent season)
 * - Closing hymn: SECOND_COMING > HOPE > DEDICATION priority
 * - Overuse rotation penalty
 * 
 * PHASE 3.8 ADDITIONS (THEMATIC PROGRAM ENGINE):
 * - If isSpecialEvent = true AND specialTheme set:
 *   → Apply +20 boost to preferredCategories from theme config
 *   → Override closing priority if theme defines closingPriority
 *   → Maintains Adventist doctrinal weighting (layers on top)
 *   → Still applies 28-day history filter
 * 
 * PHASE 4 ADDITIONS (SERMON SERIES ENGINE):
 * - If seriesConfig provided:
 *   → +15 boost for primary series categories
 *   → +8 boost for related series categories
 *   → +10 boost for matching week progression
 *   → -12 penalty for same category as previous week (continuity)
 *   → Maintains all previous weighting (layers on top)
 * 
 * PHASE 6 ADDITIONS (MONTHLY EMPHASIS ENGINE):
 * - PERMANENT EVANGELISM BOOST (+8):
 *   → Always applied to MISSION, SALVATION, CALL, SECOND_COMING
 *   → Evangelism is NOT a monthly emphasis - it's a permanent base priority
 * - If monthlyEmphasis set for current month:
 *   → +15 boost for preferred categories
 *   → +7 boost for secondary categories
 *   → Aligned with Conference themes
 *   → Maintains all previous weighting (layers on top)
 * 
 * HYBRID VERIFICATION ADJUSTMENT:
 * - If metadataVerified = true → Full scoring applies
 * - If metadataVerified = false → Reduce keyword/season weight by 40%
 */
function scoreHymnBalanced(
  hymn: HymnData,
  context: {
    verseKeywords: string[];
    seasonKeywords: string[];
    seasonName: string | null;
    expectedCategories: HymnCategory[];
    isRecentlyUsed: boolean;
    isBilingualMode: boolean;
    // Phase 3.7: Adventist context
    programType: ProgramType;
    programDate: Date;
    sectionKey: string;
    recentDoctrinalCategories: string[]; // Categories used in last 2 weeks
    // Phase 3.8: Special Theme context
    isSpecialEvent: boolean;
    specialThemeConfig: SpecialThemeConfig | null;
    // Phase 4: Sermon Series context
    seriesConfig: SeriesConfig | null;
    seriesWeek: number | null;
    seriesTotal: number | null;
    previousWeekCategory: string | null; // Category used in previous week of series
    // Phase 6: Monthly Emphasis context
    monthlyEmphasisKey: string | null; // Emphasis key for current month (e.g., STEWARDSHIP)
    emphasisOverrideContext: EmphasisOverrideContext; // Override protection context
    // Phase 7: Doctrinal Profile context
    doctrinalProfile: DoctrinalProfile;
  }
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  // Apply weight factor based on verification status
  const weightFactor = hymn.metadataVerified ? 1.0 : UNVERIFIED_WEIGHT_FACTOR;
  const verifiedLabel = hymn.metadataVerified ? '' : '*';
  const hymnCategory = (hymn.category?.toUpperCase() ?? 'GENERAL') as HymnCategory;

  // Heavy penalty for recently used hymns (28 days)
  if (context.isRecentlyUsed) {
    score -= 200;
    reasons.push('RECENT(-200)');
  }

  // ============================================
  // PHASE 7: DENOMINATION-AWARE DOCTRINAL WEIGHTING
  // ============================================
  const profile = context.doctrinalProfile;
  const isSDA = shouldApplySabbathPriority(profile);
  
  // 1️⃣ SABBATH-specific SECOND_COMING bonus (SDA ONLY)
  // For non-SDA: SABBATH priority is disabled
  if (isSDA && context.programType === 'SABBATH' && hymnCategory === 'SECOND_COMING') {
    const bonus = profile.sabbathSecondComingBonus;
    score += bonus;
    reasons.push(`SDA_SABBATH(+${bonus})`);
  }

  // 2️⃣ ADVENT season bonus - applies to all denominations but with varying weights
  // SDA: +15, CHRISTIAN: +10, others as configured
  if (isAdventSeason(context.programDate) && hymnCategory === 'SECOND_COMING') {
    const adventBonus = profile.adventSeasonBonus;
    if (adventBonus > 0) {
      score += adventBonus;
      reasons.push(`ADVENT(+${adventBonus})`);
    }
  }
  
  // 3️⃣ SECOND_COMING base weight (varies by denomination)
  // SDA: HIGH (+10), CHRISTIAN: MEDIUM (+5), METHODIST: LOW (+2)
  if (hymnCategory === 'SECOND_COMING') {
    const baseWeight = getSecondComingWeight(profile);
    if (baseWeight > 0) {
      score += baseWeight;
      reasons.push(`ESCHAT_BASE(+${baseWeight})`);
    }
  }

  // 4️⃣ Closing hymn priority - based on denomination profile
  // SDA: SECOND_COMING > HOPE > DEDICATION
  // CHRISTIAN: HOPE > DEDICATION > PRAISE
  const isClosingSection = context.sectionKey.includes('closing') || 
                           context.sectionKey === 'farewell_song';
  if (isClosingSection) {
    const closingPriority = getClosingPriority(profile);
    const priorityIndex = closingPriority.indexOf(hymnCategory);
    if (priorityIndex === 0) {
      score += ADVENTIST_CLOSING_FIRST_CHOICE_BONUS;
      reasons.push(`CLOSE_1ST(+${ADVENTIST_CLOSING_FIRST_CHOICE_BONUS})`);
    } else if (priorityIndex === 1) {
      score += ADVENTIST_CLOSING_SECOND_CHOICE_BONUS;
      reasons.push(`CLOSE_2ND(+${ADVENTIST_CLOSING_SECOND_CHOICE_BONUS})`);
    }
  }

  // 5️⃣ Apocalyptic tracking & rotation penalty (SDA ONLY)
  // For non-SDA: apocalypticTracking is disabled
  if (shouldTrackApocalyptic(profile) && ADVENTIST_DOCTRINAL_CATEGORIES.includes(hymnCategory)) {
    const usageCount = context.recentDoctrinalCategories.filter(c => c === hymnCategory).length;
    if (usageCount >= 2) {
      // Apply rotation penalty - prefer related category instead
      score -= 15;
      reasons.push(`ROTATE(-15)`);
    }
  }

  // ============================================
  // PHASE 3.8: SPECIAL THEME BOOST
  // ============================================
  // If isSpecialEvent = true, apply theme category boost +20
  // This LAYERS ON TOP of Adventist doctrinal weighting
  
  if (context.isSpecialEvent && context.specialThemeConfig) {
    const themePreferred = context.specialThemeConfig.preferredCategories;
    
    // Apply +20 boost if hymn category matches theme's preferred categories
    if (themePreferred.includes(hymnCategory)) {
      score += SPECIAL_THEME_CATEGORY_BOOST;
      reasons.push(`THEME(+${SPECIAL_THEME_CATEGORY_BOOST})`);
    }

    // Additional closing priority boost from theme config
    const isClosing = context.sectionKey.includes('closing') || 
                      context.sectionKey === 'farewell_song';
    if (isClosing && context.specialThemeConfig.closingPriority) {
      const closingPriority = context.specialThemeConfig.closingPriority;
      const priorityIndex = closingPriority.indexOf(hymnCategory);
      if (priorityIndex === 0) {
        score += 6; // First priority
        reasons.push(`THEME_CLOSE_1ST(+6)`);
      } else if (priorityIndex === 1) {
        score += 3; // Second priority
        reasons.push(`THEME_CLOSE_2ND(+3)`);
      }
    }
  }

  // ============================================
  // PHASE 4: SERMON SERIES ENGINE
  // ============================================
  // If program belongs to a series, apply series-specific weighting
  // This LAYERS ON TOP of all previous weighting systems
  
  if (context.seriesConfig && context.seriesWeek && context.seriesTotal) {
    // 1️⃣ Primary category boost (+15)
    if (isPrimaryCategoryForSeries(hymnCategory, context.seriesConfig)) {
      score += SERIES_PRIMARY_BOOST;
      reasons.push(`SERIES_1ST(+${SERIES_PRIMARY_BOOST})`);
    }
    // 2️⃣ Related category boost (+8)
    else if (isRelatedCategoryForSeries(hymnCategory, context.seriesConfig)) {
      score += SERIES_RELATED_BOOST;
      reasons.push(`SERIES_2ND(+${SERIES_RELATED_BOOST})`);
    }
    
    // 3️⃣ Week progression match boost (+10)
    // Encourage thematic progression: Week 1 → FAITH, Week 2 → SANCTIFICATION, etc.
    if (matchesSeriesProgression(hymnCategory, context.seriesConfig, context.seriesWeek, context.seriesTotal)) {
      score += SERIES_PROGRESSION_BOOST;
      reasons.push(`SERIES_PROG(+${SERIES_PROGRESSION_BOOST})`);
    }
    
    // 4️⃣ Continuity penalty (-12)
    // Reduce repetition of same category from previous week
    if (context.previousWeekCategory && 
        context.seriesWeek > 1 &&
        hymnCategory === context.previousWeekCategory.toUpperCase()) {
      score += SERIES_CONTINUITY_PENALTY; // Negative value
      reasons.push(`SERIES_REPEAT(${SERIES_CONTINUITY_PENALTY})`);
    }
  }

  // ============================================
  // PHASE 6: MONTHLY EMPHASIS ENGINE (with Override Protection)
  // ============================================
  // Priority: 1) Base Adventist → 2) Evangelism → 3) Monthly Emphasis → 4) Series → 5) Special Event
  //
  // OVERRIDE PROTECTION (Phase 6.1):
  // When Monthly Emphasis is active AND no Series/SpecialEvent override:
  // - Evangelism boost reduced: 8 → 6 (-20%)
  // - Monthly Emphasis boost increased: 15 → 18 (+20%)
  // This ensures thematic influence during emphasis months.
  
  // 6️⃣a PERMANENT EVANGELISM BOOST (+8, or +6 with override protection)
  // Applied to ALL programs, ALL months - Evangelism is a permanent mission priority
  const evangelismBoost = getEvangelismBoost(hymnCategory, context.emphasisOverrideContext);
  if (evangelismBoost > 0) {
    score += evangelismBoost;
    const overrideFlag = shouldApplyOverrideProtection(context.emphasisOverrideContext) ? '*' : '';
    reasons.push(`EVANG(+${evangelismBoost}${overrideFlag})`);
  }
  
  // 6️⃣b MONTHLY EMPHASIS BOOST (+18 primary with override, +15 without; +9/+7 secondary)
  // If current month has emphasis set, apply boost to matching categories
  if (context.monthlyEmphasisKey) {
    const emphasisBoost = getMonthlyEmphasisBoostForCategory(
      hymnCategory, 
      context.monthlyEmphasisKey,
      context.emphasisOverrideContext
    );
    if (emphasisBoost > 0) {
      score += emphasisBoost;
      const overrideFlag = shouldApplyOverrideProtection(context.emphasisOverrideContext) ? '↑' : '';
      reasons.push(`MONTH_EMPH(+${emphasisBoost}${overrideFlag})`);
    }
  }

  // ============================================
  // STANDARD BALANCED SCORING
  // ============================================

  // Priority 1: Match verse keywords to hymn keywords
  if (context.verseKeywords.length > 0) {
    const hymnKeywords = hymn.keywords ?? [];
    let keywordMatches = 0;
    
    for (const vk of context.verseKeywords) {
      if (hymnKeywords.some(hk => hk.toLowerCase().includes(vk.toLowerCase()))) {
        keywordMatches++;
      }
    }
    
    if (keywordMatches > 0) {
      const baseScore = keywordMatches * 15;
      const adjustedScore = Math.round(baseScore * weightFactor);
      score += adjustedScore;
      reasons.push(`VERSE_KW(+${adjustedScore}${verifiedLabel})`);
    }

    // Also check hymn theme against verse keywords
    if (hymn.theme) {
      for (const vk of context.verseKeywords) {
        if (hymn.theme.toLowerCase().includes(vk.toLowerCase())) {
          const baseScore = 10;
          const adjustedScore = Math.round(baseScore * weightFactor);
          score += adjustedScore;
          reasons.push(`THEME_MATCH(+${adjustedScore}${verifiedLabel})`);
          break;
        }
      }
    }
  }

  // Priority 2: Season matching (if no verse provided)
  if (context.seasonName && hymn.seasonTag) {
    if (hymn.seasonTag.toLowerCase().includes(context.seasonName.toLowerCase())) {
      const baseScore = 25;
      const adjustedScore = Math.round(baseScore * weightFactor);
      score += adjustedScore;
      reasons.push(`SEASON(+${adjustedScore}${verifiedLabel})`);
    }
  }

  // Season keyword matching
  if (context.seasonKeywords.length > 0) {
    const hymnKeywords = hymn.keywords ?? [];
    let seasonMatches = 0;
    
    for (const sk of context.seasonKeywords) {
      if (hymnKeywords.some(hk => hk.toLowerCase().includes(sk.toLowerCase()))) {
        seasonMatches++;
      }
    }
    
    if (seasonMatches > 0) {
      const baseScore = seasonMatches * 8;
      const adjustedScore = Math.round(baseScore * weightFactor);
      score += adjustedScore;
      reasons.push(`SEASON_KW(+${adjustedScore}${verifiedLabel})`);
    }
  }

  // Priority 3: Category matching (full weight - category is high confidence)
  if (context.expectedCategories.includes(hymnCategory)) {
    score += 20;
    reasons.push(`CATEGORY(+20)`);
  } else if (hymnCategory === 'GENERAL') {
    score += 5; // Small bonus for general category as fallback
    reasons.push(`GENERAL(+5)`);
  }

  // Bilingual bonus in BILINGUAL mode
  if (context.isBilingualMode && hymn.numberEn && hymn.titleEn) {
    score += 10;
    reasons.push(`BILINGUAL(+10)`);
  }

  // Small random factor for variety (0-3)
  const randomBonus = Math.random() * 3;
  score += randomBonus;

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(' ') : 'BASE',
  };
}

/**
 * Select best hymn for a section using BALANCED strategy with Adventist + Theme + Series weighting
 */
function selectHymnForSection(
  availableHymns: HymnData[],
  context: {
    verseKeywords: string[];
    seasonKeywords: string[];
    seasonName: string | null;
    expectedCategories: HymnCategory[];
    recentHymnIds: Set<number>;
    isBilingualMode: boolean;
    usedHymnIds: Set<number>;
    // Phase 3.7: Adventist context
    programType: ProgramType;
    programDate: Date;
    sectionKey: string;
    recentDoctrinalCategories: string[];
    // Phase 3.8: Special Theme context
    isSpecialEvent: boolean;
    specialThemeConfig: SpecialThemeConfig | null;
    // Phase 4: Sermon Series context
    seriesConfig: SeriesConfig | null;
    seriesWeek: number | null;
    seriesTotal: number | null;
    previousWeekCategory: string | null;
    // Phase 6: Monthly Emphasis context
    monthlyEmphasisKey: string | null;
    emphasisOverrideContext: EmphasisOverrideContext;
    // Phase 7: Doctrinal Profile context
    doctrinalProfile: DoctrinalProfile;
  }
): { hymn: HymnData | null; reason: string; candidatesCount: number; fallbackUsed: boolean } {
  
  // Filter out already-used hymns in this program
  const candidates = availableHymns.filter(h => !context.usedHymnIds.has(h.id));
  
  if (candidates.length === 0) {
    return { hymn: null, reason: 'NO_CANDIDATES', candidatesCount: 0, fallbackUsed: true };
  }

  // Score all candidates with Adventist doctrinal + Special theme + Series weighting
  const scored: ScoredHymn[] = candidates.map(hymn => {
    const { score, reason } = scoreHymnBalanced(hymn, {
      verseKeywords: context.verseKeywords,
      seasonKeywords: context.seasonKeywords,
      seasonName: context.seasonName,
      expectedCategories: context.expectedCategories,
      isRecentlyUsed: context.recentHymnIds.has(hymn.id),
      isBilingualMode: context.isBilingualMode,
      // Phase 3.7: Pass Adventist context
      programType: context.programType,
      programDate: context.programDate,
      sectionKey: context.sectionKey,
      recentDoctrinalCategories: context.recentDoctrinalCategories,
      // Phase 3.8: Pass Special Theme context
      isSpecialEvent: context.isSpecialEvent,
      specialThemeConfig: context.specialThemeConfig,
      // Phase 4: Pass Series context
      seriesConfig: context.seriesConfig,
      seriesWeek: context.seriesWeek,
      seriesTotal: context.seriesTotal,
      previousWeekCategory: context.previousWeekCategory,
      // Phase 6: Pass Monthly Emphasis context
      monthlyEmphasisKey: context.monthlyEmphasisKey,
      emphasisOverrideContext: context.emphasisOverrideContext,
      // Phase 7: Pass Doctrinal Profile context
      doctrinalProfile: context.doctrinalProfile,
    });
    
    return { ...hymn, score, selectionReason: reason };
  });

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Check if we have enough candidates with positive scores
  const positiveScored = scored.filter(h => h.score > 0);
  let fallbackUsed = false;
  let selectedPool = scored;

  if (positiveScored.length < MIN_CANDIDATES_THRESHOLD) {
    // Fall back to GENERAL category or any available
    fallbackUsed = true;
    selectedPool = scored; // Use all candidates
  } else {
    selectedPool = positiveScored;
  }

  // Select the best hymn
  const selected = selectedPool[0];
  
  if (!selected) {
    return { hymn: null, reason: 'NO_VALID_HYMNS', candidatesCount: candidates.length, fallbackUsed: true };
  }

  return {
    hymn: selected,
    reason: selected.selectionReason,
    candidatesCount: candidates.length,
    fallbackUsed,
  };
}

/**
 * Smart Generator API - BALANCED Strategy with ADVENTIST DOCTRINAL WEIGHTING
 * 
 * Algorithm Summary:
 * 1. If verse provided → Extract keywords → Match hymn.keywords → Match hymn.theme → Category fallback
 * 2. If no verse → Season detection → Match seasonTag → Category fallback
 * 3. Section-specific categories (SABBATH: Opening=PRAISE, Prayer=PRAYER, Closing=SECOND_COMING/HOPE)
 * 4. Always avoid hymns used in last 28 days
 * 5. Prioritize bilingual hymns in BILINGUAL mode
 * 6. Minimum 5 candidates before fallback to GENERAL
 * 7. Never return empty sections - always provide fallback
 * 
 * PHASE 3.7: ADVENTIST DOCTRINAL WEIGHTING
 * - SECOND_COMING +10 when programType = SABBATH
 * - SECOND_COMING +15 during Nov-Dec (Advent season)
 * - Closing hymn priority: SECOND_COMING > HOPE > DEDICATION
 * - Overuse rotation: penalty if same doctrinal category used 2+ weeks in a row
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN' && role !== 'EDITOR') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      date, 
      type, 
      languageMode = 'BILINGUAL', 
      verseText,
      // Phase 3.8: Special Theme support
      isSpecialEvent = false,
      specialTheme = null,
      // Phase 4: Sermon Series support
      seriesId = null,
      seriesTheme = null,
      seriesWeek = null,
      seriesTotal = null,
    } = body ?? {};

    if (!date || !type) {
      return NextResponse.json({ error: 'Date and type are required' }, { status: 400 });
    }

    const programDate = new Date(date);
    const programType = type as ProgramType;
    const langMode = languageMode as LanguageMode;
    const isBilingualMode = langMode === 'BILINGUAL';
    
    // Phase 3.8: Get special theme configuration
    const specialThemeConfig = getSpecialTheme(specialTheme);
    
    // Phase 4: Get sermon series configuration
    console.log('[Smart Generator] Series params received:', { seriesId, seriesTheme, seriesWeek, seriesTotal });
    const seriesConfig = getSeriesConfig(seriesTheme);
    const seriesWeekNum = seriesWeek ? parseInt(String(seriesWeek), 10) : null;
    const seriesTotalNum = seriesTotal ? parseInt(String(seriesTotal), 10) : null;
    console.log('[Smart Generator] Series config resolved:', { 
      hasConfig: !!seriesConfig, 
      seriesWeekNum, 
      seriesTotalNum,
      primaryCategories: seriesConfig?.primaryCategories ?? 'N/A'
    });

    // Phase 6: Get monthly emphasis key
    // Phase 7: Get organization denomination for doctrinal profile
    const userId = (session?.user as any)?.id;
    let monthlyEmphasisKey: string | null = null;
    let monthlyEmphasisTitle: string | null = null;
    let organizationDenomination: string | null = null;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          organizationId: true,
          organization: {
            select: { denomination: true }
          }
        },
      });
      
      // Phase 7: Extract denomination from organization
      organizationDenomination = user?.organization?.denomination ?? null;
      
      if (user?.organizationId) {
        const currentMonth = programDate.getMonth() + 1; // 1-12
        const currentYear = programDate.getFullYear();
        
        const monthlyEmphasis = await prisma.monthlyEmphasis.findUnique({
          where: {
            organizationId_month_year: {
              organizationId: user.organizationId,
              month: currentMonth,
              year: currentYear,
            },
          },
        });
        
        if (monthlyEmphasis) {
          monthlyEmphasisKey = monthlyEmphasis.emphasisKey;
          monthlyEmphasisTitle = monthlyEmphasis.title;
          const emphasisConfig = getMonthlyEmphasisConfig(monthlyEmphasisKey);
          console.log('[Smart Generator] Monthly Emphasis:', {
            month: currentMonth,
            year: currentYear,
            emphasisKey: monthlyEmphasisKey,
            emphasisTitle: monthlyEmphasisTitle,
            preferredCategories: emphasisConfig?.preferredCategories ?? [],
          });
        }
      }
    }

    // 1. Detect season and extract keywords
    const season = detectSeason(programDate);
    const seasonKeywords = getKeywordsForDate(programDate);
    const coverVerse = getRandomCoverVerse(programDate);

    // Extract verse keywords if provided
    const verseKeywords = verseText ? extractVerseKeywords(verseText) : [];

    // 2. Get hymns used in last 28 days
    const recentDate = new Date(programDate);
    recentDate.setDate(recentDate.getDate() - 28);

    const recentHymnUsage = await prisma.programHymnHistory.findMany({
      where: {
        dateUsed: { gte: recentDate },
      },
      select: { hymnId: true },
    });
    const recentHymnIds = new Set(recentHymnUsage.map((h) => h.hymnId));

    // Phase 3.7: Get recent doctrinal categories (last 2 weeks) for closing hymns
    const twoWeeksAgo = new Date(programDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentClosingHymns = await prisma.programHymnHistory.findMany({
      where: {
        dateUsed: { gte: twoWeeksAgo },
        hymn: {
          category: { in: ['SECOND_COMING', 'HOPE', 'FAITH', 'DEDICATION'] },
        },
      },
      include: {
        hymn: { select: { category: true } },
      },
    });
    const recentDoctrinalCategories = recentClosingHymns
      .map(h => h.hymn.category)
      .filter((c): c is string => c !== null);

    // Phase 4: Get previous week's closing hymn category for series continuity
    let previousWeekCategory: string | null = null;
    if (seriesId && seriesWeekNum && seriesWeekNum > 1) {
      // Find previous week's program in this series
      const previousWeekProgram = await prisma.program.findFirst({
        where: {
          seriesId: seriesId,
          seriesWeek: seriesWeekNum - 1,
        },
        include: {
          items: {
            where: {
              sectionKey: { contains: 'closing' },
              hymnPairId: { not: null },
            },
            include: {
              hymnPair: { select: { category: true } },
            },
            take: 1,
          },
        },
      });
      
      if (previousWeekProgram?.items?.[0]?.hymnPair?.category) {
        previousWeekCategory = previousWeekProgram.items[0].hymnPair.category;
      }
    }

    // 3. Fetch available hymns
    const hymnWhere: any = {};
    if (langMode === 'EN') {
      hymnWhere.AND = [
        { numberEn: { not: null } },
        { titleEn: { not: null } },
      ];
    }

    const allHymns: HymnData[] = await prisma.hymnPair.findMany({
      where: hymnWhere,
      select: {
        id: true,
        numberEs: true,
        titleEs: true,
        numberEn: true,
        titleEn: true,
        keywords: true,
        worshipSection: true,
        theme: true,
        category: true,
        seasonTag: true,
        metadataVerified: true,
      },
    });

    // Calculate verification stats
    const verifiedCount = allHymns.filter(h => h.metadataVerified).length;
    const unverifiedCount = allHymns.length - verifiedCount;

    // 4. Generate program template items with BALANCED hymn selection + Adventist weighting
    const template = PROGRAM_TEMPLATES[programType] ?? [];
    const usedHymnIds = new Set<number>();
    const selectionLogs: SelectionLog[] = [];

    // Phase 6.1: Build emphasis override context
    // Override protection applies when: Monthly emphasis active AND no Series/SpecialEvent
    const emphasisOverrideContext: EmphasisOverrideContext = {
      hasMonthlyEmphasis: !!monthlyEmphasisKey,
      hasSeriesOverride: !!seriesConfig,
      hasSpecialEventOverride: isSpecialEvent && !!specialThemeConfig,
    };
    const overrideProtectionActive = shouldApplyOverrideProtection(emphasisOverrideContext);
    
    if (overrideProtectionActive) {
      console.log('[Smart Generator] Override Protection ACTIVE:', {
        monthlyEmphasisKey,
        evangelismBoost: `${EVANGELISM_BOOST} → ${EVANGELISM_BOOST_REDUCED} (-20%)`,
        emphasisBoost: `${MONTHLY_EMPHASIS_BOOST} → ${MONTHLY_EMPHASIS_BOOST_OVERRIDE} (+20%)`,
      });
    }
    
    // Phase 7: Build doctrinal profile based on organization's denomination
    const doctrinalProfile = getDoctrinalProfile(organizationDenomination);
    logDoctrinalProfile(doctrinalProfile);
    
    console.log('[Smart Generator] Doctrinal Profile Applied:', {
      organizationDenomination: organizationDenomination ?? 'NOT_SET (default CHRISTIAN)',
      profileDenomination: doctrinalProfile.denomination,
      sabbathPriority: doctrinalProfile.sabbathPriority,
      secondComingWeight: doctrinalProfile.secondComingBaseWeight,
      apocalypticTracking: doctrinalProfile.apocalypticTracking,
    });

    const generatedItems = template.map((t: ProgramTemplate, index: number) => {
      const item: any = {
        sectionKey: t.key,
        block: t.block ?? 'MAIN',
        order: index,
        textEn: null,
        textEs: null,
        hymnPairId: null,
        hymnPair: null,
        personName: null,
      };

      // Select hymn if section has hymn slot
      if (t.hasHymn) {
        const expectedCategories = getSectionCategories(t.key, programType);
        
        const { hymn, reason, candidatesCount, fallbackUsed } = selectHymnForSection(
          allHymns,
          {
            verseKeywords,
            seasonKeywords,
            seasonName: season?.name ?? null,
            expectedCategories,
            recentHymnIds,
            isBilingualMode,
            usedHymnIds,
            // Phase 3.7: Adventist context
            programType,
            programDate,
            sectionKey: t.key,
            recentDoctrinalCategories,
            // Phase 3.8: Special Theme context
            isSpecialEvent,
            specialThemeConfig,
            // Phase 4: Series context
            seriesConfig,
            seriesWeek: seriesWeekNum,
            seriesTotal: seriesTotalNum,
            previousWeekCategory,
            // Phase 6: Monthly Emphasis context
            monthlyEmphasisKey,
            emphasisOverrideContext,
            // Phase 7: Doctrinal Profile context
            doctrinalProfile,
          }
        );

        // Log selection
        selectionLogs.push({
          sectionKey: t.key,
          selectedHymn: hymn?.id ?? null,
          reason,
          candidatesCount,
          fallbackUsed,
        });

        if (hymn) {
          item.hymnPairId = hymn.id;
          item.hymnPair = {
            id: hymn.id,
            numberEs: hymn.numberEs,
            titleEs: hymn.titleEs,
            numberEn: hymn.numberEn,
            titleEn: hymn.titleEn,
          };
          usedHymnIds.add(hymn.id);
        }
      }

      return item;
    });

    // 5. Build response
    const isAdvent = isAdventSeason(programDate);
    
    const response = {
      date,
      type: programType,
      languageMode: langMode,
      
      season: season
        ? { name: season.name, nameEs: season.nameEs, keywords: season.keywords }
        : null,

      coverVerse: {
        reference: coverVerse.reference,
        textEn: coverVerse.textEn,
        textEs: coverVerse.textEs,
      },

      items: generatedItems,

      // Debug/stats info
      stats: {
        totalHymnsAvailable: allHymns.length,
        recentlyUsedCount: recentHymnIds.size,
        hymnsSuggested: usedHymnIds.size,
        strategy: 'BALANCED',
        metadataVerified: verifiedCount,
        metadataUnverified: unverifiedCount,
        verificationPct: allHymns.length > 0 ? Math.round((verifiedCount / allHymns.length) * 100) : 0,
        // Phase 7: Denomination-Aware Doctrinal Stats
        doctrinalWeighting: {
          organizationDenomination: organizationDenomination ?? 'NOT_SET',
          profileDenomination: doctrinalProfile.denomination,
          isSabbathProgram: programType === 'SABBATH',
          // SDA-specific settings
          sabbathPriorityActive: shouldApplySabbathPriority(doctrinalProfile),
          sabbathSecondComingBonus: shouldApplySabbathPriority(doctrinalProfile) && programType === 'SABBATH' 
            ? doctrinalProfile.sabbathSecondComingBonus : 0,
          // SECOND_COMING eschatology
          secondComingBaseWeight: doctrinalProfile.secondComingBaseWeight,
          secondComingBaseValue: getSecondComingWeight(doctrinalProfile),
          // Advent season
          isAdventSeason: isAdvent,
          adventSeasonBonus: isAdvent ? doctrinalProfile.adventSeasonBonus : 0,
          // Apocalyptic tracking
          apocalypticTrackingActive: shouldTrackApocalyptic(doctrinalProfile),
          recentDoctrinalCategories: shouldTrackApocalyptic(doctrinalProfile) 
            ? recentDoctrinalCategories.slice(0, 4) : [],
          // Closing hymn priority
          closingHymnPriority: getClosingPriority(doctrinalProfile),
        },
        // Phase 3.8: Special Theme Stats
        specialThemeWeighting: {
          isSpecialEvent,
          specialTheme: specialTheme ?? null,
          themeName: specialThemeConfig?.nameEn ?? null,
          themeNameEs: specialThemeConfig?.nameEs ?? null,
          preferredCategories: specialThemeConfig?.preferredCategories ?? [],
          closingPriority: specialThemeConfig?.closingPriority ?? null,
          themeBoost: isSpecialEvent && specialThemeConfig ? SPECIAL_THEME_CATEGORY_BOOST : 0,
        },
        // Phase 4: Sermon Series Stats
        seriesWeighting: {
          hasSeries: !!seriesConfig,
          seriesId: seriesId ?? null,
          seriesTheme: seriesTheme ?? null,
          seriesWeek: seriesWeekNum ?? null,
          seriesTotal: seriesTotalNum ?? null,
          primaryCategories: seriesConfig?.primaryCategories ?? [],
          relatedCategories: seriesConfig?.relatedCategories ?? [],
          weekProgression: seriesConfig?.weekProgression ?? [],
          expectedCategory: seriesConfig && seriesWeekNum && seriesTotalNum
            ? getProgressionCategoryForWeek(seriesConfig, seriesWeekNum, seriesTotalNum)
            : null,
          previousWeekCategory: previousWeekCategory ?? null,
          primaryBoost: seriesConfig ? SERIES_PRIMARY_BOOST : 0,
          relatedBoost: seriesConfig ? SERIES_RELATED_BOOST : 0,
          progressionBoost: seriesConfig ? SERIES_PROGRESSION_BOOST : 0,
          continuityPenalty: seriesConfig && seriesWeekNum && seriesWeekNum > 1 ? SERIES_CONTINUITY_PENALTY : 0,
        },
        // Phase 6: Monthly Emphasis Stats (with Override Protection)
        monthlyEmphasisWeighting: {
          hasEmphasis: !!monthlyEmphasisKey,
          month: programDate.getMonth() + 1,
          year: programDate.getFullYear(),
          emphasisKey: monthlyEmphasisKey,
          emphasisTitle: monthlyEmphasisTitle,
          emphasisCategories: monthlyEmphasisKey 
            ? getMonthlyEmphasisConfig(monthlyEmphasisKey)?.preferredCategories ?? []
            : [],
          // Override protection info
          overrideProtectionActive,
          emphasisBoost: overrideProtectionActive ? MONTHLY_EMPHASIS_BOOST_OVERRIDE : MONTHLY_EMPHASIS_BOOST,
          emphasisBoostNote: overrideProtectionActive 
            ? `+${MONTHLY_EMPHASIS_BOOST_OVERRIDE} (override: +20%)` 
            : `+${MONTHLY_EMPHASIS_BOOST}`,
          // Permanent Evangelism boost info
          evangelismBoost: overrideProtectionActive ? EVANGELISM_BOOST_REDUCED : EVANGELISM_BOOST,
          evangelismBoostNote: overrideProtectionActive 
            ? `+${EVANGELISM_BOOST_REDUCED} (override: -20%)` 
            : `+${EVANGELISM_BOOST}`,
          evangelismCategories: ['MISSION', 'SALVATION', 'CALL', 'SECOND_COMING'],
        },
      },

      // Selection logs for debugging
      selectionLogs,

      // Keywords used in matching (for transparency)
      matchingContext: {
        verseKeywordsExtracted: verseKeywords,
        seasonKeywords,
        seasonDetected: season?.name ?? 'Ordinary Time',
      },
    };

    // Console log for server-side debugging
    console.log('[Smart Generator] BALANCED + Adventist + Theme + Series:', {
      date,
      type: programType,
      season: season?.name ?? 'Ordinary Time',
      isAdventSeason: isAdvent,
      isSpecialEvent,
      specialTheme: specialTheme ?? 'none',
      themeName: specialThemeConfig?.nameEn ?? 'N/A',
      seriesTheme: seriesTheme ?? 'none',
      seriesWeek: seriesWeekNum ?? 'N/A',
      seriesTotal: seriesTotalNum ?? 'N/A',
      previousWeekCategory: previousWeekCategory ?? 'N/A',
      hymnsSelected: usedHymnIds.size,
      selectionLogs: selectionLogs.map(l => ({
        section: l.sectionKey,
        hymn: l.selectedHymn,
        reason: l.reason,
      })),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in smart generate:', error);
    return NextResponse.json(
      { error: 'Failed to generate program' },
      { status: 500 }
    );
  }
}
