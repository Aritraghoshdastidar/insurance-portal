const { executeQuery, beginTransaction } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Payment Gateway Service
 * Mock implementation - Ready for Stripe/PayPal integration
 */
class PaymentService {
    /**
     * Process initial premium payment
     */
    async processInitialPayment(customerId, policyId, amount, paymentMethod = 'MOCK') {
        let connection;
        
        try {
            connection = await beginTransaction();

            // Get policy details
            const [policyRows] = await connection.execute(
                `SELECT p.*, c.name, c.email 
                 FROM policy p
                 JOIN customer_policy cp ON p.policy_id = cp.policy_id
                 JOIN customer c ON cp.customer_id = c.customer_id
                 WHERE p.policy_id = ? AND cp.customer_id = ?`,
                [policyId, customerId]
            );

            if (policyRows.length === 0) {
                throw new NotFoundError('Policy not found or does not belong to customer');
            }

            const policy = policyRows[0];

            // Validate payment amount
            if (Math.abs(amount - policy.premium_amount) > 0.01) {
                throw new ValidationError('Payment amount does not match premium amount');
            }

            // Process payment (mock for now)
            const paymentResult = await this.mockPaymentGateway(amount, paymentMethod);

            if (!paymentResult.success) {
                throw new Error('Payment processing failed');
            }

            // Create payment record
            const paymentId = 'PAY_' + Date.now();
            await connection.execute(
                `INSERT INTO initial_payment 
                 (payment_id, policy_id, customer_id, amount, payment_gateway, transaction_id, payment_status, payment_date)
                 VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', NOW())`,
                [paymentId, policyId, customerId, amount, paymentMethod, paymentResult.transactionId]
            );

            // Activate policy
            await connection.execute(
                `UPDATE policy SET status = 'ACTIVE', start_date = CURDATE() WHERE policy_id = ?`,
                [policyId]
            );

            await connection.commit();

            logger.info('Payment processed successfully', { 
                paymentId, 
                policyId, 
                customerId, 
                amount 
            });

            return {
                paymentId,
                transactionId: paymentResult.transactionId,
                amount,
                status: 'SUCCESS',
                policyStatus: 'ACTIVE'
            };

        } catch (error) {
            if (connection) await connection.rollback();
            logger.error('Payment processing failed', error);
            throw error;
        } finally {
            if (connection && typeof connection.end === 'function') {
                await connection.end();
            }
        }
    }

    /**
     * Process recurring payment
     */
    async processRecurringPayment(customerId, policyId) {
        // Get policy and payment details
        const [policyRows] = await executeQuery(
            `SELECT p.*, c.email, c.name
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             JOIN customer c ON cp.customer_id = c.customer_id
             WHERE p.policy_id = ? AND cp.customer_id = ?`,
            [policyId, customerId]
        );

        if (policyRows.length === 0) {
            throw new NotFoundError('Policy not found');
        }

        const policy = policyRows[0];
        const paymentResult = await this.mockPaymentGateway(policy.premium_amount, 'AUTO_DEBIT');

        // Record payment
        const paymentId = 'RPAY_' + Date.now();
        await executeQuery(
            `INSERT INTO recurring_payments 
             (payment_id, policy_id, customer_id, amount, payment_date, status, transaction_id)
             VALUES (?, ?, ?, ?, NOW(), 'SUCCESS', ?)`,
            [paymentId, policyId, customerId, policy.premium_amount, paymentResult.transactionId]
        );

        logger.info('Recurring payment processed', { paymentId, policyId });

        return {
            paymentId,
            transactionId: paymentResult.transactionId,
            amount: policy.premium_amount,
            status: 'SUCCESS'
        };
    }

    /**
     * Get payment history for customer
     */
    async getPaymentHistory(customerId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const payments = await executeQuery(
            `SELECT ip.payment_id, ip.policy_id, ip.amount, ip.payment_date, 
                    ip.payment_status, ip.transaction_id, p.policy_type
             FROM initial_payment ip
             JOIN policy p ON ip.policy_id = p.policy_id
             WHERE ip.customer_id = ?
             UNION ALL
             SELECT rp.payment_id, rp.policy_id, rp.amount, rp.payment_date,
                    rp.status as payment_status, rp.transaction_id, p.policy_type
             FROM recurring_payments rp
             JOIN policy p ON rp.policy_id = p.policy_id
             WHERE rp.customer_id = ?
             ORDER BY payment_date DESC
             LIMIT ? OFFSET ?`,
            [customerId, customerId, limit, offset]
        );

        const [{ total }] = await executeQuery(
            `SELECT COUNT(*) as total FROM (
                SELECT payment_id FROM initial_payment WHERE customer_id = ?
                UNION ALL
                SELECT payment_id FROM recurring_payments WHERE customer_id = ?
             ) as all_payments`,
            [customerId, customerId]
        );

        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Generate invoice
     */
    async generateInvoice(paymentId) {
        const [payments] = await executeQuery(
            `SELECT ip.*, p.policy_type, p.coverage_details, c.name, c.email, c.address
             FROM initial_payment ip
             JOIN policy p ON ip.policy_id = p.policy_id
             JOIN customer c ON ip.customer_id = c.customer_id
             WHERE ip.payment_id = ?`,
            [paymentId]
        );

        if (payments.length === 0) {
            throw new NotFoundError('Payment not found');
        }

        const payment = payments[0];

        // Calculate taxes
        const gst = payment.amount * 0.18; // 18% GST
        const totalAmount = parseFloat(payment.amount) + gst;

        return {
            invoiceNumber: `INV-${paymentId}`,
            invoiceDate: new Date().toISOString().split('T')[0],
            customer: {
                name: payment.name,
                email: payment.email,
                address: payment.address
            },
            policy: {
                id: payment.policy_id,
                type: payment.policy_type,
                coverage: payment.coverage_details
            },
            payment: {
                id: payment.payment_id,
                transactionId: payment.transaction_id,
                date: payment.payment_date
            },
            breakdown: {
                premium: parseFloat(payment.amount),
                gst: gst,
                total: totalAmount
            }
        };
    }

    /**
     * Process refund
     */
    async processRefund(paymentId, reason) {
        const [payments] = await executeQuery(
            `SELECT * FROM initial_payment WHERE payment_id = ?`,
            [paymentId]
        );

        if (payments.length === 0) {
            throw new NotFoundError('Payment not found');
        }

        const payment = payments[0];

        // Process refund through gateway (mock)
        const refundResult = await this.mockRefundGateway(payment.transaction_id, payment.amount);

        if (!refundResult.success) {
            throw new Error('Refund processing failed');
        }

        // Record refund
        const refundId = 'REF_' + Date.now();
        await executeQuery(
            `INSERT INTO refunds 
             (refund_id, payment_id, amount, reason, refund_date, status, transaction_id)
             VALUES (?, ?, ?, ?, NOW(), 'SUCCESS', ?)`,
            [refundId, paymentId, payment.amount, reason, refundResult.transactionId]
        );

        // Update policy status
        await executeQuery(
            `UPDATE policy SET status = 'CANCELLED' WHERE policy_id = ?`,
            [payment.policy_id]
        );

        logger.info('Refund processed', { refundId, paymentId, amount: payment.amount });

        return {
            refundId,
            transactionId: refundResult.transactionId,
            amount: payment.amount,
            status: 'SUCCESS'
        };
    }

    /**
     * Mock Payment Gateway (Replace with actual Stripe/PayPal integration)
     */
    async mockPaymentGateway(amount, method) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // 95% success rate for mock
        const success = Math.random() > 0.05;

        return {
            success,
            transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            amount,
            method,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Mock Refund Gateway
     */
    async mockRefundGateway(originalTransactionId, amount) {
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            success: true,
            transactionId: 'REFTXN_' + Date.now(),
            originalTransactionId,
            amount,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Setup recurring payments
     */
    async setupRecurringPayment(customerId, policyId, frequency = 'MONTHLY') {
        const recurringId = 'REC_' + Date.now();

        await executeQuery(
            `INSERT INTO recurring_payment_setup 
             (recurring_id, customer_id, policy_id, frequency, status, next_payment_date, created_at)
             VALUES (?, ?, ?, ?, 'ACTIVE', DATE_ADD(CURDATE(), INTERVAL 1 MONTH), NOW())`,
            [recurringId, customerId, policyId, frequency]
        );

        logger.info('Recurring payment setup', { recurringId, policyId, frequency });

        return {
            recurringId,
            frequency,
            nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'ACTIVE'
        };
    }

    /**
     * Cancel recurring payment
     */
    async cancelRecurringPayment(recurringId) {
        await executeQuery(
            `UPDATE recurring_payment_setup SET status = 'CANCELLED' WHERE recurring_id = ?`,
            [recurringId]
        );

        logger.info('Recurring payment cancelled', { recurringId });

        return { status: 'CANCELLED' };
    }
}

module.exports = new PaymentService();
