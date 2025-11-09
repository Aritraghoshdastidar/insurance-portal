const mysql = require('mysql2/promise');

async function checkPolicies() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    // Get customer ID for new@example.com
    const [customers] = await connection.execute(
      'SELECT customer_id, email FROM customer WHERE email = ?',
      ['new@example.com']
    );

    if (customers.length === 0) {
      console.log('❌ Customer new@example.com not found');
      return;
    }

    const customerId = customers[0].customer_id;
    console.log(`✅ Customer ID: ${customerId} (${customers[0].email})\n`);

    // Get policies for this customer
    const [policies] = await connection.execute(`
      SELECT cp.policy_id, p.policy_type, p.status, p.premium_amount, p.start_date
      FROM customer_policy cp
      JOIN policy p ON cp.policy_id = p.policy_id
      WHERE cp.customer_id = ?
      ORDER BY p.policy_date DESC
    `, [customerId]);

    if (policies.length === 0) {
      console.log('❌ No policies found for this customer');
    } else {
      console.log('📋 Customer Policies:');
      console.log('─────────────────────────────────────────────────────────────');
      policies.forEach((policy, idx) => {
        console.log(`${idx + 1}. Policy ID: ${policy.policy_id}`);
        console.log(`   Type: ${policy.policy_type}`);
        console.log(`   Status: ${policy.status}`);
        console.log(`   Premium: $${policy.premium_amount}`);
        console.log(`   Start Date: ${policy.start_date || 'N/A'}`);
        console.log('─────────────────────────────────────────────────────────────');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPolicies();
