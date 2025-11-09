const { executeQuery, beginTransaction } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {
    /**
     * Log an audit event
     */
    async log(userId, userType, actionType, entityId = null, details = null) {
        try {
            await executeQuery(
                `INSERT INTO audit_log (user_id, user_type, action_type, entity_id, details, timestamp)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    userId,
                    userType,
                    actionType,
                    entityId,
                    details ? JSON.stringify(details) : null
                ]
            );
            
            logger.debug('Audit log created', { userId, userType, actionType, entityId });
        } catch (error) {
            // Don't throw error - audit logging should not break main functionality
            logger.error('Failed to create audit log:', error);
        }
    }

    /**
     * Get audit logs with pagination and filters
     */
    async getLogs(filters = {}, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];

        // Apply filters
        if (filters.userId) {
            query += ' AND user_id = ?';
            params.push(filters.userId);
        }

        if (filters.userType) {
            query += ' AND user_type = ?';
            params.push(filters.userType);
        }

        if (filters.actionType) {
            query += ' AND action_type = ?';
            params.push(filters.actionType);
        }

        if (filters.entityId) {
            query += ' AND entity_id = ?';
            params.push(filters.entityId);
        }

        if (filters.startDate) {
            query += ' AND timestamp >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND timestamp <= ?';
            params.push(filters.endDate);
        }

        // Add ordering and pagination
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const logs = await executeQuery(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
        const countParams = params.slice(0, -2); // Remove limit and offset
        
        if (filters.userId) countQuery += ' AND user_id = ?';
        if (filters.userType) countQuery += ' AND user_type = ?';
        if (filters.actionType) countQuery += ' AND action_type = ?';
        if (filters.entityId) countQuery += ' AND entity_id = ?';
        if (filters.startDate) countQuery += ' AND timestamp >= ?';
        if (filters.endDate) countQuery += ' AND timestamp <= ?';

        const [{ total }] = await executeQuery(countQuery, countParams);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get audit logs for a specific user
     */
    async getUserLogs(userId, userType, page = 1, limit = 50) {
        return this.getLogs({ userId, userType }, page, limit);
    }

    /**
     * Get audit logs for a specific entity
     */
    async getEntityLogs(entityId, page = 1, limit = 50) {
        return this.getLogs({ entityId }, page, limit);
    }

    /**
     * Get recent audit logs
     */
    async getRecentLogs(limit = 100) {
        const logs = await executeQuery(
            'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?',
            [limit]
        );
        return logs;
    }

    /**
     * Export audit logs to JSON
     */
    async exportLogs(filters = {}) {
        const { logs } = await this.getLogs(filters, 1, 100000); // Get all matching logs
        return logs;
    }
}

module.exports = new AuditService();
