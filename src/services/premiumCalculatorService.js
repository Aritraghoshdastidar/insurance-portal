const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Advanced Premium Calculator Service
 * Implements actuarial formulas for premium calculation
 */
class PremiumCalculatorService {
    /**
     * Calculate premium based on multiple factors
     */
    async calculatePremium(policyData) {
        const {
            policy_type,
            age,
            gender,
            occupation,
            health_score,
            coverage_amount,
            term_years,
            smoking_status,
            location,
            vehicle_age, // For auto insurance
            vehicle_type, // For auto insurance
            driving_record // For auto insurance
        } = policyData;

        let basePremium = 1000; // Base premium
        let riskMultiplier = 1.0;
        let discountFactor = 1.0;

        // Policy type base adjustment
        switch (policy_type) {
            case 'LIFE':
                basePremium = this.calculateLifeInsuranceBase(coverage_amount, term_years);
                break;
            case 'HEALTH':
                basePremium = this.calculateHealthInsuranceBase(coverage_amount, age);
                break;
            case 'AUTO':
                basePremium = this.calculateAutoInsuranceBase(vehicle_type, vehicle_age);
                break;
            case 'HOME':
                basePremium = this.calculateHomeInsuranceBase(coverage_amount);
                break;
            default:
                basePremium = 1000;
        }

        // Age risk factor
        if (age < 25) {
            riskMultiplier *= 1.5; // Higher risk for young drivers
        } else if (age > 60) {
            riskMultiplier *= 1.3; // Higher risk for elderly
        } else if (age >= 35 && age <= 50) {
            discountFactor *= 0.9; // Prime age discount
        }

        // Health score impact (for health/life insurance)
        if (health_score) {
            if (health_score >= 8) {
                discountFactor *= 0.85; // Excellent health
            } else if (health_score <= 5) {
                riskMultiplier *= 1.4; // Poor health
            }
        }

        // Smoking status (for life/health insurance)
        if (smoking_status === 'YES') {
            riskMultiplier *= 1.75; // Significant risk increase
        }

        // Occupation risk
        const highRiskOccupations = ['construction', 'mining', 'pilot', 'firefighter'];
        if (occupation && highRiskOccupations.includes(occupation.toLowerCase())) {
            riskMultiplier *= 1.4;
        }

        // Driving record (for auto insurance)
        if (driving_record) {
            const accidents = driving_record.accidents || 0;
            const violations = driving_record.violations || 0;
            riskMultiplier *= (1 + (accidents * 0.2) + (violations * 0.15));
        }

        // Location-based adjustment
        const highRiskZones = ['zone_flood', 'zone_earthquake', 'zone_hurricane'];
        if (location && highRiskZones.includes(location)) {
            riskMultiplier *= 1.25;
        }

        // Calculate final premium
        let finalPremium = basePremium * riskMultiplier * discountFactor;

        // Add administrative fees
        const adminFee = finalPremium * 0.05;
        finalPremium += adminFee;

        // Round to 2 decimal places
        finalPremium = Math.round(finalPremium * 100) / 100;

        logger.info('Premium calculated', {
            policy_type,
            basePremium,
            riskMultiplier,
            discountFactor,
            finalPremium
        });

        return {
            basePremium,
            riskMultiplier,
            discountFactor,
            adminFee,
            finalPremium,
            breakdown: {
                base: basePremium,
                riskAdjustment: basePremium * (riskMultiplier - 1),
                discount: basePremium * (1 - discountFactor),
                fees: adminFee
            }
        };
    }

    /**
     * Life Insurance Base Calculation
     */
    calculateLifeInsuranceBase(coverageAmount, termYears) {
        // Simplified actuarial formula
        const coverageInLakhs = coverageAmount / 100000;
        const termFactor = Math.sqrt(termYears) / 5;
        return coverageInLakhs * 1000 * termFactor;
    }

    /**
     * Health Insurance Base Calculation
     */
    calculateHealthInsuranceBase(coverageAmount, age) {
        const coverageInLakhs = coverageAmount / 100000;
        const ageFactor = 1 + (age / 100);
        return coverageInLakhs * 800 * ageFactor;
    }

    /**
     * Auto Insurance Base Calculation
     */
    calculateAutoInsuranceBase(vehicleType, vehicleAge) {
        let baseRate = 5000;
        
        // Vehicle type multiplier
        const typeMultipliers = {
            'sedan': 1.0,
            'suv': 1.3,
            'sports': 2.0,
            'luxury': 1.8,
            'motorcycle': 1.5,
            'truck': 1.4
        };
        
        baseRate *= typeMultipliers[vehicleType?.toLowerCase()] || 1.0;
        
        // Depreciation for vehicle age
        const depreciation = Math.max(0.5, 1 - (vehicleAge * 0.05));
        baseRate *= depreciation;
        
        return baseRate;
    }

    /**
     * Home Insurance Base Calculation
     */
    calculateHomeInsuranceBase(coverageAmount) {
        const coverageInLakhs = coverageAmount / 100000;
        return coverageInLakhs * 500;
    }

    /**
     * Compare multiple policy options
     */
    async comparePolicies(customerData, policyTypes) {
        const comparisons = [];

        for (const policyType of policyTypes) {
            const premium = await this.calculatePremium({
                ...customerData,
                policy_type: policyType
            });

            comparisons.push({
                policy_type: policyType,
                ...premium
            });
        }

        return comparisons;
    }

    /**
     * Calculate risk score for fraud detection
     */
    calculateRiskScore(claimData) {
        let riskScore = 0;
        const flags = [];

        // Amount-based risk (₹80 lakhs threshold for high-value claims)
        if (claimData.amount > 8000000) {
            riskScore += 3;
            flags.push('HIGH_AMOUNT');
        }

        // Frequency-based risk (if customer has filed multiple claims)
        if (claimData.previous_claims > 3) {
            riskScore += 2;
            flags.push('FREQUENT_CLAIMER');
        }

        // Time-based risk (claim filed too soon after policy purchase)
        const daysSincePurchase = claimData.days_since_purchase || 365;
        if (daysSincePurchase < 30) {
            riskScore += 4;
            flags.push('EARLY_CLAIM');
        }

        // Documentation completeness
        if (!claimData.has_all_documents) {
            riskScore += 2;
            flags.push('INCOMPLETE_DOCS');
        }

        // Pattern matching (unusual patterns)
        if (claimData.matches_fraud_pattern) {
            riskScore += 5;
            flags.push('PATTERN_MATCH');
        }

        return {
            riskScore,
            riskLevel: riskScore >= 7 ? 'HIGH' : riskScore >= 4 ? 'MEDIUM' : 'LOW',
            flags
        };
    }
}

module.exports = new PremiumCalculatorService();
