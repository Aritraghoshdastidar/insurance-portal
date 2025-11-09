const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/v2/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', authLimiter, validateRegistration, asyncHandler(async (req, res) => {
    const result = await authService.registerCustomer(req.body);
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
    });
}));

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validateLogin, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginCustomer(email, password);
    
    res.json({
        status: 'success',
        message: 'Login successful',
        data: result
    });
}));

/**
 * @swagger
 * /api/v2/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/admin/login', authLimiter, validateLogin, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    
    res.json({
        status: 'success',
        message: 'Admin login successful',
        data: result
    });
}));

/**
 * @swagger
 * /api/v2/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const token = await authService.refreshAccessToken(refreshToken);
    
    res.json({
        status: 'success',
        data: { token }
    });
}));

/**
 * @swagger
 * /api/v2/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.customer_id || req.user.admin_id;
    const isAdmin = req.user.isAdmin;
    
    const result = await authService.changePassword(userId, isAdmin, oldPassword, newPassword);
    
    res.json({
        status: 'success',
        message: result.message
    });
}));

module.exports = router;
