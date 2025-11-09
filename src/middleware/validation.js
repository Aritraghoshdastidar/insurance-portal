const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation Result Handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));
        
        return next(new ValidationError(JSON.stringify(errorMessages)));
    }
    
    next();
};

/**
 * User Registration Validation
 */
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    handleValidationErrors
];

/**
 * Login Validation
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Claim Filing Validation
 */
const validateClaimCreation = [
    body('policy_id')
        .trim()
        .notEmpty().withMessage('Policy ID is required'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    handleValidationErrors
];

/**
 * Claim Status Update Validation
 */
const validateClaimStatusUpdate = [
    body('newStatus')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['APPROVED', 'DECLINED', 'PENDING', 'UNDER_REVIEW'])
        .withMessage('Invalid status value'),
    handleValidationErrors
];

/**
 * Policy Purchase Validation
 */
const validatePolicyPurchase = [
    body('template_policy_id')
        .trim()
        .notEmpty().withMessage('Template policy ID is required'),
    handleValidationErrors
];

/**
 * Quote Generation Validation
 */
const validateQuoteGeneration = [
    body('customer_id')
        .trim()
        .notEmpty().withMessage('Customer ID is required'),
    body('policy_id')
        .trim()
        .notEmpty().withMessage('Policy ID is required'),
    handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateIdParam = (paramName = 'id') => [
    param(paramName)
        .trim()
        .notEmpty().withMessage(`${paramName} is required`),
    handleValidationErrors
];

/**
 * Pagination Validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

/**
 * Workflow Creation Validation
 */
const validateWorkflowCreation = [
    body('workflow_id')
        .trim()
        .notEmpty().withMessage('Workflow ID is required')
        .matches(/^[A-Z0-9_]+$/).withMessage('Workflow ID must contain only uppercase letters, numbers, and underscores'),
    body('name')
        .trim()
        .notEmpty().withMessage('Workflow name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateClaimCreation,
    validateClaimStatusUpdate,
    validatePolicyPurchase,
    validateQuoteGeneration,
    validateIdParam,
    validatePagination,
    validateWorkflowCreation,
    handleValidationErrors
};
