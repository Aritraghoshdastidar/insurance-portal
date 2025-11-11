/**
 * Test Premium Calculations for All Policies
 * Verify the formulas produce realistic Indian insurance premiums
 */

console.log('🧮 Testing Premium Calculations for All Policies\n');
console.log('='.repeat(70));

// Premium calculation function (matching frontend logic)
function calculatePremium(basePremium, coverage, minCoverage, termMonths) {
  const coverageFactor = coverage / minCoverage;
  const termFactor = Math.sqrt(termMonths / 12);
  const monthlyPremium = basePremium * coverageFactor * termFactor;
  const totalPremium = monthlyPremium * termMonths;
  
  return {
    monthly: monthlyPremium,
    total: totalPremium,
    annual: monthlyPremium * 12
  };
}

// Policy catalog from BuyPolicy.js
const policies = [
  {
    name: 'Individual Health - Basic',
    basePremium: 800,
    coverageRange: [200000, 500000],
    termRange: [12, 24],
    testCases: [
      { coverage: 200000, term: 12, desc: 'Min coverage, 1 year' },
      { coverage: 300000, term: 12, desc: 'Mid coverage, 1 year' },
      { coverage: 500000, term: 12, desc: 'Max coverage, 1 year' }
    ]
  },
  {
    name: 'Individual Health - Premium',
    basePremium: 1500,
    coverageRange: [500000, 1000000],
    termRange: [12, 24],
    testCases: [
      { coverage: 500000, term: 12, desc: 'Min ₹5L, 1 year' },
      { coverage: 1000000, term: 12, desc: 'Max ₹10L, 1 year' }
    ]
  },
  {
    name: 'Family Floater',
    basePremium: 2000,
    coverageRange: [500000, 2500000],
    termRange: [12, 24],
    testCases: [
      { coverage: 500000, term: 12, desc: 'Min ₹5L, 1 year' },
      { coverage: 1500000, term: 12, desc: 'Mid ₹15L, 1 year' },
      { coverage: 2500000, term: 12, desc: 'Max ₹25L, 1 year' }
    ]
  },
  {
    name: 'Term Life - Basic',
    basePremium: 500,
    coverageRange: [1000000, 5000000],
    termRange: [120, 360],
    testCases: [
      { coverage: 1000000, term: 120, desc: '₹10L, 10 years' },
      { coverage: 2500000, term: 240, desc: '₹25L, 20 years' },
      { coverage: 5000000, term: 120, desc: '₹50L, 10 years' }
    ]
  },
  {
    name: 'Term Life - Premium',
    basePremium: 1200,
    coverageRange: [5000000, 20000000],
    termRange: [120, 480],
    testCases: [
      { coverage: 5000000, term: 120, desc: '₹50L, 10 years' },
      { coverage: 10000000, term: 180, desc: '₹1Cr, 15 years' },
      { coverage: 20000000, term: 240, desc: '₹2Cr, 20 years' }
    ]
  },
  {
    name: 'Two Wheeler Insurance',
    basePremium: 350,
    coverageRange: [40000, 150000],
    termRange: [12, 12],
    testCases: [
      { coverage: 40000, term: 12, desc: '₹40K bike' },
      { coverage: 80000, term: 12, desc: '₹80K bike' },
      { coverage: 150000, term: 12, desc: '₹1.5L bike' }
    ]
  },
  {
    name: 'Car Insurance - Comprehensive',
    basePremium: 1200,
    coverageRange: [300000, 1500000],
    termRange: [12, 36],
    testCases: [
      { coverage: 300000, term: 12, desc: '₹3L car, 1 year' },
      { coverage: 800000, term: 12, desc: '₹8L car, 1 year' },
      { coverage: 1500000, term: 12, desc: '₹15L car, 1 year' }
    ]
  },
  {
    name: 'Home Insurance - Standard',
    basePremium: 500,
    coverageRange: [500000, 5000000],
    termRange: [12, 36],
    testCases: [
      { coverage: 500000, term: 12, desc: '₹5L home, 1 year' },
      { coverage: 2500000, term: 12, desc: '₹25L home, 1 year' },
      { coverage: 5000000, term: 12, desc: '₹50L home, 1 year' }
    ]
  },
  {
    name: 'Home Insurance - Premium',
    basePremium: 1500,
    coverageRange: [5000000, 20000000],
    termRange: [12, 36],
    testCases: [
      { coverage: 5000000, term: 12, desc: '₹50L home, 1 year' },
      { coverage: 10000000, term: 12, desc: '₹1Cr home, 1 year' },
      { coverage: 20000000, term: 12, desc: '₹2Cr home, 1 year' }
    ]
  }
];

// Test each policy
policies.forEach((policy, idx) => {
  console.log(`\n${idx + 1}. ${policy.name}`);
  console.log('-'.repeat(70));
  console.log(`Base Premium: ₹${policy.basePremium}/month`);
  console.log(`Coverage Range: ₹${(policy.coverageRange[0]/100000).toFixed(1)}L - ₹${(policy.coverageRange[1]/100000).toFixed(0)}L`);
  console.log(`Term Range: ${policy.termRange[0]}-${policy.termRange[1]} months\n`);
  
  policy.testCases.forEach(test => {
    const result = calculatePremium(
      policy.basePremium,
      test.coverage,
      policy.coverageRange[0],
      test.term
    );
    
    console.log(`  📋 ${test.desc}`);
    console.log(`     Coverage: ₹${test.coverage.toLocaleString('en-IN')}`);
    console.log(`     Monthly:  ₹${result.monthly.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`     Annual:   ₹${result.annual.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`     Total:    ₹${result.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} for ${test.term} months`);
    
    // Validation checks
    const warnings = [];
    if (result.monthly < 100) warnings.push('⚠️  Monthly < ₹100 (too low!)');
    if (result.monthly > 50000) warnings.push('⚠️  Monthly > ₹50K (too high!)');
    if (result.annual < 1000) warnings.push('⚠️  Annual < ₹1K (unrealistic)');
    
    if (warnings.length > 0) {
      warnings.forEach(w => console.log(`     ${w}`));
    } else {
      console.log(`     ✓ Premium looks reasonable`);
    }
    console.log('');
  });
});

console.log('='.repeat(70));
console.log('\n📊 Summary: Premium Calculation Formula');
console.log('   monthlyPremium = basePremium × (coverage/minCoverage) × √(termMonths/12)');
console.log('   totalPremium = monthlyPremium × termMonths\n');

console.log('💡 Expected Ranges (Indian Market 2025):');
console.log('   Health Basic:       ₹800-2,000/month  (₹10K-24K/year)');
console.log('   Health Premium:     ₹1,500-3,000/month (₹18K-36K/year)');
console.log('   Family Floater:     ₹2,000-10,000/month (₹24K-1.2L/year)');
console.log('   Term Life Basic:    ₹500-2,500/month  (₹6K-30K/year)');
console.log('   Term Life Premium:  ₹1,200-6,000/month (₹15K-72K/year)');
console.log('   Two Wheeler:        ₹350-1,000/month  (₹4K-12K/year)');
console.log('   Car:                ₹1,200-5,000/month (₹15K-60K/year)');
console.log('   Home Standard:      ₹500-5,000/month  (₹6K-60K/year)');
console.log('   Home Premium:       ₹1,500-15,000/month (₹18K-1.8L/year)\n');
