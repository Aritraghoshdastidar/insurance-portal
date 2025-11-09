const mysql = require('mysql2/promise');

async function addNewStatuses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
  });

  try {
    console.log('🔧 Adding new policy statuses to ENUM...\n');

    // Alter the policy status enum to include new workflow statuses
    await connection.execute(`
      ALTER TABLE policy 
      MODIFY COLUMN status ENUM(
        'INACTIVE_AWAITING_PAYMENT',
        'UNDERWRITER_REVIEW',
        'PENDING_INITIAL_APPROVAL',
        'PENDING_FINAL_APPROVAL',
        'ACTIVE',
        'DECLINED',
        'DENIED_UNDERWRITER',
        'EXPIRED'
      )
    `);

    console.log('✅ Successfully added new statuses:');
    console.log('   - UNDERWRITER_REVIEW');
    console.log('   - PENDING_INITIAL_APPROVAL (was already there)');
    console.log('   - DENIED_UNDERWRITER');
    console.log('\n📊 Complete workflow statuses now available:');
    console.log('   1. INACTIVE_AWAITING_PAYMENT (after purchase)');
    console.log('   2. UNDERWRITER_REVIEW (after payment)');
    console.log('   3. PENDING_INITIAL_APPROVAL (after underwriter approval)');
    console.log('   4. PENDING_FINAL_APPROVAL (after first admin approval)');
    console.log('   5. ACTIVE (after second admin approval)');
    console.log('   6. DENIED_UNDERWRITER (if underwriter denies)');
    console.log('   7. DECLINED (manual decline)');
    console.log('   8. EXPIRED\n');

    // Verify
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM policy WHERE Field = 'status'
    `);
    
    console.log('✅ Verified - New column definition:');
    console.log(columns[0].Type);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addNewStatuses();
