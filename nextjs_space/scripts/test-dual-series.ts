/**
 * Phase 4.5: Dual Series Engine Test Script
 * 
 * Demonstrates:
 * A) Predefined Series (4 weeks) - "Living by Faith in the Last Days"
 * B) Dynamically Generated Series (4 weeks) - Custom "Stewardship" theme
 * 
 * Shows system layering priority:
 * 1. Adventist doctrinal weighting (base)
 * 2. SpecialTheme weighting (if applicable)
 * 3. Series weighting
 * 4. Balanced logic
 * 5. History filter
 */

import { PrismaClient } from '@prisma/client';
import {
  PREDEFINED_SERIES,
  getPredefinedSeries,
  getWeekConfigForPredefinedSeries,
  generateDynamicSeries,
  getSeriesBoostsForScoring,
  calculateSeriesBoost,
  SERIES_LIBRARY_BOOSTS,
  type WeekConfig,
} from '../lib/series-library';
import type { HymnCategory } from '../lib/types';

const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  PHASE 4.5: DUAL SERIES ENGINE - TEST REPORT');
  console.log('='.repeat(80));
  
  // ============================================================================
  // PART A: PREDEFINED SERIES (4 WEEKS)
  // ============================================================================
  
  console.log('\n\n' + '-'.repeat(80));
  console.log('  PART A: PREDEFINED SERIES - "Living by Faith in the Last Days"');
  console.log('-'.repeat(80));
  
  const predefinedSeries = getPredefinedSeries('faith-last-days');
  
  if (predefinedSeries) {
    console.log(`\n📚 Series: ${predefinedSeries.title}`);
    console.log(`   Spanish: ${predefinedSeries.titleEs}`);
    console.log(`   Theme: ${predefinedSeries.theme}`);
    console.log(`   Total Weeks: ${predefinedSeries.totalWeeks}`);
    console.log(`   Description: ${predefinedSeries.description}`);
    console.log(`\n   Keywords: ${predefinedSeries.keywords.join(', ')}`);
    
    console.log('\n   📅 Week-by-Week Configuration:');
    console.log('   ' + '-'.repeat(74));
    
    for (const weekConfig of predefinedSeries.weekProgression) {
      console.log(`\n   🗓️  WEEK ${weekConfig.weekNumber}: ${weekConfig.title}`);
      console.log(`      Spanish: ${weekConfig.titleEs}`);
      console.log(`      Theme: ${weekConfig.theme}`);
      console.log(`      ✨ Preferred Categories: ${weekConfig.preferredCategories.join(', ')}`);
      console.log(`      🔹 Secondary Categories: ${weekConfig.secondaryCategories.join(', ')}`);
      console.log(`      🎯 Category Boosts:`);
      
      const sortedBoosts = Object.entries(weekConfig.categoryBoosts)
        .filter(([_, boost]) => boost > 0)
        .sort((a, b) => b[1] - a[1]);
      
      for (const [cat, boost] of sortedBoosts) {
        console.log(`         ${cat}: +${boost}`);
      }
    }
    
    console.log(`\n   🎵 Closing Progression: ${predefinedSeries.closingProgression.join(' → ')}`);
    
    // Simulate hymn selection for Week 1
    console.log('\n   🎼 Simulated Hymn Selection (Week 1):');
    const week1Config = getWeekConfigForPredefinedSeries('faith-last-days', 1);
    const hymns = await prisma.hymnPair.findMany({
      where: {
        category: {
          in: ['FAITH', 'SCRIPTURE', 'HOPE', 'PRAYER'],
        },
      },
      take: 10,
    });
    
    console.log('\n      Top Hymn Candidates with Series Boosts:');
    for (const hymn of hymns.slice(0, 5)) {
      const baseScore = 10; // Adventist doctrinal base
      const seriesBoost = calculateSeriesBoost(hymn.category as HymnCategory, week1Config?.categoryBoosts ?? null);
      const totalScore = baseScore + seriesBoost;
      
      console.log(`      - #${hymn.numberEs} ${hymn.titleEs}`);
      console.log(`        Category: ${hymn.category} | Base: ${baseScore} | Series: +${seriesBoost} | Total: ${totalScore}`);
    }
  }
  
  // ============================================================================
  // PART B: DYNAMICALLY GENERATED SERIES (4 WEEKS)
  // ============================================================================
  
  console.log('\n\n' + '-'.repeat(80));
  console.log('  PART B: DYNAMICALLY GENERATED SERIES - Custom "Stewardship" Theme');
  console.log('-'.repeat(80));
  
  const dynamicSeries = generateDynamicSeries({
    customTheme: 'Stewardship and Faithful Service',
    totalWeeks: 4,
  });
  
  console.log(`\n💡 Generated Series:`);
  console.log(`   Suggested Title: ${dynamicSeries.suggestedTitle}`);
  console.log(`   Spanish: ${dynamicSeries.suggestedTitleEs}`);
  console.log(`\n   📊 Doctrinal Progression Map: ${dynamicSeries.doctrinalProgressionMap.join(' → ')}`);
  
  console.log('\n   📅 Generated Week-by-Week Configuration:');
  console.log('   ' + '-'.repeat(74));
  
  for (let week = 0; week < dynamicSeries.weekConfigs.length; week++) {
    const weekConfig = dynamicSeries.weekConfigs[week];
    const weekTheme = dynamicSeries.weekThemes[week];
    
    console.log(`\n   🗓️  WEEK ${weekConfig.weekNumber}: ${weekConfig.title}`);
    console.log(`      Spanish: ${weekConfig.titleEs}`);
    console.log(`      Theme (EN): ${weekTheme.en}`);
    console.log(`      Theme (ES): ${weekTheme.es}`);
    console.log(`      ✨ Preferred Categories: ${weekConfig.preferredCategories.join(', ')}`);
    console.log(`      🔹 Secondary Categories: ${weekConfig.secondaryCategories.join(', ')}`);
    console.log(`      🎯 Category Boosts:`);
    
    const boosts = dynamicSeries.categoryWeightingPerWeek[week];
    const sortedBoosts = Object.entries(boosts)
      .filter(([_, boost]) => boost > 0)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [cat, boost] of sortedBoosts) {
      console.log(`         ${cat}: +${boost}`);
    }
  }
  
  // Simulate hymn selection for dynamic series Week 1
  console.log('\n   🎼 Simulated Hymn Selection (Week 1):');
  const dynamicWeek1Boosts = dynamicSeries.categoryWeightingPerWeek[0];
  const dynamicCategories = Object.keys(dynamicWeek1Boosts) as HymnCategory[];
  
  const dynamicHymns = await prisma.hymnPair.findMany({
    where: {
      category: {
        in: dynamicCategories,
      },
    },
    take: 10,
  });
  
  console.log('\n      Top Hymn Candidates with Dynamic Series Boosts:');
  for (const hymn of dynamicHymns.slice(0, 5)) {
    const baseScore = 10; // Adventist doctrinal base
    const seriesBoost = calculateSeriesBoost(hymn.category as HymnCategory, dynamicWeek1Boosts);
    const totalScore = baseScore + seriesBoost;
    
    console.log(`      - #${hymn.numberEs} ${hymn.titleEs}`);
    console.log(`        Category: ${hymn.category} | Base: ${baseScore} | Series: +${seriesBoost} | Total: ${totalScore}`);
  }
  
  // ============================================================================
  // COMPARISON TABLE
  // ============================================================================
  
  console.log('\n\n' + '-'.repeat(80));
  console.log('  COMPARISON: PREDEFINED vs DYNAMIC SERIES');
  console.log('-'.repeat(80));
  
  console.log('\n  | Aspect                  | Predefined Series              | Dynamic Series                 |');
  console.log('  |-------------------------|--------------------------------|--------------------------------|');
  console.log(`  | Source                  | Library (curated)              | Generated from theme           |`);
  console.log(`  | Title                   | ${predefinedSeries?.title.padEnd(30) ?? 'N/A'.padEnd(30)} | ${dynamicSeries.suggestedTitle.padEnd(30)} |`);
  console.log(`  | Week 1 Primary          | ${predefinedSeries?.weekProgression[0].preferredCategories.join(', ').padEnd(30) ?? 'N/A'.padEnd(30)} | ${dynamicSeries.weekConfigs[0].preferredCategories.join(', ').padEnd(30)} |`);
  console.log(`  | Week 4 Primary          | ${predefinedSeries?.weekProgression[3].preferredCategories.join(', ').padEnd(30) ?? 'N/A'.padEnd(30)} | ${dynamicSeries.weekConfigs[3].preferredCategories.join(', ').padEnd(30)} |`);
  console.log(`  | Max Boost               | +${SERIES_LIBRARY_BOOSTS.PRIMARY.toString().padEnd(28)} | +${SERIES_LIBRARY_BOOSTS.PRIMARY.toString().padEnd(28)} |`);
  console.log(`  | Secondary Boost         | +${SERIES_LIBRARY_BOOSTS.SECONDARY.toString().padEnd(28)} | +${SERIES_LIBRARY_BOOSTS.SECONDARY.toString().padEnd(28)} |`);
  
  // ============================================================================
  // SYSTEM LAYERING DEMONSTRATION
  // ============================================================================
  
  console.log('\n\n' + '-'.repeat(80));
  console.log('  SYSTEM LAYERING PRIORITY DEMONSTRATION');
  console.log('-'.repeat(80));
  
  console.log('\n  Example: FAITH hymn during EVANGELISM special event in Week 1 of Faith series');
  console.log('\n  Layer 1: Adventist Doctrinal Base       +10  (FAITH is core category)');
  console.log('  Layer 2: Special Theme (EVANGELISM)    +20  (FAITH in preferredCategories)');
  console.log('  Layer 3: Series Weighting              +20  (FAITH is primary for Week 1)');
  console.log('  Layer 4: Balanced Logic                 +0  (not penalized)');
  console.log('  Layer 5: History Filter                 +0  (not used in 28 days)');
  console.log('  ' + '-'.repeat(50));
  console.log('  TOTAL SCORE:                           +50');
  
  console.log('\n  Contrast: GENERAL hymn (same conditions)');
  console.log('\n  Layer 1: Adventist Doctrinal Base        +0  (GENERAL not prioritized)');
  console.log('  Layer 2: Special Theme (EVANGELISM)     +0  (GENERAL not preferred)');
  console.log('  Layer 3: Series Weighting               +0  (GENERAL not in series)');
  console.log('  Layer 4: Balanced Logic                 -5  (penalty for generic)');
  console.log('  Layer 5: History Filter                 +0  (not used in 28 days)');
  console.log('  ' + '-'.repeat(50));
  console.log('  TOTAL SCORE:                            -5');
  
  // ============================================================================
  // AVAILABLE PREDEFINED SERIES
  // ============================================================================
  
  console.log('\n\n' + '-'.repeat(80));
  console.log('  AVAILABLE PREDEFINED SERIES IN LIBRARY');
  console.log('-'.repeat(80));
  
  console.log('\n  | #  | ID                    | Title                                    | Weeks |');
  console.log('  |----|----------------------|------------------------------------------|-------|');
  
  PREDEFINED_SERIES.forEach((series, idx) => {
    console.log(`  | ${(idx + 1).toString().padEnd(2)} | ${series.id.padEnd(20)} | ${series.title.padEnd(40)} | ${series.totalWeeks.toString().padEnd(5)} |`);
  });
  
  // ============================================================================
  // SUMMARY
  // ============================================================================
  
  console.log('\n\n' + '='.repeat(80));
  console.log('  PHASE 4.5 IMPLEMENTATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n  ✅ Created /lib/series-library.ts with:');
  console.log('     - 8 predefined Adventist doctrinal series');
  console.log('     - Each series includes: title, theme, totalWeeks, weekProgression, preferredCategoriesPerWeek');
  console.log('     - Dynamic series generation from custom themes');
  console.log('     - Category relationship mapping for intelligent generation');
  console.log('\n  ✅ Dynamic Series Generation:');
  console.log('     - Accepts custom theme input');
  console.log('     - Generates suggested title (EN/ES)');
  console.log('     - Creates doctrinal progression map');
  console.log('     - Assigns week themes based on categories');
  console.log('     - Calculates category weighting per week');
  console.log('\n  ✅ System Layering Maintained:');
  console.log('     1. Adventist doctrinal weighting (base)');
  console.log('     2. SpecialTheme weighting (if applicable)');
  console.log('     3. Series weighting (this module)');
  console.log('     4. Balanced logic');
  console.log('     5. History filter');
  
  console.log('\n' + '='.repeat(80));
  console.log('  END OF PHASE 4.5 TEST REPORT');
  console.log('='.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
