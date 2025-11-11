-- Create Template Policies for All Types
-- These are required for the Buy Policy feature to work

USE insurance_db_dev;

-- Insert template policies for each type
INSERT INTO policy (policy_id, customer_id, policy_type, status, premium_amount, start_date, end_date, coverage_details)
VALUES
  ('TEMPLATE_HEALTH', NULL, 'HEALTH', 'TEMPLATE', 0, NULL, NULL, '{"template": true, "description": "Health Insurance Template"}'),
  ('TEMPLATE_LIFE', NULL, 'LIFE', 'TEMPLATE', 0, NULL, NULL, '{"template": true, "description": "Life Insurance Template"}'),
  ('TEMPLATE_AUTO', NULL, 'AUTO', 'TEMPLATE', 0, NULL, NULL, '{"template": true, "description": "Auto Insurance Template"}'),
  ('TEMPLATE_HOME', NULL, 'HOME', 'TEMPLATE', 0, NULL, NULL, '{"template": true, "description": "Home Insurance Template"}')
ON DUPLICATE KEY UPDATE status = 'TEMPLATE';

SELECT 'Template policies created successfully!' AS status;
SELECT policy_id, policy_type, status FROM policy WHERE status = 'TEMPLATE';
