const premiumCalculatorService = require('../services/premiumCalculatorService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Calculate premium for a policy
 */
exports.calculatePremium = asyncHandler(async (req, res) => {
    const result = await premiumCalculatorService.calculatePremium(req.body);
    
    res.json({
        status: 'success',
        data: result
    });
});

/**
 * Compare multiple policies
 */
exports.comparePolicies = asyncHandler(async (req, res) => {
    const { customerData, policyTypes } = req.body;
    
    const comparisons = await premiumCalculatorService.comparePolicies(
        customerData,
        policyTypes
    );
    
    res.json({
        status: 'success',
        data: { comparisons }
    });
});

/**
 * Calculate risk score for claim
 */
exports.calculateRiskScore = asyncHandler(async (req, res) => {
    const riskAssessment = premiumCalculatorService.calculateRiskScore(req.body);
    
    res.json({
        status: 'success',
        data: riskAssessment
    });
});
