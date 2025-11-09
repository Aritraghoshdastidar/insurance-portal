// Create notification table
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

async function createNotificationTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Creating notification table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notification (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'INFO',
        sent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_status TINYINT(1) DEFAULT 0,
        INDEX idx_customer_id (customer_id),
        INDEX idx_read_status (read_status),
        INDEX idx_sent_timestamp (sent_timestamp)
      )
    `);
    
    console.log('✅ Notification table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating notification table:', error);
  } finally {
    if (connection) await connection.end();
  }
}

createNotificationTable();
