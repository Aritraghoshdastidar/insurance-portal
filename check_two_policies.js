const mysql = require('mysql2/promise');
(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });
  try {
    const ids = ['POL_BUY_1762662764443','POL_BUY_1762665108394'];
    const [rows] = await connection.query(`SELECT policy_id, status, premium_amount, initial_approver_id, final_approver_id FROM policy WHERE policy_id IN (?, ?)`, ids);
    console.log('🔍 Specific Policies:');
    rows.forEach(r => console.log(r));
  } catch(e){ console.error(e); } finally { await connection.end(); }
})();