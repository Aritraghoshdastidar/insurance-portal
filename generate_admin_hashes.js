const bcrypt = require('bcrypt');

const adminPasswords = [
  { id: 'ADM001', email: 'admin@insurance.com', password: 'admin123', role: 'System Admin' },
  { id: 'ADM002', email: 'j.adjuster@insurance.com', password: 'admin_pass_123', role: 'Junior Adjuster' },
  { id: 'ADM003', email: 'security.officer@insurance.com', password: 'security', role: 'Security Officer' }
];

async function generateHashes() {
  console.log('\n🔐 ADMIN PASSWORD HASHES FOR DATABASE\n');
  console.log('Copy these hashes into your SQL INSERT statements:\n');
  console.log('='.repeat(50));
  
  for (const admin of adminPasswords) {
    const hash = await bcrypt.hash(admin.password, 10);
    console.log(`\n${admin.id} (${admin.role})`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${admin.password}`);
    console.log(`Hash: ${hash}`);
    console.log('-'.repeat(80));
  }
  
  console.log('\n\n📋 SQL UPDATE STATEMENTS:\n');
  
  for (const admin of adminPasswords) {
    const hash = await bcrypt.hash(admin.password, 10);
    console.log(`UPDATE administrator SET password = '${hash}' WHERE admin_id = '${admin.id}';`);
  }
  
  console.log('\n✅ Done! Use these hashes in your database dump.\n');
}

generateHashes();
