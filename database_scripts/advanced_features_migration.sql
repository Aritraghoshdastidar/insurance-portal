-- ============================================
-- Advanced Features Database Migration
-- Insurance Automation System v2.0
-- ============================================
-- This script adds tables for:
-- 1. Notifications system
-- 2. Recurring payments
-- 3. Payment refunds
-- 4. Enhanced analytics support
-- ============================================

USE insurance_db;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
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

-- ============================================
-- RECURRING PAYMENT SETUP TABLE
-- ============================================
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
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE,
    INDEX idx_customer_recurring (customer_id, status),
    INDEX idx_policy_recurring (policy_id),
    INDEX idx_next_payment (next_payment_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECURRING PAYMENTS HISTORY TABLE
-- ============================================
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
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE,
    INDEX idx_recurring_payments (recurring_id, payment_date),
    INDEX idx_customer_payments (customer_id, status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REFUNDS TABLE
-- ============================================
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
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE SET NULL,
    INDEX idx_payment_refund (payment_id),
    INDEX idx_customer_refunds (customer_id, status),
    INDEX idx_status (status),
    INDEX idx_refund_date (refund_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVOICES TABLE
-- ============================================
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
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE,
    INDEX idx_customer_invoices (customer_id, status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PREMIUM CALCULATIONS CACHE TABLE
-- For storing calculated premiums with risk factors
-- ============================================
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

-- ============================================
-- FRAUD RISK SCORES TABLE
-- ============================================
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
    FOREIGN KEY (claim_id) REFERENCES claims(claim_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_claim_risk (claim_id),
    INDEX idx_risk_level (risk_level, calculated_at),
    INDEX idx_customer_risk (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM METRICS TABLE
-- For tracking system performance and analytics
-- ============================================
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
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add email notification preferences to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Opt-in for email notifications',
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE COMMENT 'Opt-in for SMS notifications',
ADD COLUMN IF NOT EXISTS preferred_contact_method ENUM('EMAIL', 'SMS', 'PHONE') DEFAULT 'EMAIL';

-- Add risk score to policies table
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS risk_score INT COMMENT 'Calculated risk score at policy creation',
ADD COLUMN IF NOT EXISTS risk_level ENUM('LOW', 'MEDIUM', 'HIGH') COMMENT 'Risk level category';

-- Add fraud flags to claims table
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS fraud_risk_score INT COMMENT 'Fraud detection score 0-100',
ADD COLUMN IF NOT EXISTS fraud_flags JSON COMMENT 'Detected fraud indicators',
ADD COLUMN IF NOT EXISTS requires_investigation BOOLEAN DEFAULT FALSE;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample notification
INSERT INTO notifications (user_id, user_type, title, message, type, related_id) VALUES
('CUST001', 'CUSTOMER', 'Welcome to Insurance Automation System', 'Thank you for registering with us!', 'SYSTEM', NULL);

-- ============================================
-- VIEWS FOR ANALYTICS
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
JOIN customers c ON rps.customer_id = c.customer_id
JOIN policies p ON rps.policy_id = p.policy_id
LEFT JOIN recurring_payments rp ON rps.recurring_id = rp.recurring_id
WHERE rps.status = 'ACTIVE'
GROUP BY rps.recurring_id;

-- View: Refunds summary
CREATE OR REPLACE VIEW v_refunds_summary AS
SELECT 
    DATE_FORMAT(refund_date, '%Y-%m') as month,
    COUNT(*) as total_refunds,
    SUM(amount) as total_refund_amount,
    AVG(amount) as avg_refund_amount
FROM refunds
WHERE status = 'COMPLETED'
GROUP BY DATE_FORMAT(refund_date, '%Y-%m')
ORDER BY month DESC;

-- View: High-risk claims requiring investigation
CREATE OR REPLACE VIEW v_high_risk_claims AS
SELECT 
    c.claim_id,
    c.customer_id,
    cust.name as customer_name,
    c.policy_id,
    c.claim_amount,
    c.claim_date,
    c.status,
    c.fraud_risk_score,
    c.requires_investigation,
    frs.risk_level,
    frs.risk_flags
FROM claims c
JOIN customers cust ON c.customer_id = cust.customer_id
LEFT JOIN fraud_risk_scores frs ON c.claim_id = frs.claim_id
WHERE c.fraud_risk_score >= 70 OR c.requires_investigation = TRUE
ORDER BY c.fraud_risk_score DESC;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Process next recurring payment
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_process_recurring_payment(IN p_recurring_id VARCHAR(50))
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
    SET v_payment_id = CONCAT('PAY_', DATE_FORMAT(NOW(), '%Y%m%d'), '_', LPAD(FLOOR(RAND() * 99999), 5, '0'));
    
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
-- TRIGGERS
-- ============================================

-- Trigger: Auto-create notification on high-value claim
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_high_value_claim_notification
AFTER INSERT ON claims
FOR EACH ROW
BEGIN
    IF NEW.claim_amount > 50000 THEN
        INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
        VALUES ('ADMIN', 'ADMIN', 'High-Value Claim Submitted', 
                CONCAT('Claim ', NEW.claim_id, ' for amount $', NEW.claim_amount, ' requires review'),
                'ALERT', NEW.claim_id);
    END IF;
END$$
DELIMITER ;

-- Trigger: Auto-create notification on refund completion
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_refund_notification
AFTER UPDATE ON refunds
FOR EACH ROW
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        INSERT INTO notifications (user_id, user_type, title, message, type, related_id)
        VALUES (NEW.customer_id, 'CUSTOMER', 'Refund Processed', 
                CONCAT('Your refund of $', NEW.amount, ' has been processed'),
                'PAYMENT', NEW.refund_id);
    END IF;
END$$
DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Add composite indexes for common queries
CREATE INDEX idx_policies_customer_type ON policies(customer_id, policy_type, status);
CREATE INDEX idx_claims_customer_status ON claims(customer_id, status, claim_date);
CREATE INDEX idx_payments_customer_date ON payments(customer_id, payment_date);

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

SELECT 'Migration completed successfully!' as message;
SELECT 
    'notifications' as table_name,
    COUNT(*) as row_count
FROM notifications
UNION ALL
SELECT 'recurring_payment_setup', COUNT(*) FROM recurring_payment_setup
UNION ALL
SELECT 'refunds', COUNT(*) FROM refunds
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'premium_calculations', COUNT(*) FROM premium_calculations
UNION ALL
SELECT 'fraud_risk_scores', COUNT(*) FROM fraud_risk_scores
UNION ALL
SELECT 'system_metrics', COUNT(*) FROM system_metrics;
