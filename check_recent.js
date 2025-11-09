const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

async function checkRecent() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [claims] = await conn.execute('SELECT claim_id, claim_status FROM claim ORDER BY claim_date DESC LIMIT 5');
        const [policies] = await conn.execute('SELECT policy_id, status FROM policy ORDER BY policy_date DESC LIMIT 5');
        console.log('Recent Claims:');
        claims.forEach(c => console.log(`${c.claim_id}: ${c.claim_status}`));
        console.log('Recent Policies:');
        policies.forEach(p => console.log(`${p.policy_id}: ${p.status}`));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

checkRecent();
