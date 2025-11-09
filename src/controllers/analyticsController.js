const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get dashboard metrics
 */
exports.getDashboardMetrics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);
    
    res.json({
        status: 'success',
        data: metrics
    });
});

/**
 * Get claims trend
 */
exports.getClaimsTrend = asyncHandler(async (req, res) => {
    const { period, year } = req.query;
    const trend = await analyticsService.getClaimsTrend(period, year);
    
    res.json({
        status: 'success',
        data: { trend }
    });
});

/**
 * Get policy distribution
 */
exports.getPolicyDistribution = asyncHandler(async (req, res) => {
    const distribution = await analyticsService.getPolicyDistribution();
    
    res.json({
        status: 'success',
        data: { distribution }
    });
});

/**
 * Get top customers
 */
exports.getTopCustomers = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const customers = await analyticsService.getTopCustomers(limit);
    
    res.json({
        status: 'success',
        data: { customers }
    });
});

/**
 * Get comprehensive report
 */
exports.getComprehensiveReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const report = await analyticsService.generateComprehensiveReport(startDate, endDate);
    
    res.json({
        status: 'success',
        data: report
    });
});

/**
 * Get workflow metrics
 */
exports.getWorkflowMetrics = asyncHandler(async (req, res) => {
    const metrics = await analyticsService.getWorkflowMetrics();
    
    res.json({
        status: 'success',
        data: { metrics }
    });
});

/**
 * Get high-risk claims
 */
exports.getHighRiskClaims = asyncHandler(async (req, res) => {
    const { threshold } = req.query;
    const claims = await analyticsService.getHighRiskClaims(threshold);
    
    res.json({
        status: 'success',
        data: { claims }
    });
});

/**
 * Get overdue tasks
 */
exports.getOverdueTasks = asyncHandler(async (req, res) => {
    const tasks = await analyticsService.getOverdueTasks();
    
    res.json({
        status: 'success',
        data: { tasks }
    });
});

/**
 * Get admin performance
 */
exports.getAdminPerformance = asyncHandler(async (req, res) => {
    const performance = await analyticsService.getAdminPerformance();
    
    res.json({
        status: 'success',
        data: { performance }
    });
});
