const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { executeQuery } = require('../config/database');
const { AuthenticationError, ValidationError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');
const auditService = require('./auditService');

class AuthService {
    /**
     * Register a new customer
     */
    async registerCustomer(userData) {
        const { name, email, password, phone, dob, address } = userData;

        // Check if email already exists
        const existingUser = await executeQuery(
            'SELECT customer_id FROM customer WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            throw new ConflictError('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
        
        // Generate customer ID
        const customer_id = 'CUST_' + Date.now();

        // Insert customer
        await executeQuery(
            `INSERT INTO customer (customer_id, name, email, password, phone, dob, address, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [customer_id, name, email, hashedPassword, phone || null, dob || null, address || null]
        );

        logger.info('Customer registered successfully', { customer_id, email });
        
        // Audit log
        await auditService.log(customer_id, 'CUSTOMER', 'REGISTRATION_SUCCESS');

        return { customer_id, name, email };
    }

    /**
     * Customer Login
     */
    async loginCustomer(email, password) {
        // Get customer
        const customers = await executeQuery(
            'SELECT * FROM customer WHERE email = ?',
            [email]
        );

        if (customers.length === 0) {
            await auditService.log(email, 'CUSTOMER', 'LOGIN_FAILED_USER_NOT_FOUND', null, { email });
            throw new AuthenticationError('Invalid email or password');
        }

        const customer = customers[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, customer.password);
        
        if (!isPasswordValid) {
            await auditService.log(customer.customer_id, 'CUSTOMER', 'LOGIN_FAILED_PASSWORD');
            throw new AuthenticationError('Invalid email or password');
        }

        // Generate tokens
        const token = this.generateToken({
            customer_id: customer.customer_id,
            name: customer.name,
            email: customer.email,
            isAdmin: false
        });

        const refreshToken = this.generateRefreshToken({
            customer_id: customer.customer_id
        });

        // Update last login
        await executeQuery(
            'UPDATE customer SET last_login = NOW() WHERE customer_id = ?',
            [customer.customer_id]
        );

        // Audit log
        await auditService.log(customer.customer_id, 'CUSTOMER', 'LOGIN_SUCCESS');

        logger.info('Customer logged in successfully', { customer_id: customer.customer_id });

        return {
            token,
            refreshToken,
            user: {
                customer_id: customer.customer_id,
                name: customer.name,
                email: customer.email,
                isAdmin: false
            }
        };
    }

    /**
     * Admin Login
     */
    async loginAdmin(email, password) {
        // Get admin
        const admins = await executeQuery(
            'SELECT * FROM administrator WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            await auditService.log(email, 'ADMIN', 'ADMIN_LOGIN_FAILED_USER_NOT_FOUND', null, { email });
            throw new AuthenticationError('Invalid email or password');
        }

        const admin = admins[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            await auditService.log(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_FAILED_PASSWORD');
            throw new AuthenticationError('Invalid email or password');
        }

        // Generate tokens
        const token = this.generateToken({
            admin_id: admin.admin_id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isAdmin: true
        });

        const refreshToken = this.generateRefreshToken({
            admin_id: admin.admin_id
        });

        // Audit log
        await auditService.log(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_SUCCESS');

        logger.info('Admin logged in successfully', { admin_id: admin.admin_id, role: admin.role });

        return {
            token,
            refreshToken,
            user: {
                admin_id: admin.admin_id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isAdmin: true
            }
        };
    }

    /**
     * Generate Access Token
     */
    generateToken(payload) {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
    }

    /**
     * Generate Refresh Token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn
        });
    }

    /**
     * Refresh Access Token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
            
            // Determine if customer or admin
            if (decoded.customer_id) {
                const customers = await executeQuery(
                    'SELECT customer_id, name, email FROM customer WHERE customer_id = ?',
                    [decoded.customer_id]
                );
                
                if (customers.length === 0) {
                    throw new AuthenticationError('User not found');
                }
                
                const customer = customers[0];
                return this.generateToken({
                    customer_id: customer.customer_id,
                    name: customer.name,
                    email: customer.email,
                    isAdmin: false
                });
            } else if (decoded.admin_id) {
                const admins = await executeQuery(
                    'SELECT admin_id, name, email, role FROM administrator WHERE admin_id = ?',
                    [decoded.admin_id]
                );
                
                if (admins.length === 0) {
                    throw new AuthenticationError('Admin not found');
                }
                
                const admin = admins[0];
                return this.generateToken({
                    admin_id: admin.admin_id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    isAdmin: true
                });
            }
            
            throw new AuthenticationError('Invalid refresh token');
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('Refresh token expired');
            }
            throw error;
        }
    }

    /**
     * Change Password
     */
    async changePassword(userId, isAdmin, oldPassword, newPassword) {
        const table = isAdmin ? 'administrator' : 'customer';
        const idField = isAdmin ? 'admin_id' : 'customer_id';
        
        // Get current password
        const users = await executeQuery(
            `SELECT password FROM ${table} WHERE ${idField} = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            throw new AuthenticationError('User not found');
        }
        
        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, users[0].password);
        if (!isValid) {
            throw new AuthenticationError('Current password is incorrect');
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
        
        // Update password
        await executeQuery(
            `UPDATE ${table} SET password = ? WHERE ${idField} = ?`,
            [hashedPassword, userId]
        );
        
        // Audit log
        await auditService.log(userId, isAdmin ? 'ADMIN' : 'CUSTOMER', 'PASSWORD_CHANGED');
        
        logger.info('Password changed successfully', { userId, isAdmin });
        
        return { message: 'Password changed successfully' };
    }
}

module.exports = new AuthService();
