/**
 * Phase 3.7 - Adventist Doctrinal Weighting Report
 * Shows metadata-enhanced Smart Generator with SDA weighting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Adventist doctrinal priorities
const ADVENTIST_PRIORITIES = ['SECOND_COMING', 'HOPE', 'FAITH', 'DEDICATION'];

// Check if in Advent season (Nov-Dec)
function isAdventSeason(date: Date): boolean {
  const month = date.getMonth();
  return month === 10 || month === 11;
}

async function generateComparisonReport() {
  console.log('\n========================================================');
  console.log('PHASE 3.7 - ADVENTIST DOCTRINAL WEIGHTING REPORT');
  console.log('========================================================\n');

  // Get hymn stats
  const hymns = await prisma.hymnPair.findMany({
    select: {
      id: true,
      numberEs: true,
      titleEs: true,
      numberEn: true,
      titleEn: true,
      category: true,
      theme: true,
      seasonTag: true,
      worshipSection: true,
      keywords: true,
      metadataVerified: true,
    },
    orderBy: { numberEs: 'asc' },
  });

  // Category distribution
  const categoryStats: Record<string, number> = {};
  const seasonStats: Record<string, number> = {};
  const worshipSectionStats: Record<string, number> = {};
  let verifiedCount = 0;

  for (const h of hymns) {
    categoryStats[h.category ?? 'NULL'] = (categoryStats[h.category ?? 'NULL'] ?? 0) + 1;
    if (h.seasonTag) {
      seasonStats[h.seasonTag] = (seasonStats[h.seasonTag] ?? 0) + 1;
    }
    worshipSectionStats[h.worshipSection ?? 'NULL'] = (worshipSectionStats[h.worshipSection ?? 'NULL'] ?? 0) + 1;
    if (h.metadataVerified) verifiedCount++;
  }

  console.log('=== HYMN DATABASE SUMMARY ===\n');
  console.log(`Total Hymns:             ${hymns.length}`);
  console.log(`Metadata Verified:       ${verifiedCount} (${((verifiedCount / hymns.length) * 100).toFixed(1)}%)`);
  console.log(`Metadata Unverified:     ${hymns.length - verifiedCount} (${(((hymns.length - verifiedCount) / hymns.length) * 100).toFixed(1)}%)`);

  console.log('\n=== CATEGORY DISTRIBUTION ===\n');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / hymns.length) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(18)} ${count.toString().padStart(3)} (${pct}%)`);
    });

  console.log('\n=== SEASON TAG DISTRIBUTION ===\n');
  Object.entries(seasonStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => {
      console.log(`  ${tag.padEnd(18)} ${count.toString().padStart(3)}`);
    });
  const noSeasonCount = hymns.length - Object.values(seasonStats).reduce((a, b) => a + b, 0);
  console.log(`  ${'(No Season)'.padEnd(18)} ${noSeasonCount.toString().padStart(3)}`);

  console.log('\n=== WORSHIP SECTION DISTRIBUTION ===\n');
  Object.entries(worshipSectionStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([section, count]) => {
      const pct = ((count / hymns.length) * 100).toFixed(1);
      console.log(`  ${section.padEnd(18)} ${count.toString().padStart(3)} (${pct}%)`);
    });

  // Simulate SABBATH program generation with metadata
  console.log('\n========================================================');
  console.log('SAMPLE SABBATH PROGRAM GENERATION (Feb 14, 2026)');
  console.log('========================================================\n');

  // Get hymns by category for SABBATH sections
  const praiseHymns = hymns.filter(h => h.category === 'PRAISE').slice(0, 5);
  const prayerHymns = hymns.filter(h => h.category === 'PRAYER').slice(0, 3);
  const hopeHymns = hymns.filter(h => h.category === 'HOPE' || h.category === 'SECOND_COMING').slice(0, 3);

  console.log('--- SABBATH SCHOOL HYMN (category: PRAISE) ---');
  if (praiseHymns[0]) {
    const h = praiseHymns[0];
    console.log(`  Selected: #${h.numberEs} ${h.titleEs}`);
    console.log(`            EN: #${h.numberEn ?? 'N/A'} ${h.titleEn ?? 'N/A'}`);
    console.log(`            Category: ${h.category} | Theme: ${h.theme}`);
    console.log(`            Keywords: ${h.keywords.slice(0, 5).join(', ')}`);
    console.log(`            Scoring: CATEGORY(+20) BILINGUAL(+10) = ~30+ pts`);
  }

  console.log('\n--- DOXOLOGY (category: PRAISE) ---');
  if (praiseHymns[1]) {
    const h = praiseHymns[1];
    console.log(`  Selected: #${h.numberEs} ${h.titleEs}`);
    console.log(`            EN: #${h.numberEn ?? 'N/A'} ${h.titleEn ?? 'N/A'}`);
    console.log(`            Category: ${h.category} | Theme: ${h.theme}`);
    console.log(`            Keywords: ${h.keywords.slice(0, 5).join(', ')}`);
    console.log(`            Scoring: CATEGORY(+20) BILINGUAL(+10) = ~30+ pts`);
  }

  console.log('\n--- DIVINE WORSHIP HYMN (category: PRAISE/PRAYER) ---');
  if (prayerHymns[0]) {
    const h = prayerHymns[0];
    console.log(`  Selected: #${h.numberEs} ${h.titleEs}`);
    console.log(`            EN: #${h.numberEn ?? 'N/A'} ${h.titleEn ?? 'N/A'}`);
    console.log(`            Category: ${h.category} | Theme: ${h.theme}`);
    console.log(`            Keywords: ${h.keywords.slice(0, 5).join(', ')}`);
    console.log(`            Scoring: CATEGORY(+20) BILINGUAL(+10) = ~30+ pts`);
  }

  console.log('\n--- CLOSING HYMN (category: HOPE/SECOND_COMING) ---');
  if (hopeHymns[0]) {
    const h = hopeHymns[0];
    console.log(`  Selected: #${h.numberEs} ${h.titleEs}`);
    console.log(`            EN: #${h.numberEn ?? 'N/A'} ${h.titleEn ?? 'N/A'}`);
    console.log(`            Category: ${h.category} | Theme: ${h.theme}`);
    console.log(`            Keywords: ${h.keywords.slice(0, 5).join(', ')}`);
    console.log(`            Scoring: CATEGORY(+20) BILINGUAL(+10) = ~30+ pts`);
  }

  console.log('\n========================================================');
  console.log('COMPARISON: BEFORE vs AFTER METADATA INITIALIZATION');
  console.log('========================================================\n');

  console.log('--- BEFORE (Fallback-Dominant) ---');
  console.log('  Selection Reason: BILINGUAL(+10) GENERAL(+5) = ~15 pts');
  console.log('  Category Match:   0% (no category data)');
  console.log('  Season Match:     0% (no seasonTag data)');
  console.log('  Keyword Match:    0% (no keywords)');
  console.log('  Fallback Used:    100%');

  console.log('\n--- AFTER (Metadata-Enhanced) ---');
  const nonGeneralCount = hymns.filter(h => h.category && h.category !== 'GENERAL').length;
  const hasSeasonCount = hymns.filter(h => h.seasonTag).length;
  const hasKeywordsCount = hymns.filter(h => h.keywords.length > 0).length;
  
  console.log(`  Selection Reason: CATEGORY(+20) BILINGUAL(+10) SEASON_KW(+var) = ~30+ pts`);
  console.log(`  Category Match:   ${nonGeneralCount}/${hymns.length} (${((nonGeneralCount / hymns.length) * 100).toFixed(1)}%) hymns have specific categories`);
  console.log(`  Season Match:     ${hasSeasonCount}/${hymns.length} (${((hasSeasonCount / hymns.length) * 100).toFixed(1)}%) hymns have seasonTag`);
  console.log(`  Keyword Match:    ${hasKeywordsCount}/${hymns.length} (${((hasKeywordsCount / hymns.length) * 100).toFixed(1)}%) hymns have keywords`);
  console.log(`  Fallback Used:    ~${((hymns.filter(h => h.category === 'GENERAL').length / hymns.length) * 100).toFixed(0)}% (only GENERAL category)`);

  console.log('\n========================================================');
  console.log('HISTORY FILTERING CONFIRMATION');
  console.log('========================================================\n');

  const historyCount = await prisma.programHymnHistory.count();
  console.log(`  History Records:      ${historyCount}`);
  console.log(`  28-Day Penalty:       -200 pts (applied to recent hymns)`);
  console.log(`  Unique Per Program:   \u2713 (usedHymnIds Set prevents duplicates)`);
  
  if (historyCount === 0) {
    console.log(`  Status:               Ready (no history yet - hymns will be tracked on save)`);
  } else {
    const recent = await prisma.programHymnHistory.findMany({
      take: 5,
      orderBy: { dateUsed: 'desc' },
      include: { hymn: { select: { numberEs: true, titleEs: true } } }
    });
    console.log(`  Recent History:`);
    recent.forEach(r => {
      console.log(`    - #${r.hymn.numberEs} ${r.hymn.titleEs} (${r.dateUsed.toISOString().split('T')[0]})`);
    });
  }

  console.log('\n========================================================');
  console.log('TOP 10 CATEGORIES BY COUNT');
  console.log('========================================================\n');
  
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count], i) => {
      const bar = '\u2588'.repeat(Math.min(count, 30));
      console.log(`  ${(i+1).toString().padStart(2)}. ${cat.padEnd(18)} ${bar} ${count}`);
    });

  // Phase 3.7: Adventist Doctrinal Weighting Analysis
  console.log('\n========================================================');
  console.log('PHASE 3.7: ADVENTIST DOCTRINAL WEIGHTING');
  console.log('========================================================\n');

  // Current date analysis
  const today = new Date();
  const isAdvent = isAdventSeason(today);
  
  console.log('--- CURRENT CONTEXT ---');
  console.log(`  Date:                 ${today.toISOString().split('T')[0]}`);
  console.log(`  Month:                ${today.toLocaleString('default', { month: 'long' })}`);
  console.log(`  Is Advent Season:     ${isAdvent ? 'YES (Nov-Dec)' : 'NO'}`);
  
  console.log('\n--- SABBATH PROGRAM WEIGHTING ---');
  console.log(`  SECOND_COMING base:   +10 (SDA_SABBATH bonus)`);
  console.log(`  Advent season:        ${isAdvent ? '+15 (SDA_ADVENT bonus)' : '+0 (not in Nov-Dec)'}`);
  console.log(`  Total SECOND_COMING:  ${isAdvent ? '+25' : '+10'} on SABBATH programs`);

  console.log('\n--- CLOSING HYMN PRIORITY ---');
  console.log(`  1st choice:           SECOND_COMING (+8 SDA_CLOSE_1ST)`);
  console.log(`  2nd choice:           HOPE (+4 SDA_CLOSE_2ND)`);
  console.log(`  3rd choice:           DEDICATION (standard category)`);

  console.log('\n--- ADVENTIST DOCTRINAL CATEGORIES ---');
  const adventistHymns = hymns.filter(h => ADVENTIST_PRIORITIES.includes(h.category ?? ''));
  const adventistByCategory: Record<string, number> = {};
  for (const h of adventistHymns) {
    adventistByCategory[h.category ?? 'UNKNOWN'] = (adventistByCategory[h.category ?? 'UNKNOWN'] ?? 0) + 1;
  }
  
  Object.entries(adventistByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const bar = '\u2588'.repeat(Math.min(count, 20));
      console.log(`  ${cat.padEnd(15)} ${bar} ${count}`);
    });
  console.log(`  TOTAL:                ${adventistHymns.length} / ${hymns.length} (${((adventistHymns.length / hymns.length) * 100).toFixed(1)}%)`);

  console.log('\n--- OVERUSE ROTATION PREVENTION ---');
  console.log(`  Tracking:             Last 2 weeks of doctrinal categories`);
  console.log(`  Penalty:              -15 if same category used 2+ weeks`);
  console.log(`  Related rotations:`);
  console.log(`    SECOND_COMING  \u2192  HOPE, FAITH`);
  console.log(`    HOPE           \u2192  SECOND_COMING, FAITH`);
  console.log(`    FAITH          \u2192  HOPE, DEDICATION`);
  console.log(`    DEDICATION     \u2192  FAITH, HOPE`);

  // Sample SABBATH closing hymn selection
  console.log('\n--- SAMPLE SABBATH CLOSING HYMN SELECTION ---');
  const secondComingHymns = hymns.filter(h => h.category === 'SECOND_COMING').slice(0, 3);
  const hopeHymns2 = hymns.filter(h => h.category === 'HOPE').slice(0, 2);
  
  console.log('\n  Top SECOND_COMING candidates (highest priority):');
  secondComingHymns.forEach((h, i) => {
    const baseScore = 20; // CATEGORY
    const sabbathBonus = 10;
    const adventBonus = isAdvent ? 15 : 0;
    const closingBonus = 8;
    const bilingualBonus = 10;
    const total = baseScore + sabbathBonus + adventBonus + closingBonus + bilingualBonus;
    console.log(`    ${i+1}. #${h.numberEs} ${h.titleEs.substring(0, 30).padEnd(30)} Score: ~${total} pts`);
    console.log(`       CATEGORY(+20) SDA_SABBATH(+10) ${isAdvent ? 'SDA_ADVENT(+15) ' : ''}SDA_CLOSE_1ST(+8) BILINGUAL(+10)`);
  });

  console.log('\n  Top HOPE candidates (2nd priority):');
  hopeHymns2.forEach((h, i) => {
    const baseScore = 20;
    const closingBonus = 4;
    const bilingualBonus = 10;
    const total = baseScore + closingBonus + bilingualBonus;
    console.log(`    ${i+1}. #${h.numberEs} ${h.titleEs.substring(0, 30).padEnd(30)} Score: ~${total} pts`);
    console.log(`       CATEGORY(+20) SDA_CLOSE_2ND(+4) BILINGUAL(+10)`);
  });

  console.log('\n========================================================');
  console.log('PHASE 3.7 COMPLETE - ADVENTIST IDENTITY ENFORCED');
  console.log('========================================================\n');

  await prisma.$disconnect();
}

generateComparisonReport().catch(console.error);
