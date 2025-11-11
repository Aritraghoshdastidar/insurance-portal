-- Update High-Value Claim Threshold from ₹50K to ₹80L
-- Run this to fix the risk alert trigger

USE insurance_db_dev;

-- Temporarily allow trigger creation
SET GLOBAL log_bin_trust_function_creators = 1;

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_high_value_claim_notification;

-- Create updated trigger with ₹80L threshold
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

-- Reset to default
SET GLOBAL log_bin_trust_function_creators = 0;

SELECT 'High-value claim trigger updated successfully! Threshold: ₹80,00,000 (₹80L)' AS status;
