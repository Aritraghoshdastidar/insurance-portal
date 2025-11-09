const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'insurance_app',
        password: 'app_password_123',
        database: 'insurance_db_dev',
        multipleStatements: true
    });

    try {
        console.log('Creating initial_payment table...');
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS initial_payment (
                payment_id VARCHAR(50) PRIMARY KEY,
                policy_id VARCHAR(50) NOT NULL,
                customer_id VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_gateway VARCHAR(50) DEFAULT 'MOCK_PAYMENT',
                transaction_id VARCHAR(100) UNIQUE,
                payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_policy_payment (policy_id),
                INDEX idx_customer_payment (customer_id),
                INDEX idx_payment_status (payment_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✓ initial_payment table created');
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                payment_id VARCHAR(50) PRIMARY KEY,
                policy_id VARCHAR(50),
                customer_id VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'CARD',
                payment_gateway VARCHAR(50) DEFAULT 'MOCK_PAYMENT',
                transaction_id VARCHAR(100),
                payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_policy_payment (policy_id),
                INDEX idx_customer_payment (customer_id),
                INDEX idx_payment_status (payment_status),
                INDEX idx_payment_date (payment_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✓ payments table created');
        console.log('\n✅ All tables created successfully!');
        
    } catch (error) {
        console.error('Error creating tables:', error.message);
    } finally {
        await connection.end();
    }
}

createTables();
