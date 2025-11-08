-- Create audit_log table if it doesn't exist
USE insurance_db_dev;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `audit_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `user_type` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL COMMENT 'ID of the affected entity (e.g., claim_id, policy_id)',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `details` JSON DEFAULT NULL COMMENT 'Optional details like data before/after change'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Audit log for sensitive user actions';
