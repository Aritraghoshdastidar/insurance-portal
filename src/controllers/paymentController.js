const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Process initial payment
 */
exports.processInitialPayment = asyncHandler(async (req, res) => {
    const customerId = req.user.customer_id;
    const { policyId, amount, paymentMethod } = req.body;
    
    const result = await paymentService.processInitialPayment(
        customerId,
        policyId,
        amount,
        paymentMethod
    );
    
    res.json({
        status: 'success',
        message: 'Payment processed successfully',
        data: result
    });
});

/**
 * Get payment history
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
    const customerId = req.user.customer_id;
    const { page, limit } = req.query;
    
    const result = await paymentService.getPaymentHistory(
        customerId,
        parseInt(page) || 1,
        parseInt(limit) || 10
    );
    
    res.json({
        status: 'success',
        data: result
    });
});

/**
 * Generate invoice
 */
exports.generateInvoice = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const invoice = await paymentService.generateInvoice(paymentId);
    
    res.json({
        status: 'success',
        data: invoice
    });
});

/**
 * Setup recurring payment
 */
exports.setupRecurringPayment = asyncHandler(async (req, res) => {
    const customerId = req.user.customer_id;
    const { policyId, frequency } = req.body;
    
    const result = await paymentService.setupRecurringPayment(
        customerId,
        policyId,
        frequency
    );
    
    res.json({
        status: 'success',
        message: 'Recurring payment setup successfully',
        data: result
    });
});

/**
 * Cancel recurring payment
 */
exports.cancelRecurringPayment = asyncHandler(async (req, res) => {
    const { recurringId } = req.params;
    const result = await paymentService.cancelRecurringPayment(recurringId);
    
    res.json({
        status: 'success',
        message: 'Recurring payment cancelled',
        data: result
    });
});

/**
 * Process refund (Admin only)
 */
exports.processRefund = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { reason } = req.body;
    
    const result = await paymentService.processRefund(paymentId, reason);
    
    res.json({
        status: 'success',
        message: 'Refund processed successfully',
        data: result
    });
});
