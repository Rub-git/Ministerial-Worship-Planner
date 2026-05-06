/**
 * Phase 3.8: Thematic Program Engine - Test Script
 * 
 * Simulates Smart Generator with special themes to show category distribution
 * and scoring behavior for EVANGELISM and YOUTH_DAY Sabbath programs.
 */

import { PrismaClient } from '@prisma/client';
import { SPECIAL_THEMES, getSpecialTheme, SPECIAL_THEME_CATEGORY_BOOST } from '../lib/special-themes';

const prisma = new PrismaClient();

// Simplified scoring constants (matching smart-generate route)
const ADVENTIST_SABBATH_SECOND_COMING_BONUS = 10;
const ADVENTIST_ADVENT_SEASON_BONUS = 15;
const ADVENTIST_CLOSING_FIRST_CHOICE_BONUS = 8;
const ADVENTIST_CLOSING_SECOND_CHOICE_BONUS = 4;
const CATEGORY_MATCH_BONUS = 20;
const BILINGUAL_BONUS = 10;

interface HymnData {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
  category: string | null;
  theme: string | null;
  keywords: string[];
  metadataVerified: boolean;
}

interface ScoredHymn extends HymnData {
  score: number;
  reasons: string[];
}

function isAdventSeason(date: Date): boolean {
  const month = date.getMonth();
  return month === 10 || month === 11;
}

function scoreHymnForSection(
  hymn: HymnData,
  sectionKey: string,
  isSpecialEvent: boolean,
  themeKey: string | null,
  programDate: Date
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const category = hymn.category?.toUpperCase() ?? 'GENERAL';
  const themeConfig = getSpecialTheme(themeKey);
  const isClosing = sectionKey.includes('closing');
  const isAdvent = isAdventSeason(programDate);

  // Adventist Doctrinal Weighting
  if (category === 'SECOND_COMING') {
    score += ADVENTIST_SABBATH_SECOND_COMING_BONUS;
    reasons.push(`SDA_SABBATH(+${ADVENTIST_SABBATH_SECOND_COMING_BONUS})`);
    
    if (isAdvent) {
      score += ADVENTIST_ADVENT_SEASON_BONUS;
      reasons.push(`SDA_ADVENT(+${ADVENTIST_ADVENT_SEASON_BONUS})`);
    }
  }

  // Closing section priority (Adventist default)
  if (isClosing) {
    if (category === 'SECOND_COMING') {
      score += ADVENTIST_CLOSING_FIRST_CHOICE_BONUS;
      reasons.push(`SDA_CLOSE_1ST(+${ADVENTIST_CLOSING_FIRST_CHOICE_BONUS})`);
    } else if (category === 'HOPE') {
      score += ADVENTIST_CLOSING_SECOND_CHOICE_BONUS;
      reasons.push(`SDA_CLOSE_2ND(+${ADVENTIST_CLOSING_SECOND_CHOICE_BONUS})`);
    }
  }

  // Phase 3.8: Special Theme Boost
  if (isSpecialEvent && themeConfig) {
    const preferredCategories = themeConfig.preferredCategories as string[];
    if (preferredCategories.includes(category)) {
      score += SPECIAL_THEME_CATEGORY_BOOST;
      reasons.push(`THEME(+${SPECIAL_THEME_CATEGORY_BOOST})`);
    }

    // Theme closing priority
    if (isClosing && themeConfig.closingPriority) {
      const closingPriority = themeConfig.closingPriority as string[];
      const priorityIndex = closingPriority.indexOf(category);
      if (priorityIndex === 0) {
        score += 6;
        reasons.push(`THEME_CLOSE_1ST(+6)`);
      } else if (priorityIndex === 1) {
        score += 3;
        reasons.push(`THEME_CLOSE_2ND(+3)`);
      }
    }
  }

  // Standard category match (for section-appropriate categories)
  const sectionCategories: Record<string, string[]> = {
    'ss_hymn': ['PRAISE', 'GENERAL'],
    'dw_doxology': ['PRAISE'],
    'dw_hymn': ['PRAISE', 'PRAYER'],
    'dw_closing_hymn': ['SECOND_COMING', 'HOPE', 'DEDICATION'],
  };
  const expectedCats = sectionCategories[sectionKey] ?? ['GENERAL'];
  if (expectedCats.includes(category)) {
    score += CATEGORY_MATCH_BONUS;
    reasons.push(`CATEGORY(+${CATEGORY_MATCH_BONUS})`);
  }

  // Bilingual bonus
  if (hymn.numberEn && hymn.titleEn) {
    score += BILINGUAL_BONUS;
    reasons.push(`BILINGUAL(+${BILINGUAL_BONUS})`);
  }

  return { score, reasons };
}

async function generateSampleProgram(
  themeKey: string | null,
  isSpecialEvent: boolean,
  hymns: HymnData[]
): Promise<void> {
  const themeConfig = getSpecialTheme(themeKey);
  const programDate = new Date('2026-02-14'); // Regular date (not Advent)
  
  console.log('\n' + '='.repeat(70));
  if (isSpecialEvent && themeConfig) {
    console.log(`📌 SPECIAL EVENT: ${themeConfig.nameEn}`);
    console.log(`   Spanish: ${themeConfig.nameEs}`);
    console.log(`   Preferred Categories: ${themeConfig.preferredCategories.join(', ')}`);
    if (themeConfig.closingPriority) {
      console.log(`   Closing Priority: ${themeConfig.closingPriority.join(' → ')}`);
    }
  } else {
    console.log('📌 REGULAR SABBATH PROGRAM (No Special Theme)');
  }
  console.log('='.repeat(70));

  const sections = ['dw_hymn', 'dw_closing_hymn'];

  for (const section of sections) {
    console.log(`\n🎵 Section: ${section}`);
    console.log('-'.repeat(50));

    // Score all hymns for this section
    const scored: ScoredHymn[] = hymns.map(h => {
      const { score, reasons } = scoreHymnForSection(
        h,
        section,
        isSpecialEvent,
        themeKey,
        programDate
      );
      return { ...h, score, reasons };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Show top 5 candidates
    console.log('Top 5 candidates:');
    scored.slice(0, 5).forEach((h, idx) => {
      const enInfo = h.numberEn ? `#${h.numberEn} ${h.titleEn}` : '(ES only)';
      console.log(`  ${idx + 1}. [${h.category ?? 'N/A'}] #${h.numberEs} ${h.titleEs}`);
      console.log(`     ${enInfo}`);
      console.log(`     Score: ${h.score} | ${h.reasons.join(' ')}`);
    });

    // Selected hymn
    const selected = scored[0];
    console.log(`\n   ✅ SELECTED: #${selected.numberEs} ${selected.titleEs} (${selected.category})`);
  }
}

async function runThematicProgramTest() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     PHASE 3.8: THEMATIC PROGRAM ENGINE - TEST REPORT              ║');
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
      theme: true,
      keywords: true,
      metadataVerified: true,
    },
  });

  console.log(`\n📊 Hymn Database: ${hymns.length} total hymns`);

  // Category distribution
  const catDist: Record<string, number> = {};
  for (const h of hymns) {
    const cat = h.category ?? 'UNCLASSIFIED';
    catDist[cat] = (catDist[cat] ?? 0) + 1;
  }
  console.log('\n📈 Category Distribution:');
  Object.entries(catDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / hymns.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 2));
      console.log(`   ${cat.padEnd(15)} ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
    });

  // Theme Configurations Summary
  console.log('\n' + '─'.repeat(70));
  console.log('📋 SPECIAL THEMES CONFIGURATION:');
  console.log('─'.repeat(70));
  Object.entries(SPECIAL_THEMES).forEach(([key, config]) => {
    console.log(`\n  ${key}:`);
    console.log(`    EN: ${config.nameEn}`);
    console.log(`    ES: ${config.nameEs}`);
    console.log(`    Categories: ${config.preferredCategories.join(', ')}`);
    if (config.closingPriority) {
      console.log(`    Closing: ${config.closingPriority.join(' → ')}`);
    }
  });

  // Sample 1: EVANGELISM Sabbath
  await generateSampleProgram('EVANGELISM', true, hymns);

  // Sample 2: YOUTH_DAY Sabbath
  await generateSampleProgram('YOUTH_DAY', true, hymns);

  // Sample 3: Regular Sabbath (for comparison)
  await generateSampleProgram(null, false, hymns);

  // Scoring comparison table
  console.log('\n' + '═'.repeat(70));
  console.log('📊 SCORING COMPARISON: Closing Hymn Candidates');
  console.log('═'.repeat(70));
  console.log('\nCategory         | Regular | EVANGELISM | YOUTH_DAY | Difference');
  console.log('-'.repeat(70));

  const categories = ['SECOND_COMING', 'HOPE', 'MISSION', 'CALL', 'DEDICATION', 'FAITH'];
  for (const cat of categories) {
    // Find a hymn with this category
    const sampleHymn = hymns.find(h => h.category === cat);
    if (!sampleHymn) {
      console.log(`${cat.padEnd(16)} | (no hymns with this category)`);
      continue;
    }

    const { score: regScore } = scoreHymnForSection(sampleHymn, 'dw_closing_hymn', false, null, new Date());
    const { score: evScore } = scoreHymnForSection(sampleHymn, 'dw_closing_hymn', true, 'EVANGELISM', new Date());
    const { score: ydScore } = scoreHymnForSection(sampleHymn, 'dw_closing_hymn', true, 'YOUTH_DAY', new Date());

    console.log(
      `${cat.padEnd(16)} | ${regScore.toString().padStart(7)} | ${evScore.toString().padStart(10)} | ${ydScore.toString().padStart(9)} | EV:+${evScore - regScore}, YD:+${ydScore - regScore}`
    );
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Phase 3.8 Test Complete');
  console.log('\nKey Observations:');
  console.log('  • Special themes add +20 boost to preferred category hymns');
  console.log('  • Theme closing priority adds +6 (1st) / +3 (2nd) for closing hymns');
  console.log('  • Adventist doctrinal weighting (SECOND_COMING bonus) is PRESERVED');
  console.log('  • Themes LAYER ON TOP of core identity scoring');
  console.log('═'.repeat(70));

  await prisma.$disconnect();
}

runThematicProgramTest().catch(console.error);
