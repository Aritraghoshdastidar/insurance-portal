const mysql = require('mysql2/promise');

async function checkStatusColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM policy WHERE Field = 'status'
    `);
    
    console.log('📋 Policy Status Column Info:');
    console.log(columns[0]);
    
    const [statuses] = await connection.execute(`
      SELECT DISTINCT status FROM policy
    `);
    
    console.log('\n📊 Current Status Values in Use:');
    statuses.forEach(s => console.log(`  - ${s.status}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStatusColumn();
