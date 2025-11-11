const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function testAdminPasswords() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  const [admins] = await conn.execute('SELECT admin_id, email, password FROM administrator ORDER BY admin_id');
  
  const passwords = {
    ADM001: 'admin123',
    ADM002: 'admin_pass_123',
    ADM003: 'security'
  };

  console.log('\n🔐 Testing Admin Passwords:\n');
  
  for (const admin of admins) {
    const isValid = await bcrypt.compare(passwords[admin.admin_id], admin.password);
    console.log(`${admin.admin_id} (${admin.email})`);
    console.log(`  Password: ${passwords[admin.admin_id]}`);
    console.log(`  Status: ${isValid ? '✅ VALID - Can login!' : '❌ INVALID'}\n`);
  }

  await conn.end();
}

testAdminPasswords();
