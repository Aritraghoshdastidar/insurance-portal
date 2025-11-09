const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Database Configuration with Connection Pooling
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'insurance_app',
    password: process.env.DB_PASSWORD || 'app_password_123',
    database: process.env.DB_NAME || 'insurance_db_dev',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        logger.info('Database connection established successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error('Database connection failed:', error);
        return false;
    }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        logger.error('Database query error:', { query, params, error: error.message });
        throw error;
    }
};

// Begin transaction
const beginTransaction = async () => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    beginTransaction,
    dbConfig
};
