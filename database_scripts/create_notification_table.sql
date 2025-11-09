-- Create notification table for customer notifications
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
);
