const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

async function assignClaims() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Assign claims to different adjusters
    await connection.execute(
      'UPDATE claim SET admin_id = ? WHERE claim_id = ?',
      ['ADM001', 'CLM_1762665971112']
    );
    console.log('✅ Assigned CLM_1762665971112 to ADM001');
    
    await connection.execute(
      'UPDATE claim SET admin_id = ? WHERE claim_id = ?',
      ['ADM002', 'CLM_1762670090888']
    );
    console.log('✅ Assigned CLM_1762670090888 to ADM002');
    
    await connection.execute(
      'UPDATE claim SET admin_id = ? WHERE claim_id = ?',
      ['ADM003', 'CLM_1762667111575']
    );
    console.log('✅ Assigned CLM_1762667111575 to ADM003');
    
    // Show all assigned claims
    const [rows] = await connection.execute(
      'SELECT claim_id, admin_id, amount, description FROM claim WHERE admin_id IS NOT NULL'
    );
    
    console.log('\n📋 Assigned Claims:');
    rows.forEach(claim => {
      console.log(`  ${claim.claim_id} → ${claim.admin_id} (₹${claim.amount})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

assignClaims();
