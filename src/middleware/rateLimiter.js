const rateLimit = require('express-rate-limit');
const config = require('../config/config');

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict Rate Limiter for Authentication Routes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: true
});

/**
 * Rate Limiter for Quote Generation
 */
const quoteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 quotes per minute
    message: {
        status: 'error',
        message: 'Too many quote requests, please try again later.'
    }
});

/**
 * Rate Limiter for File Uploads
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        status: 'error',
        message: 'Too many file uploads, please try again later.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    quoteLimiter,
    uploadLimiter
};
