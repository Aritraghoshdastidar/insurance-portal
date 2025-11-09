const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Verify JWT Token Middleware
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Add user info to request
        req.user = decoded;
        
        logger.debug('User authenticated:', { userId: decoded.customer_id || decoded.admin_id });
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AuthenticationError('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AuthenticationError('Token expired'));
        }
        next(error);
    }
};

/**
 * Check if user is Admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
    }
    
    if (!req.user.isAdmin) {
        return next(new AuthorizationError('Admin access required'));
    }
    
    next();
};

/**
 * Check specific role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthenticationError('Authentication required'));
        }
        
        if (!req.user.role || !roles.includes(req.user.role)) {
            return next(new AuthorizationError(`One of these roles required: ${roles.join(', ')}`));
        }
        
        next();
    };
};

/**
 * Check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (resourceIdParam = 'id', userIdField = 'customer_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthenticationError('Authentication required'));
        }
        
        const resourceId = req.params[resourceIdParam];
        const userId = req.user[userIdField];
        
        // Allow if admin or owns the resource
        if (req.user.isAdmin || resourceId === userId) {
            return next();
        }
        
        return next(new AuthorizationError('You do not have permission to access this resource'));
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
        }
    } catch (error) {
        // Ignore authentication errors for optional auth
        logger.debug('Optional auth failed:', error.message);
    }
    
    next();
};

module.exports = {
    authenticate,
    requireAdmin,
    requireRole,
    requireOwnershipOrAdmin,
    optionalAuth
};
