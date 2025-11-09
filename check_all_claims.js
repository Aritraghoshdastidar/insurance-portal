const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

async function checkAllClaims() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [claims] = await conn.execute(
            'SELECT claim_id, customer_id, amount, claim_status, risk_score FROM claim ORDER BY amount DESC'
        );
        console.log('All Claims (sorted by amount):');
        claims.forEach(c => {
            const isHighRisk = parseFloat(c.amount) > 1000000 || c.risk_score > 8;
            console.log(`${c.claim_id}: ₹${c.amount} (${c.claim_status}) Risk:${c.risk_score} ${isHighRisk ? '← HIGH RISK' : ''}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

checkAllClaims();
