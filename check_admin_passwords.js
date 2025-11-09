const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

async function checkAdminPasswords() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT admin_id, name, email, password IS NOT NULL as has_password FROM administrator ORDER BY admin_id'
    );
    
    console.log('📋 Admin Password Status:\n');
    rows.forEach(admin => {
      const status = admin.has_password ? '✅ SET' : '❌ MISSING';
      console.log(`${admin.admin_id}: ${admin.name} (${admin.email})`);
      console.log(`   Password: ${status}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkAdminPasswords();
