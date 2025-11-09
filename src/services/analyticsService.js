const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Analytics and Reporting Service
 */
class AnalyticsService {
    /**
     * Get dashboard overview metrics
     */
    async getDashboardMetrics(startDate, endDate) {
        try {
            // Total policies
            const [policiesCount] = await executeQuery(
                `SELECT COUNT(*) as total, 
                        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
                        SUM(premium_amount) as total_premium
                 FROM policy
                 WHERE policy_date BETWEEN ? AND ?`,
                [startDate || '2020-01-01', endDate || '2099-12-31']
            );

            // Total claims
            const [claimsCount] = await executeQuery(
                `SELECT COUNT(*) as total,
                        SUM(CASE WHEN claim_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN claim_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN claim_status = 'DECLINED' THEN 1 ELSE 0 END) as declined,
                        SUM(amount) as total_amount,
                        AVG(amount) as avg_amount
                 FROM claim
                 WHERE claim_date BETWEEN ? AND ?`,
                [startDate || '2020-01-01', endDate || '2099-12-31']
            );

            // Total customers
            const [customersCount] = await executeQuery(
                `SELECT COUNT(*) as total,
                        COUNT(DISTINCT customer_id) as unique_customers
                 FROM customer
                 WHERE created_at BETWEEN ? AND ?`,
                [startDate || '2020-01-01', endDate || '2099-12-31']
            );

            // Revenue metrics
            const [revenue] = await executeQuery(
                `SELECT SUM(p.premium_amount) as total_premium_revenue,
                        SUM(c.amount) as total_claims_payout,
                        (SUM(p.premium_amount) - SUM(c.amount)) as net_profit
                 FROM policy p
                 LEFT JOIN claim c ON p.policy_id = c.policy_id
                 WHERE p.policy_date BETWEEN ? AND ?`,
                [startDate || '2020-01-01', endDate || '2099-12-31']
            );

            return {
                policies: policiesCount,
                claims: claimsCount,
                customers: customersCount,
                revenue: revenue,
                generated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error fetching dashboard metrics', error);
            throw error;
        }
    }

    /**
     * Get claims trend data
     */
    async getClaimsTrend(period = 'monthly', year = new Date().getFullYear()) {
        const groupBy = period === 'monthly' ? 'MONTH(claim_date)' : 'WEEK(claim_date)';
        
        const query = `
            SELECT ${groupBy} as period,
                   COUNT(*) as total_claims,
                   SUM(CASE WHEN claim_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN claim_status = 'DECLINED' THEN 1 ELSE 0 END) as declined,
                   SUM(amount) as total_amount
            FROM claim
            WHERE YEAR(claim_date) = ?
            GROUP BY period
            ORDER BY period
        `;

        return executeQuery(query, [year]);
    }

    /**
     * Get policy distribution by type
     */
    async getPolicyDistribution() {
        const query = `
            SELECT policy_type,
                   COUNT(*) as count,
                   SUM(premium_amount) as total_premium,
                   AVG(premium_amount) as avg_premium
            FROM policy
            GROUP BY policy_type
            ORDER BY count DESC
        `;

        return executeQuery(query);
    }

    /**
     * Get top customers by premium
     */
    async getTopCustomers(limit = 10) {
        const query = `
            SELECT c.customer_id, c.name, c.email,
                   COUNT(DISTINCT p.policy_id) as policy_count,
                   SUM(p.premium_amount) as total_premium,
                   COUNT(DISTINCT cl.claim_id) as claim_count
            FROM customer c
            LEFT JOIN customer_policy cp ON c.customer_id = cp.customer_id
            LEFT JOIN policy p ON cp.policy_id = p.policy_id
            LEFT JOIN claim cl ON c.customer_id = cl.customer_id
            GROUP BY c.customer_id, c.name, c.email
            ORDER BY total_premium DESC
            LIMIT ?
        `;

        return executeQuery(query, [limit]);
    }

    /**
     * Get claims by status breakdown
     */
    async getClaimsStatusBreakdown() {
        const query = `
            SELECT claim_status,
                   COUNT(*) as count,
                   SUM(amount) as total_amount,
                   AVG(amount) as avg_amount,
                   MIN(amount) as min_amount,
                   MAX(amount) as max_amount
            FROM claim
            GROUP BY claim_status
        `;

        return executeQuery(query);
    }

    /**
     * Get workflow performance metrics
     */
    async getWorkflowMetrics() {
        const query = `
            SELECT w.workflow_id, w.name,
                   COUNT(DISTINCT c.claim_id) as total_claims,
                   AVG(TIMESTAMPDIFF(HOUR, c.claim_date, NOW())) as avg_processing_time_hrs,
                   SUM(CASE WHEN c.claim_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN c.claim_status = 'DECLINED' THEN 1 ELSE 0 END) as declined_count,
                   SUM(CASE WHEN c.claim_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count
            FROM workflows w
            LEFT JOIN claim c ON w.workflow_id = c.workflow_id
            GROUP BY w.workflow_id, w.name
            ORDER BY total_claims DESC
        `;

        return executeQuery(query);
    }

    /**
     * Get monthly revenue trend
     */
    async getRevenueTrend(year = new Date().getFullYear()) {
        const query = `
            SELECT MONTH(policy_date) as month,
                   COUNT(*) as policies_sold,
                   SUM(premium_amount) as premium_revenue,
                   (SELECT SUM(amount) 
                    FROM claim 
                    WHERE YEAR(claim_date) = ? 
                    AND MONTH(claim_date) = MONTH(p.policy_date)
                    AND claim_status = 'APPROVED') as claims_payout
            FROM policy p
            WHERE YEAR(policy_date) = ?
            GROUP BY MONTH(policy_date)
            ORDER BY month
        `;

        return executeQuery(query, [year, year]);
    }

    /**
     * Get high-risk claims report
     */
    async getHighRiskClaims(threshold = 1000000) {
        const query = `
            SELECT c.claim_id, c.customer_id, cu.name as customer_name,
                   c.amount, c.claim_status, c.claim_date,
                   c.risk_score,
                   p.policy_type,
                   DATEDIFF(c.claim_date, p.policy_date) as days_since_policy
            FROM claim c
            JOIN customer cu ON c.customer_id = cu.customer_id
            JOIN policy p ON c.policy_id = p.policy_id
            WHERE c.amount > ? OR c.risk_score > 7
            ORDER BY c.amount DESC, c.risk_score DESC
        `;

        return executeQuery(query, [threshold]);
    }

    /**
     * Get customer retention metrics
     */
    async getCustomerRetentionMetrics() {
        const query = `
            SELECT 
                COUNT(DISTINCT c.customer_id) as total_customers,
                COUNT(DISTINCT CASE WHEN policy_count > 1 THEN c.customer_id END) as repeat_customers,
                AVG(policy_count) as avg_policies_per_customer,
                AVG(total_premium) as avg_lifetime_value
            FROM customer c
            LEFT JOIN (
                SELECT cp.customer_id,
                       COUNT(DISTINCT cp.policy_id) as policy_count,
                       SUM(p.premium_amount) as total_premium
                FROM customer_policy cp
                JOIN policy p ON cp.policy_id = p.policy_id
                GROUP BY cp.customer_id
            ) cust_stats ON c.customer_id = cust_stats.customer_id
        `;

        const [result] = await executeQuery(query);
        return result;
    }

    /**
     * Get overdue tasks report
     */
    async getOverdueTasks() {
        const query = `
            SELECT ws.step_id, ws.workflow_id, ws.step_name,
                   ws.assigned_role, ws.due_date,
                   c.claim_id, c.customer_id, cu.name as customer_name,
                   TIMESTAMPDIFF(HOUR, ws.due_date, NOW()) as hours_overdue
            FROM workflow_steps ws
            JOIN claim c ON ws.workflow_id = c.workflow_id
            JOIN customer cu ON c.customer_id = cu.customer_id
            WHERE ws.due_date IS NOT NULL
              AND NOW() > ws.due_date
              AND c.claim_status = 'PENDING'
            ORDER BY hours_overdue DESC
        `;

        return executeQuery(query);
    }

    /**
     * Generate comprehensive report
     */
    async generateComprehensiveReport(startDate, endDate) {
        const [
            dashboardMetrics,
            claimsTrend,
            policyDistribution,
            topCustomers,
            claimsStatus,
            workflowMetrics,
            revenueTrend,
            highRiskClaims,
            retentionMetrics,
            overdueTasks
        ] = await Promise.all([
            this.getDashboardMetrics(startDate, endDate),
            this.getClaimsTrend('monthly', new Date().getFullYear()),
            this.getPolicyDistribution(),
            this.getTopCustomers(10),
            this.getClaimsStatusBreakdown(),
            this.getWorkflowMetrics(),
            this.getRevenueTrend(new Date().getFullYear()),
            this.getHighRiskClaims(),
            this.getCustomerRetentionMetrics(),
            this.getOverdueTasks()
        ]);

        return {
            report_generated: new Date().toISOString(),
            period: { startDate, endDate },
            dashboard: dashboardMetrics,
            trends: {
                claims: claimsTrend,
                revenue: revenueTrend
            },
            distribution: {
                policies: policyDistribution,
                claims: claimsStatus
            },
            customers: {
                top: topCustomers,
                retention: retentionMetrics
            },
            workflows: workflowMetrics,
            risks: {
                highValueClaims: highRiskClaims,
                overdueTasks: overdueTasks
            }
        };
    }

    /**
     * Get claim approval rate by admin
     */
    async getAdminPerformance() {
        const query = `
            SELECT a.admin_id, a.name, a.role,
                   COUNT(c.claim_id) as claims_handled,
                   SUM(CASE WHEN c.claim_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN c.claim_status = 'DECLINED' THEN 1 ELSE 0 END) as declined,
                   AVG(TIMESTAMPDIFF(HOUR, c.claim_date, c.updated_at)) as avg_resolution_time_hrs
            FROM administrator a
            LEFT JOIN claim c ON a.admin_id = c.admin_id
            WHERE c.claim_id IS NOT NULL
            GROUP BY a.admin_id, a.name, a.role
            ORDER BY claims_handled DESC
        `;

        return executeQuery(query);
    }
}

module.exports = new AnalyticsService();
