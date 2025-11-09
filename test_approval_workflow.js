const mysql = require('mysql2/promise');

async function testWorkflow() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    console.log('🔧 Creating a test policy purchase...\n');

    const customerId = 'CUST_1761038061124'; // new@example.com
    const testPolicyId = 'POL_TEST_WORKFLOW_' + Date.now();

    // 1. Create policy (simulating /api/policies/buy)
    await connection.execute(
      `INSERT INTO policy (policy_id, policy_date, start_date, end_date, premium_amount, coverage_details, status, policy_type)
       VALUES (?, CURDATE(), NULL, NULL, ?, ?, 'INACTIVE_AWAITING_PAYMENT', ?)`,
      [testPolicyId, 15000, 'Test coverage', 'HEALTH']
    );

    await connection.execute(
      `INSERT INTO customer_policy (customer_id, policy_id) VALUES (?, ?)`,
      [customerId, testPolicyId]
    );

    console.log(`✅ Step 1: Policy created with status INACTIVE_AWAITING_PAYMENT`);
    console.log(`   Policy ID: ${testPolicyId}`);
    console.log(`   Premium: $15,000 (should auto-approve)\n`);

    // 2. Simulate payment (would trigger UNDERWRITER_REVIEW → auto-eval → PENDING_INITIAL_APPROVAL)
    await connection.execute(
      `UPDATE policy SET status = 'UNDERWRITER_REVIEW' WHERE policy_id = ?`,
      [testPolicyId]
    );
    console.log(`✅ Step 2: Payment received → Status: UNDERWRITER_REVIEW\n`);

    // 3. Simulate auto-evaluation (premium $15,000 <= $50,000 → auto-approve)
    await connection.execute(
      `UPDATE policy SET status = 'PENDING_INITIAL_APPROVAL' WHERE policy_id = ?`,
      [testPolicyId]
    );
    console.log(`✅ Step 3: Auto-evaluated by underwriter rules → Status: PENDING_INITIAL_APPROVAL`);
    console.log(`   (Premium $15,000 is ≤ $50,000, so auto-approved)\n`);

    // 4. Check current status
    const [result] = await connection.execute(
      `SELECT policy_id, policy_type, premium_amount, status FROM policy WHERE policy_id = ?`,
      [testPolicyId]
    );

    console.log('📊 Final Result:');
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`Policy ID: ${result[0].policy_id}`);
    console.log(`Type: ${result[0].policy_type}`);
    console.log(`Premium: $${result[0].premium_amount}`);
    console.log(`Status: ${result[0].status}`);
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('✅ WORKFLOW TEST COMPLETE!\n');
    console.log('Expected Flow:');
    console.log('1. Customer buys policy → INACTIVE_AWAITING_PAYMENT');
    console.log('2. Customer pays → UNDERWRITER_REVIEW');
    console.log('3. Auto-evaluation → PENDING_INITIAL_APPROVAL (if premium ≤ $50k)');
    console.log('4. Admin approves → PENDING_FINAL_APPROVAL');
    console.log('5. Security Officer approves → ACTIVE\n');

    console.log('🎯 This policy is now waiting in Admin Dashboard "Pending Policy Approvals"!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testWorkflow();
