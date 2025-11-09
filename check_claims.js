const mysql = require('mysql2/promise');

async function checkClaims() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    // Get recent claims
    const [claims] = await connection.execute(`
      SELECT claim_id, policy_id, customer_id, description, 
             claim_status, amount, claim_date
      FROM claim
      ORDER BY claim_date DESC
      LIMIT 10
    `);

    console.log('📋 Recent Claims:');
    console.log('─────────────────────────────────────────────────────────────');
    
    if (claims.length === 0) {
      console.log('❌ No claims found in database');
    } else {
      claims.forEach((claim, idx) => {
        console.log(`${idx + 1}. Claim ID: ${claim.claim_id}`);
        console.log(`   Policy ID: ${claim.policy_id}`);
        console.log(`   Customer ID: ${claim.customer_id}`);
        console.log(`   Status: ${claim.claim_status}`);
        console.log(`   Amount: $${claim.amount}`);
        console.log(`   Description: ${claim.description}`);
        console.log(`   Date: ${claim.claim_date}`);
        console.log('─────────────────────────────────────────────────────────────');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkClaims();
