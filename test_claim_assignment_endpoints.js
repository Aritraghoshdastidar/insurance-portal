async function testEndpoints() {
  console.log('🔍 Testing Claim Assignment Endpoints...\n');
  
  try {
    // Test 1: Get all claims
    console.log('1️⃣ Testing GET /api/claims');
    const claimsRes = await fetch('http://localhost:3001/api/claims');
    const claimsData = await claimsRes.json();
    console.log(`   ✅ Success! Found ${claimsData.claims.length} claims`);
    console.log(`   Sample: ${claimsData.claims[0].claim_id} - ${claimsData.claims[0].description}`);
    console.log('');
    
    // Test 2: Get all adjusters
    console.log('2️⃣ Testing GET /api/adjusters/list');
    const adjustersRes = await fetch('http://localhost:3001/api/adjusters/list');
    const adjustersData = await adjustersRes.json();
    console.log(`   ✅ Success! Found ${adjustersData.length} adjusters`);
    adjustersData.forEach(adj => {
      console.log(`   • ${adj.admin_id}: ${adj.name} (${adj.role})`);
    });
    console.log('');
    
    // Test 3: Check current assignments
    console.log('3️⃣ Current Claim Assignments:');
    const assigned = claimsData.claims.filter(c => c.admin_id);
    console.log(`   ${assigned.length} claims are assigned`);
    assigned.slice(0, 5).forEach(claim => {
      console.log(`   • ${claim.claim_id} → ${claim.admin_id} (₹${claim.amount})`);
    });
    
    console.log('\n✅ All endpoints working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoints();
