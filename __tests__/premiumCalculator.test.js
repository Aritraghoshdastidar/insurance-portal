const premiumCalculator = require('../src/services/premiumCalculatorService');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('PremiumCalculatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePremium', () => {
    test('calculates LIFE insurance premium', async () => {
      const policyData = {
        policy_type: 'LIFE',
        age: 35,
        coverage_amount: 5000000,
        term_years: 20,
        smoking_status: 'NO',
        health_score: 8
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result).toHaveProperty('finalPremium');
      expect(result).toHaveProperty('basePremium');
      expect(result).toHaveProperty('riskMultiplier');
      expect(result).toHaveProperty('discountFactor');
      expect(result).toHaveProperty('adminFee');
      expect(result).toHaveProperty('breakdown');
      expect(result.finalPremium).toBeGreaterThan(0);
    });

    test('calculates HEALTH insurance premium', async () => {
      const policyData = {
        policy_type: 'HEALTH',
        age: 45,
        coverage_amount: 1000000,
        health_score: 6
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.finalPremium).toBeGreaterThan(0);
      expect(result.basePremium).toBeGreaterThan(0);
    });

    test('calculates AUTO insurance premium', async () => {
      const policyData = {
        policy_type: 'AUTO',
        age: 28,
        vehicle_type: 'sedan',
        vehicle_age: 3,
        driving_record: { accidents: 1, violations: 0 }
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.finalPremium).toBeGreaterThan(0);
      expect(result.riskMultiplier).toBeGreaterThan(1);
    });

    test('calculates HOME insurance premium', async () => {
      const policyData = {
        policy_type: 'HOME',
        coverage_amount: 10000000,
        location: 'zone_flood'
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.finalPremium).toBeGreaterThan(0);
      expect(result.riskMultiplier).toBeGreaterThan(1);
    });

    test('applies young age risk multiplier', async () => {
      const policyData = {
        policy_type: 'AUTO',
        age: 22,
        vehicle_type: 'sedan',
        vehicle_age: 1
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.4);
    });

    test('applies elderly risk multiplier', async () => {
      const policyData = {
        policy_type: 'LIFE',
        age: 65,
        coverage_amount: 2000000,
        term_years: 10
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.2);
    });

    test('applies prime age discount', async () => {
      const policyData = {
        policy_type: 'HEALTH',
        age: 40,
        coverage_amount: 500000
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.discountFactor).toBeLessThan(1);
    });

    test('applies excellent health discount', async () => {
      const policyData = {
        policy_type: 'HEALTH',
        age: 35,
        coverage_amount: 500000,
        health_score: 9
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.discountFactor).toBeLessThan(0.9);
    });

    test('applies poor health risk multiplier', async () => {
      const policyData = {
        policy_type: 'HEALTH',
        age: 50,
        coverage_amount: 500000,
        health_score: 4
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.3);
    });

    test('applies smoking risk multiplier', async () => {
      const policyData = {
        policy_type: 'LIFE',
        age: 40,
        coverage_amount: 3000000,
        term_years: 15,
        smoking_status: 'YES'
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.7);
    });

    test('applies high-risk occupation multiplier', async () => {
      const policyData = {
        policy_type: 'LIFE',
        age: 35,
        coverage_amount: 2000000,
        term_years: 20,
        occupation: 'pilot'
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.3);
    });

    test('handles multiple driving violations', async () => {
      const policyData = {
        policy_type: 'AUTO',
        age: 30,
        vehicle_type: 'suv',
        vehicle_age: 2,
        driving_record: { accidents: 2, violations: 3 }
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.5);
    });

    test('applies high-risk location multiplier', async () => {
      const policyData = {
        policy_type: 'HOME',
        coverage_amount: 5000000,
        location: 'zone_earthquake'
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.riskMultiplier).toBeGreaterThan(1.2);
    });

    test('includes admin fee in final premium', async () => {
      const policyData = {
        policy_type: 'LIFE',
        age: 30,
        coverage_amount: 1000000,
        term_years: 10
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.adminFee).toBeGreaterThan(0);
      expect(result.finalPremium).toBeGreaterThan(result.basePremium);
    });

    test('handles default policy type', async () => {
      const policyData = {
        policy_type: 'UNKNOWN',
        age: 30
      };

      const result = await premiumCalculator.calculatePremium(policyData);

      expect(result.basePremium).toBe(1000);
    });
  });

  describe('calculateLifeInsuranceBase', () => {
    test('calculates correct base for life insurance', () => {
      const result = premiumCalculator.calculateLifeInsuranceBase(5000000, 20);
      expect(result).toBeGreaterThan(0);
    });

    test('handles different coverage amounts', () => {
      const low = premiumCalculator.calculateLifeInsuranceBase(1000000, 10);
      const high = premiumCalculator.calculateLifeInsuranceBase(10000000, 10);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('calculateHealthInsuranceBase', () => {
    test('calculates correct base for health insurance', () => {
      const result = premiumCalculator.calculateHealthInsuranceBase(500000, 40);
      expect(result).toBeGreaterThan(0);
    });

    test('increases with age', () => {
      const young = premiumCalculator.calculateHealthInsuranceBase(500000, 25);
      const old = premiumCalculator.calculateHealthInsuranceBase(500000, 60);
      expect(old).toBeGreaterThan(young);
    });
  });

  describe('calculateAutoInsuranceBase', () => {
    test('calculates base for sedan', () => {
      const result = premiumCalculator.calculateAutoInsuranceBase('sedan', 2);
      expect(result).toBeGreaterThan(0);
    });

    test('applies higher rate for SUV', () => {
      const sedan = premiumCalculator.calculateAutoInsuranceBase('sedan', 2);
      const suv = premiumCalculator.calculateAutoInsuranceBase('suv', 2);
      expect(suv).toBeGreaterThan(sedan);
    });

    test('applies highest rate for sports car', () => {
      const sedan = premiumCalculator.calculateAutoInsuranceBase('sedan', 2);
      const sports = premiumCalculator.calculateAutoInsuranceBase('sports', 2);
      expect(sports).toBeGreaterThan(sedan * 1.8);
    });

    test('applies depreciation for older vehicles', () => {
      const newer = premiumCalculator.calculateAutoInsuranceBase('sedan', 1);
      const older = premiumCalculator.calculateAutoInsuranceBase('sedan', 5);
      expect(older).toBeLessThan(newer);
    });

    test('handles luxury vehicles', () => {
      const result = premiumCalculator.calculateAutoInsuranceBase('luxury', 1);
      expect(result).toBeGreaterThan(5000);
    });

    test('handles motorcycles', () => {
      const result = premiumCalculator.calculateAutoInsuranceBase('motorcycle', 1);
      expect(result).toBeGreaterThan(5000);
    });

    test('handles trucks', () => {
      const result = premiumCalculator.calculateAutoInsuranceBase('truck', 2);
      expect(result).toBeGreaterThan(5000);
    });

    test('handles unknown vehicle type', () => {
      const result = premiumCalculator.calculateAutoInsuranceBase('unknown', 2);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateHomeInsuranceBase', () => {
    test('calculates correct base for home insurance', () => {
      const result = premiumCalculator.calculateHomeInsuranceBase(10000000);
      expect(result).toBeGreaterThan(0);
    });

    test('scales with coverage amount', () => {
      const low = premiumCalculator.calculateHomeInsuranceBase(5000000);
      const high = premiumCalculator.calculateHomeInsuranceBase(20000000);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('comparePolicies', () => {
    test('compares multiple policy types', async () => {
      const customerData = {
        age: 35,
        coverage_amount: 2000000,
        term_years: 15,
        health_score: 7
      };

      const result = await premiumCalculator.comparePolicies(customerData, ['LIFE', 'HEALTH']);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('policy_type', 'LIFE');
      expect(result[1]).toHaveProperty('policy_type', 'HEALTH');
      expect(result[0]).toHaveProperty('finalPremium');
      expect(result[1]).toHaveProperty('finalPremium');
    });

    test('handles single policy comparison', async () => {
      const customerData = {
        age: 30,
        coverage_amount: 1000000,
        term_years: 10
      };

      const result = await premiumCalculator.comparePolicies(customerData, ['LIFE']);

      expect(result).toHaveLength(1);
      expect(result[0].policy_type).toBe('LIFE');
    });
  });

  describe('calculateRiskScore', () => {
    test('flags high amount claims', () => {
      const claimData = {
        amount: 9000000,
        previous_claims: 1,
        days_since_purchase: 180,
        has_all_documents: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskScore).toBeGreaterThanOrEqual(3);
      expect(result.flags).toContain('HIGH_AMOUNT');
    });

    test('flags frequent claimers', () => {
      const claimData = {
        amount: 100000,
        previous_claims: 5,
        days_since_purchase: 365,
        has_all_documents: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskScore).toBeGreaterThanOrEqual(2);
      expect(result.flags).toContain('FREQUENT_CLAIMER');
    });

    test('flags early claims', () => {
      const claimData = {
        amount: 200000,
        previous_claims: 0,
        days_since_purchase: 15,
        has_all_documents: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskScore).toBeGreaterThanOrEqual(4);
      expect(result.flags).toContain('EARLY_CLAIM');
    });

    test('flags incomplete documentation', () => {
      const claimData = {
        amount: 300000,
        previous_claims: 1,
        days_since_purchase: 200,
        has_all_documents: false
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskScore).toBeGreaterThanOrEqual(2);
      expect(result.flags).toContain('INCOMPLETE_DOCS');
    });

    test('flags fraud pattern matches', () => {
      const claimData = {
        amount: 500000,
        previous_claims: 2,
        days_since_purchase: 100,
        has_all_documents: true,
        matches_fraud_pattern: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskScore).toBeGreaterThanOrEqual(5);
      expect(result.flags).toContain('PATTERN_MATCH');
    });

    test('returns HIGH risk level for high scores', () => {
      const claimData = {
        amount: 10000000,
        previous_claims: 5,
        days_since_purchase: 20,
        has_all_documents: false,
        matches_fraud_pattern: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskScore).toBeGreaterThanOrEqual(7);
    });

    test('returns MEDIUM risk level for medium scores', () => {
      const claimData = {
        amount: 9000000, // 3 points for HIGH_AMOUNT (>8M)
        previous_claims: 1, // no flag (needs >3)
        days_since_purchase: 100, // no flag (needs <30)
        has_all_documents: false // 2 points for INCOMPLETE_DOCS
      };
      // Total: 3 + 2 = 5 points (MEDIUM range: 4-6)

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.riskScore).toBeGreaterThanOrEqual(4);
      expect(result.riskScore).toBeLessThan(7);
    });

    test('returns LOW risk level for low scores', () => {
      const claimData = {
        amount: 100000,
        previous_claims: 0,
        days_since_purchase: 365,
        has_all_documents: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.riskLevel).toBe('LOW');
      expect(result.riskScore).toBeLessThan(4);
    });

    test('defaults days_since_purchase when not provided', () => {
      const claimData = {
        amount: 100000,
        previous_claims: 0,
        has_all_documents: true
      };

      const result = premiumCalculator.calculateRiskScore(claimData);

      expect(result.flags).not.toContain('EARLY_CLAIM');
    });
  });
});
