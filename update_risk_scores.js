const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};

// Simple risk score calculation based on amount
function calculateRiskScore(amount) {
    const amt = parseFloat(amount);
    if (amt > 10000000) return 10; // Very high
    if (amt > 1000000) return 9;   // High
    if (amt > 500000) return 8;    // Medium-high
    if (amt > 100000) return 7;    // Medium
    if (amt > 50000) return 6;     // Medium-low
    if (amt > 10000) return 5;     // Low-medium
    if (amt > 5000) return 4;      // Low
    if (amt > 1000) return 3;      // Very low
    return 2;                       // Minimal
}

async function updateRiskScores() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        
        // Get all claims
        const [claims] = await conn.execute('SELECT claim_id, amount FROM claim');
        
        console.log(`Updating risk scores for ${claims.length} claims...`);
        
        for (const claim of claims) {
            const riskScore = calculateRiskScore(claim.amount);
            await conn.execute(
                'UPDATE claim SET risk_score = ? WHERE claim_id = ?',
                [riskScore, claim.claim_id]
            );
            console.log(`${claim.claim_id}: ₹${claim.amount} → Risk Score: ${riskScore}`);
        }
        
        console.log('\nRisk scores updated successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

updateRiskScores();
