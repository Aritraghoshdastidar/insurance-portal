const mysql = require('mysql2/promise');

async function repairPolicies(policyIds) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔧 Repairing policy statuses for approval workflow...');
    await connection.beginTransaction();

    // Simplify: avoid join + collation mismatch by checking payment existence separately
    for (const pid of policyIds) {
      const [[policy]] = await connection.execute(
        `SELECT policy_id, status, initial_approver_id, final_approver_id FROM policy WHERE policy_id = ? FOR UPDATE`,
        [pid]
      );
      if (!policy) {
        console.log(`⚠️ Policy ${pid} not found, skipping.`);
        continue;
      }
      if (policy.status !== 'ACTIVE' || (policy.initial_approver_id || policy.final_approver_id)) {
        console.log(`ℹ️ Policy ${pid} not a candidate (status=${policy.status}).`);
        continue;
      }
      const [payRows] = await connection.execute(
        `SELECT 1 FROM initial_payment WHERE policy_id = ? LIMIT 1`,
        [pid]
      );
      if (payRows.length === 0) {
        console.log(`ℹ️ Policy ${pid} has no payment, skipping.`);
        continue;
      }
      await connection.execute(
        `UPDATE policy SET status = 'PENDING_INITIAL_APPROVAL' WHERE policy_id = ?`,
        [pid]
      );
      console.log(`✅ Policy ${pid} reset to PENDING_INITIAL_APPROVAL`);
    }

    await connection.commit();
    console.log('🎯 Repair complete.');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error repairing policies:', error.message);
  } finally {
    await connection.end();
  }
}

const ids = ['POL_BUY_1762662764443','POL_BUY_1762665108394'];
repairPolicies(ids);
