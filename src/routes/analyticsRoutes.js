const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/v2/analytics/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */
router.get('/dashboard', authenticate, requireAdmin, analyticsController.getDashboardMetrics);

/**
 * @swagger
 * /api/v2/analytics/claims-trend:
 *   get:
 *     summary: Get claims trend data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/claims-trend', authenticate, requireAdmin, analyticsController.getClaimsTrend);

/**
 * @swagger
 * /api/v2/analytics/policy-distribution:
 *   get:
 *     summary: Get policy distribution by type
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/policy-distribution', authenticate, requireAdmin, analyticsController.getPolicyDistribution);

/**
 * @swagger
 * /api/v2/analytics/top-customers:
 *   get:
 *     summary: Get top customers by premium
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/top-customers', authenticate, requireAdmin, analyticsController.getTopCustomers);

/**
 * @swagger
 * /api/v2/analytics/report:
 *   get:
 *     summary: Get comprehensive analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/report', authenticate, requireAdmin, analyticsController.getComprehensiveReport);

/**
 * @swagger
 * /api/v2/analytics/workflow-metrics:
 *   get:
 *     summary: Get workflow performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workflow-metrics', authenticate, requireAdmin, analyticsController.getWorkflowMetrics);

/**
 * @swagger
 * /api/v2/analytics/high-risk-claims:
 *   get:
 *     summary: Get high-risk claims
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/high-risk-claims', authenticate, requireAdmin, analyticsController.getHighRiskClaims);

/**
 * @swagger
 * /api/v2/analytics/overdue-tasks:
 *   get:
 *     summary: Get overdue tasks
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overdue-tasks', authenticate, requireAdmin, analyticsController.getOverdueTasks);

/**
 * @swagger
 * /api/v2/analytics/admin-performance:
 *   get:
 *     summary: Get admin performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin-performance', authenticate, requireAdmin, analyticsController.getAdminPerformance);

module.exports = router;
