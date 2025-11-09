const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const premiumController = require('../controllers/premiumController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * @swagger
 * /api/v2/payments/process:
 *   post:
 *     summary: Process initial premium payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policyId
 *               - amount
 *             properties:
 *               policyId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/process', 
    authenticate,
    [
        body('policyId').notEmpty().withMessage('Policy ID is required'),
        body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
        handleValidationErrors
    ],
    paymentController.processInitialPayment
);

/**
 * @swagger
 * /api/v2/payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', authenticate, paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/v2/payments/invoice/:paymentId:
 *   get:
 *     summary: Generate invoice for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice generated
 */
router.get('/invoice/:paymentId', authenticate, paymentController.generateInvoice);

/**
 * @swagger
 * /api/v2/payments/recurring/setup:
 *   post:
 *     summary: Setup recurring payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policyId
 *             properties:
 *               policyId:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, ANNUALLY]
 *     responses:
 *       200:
 *         description: Recurring payment setup
 */
router.post('/recurring/setup',
    authenticate,
    [
        body('policyId').notEmpty().withMessage('Policy ID is required'),
        body('frequency').optional().isIn(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
        handleValidationErrors
    ],
    paymentController.setupRecurringPayment
);

/**
 * @swagger
 * /api/v2/payments/recurring/:recurringId/cancel:
 *   post:
 *     summary: Cancel recurring payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recurringId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recurring payment cancelled
 */
router.post('/recurring/:recurringId/cancel', authenticate, paymentController.cancelRecurringPayment);

/**
 * @swagger
 * /api/v2/payments/refund/:paymentId:
 *   post:
 *     summary: Process refund (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post('/refund/:paymentId',
    authenticate,
    requireAdmin,
    [
        body('reason').notEmpty().withMessage('Refund reason is required'),
        handleValidationErrors
    ],
    paymentController.processRefund
);

// Premium Calculator Routes

/**
 * @swagger
 * /api/v2/payments/calculate-premium:
 *   post:
 *     summary: Calculate insurance premium
 *     tags: [Premium Calculator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policy_type
 *               - age
 *               - coverage_amount
 *             properties:
 *               policy_type:
 *                 type: string
 *                 enum: [LIFE, HEALTH, AUTO, HOME]
 *               age:
 *                 type: integer
 *               coverage_amount:
 *                 type: number
 *               gender:
 *                 type: string
 *               health_score:
 *                 type: integer
 *               smoking_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Premium calculated
 */
router.post('/calculate-premium', premiumController.calculatePremium);

/**
 * @swagger
 * /api/v2/payments/compare-policies:
 *   post:
 *     summary: Compare premiums for multiple policy types
 *     tags: [Premium Calculator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerData
 *               - policyTypes
 *             properties:
 *               customerData:
 *                 type: object
 *               policyTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Policy comparison completed
 */
router.post('/compare-policies', premiumController.comparePolicies);

/**
 * @swagger
 * /api/v2/payments/risk-score:
 *   post:
 *     summary: Calculate fraud risk score for claim
 *     tags: [Premium Calculator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Risk score calculated
 */
router.post('/risk-score', authenticate, requireAdmin, premiumController.calculateRiskScore);

module.exports = router;
