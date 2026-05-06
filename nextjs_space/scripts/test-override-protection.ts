import { 
  getEvangelismBoost, 
  getMonthlyEmphasisBoostForCategory, 
  getMonthlyEmphasisConfig,
  shouldApplyOverrideProtection,
  EVANGELISM_BOOST,
  EVANGELISM_BOOST_REDUCED,
  MONTHLY_EMPHASIS_BOOST,
  MONTHLY_EMPHASIS_BOOST_OVERRIDE,
  EmphasisOverrideContext 
} from '../lib/monthly-emphasis';
import { HymnCategory } from '../lib/types';

console.log('='.repeat(70));
console.log(' PHASE 6.1: MONTHLY EMPHASIS OVERRIDE PROTECTION');
console.log(' April 2026 → STEWARDSHIP Emphasis');
console.log('='.repeat(70));
console.log('');

// STEWARDSHIP emphasis config
const emphasisKey = 'STEWARDSHIP';
const config = getMonthlyEmphasisConfig(emphasisKey);
console.log('📅 Monthly Emphasis Configuration:');
console.log(`   Key: ${emphasisKey}`);
console.log(`   Primary Categories: ${config?.preferredCategories.join(', ')}`);
console.log(`   Secondary Categories: ${config?.secondaryCategories?.join(', ')}`);
console.log('');

// Test categories
interface TestCategory { name: HymnCategory; type: string; }
const testCategories: TestCategory[] = [
  { name: 'DEDICATION', type: 'STEWARDSHIP Primary' },
  { name: 'SERVICE', type: 'STEWARDSHIP Primary' },
  { name: 'GRATITUDE', type: 'STEWARDSHIP Primary' },
  { name: 'SACRIFICE', type: 'STEWARDSHIP Primary' },
  { name: 'FAITH', type: 'STEWARDSHIP Secondary' },
  { name: 'MISSION', type: 'Evangelism' },
  { name: 'SALVATION', type: 'Evangelism' },
  { name: 'CALL', type: 'Evangelism' },
  { name: 'SECOND_COMING', type: 'Evangelism' },
  { name: 'PRAISE', type: 'Neither' },
];

// Context WITHOUT override protection (has Series or SpecialEvent)
const noOverrideContext: EmphasisOverrideContext = {
  hasMonthlyEmphasis: true,
  hasSeriesOverride: true,
  hasSpecialEventOverride: false,
};

// Context WITH override protection (Monthly Emphasis alone)
const withOverrideContext: EmphasisOverrideContext = {
  hasMonthlyEmphasis: true,
  hasSeriesOverride: false,
  hasSpecialEventOverride: false,
};

console.log('─'.repeat(70));
console.log(' BEFORE/AFTER COMPARISON');
console.log('─'.repeat(70));
console.log('');
console.log('SCENARIO A: Monthly Emphasis + Series (NO override protection)');
console.log(`   Override Active: ${shouldApplyOverrideProtection(noOverrideContext)}`);
console.log('');
console.log('SCENARIO B: Monthly Emphasis ONLY (WITH override protection)');
console.log(`   Override Active: ${shouldApplyOverrideProtection(withOverrideContext)}`);
console.log('');

console.log('─'.repeat(70));
console.log(' SCORING COMPARISON TABLE');
console.log('─'.repeat(70));
console.log('');
console.log('Category         | Type                  | BEFORE | AFTER  | Δ');
console.log('─'.repeat(70));

for (const cat of testCategories) {
  const evangBefore = getEvangelismBoost(cat.name, noOverrideContext);
  const emphBefore = getMonthlyEmphasisBoostForCategory(cat.name, emphasisKey, noOverrideContext);
  const totalBefore = evangBefore + emphBefore;
  
  const evangAfter = getEvangelismBoost(cat.name, withOverrideContext);
  const emphAfter = getMonthlyEmphasisBoostForCategory(cat.name, emphasisKey, withOverrideContext);
  const totalAfter = evangAfter + emphAfter;
  
  const delta = totalAfter - totalBefore;
  const deltaStr = delta > 0 ? `+${delta}` : delta === 0 ? '0' : String(delta);
  
  console.log(`${cat.name.padEnd(16)} | ${cat.type.padEnd(21)} | ${String(totalBefore).padStart(6)} | ${String(totalAfter).padStart(6)} | ${deltaStr.padStart(4)}`);
}

console.log('');
console.log('─'.repeat(70));
console.log(' DETAILED BREAKDOWN');
console.log('─'.repeat(70));

console.log('');
console.log('📊 DEDICATION (STEWARDSHIP Primary):');
console.log('   BEFORE (with Series override):');
console.log(`      Evangelism: +${getEvangelismBoost('DEDICATION', noOverrideContext)} (not evangelism category)`);
console.log(`      Monthly Emphasis: +${getMonthlyEmphasisBoostForCategory('DEDICATION', emphasisKey, noOverrideContext)}`);
console.log(`      TOTAL: +${getEvangelismBoost('DEDICATION', noOverrideContext) + getMonthlyEmphasisBoostForCategory('DEDICATION', emphasisKey, noOverrideContext)}`);
console.log('');
console.log('   AFTER (override protection active):');
console.log(`      Evangelism: +${getEvangelismBoost('DEDICATION', withOverrideContext)} (not evangelism category)`);
console.log(`      Monthly Emphasis: +${getMonthlyEmphasisBoostForCategory('DEDICATION', emphasisKey, withOverrideContext)} (↑ 1.2x)`);
console.log(`      TOTAL: +${getEvangelismBoost('DEDICATION', withOverrideContext) + getMonthlyEmphasisBoostForCategory('DEDICATION', emphasisKey, withOverrideContext)}`);

console.log('');
console.log('📊 MISSION (Evangelism Primary):');
console.log('   BEFORE (with Series override):');
console.log(`      Evangelism: +${getEvangelismBoost('MISSION', noOverrideContext)}`);
console.log(`      Monthly Emphasis: +${getMonthlyEmphasisBoostForCategory('MISSION', emphasisKey, noOverrideContext)} (not in STEWARDSHIP)`);
console.log(`      TOTAL: +${getEvangelismBoost('MISSION', noOverrideContext) + getMonthlyEmphasisBoostForCategory('MISSION', emphasisKey, noOverrideContext)}`);
console.log('');
console.log('   AFTER (override protection active):');
console.log(`      Evangelism: +${getEvangelismBoost('MISSION', withOverrideContext)} (↓ 20%)`);
console.log(`      Monthly Emphasis: +${getMonthlyEmphasisBoostForCategory('MISSION', emphasisKey, withOverrideContext)} (not in STEWARDSHIP)`);
console.log(`      TOTAL: +${getEvangelismBoost('MISSION', withOverrideContext) + getMonthlyEmphasisBoostForCategory('MISSION', emphasisKey, withOverrideContext)}`);

console.log('');
console.log('─'.repeat(70));
console.log(' RANKING COMPARISON (April 2026 STEWARDSHIP)');
console.log('─'.repeat(70));
console.log('');

const allScores = testCategories.map(c => ({
  cat: c.name,
  type: c.type,
  before: getEvangelismBoost(c.name, noOverrideContext) + getMonthlyEmphasisBoostForCategory(c.name, emphasisKey, noOverrideContext),
  after: getEvangelismBoost(c.name, withOverrideContext) + getMonthlyEmphasisBoostForCategory(c.name, emphasisKey, withOverrideContext),
}));

console.log('BEFORE (no override):');
const sortedBefore = [...allScores].sort((a, b) => b.before - a.before);
sortedBefore.forEach((s, i) => {
  console.log(`   ${i + 1}. ${s.cat.padEnd(16)} +${s.before}`);
});

console.log('');
console.log('AFTER (with override protection):');
const sortedAfter = [...allScores].sort((a, b) => b.after - a.after);
sortedAfter.forEach((s, i) => {
  console.log(`   ${i + 1}. ${s.cat.padEnd(16)} +${s.after}`);
});

console.log('');
console.log('═'.repeat(70));
console.log(' SUMMARY');
console.log('═'.repeat(70));
console.log('');
console.log('✅ Override Protection ensures:');
console.log(`   • STEWARDSHIP primary categories: +${MONTHLY_EMPHASIS_BOOST} → +${MONTHLY_EMPHASIS_BOOST_OVERRIDE} (↑ 20%)`);
console.log(`   • Evangelism categories: +${EVANGELISM_BOOST} → +${EVANGELISM_BOOST_REDUCED} (↓ 20%)`);
console.log('   • STEWARDSHIP categories OUTRANK Evangelism categories during April');
console.log('   • Adventist identity preserved (Evangelism still receives a positive boost)');
console.log('');
console.log('🎯 Net Effect:');
console.log('   STEWARDSHIP primary: +18 vs Evangelism: +6');
console.log('   Clear thematic leadership for the emphasis month!');
console.log('');
