-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Insurance Workflow Automation System
-- ============================================
-- This script sets up the entire database including:
-- 1. Core schema and tables (from backup)
-- 2. Advanced analytics features
-- 3. Notification system
-- 4. Recurring payments
-- 5. Fraud detection
-- ============================================

-- STEP 1: Import the main backup
-- Run this manually first:
-- mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/insurance_db_dev_backup.sql

-- After importing the main backup, run the rest of this script:

USE insurance_db_dev;

-- ============================================
-- STEP 2: ADVANCED FEATURES MIGRATION
-- ============================================

-- NOTIFICATIONS TABLE (in-app notifications, separate from reminders)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_type ENUM('CUSTOMER', 'ADMIN') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'POLICY, CLAIM, PAYMENT, DOCUMENT, SYSTEM, ALERT',
    related_id VARCHAR(50) COMMENT 'Policy ID, Claim ID, etc.',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_user_notifications (user_id, user_type, is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RECURRING PAYMENT SETUP TABLE
CREATE TABLE IF NOT EXISTS recurring_payment_setup (
    recurring_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    policy_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    frequency ENUM('MONTHLY', 'QUARTERLY', 'ANNUALLY') NOT NULL DEFAULT 'MONTHLY',
    status ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    next_payment_date DATE NOT NULL,
    last_payment_date DATE NULL,
    payment_method VARCHAR(50) DEFAULT 'CARD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policy(policy_id) ON DELETE CASCADE,
    INDEX idx_customer_recurring (customer_id, status),
    INDEX idx_policy_recurring (policy_id),
    INDEX idx_next_payment (next_payment_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RECURRING PAYMENTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS recurring_payments (
    payment_id VARCHAR(50) PRIMARY KEY,
    recurring_id VARCHAR(50) NOT NULL,
    policy_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(100) UNIQUE,
    payment_method VARCHAR(50),
    gateway_response TEXT,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_id) REFERENCES recurring_payment_setup(recurring_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policy(policy_id) ON DELETE CASCADE,
    INDEX idx_recurring_payments (recurring_id, payment_date),
    INDEX idx_customer_payments (customer_id, status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REFUNDS TABLE
CREATE TABLE IF NOT EXISTS refunds (
    refund_id VARCHAR(50) PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL,
    policy_id VARCHAR(50),
    customer_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    refund_date DATETIME NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    gateway_response TEXT,
    processed_by VARCHAR(50) COMMENT 'Admin ID who processed refund',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policy(policy_id) ON DELETE SET NULL,
    INDEX idx_payment_refund (payment_id),
    INDEX idx_customer_refunds (customer_id, status),
    INDEX idx_status (status),
    INDEX idx_refund_date (refund_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id VARCHAR(50) PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    policy_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('GENERATED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'GENERATED',
    pdf_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policy(policy_id) ON DELETE CASCADE,
    INDEX idx_customer_invoices (customer_id, status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PREMIUM CALCULATIONS CACHE TABLE
CREATE TABLE IF NOT EXISTS premium_calculations (
    calculation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50),
    policy_type VARCHAR(50) NOT NULL,
    base_premium DECIMAL(10, 2) NOT NULL,
    risk_multiplier DECIMAL(5, 3) NOT NULL,
    final_premium DECIMAL(10, 2) NOT NULL,
    risk_factors JSON COMMENT 'Stores applied risk factors as JSON',
    coverage_amount DECIMAL(12, 2),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Quote expiration',
    accepted BOOLEAN DEFAULT FALSE,
    policy_id VARCHAR(50) COMMENT 'Set when quote is accepted',
    INDEX idx_customer_calc (customer_id, calculation_date),
    INDEX idx_policy_type (policy_type),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FRAUD RISK SCORES TABLE
CREATE TABLE IF NOT EXISTS fraud_risk_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    risk_score INT NOT NULL COMMENT '0-100 score',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    risk_flags JSON COMMENT 'Array of detected risk flags',
    calculation_details JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(50) COMMENT 'Admin ID who reviewed',
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    FOREIGN KEY (claim_id) REFERENCES claim(claim_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    INDEX idx_claim_risk (claim_id),
    INDEX idx_risk_level (risk_level, calculated_at),
    INDEX idx_customer_risk (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SYSTEM METRICS TABLE
CREATE TABLE IF NOT EXISTS system_metrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL COMMENT 'API_CALL, PAYMENT, CLAIM_PROCESSING, etc.',
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 2),
    metric_data JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_type (metric_type, recorded_at),
    INDEX idx_metric_name (metric_name, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add notification preferences to customer table (if not exists)
ALTER TABLE customer 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Opt-in for email notifications',
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE COMMENT 'Opt-in for SMS notifications',
ADD COLUMN IF NOT EXISTS preferred_contact_method ENUM('EMAIL', 'SMS', 'PHONE') DEFAULT 'EMAIL',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL COMMENT 'Last successful login',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add risk scoring to policies table (if not exists)
ALTER TABLE policy
ADD COLUMN IF NOT EXISTS risk_score INT COMMENT 'Calculated risk score at policy creation',
ADD COLUMN IF NOT EXISTS risk_level ENUM('LOW', 'MEDIUM', 'HIGH') COMMENT 'Risk level category';

-- Add fraud detection to claims table (if not exists)
ALTER TABLE claim
ADD COLUMN IF NOT EXISTS fraud_risk_score INT COMMENT 'Fraud detection score 0-100',
ADD COLUMN IF NOT EXISTS fraud_flags JSON COMMENT 'Detected fraud indicators',
ADD COLUMN IF NOT EXISTS requires_investigation BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 4: ADD SECURITY OFFICER ADMIN
-- ============================================

INSERT IGNORE INTO administrator (admin_id, name, email, phone, role, password)
VALUES ('ADM003', 'Security Officer', 'security.officer@insurance.com', '8888888888', 'Security Officer', NULL);

-- ============================================
-- STEP 5: SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample notification
INSERT IGNORE INTO notifications (user_id, user_type, title, message, type, related_id) VALUES
('CUST001', 'CUSTOMER', 'Welcome to Insurance Automation System', 'Thank you for registering with us!', 'SYSTEM', NULL);

-- ============================================
-- STEP 6: CREATE ANALYTICS VIEWS
-- ============================================

-- View: Active recurring payments summary
CREATE OR REPLACE VIEW v_active_recurring_payments AS
SELECT 
    rps.recurring_id,
    rps.customer_id,
    c.name as customer_name,
    rps.policy_id,
    p.policy_type,
    rps.amount,
    rps.frequency,
    rps.next_payment_date,
    COUNT(rp.payment_id) as total_payments,
    SUM(CASE WHEN rp.status = 'SUCCESS' THEN rp.amount ELSE 0 END) as total_paid
FROM recurring_payment_setup rps
JOIN customer c ON rps.customer_id = c.customer_id
JOIN policy p ON rps.policy_id = p.policy_id
LEFT JOIN recurring_payments rp ON rps.recurring_id = rp.recurring_id
WHERE rps.status = 'ACTIVE'
GROUP BY rps.recurring_id;

-- View: High-risk claims requiring investigation
CREATE OR REPLACE VIEW v_high_risk_claims AS
SELECT 
    c.claim_id,
    c.customer_id,
    cust.name as customer_name,
    c.policy_id,
    c.amount as claim_amount,
    c.claim_date,
    c.claim_status,
    c.fraud_risk_score,
    c.requires_investigation,
    frs.risk_level,
    frs.risk_flags
FROM claim c
JOIN customer cust ON c.customer_id = cust.customer_id
LEFT JOIN fraud_risk_scores frs ON c.claim_id = frs.claim_id
WHERE c.fraud_risk_score >= 70 OR c.requires_investigation = TRUE
ORDER BY c.fraud_risk_score DESC;

-- ============================================
-- STEP 7: CREATE STORED PROCEDURES
-- ============================================

DROP PROCEDURE IF EXISTS sp_process_recurring_payment;

DELIMITER $$
CREATE PROCEDURE sp_process_recurring_payment(IN p_recurring_id VARCHAR(50))
BEGIN
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_policy_id VARCHAR(50);
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_payment_id VARCHAR(50);
    DECLARE v_frequency VARCHAR(20);
    DECLARE v_next_date DATE;
    
    -- Get recurring payment details
    SELECT customer_id, policy_id, amount, frequency
    INTO v_customer_id, v_policy_id, v_amount, v_frequency
    FROM recurring_payment_setup
    WHERE recurring_id = p_recurring_id AND status = 'ACTIVE';
    
    -- Generate payment ID
    SET v_payment_id = CONCAT('PAY_REC_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
    
    -- Insert payment record
    INSERT INTO recurring_payments (payment_id, recurring_id, policy_id, customer_id, amount, payment_date, status)
    VALUES (v_payment_id, p_recurring_id, v_policy_id, v_customer_id, v_amount, NOW(), 'SUCCESS');
    
    -- Calculate next payment date
    SET v_next_date = CASE v_frequency
        WHEN 'MONTHLY' THEN DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
        WHEN 'QUARTERLY' THEN DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
        WHEN 'ANNUALLY' THEN DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
    END;
    
    -- Update recurring setup
    UPDATE recurring_payment_setup
    SET next_payment_date = v_next_date,
        last_payment_date = CURDATE(),
        updated_at = NOW()
    WHERE recurring_id = p_recurring_id;
    
    SELECT 'SUCCESS' as status, v_payment_id as payment_id;
END$$
DELIMITER ;

-- ============================================
-- STEP 8: CREATE ADDITIONAL TRIGGERS
-- ============================================

-- Trigger: Auto-create notification on high-value claim
DROP TRIGGER IF EXISTS trg_high_value_claim_notification;

DELIMITER $$
CREATE TRIGGER trg_high_value_claim_notification
AFTER INSERT ON claim
FOR EACH ROW
BEGIN
    -- High-value claim threshold: ₹80 lakhs (₹80,00,000)
    IF NEW.amount > 8000000 THEN
        INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
        VALUES ('ADM001', 'ADMIN', 'High-Value Claim Alert', 
                CONCAT('HIGH-VALUE CLAIM: ', NEW.claim_id, ' for amount ₹', FORMAT(NEW.amount, 2), ' (₹', ROUND(NEW.amount/100000, 2), 'L) requires immediate senior review'),
                'ALERT', NEW.claim_id);
    END IF;
END$$
DELIMITER ;

-- Trigger: Auto-create notification on refund completion
DROP TRIGGER IF EXISTS trg_refund_notification;

DELIMITER $$
CREATE TRIGGER trg_refund_notification
AFTER UPDATE ON refunds
FOR EACH ROW
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
        VALUES (NEW.customer_id, 'CUSTOMER', 'Refund Processed', 
                CONCAT('Your refund of Rs.', NEW.amount, ' has been processed'),
                'PAYMENT', NEW.refund_id);
    END IF;
END$$
DELIMITER ;

-- ============================================
-- STEP 9: PERFORMANCE INDEXES
-- ============================================

-- Add composite indexes for common queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_policy_customer_type ON policy(customer_id, policy_type, status);
CREATE INDEX IF NOT EXISTS idx_claim_customer_status ON claim(customer_id, claim_status, claim_date);
CREATE INDEX IF NOT EXISTS idx_payment_customer_date ON payment(customer_policy_id, payment_date);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Complete database setup finished!' as status;

SELECT 'Table Check' as verification_step;
SELECT 
    TABLE_NAME as table_name,
    TABLE_ROWS as row_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'insurance_db_dev'
ORDER BY TABLE_NAME;
