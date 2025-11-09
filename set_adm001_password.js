const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

async function setAdminPassword() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update ADM001 password
    await connection.execute(
      'UPDATE administrator SET password = ? WHERE admin_id = ?',
      [hashedPassword, 'ADM001']
    );
    
    console.log('✅ Password set for ADM001');
    console.log('   Email: admin@insurance.com');
    console.log('   Password: admin123');
    
    // Verify it was set
    const [rows] = await connection.execute(
      'SELECT admin_id, name, email, role, password FROM administrator WHERE admin_id = ?',
      ['ADM001']
    );
    
    if (rows[0].password) {
      console.log('\n✅ Password verified in database');
      console.log(`   Admin: ${rows[0].name}`);
      console.log(`   Email: ${rows[0].email}`);
      console.log(`   Role: ${rows[0].role}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

setAdminPassword();
