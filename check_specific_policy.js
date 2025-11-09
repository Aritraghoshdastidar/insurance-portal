const mysql = require('mysql2/promise');

async function checkSpecificPolicy() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    const policyId = 'POL_TEST_WORKFLOW_1762667801290';
    
    const [policy] = await connection.execute(`
      SELECT policy_id, status, policy_date, start_date, 
             initial_approver_id, final_approver_id,
             initial_approval_date, final_approval_date
      FROM policy 
      WHERE policy_id = ?
    `, [policyId]);

    console.log('📋 Policy Details:');
    console.log(policy[0]);

    const [payments] = await connection.execute(`
      SELECT * FROM initial_payment WHERE policy_id = ?
    `, [policyId]);

    console.log('\n💰 Payments:');
    console.log(payments);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSpecificPolicy();
