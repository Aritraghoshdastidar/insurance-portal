const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

async function testHighRiskAlerts() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(
            `SELECT claim_id, customer_id, amount, claim_status, risk_score
             FROM claim
             WHERE amount > 1000000 OR risk_score > 8
             ORDER BY amount DESC`
        );
        console.log('High Risk Claims Found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

testHighRiskAlerts();
