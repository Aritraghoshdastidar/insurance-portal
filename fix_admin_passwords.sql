-- Fix Admin Passwords with Correct Bcrypt Hashes
USE insurance_db_dev;

-- Update passwords and fix ADM002 role
UPDATE administrator SET 
    password = '$2b$10$0w0dB4ZU622jS5DOmR4/Le3d6Kit2zUu80aufzNFoCv9VWYYPk/.C',
    role = 'System Admin'
WHERE admin_id = 'ADM001';

UPDATE administrator SET 
    password = '$2b$10$Qg0rD8un5G5Cetou0yga7OW7r3OI5up96/xxvj3WcWZyKOr/UZsi.',
    role = 'Junior Adjuster'
WHERE admin_id = 'ADM002';

UPDATE administrator SET 
    password = '$2b$10$y30jFKUcTiwo.LNQVcy3vOWzVu3Bqpbmla.hpVVOTlc0ajEYAzK3y',
    role = 'Security Officer'
WHERE admin_id = 'ADM003';

-- Verify
SELECT admin_id, email, role, 
       CASE WHEN password IS NULL THEN 'NO PASSWORD' 
            WHEN password LIKE '$2b$10$%' THEN 'OK' 
            ELSE 'INVALID HASH' 
       END as password_check
FROM administrator
ORDER BY admin_id;
