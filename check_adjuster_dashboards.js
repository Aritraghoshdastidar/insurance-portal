const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

async function checkAdjusterDashboards() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Get all admins
    const [admins] = await connection.execute('SELECT admin_id, name, role FROM administrator');
    
    console.log('🔍 Adjuster Dashboard Check:\n');
    
    for (const admin of admins) {
      const [claims] = await connection.execute(
        'SELECT claim_id, description, amount FROM claim WHERE admin_id = ?',
        [admin.admin_id]
      );
      
      console.log(`📊 ${admin.name} (${admin.admin_id}) - ${admin.role}`);
      if (claims.length === 0) {
        console.log('   No claims assigned\n');
      } else {
        console.log(`   ${claims.length} claims assigned:`);
        claims.forEach(claim => {
          console.log(`   • ${claim.claim_id}: ${claim.description} (₹${parseFloat(claim.amount).toLocaleString()})`);
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkAdjusterDashboards();
