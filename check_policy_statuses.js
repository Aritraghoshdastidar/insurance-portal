const mysql = require('mysql2/promise');

async function checkPolicyStatuses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    // Get all policies with their statuses
    const [policies] = await connection.execute(`
      SELECT policy_id, policy_type, status, premium_amount, policy_date,
             initial_approver_id, final_approver_id
      FROM policy
      ORDER BY policy_date DESC
      LIMIT 20
    `);

    console.log('📋 Policy Status Summary:');
    console.log('═════════════════════════════════════════════════════════════');
    
    // Group by status
    const statusGroups = {};
    policies.forEach(policy => {
      if (!statusGroups[policy.status]) {
        statusGroups[policy.status] = [];
      }
      statusGroups[policy.status].push(policy);
    });

    Object.keys(statusGroups).forEach(status => {
      console.log(`\n📊 ${status} (${statusGroups[status].length} policies):`);
      console.log('─────────────────────────────────────────────────────────────');
      statusGroups[status].forEach(policy => {
        console.log(`   ${policy.policy_id} - ${policy.policy_type} - $${policy.premium_amount}`);
      });
    });

    console.log('\n\n🔍 Workflow Status Breakdown:');
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`✅ ACTIVE: ${(statusGroups['ACTIVE'] || []).length} policies`);
    console.log(`⏳ INACTIVE_AWAITING_PAYMENT: ${(statusGroups['INACTIVE_AWAITING_PAYMENT'] || []).length} policies`);
    console.log(`📝 PENDING_INITIAL_APPROVAL: ${(statusGroups['PENDING_INITIAL_APPROVAL'] || []).length} policies`);
    console.log(`🔄 PENDING_FINAL_APPROVAL: ${(statusGroups['PENDING_FINAL_APPROVAL'] || []).length} policies`);
    console.log(`🔍 UNDERWRITER_REVIEW: ${(statusGroups['UNDERWRITER_REVIEW'] || []).length} policies`);
    console.log(`❌ DENIED_UNDERWRITER: ${(statusGroups['DENIED_UNDERWRITER'] || []).length} policies`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPolicyStatuses();
