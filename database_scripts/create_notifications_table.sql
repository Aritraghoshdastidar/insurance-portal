-- Create notifications table for admin/user notifications (used by triggers)
-- This is different from the 'notification' table used for customer notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  related_id VARCHAR(50),
  sent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_status TINYINT(1) DEFAULT 0,
  INDEX idx_user_id (user_id),
  INDEX idx_user_type (user_type),
  INDEX idx_read_status (read_status),
  INDEX idx_sent_timestamp (sent_timestamp),
  INDEX idx_related_id (related_id)
);
