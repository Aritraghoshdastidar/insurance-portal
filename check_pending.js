const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

async function checkPending() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [claims] = await conn.execute('SELECT claim_id, claim_status FROM claim WHERE claim_status = "PENDING"');
        const [policies] = await conn.execute('SELECT policy_id, status FROM policy WHERE status IN ("PENDING_INITIAL_APPROVAL", "PENDING_FINAL_APPROVAL")');
        console.log('Pending Claims:', claims.length);
        console.log('Pending Policies:', policies.length);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

checkPending();
