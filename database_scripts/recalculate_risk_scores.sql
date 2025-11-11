-- Recalculate risk scores for existing claims based on actual risk factors

-- CLM_1762665971112: Amount > 80L (+3) + Same day claim (+4) + 4 previous claims (+2) = 9
UPDATE claim SET risk_score = 9 WHERE claim_id = 'CLM_1762665971112';

-- CLM_1762670090888: Amount < 80L (0) + Same day claim (+4) + 6 previous claims (+2) = 6
UPDATE claim SET risk_score = 6 WHERE claim_id = 'CLM_1762670090888';

-- CLM_1762788196664: Amount > 80L (+3) + Same day claim (+4) + 1 previous claim (0) = 7
UPDATE claim SET risk_score = 7 WHERE claim_id = 'CLM_1762788196664';

-- Verify the updates
SELECT claim_id, amount, risk_score, claim_date FROM claim WHERE claim_id IN ('CLM_1762665971112', 'CLM_1762670090888', 'CLM_1762788196664');
