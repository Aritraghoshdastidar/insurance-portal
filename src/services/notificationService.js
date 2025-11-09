const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Email and Notification Service
 */
class NotificationService {
    constructor() {
        // Create email transporter
        this.transporter = nodemailer.createTransporter({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: config.email.user && config.email.password ? {
                user: config.email.user,
                pass: config.email.password
            } : undefined
        });
    }

    /**
     * Send email notification
     */
    async sendEmail(to, subject, html, text) {
        try {
            // Skip email in test/dev without config
            if (!config.email.user) {
                logger.info('Email skipped (no config)', { to, subject });
                return { success: true, message: 'Email skipped - no SMTP config' };
            }

            const mailOptions = {
                from: config.email.from,
                to,
                subject,
                html,
                text: text || this.stripHtml(html)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error('Failed to send email', { to, subject, error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * Send welcome email to new customer
     */
    async sendWelcomeEmail(customer) {
        const subject = 'Welcome to Insurance Automation System';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1976d2;">Welcome ${customer.name}!</h1>
                <p>Thank you for registering with our Insurance Automation System.</p>
                <p>Your customer ID is: <strong>${customer.customer_id}</strong></p>
                <p>You can now:</p>
                <ul>
                    <li>Browse and purchase insurance policies</li>
                    <li>File claims online</li>
                    <li>Track your policy status</li>
                    <li>Manage your profile</li>
                </ul>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send policy purchase confirmation
     */
    async sendPolicyConfirmation(customer, policy) {
        const subject = `Policy ${policy.policy_id} Purchased Successfully`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4caf50;">Policy Purchase Confirmed</h1>
                <p>Dear ${customer.name},</p>
                <p>Your policy has been successfully purchased!</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Policy ID:</strong> ${policy.policy_id}</p>
                    <p><strong>Policy Type:</strong> ${policy.policy_type}</p>
                    <p><strong>Premium Amount:</strong> ₹${policy.premium_amount}</p>
                    <p><strong>Status:</strong> ${policy.status}</p>
                </div>
                <p>You can view your policy details in your dashboard.</p>
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send claim status update notification
     */
    async sendClaimStatusUpdate(customer, claim) {
        const subject = `Claim ${claim.claim_id} Status Update`;
        const statusColors = {
            'APPROVED': '#4caf50',
            'DECLINED': '#f44336',
            'PENDING': '#ff9800',
            'UNDER_REVIEW': '#2196f3'
        };

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: ${statusColors[claim.claim_status] || '#1976d2'};">Claim Status Update</h1>
                <p>Dear ${customer.name},</p>
                <p>Your claim status has been updated.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Claim ID:</strong> ${claim.claim_id}</p>
                    <p><strong>Status:</strong> <span style="color: ${statusColors[claim.claim_status]};">${claim.claim_status}</span></p>
                    <p><strong>Amount:</strong> ₹${claim.amount}</p>
                    <p><strong>Description:</strong> ${claim.description}</p>
                </div>
                ${claim.claim_status === 'APPROVED' ? 
                    '<p style="color: #4caf50;"><strong>Congratulations! Your claim has been approved.</strong></p>' : 
                    claim.claim_status === 'DECLINED' ? 
                    '<p style="color: #f44336;"><strong>We regret to inform you that your claim has been declined.</strong></p>' : 
                    '<p>We will keep you updated on the progress.</p>'
                }
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send payment reminder
     */
    async sendPaymentReminder(customer, policy, dueDate) {
        const subject = `Payment Reminder - Policy ${policy.policy_id}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ff9800;">Payment Reminder</h1>
                <p>Dear ${customer.name},</p>
                <p>This is a friendly reminder that your premium payment is due soon.</p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                    <p><strong>Policy ID:</strong> ${policy.policy_id}</p>
                    <p><strong>Amount Due:</strong> ₹${policy.premium_amount}</p>
                    <p><strong>Due Date:</strong> ${dueDate}</p>
                </div>
                <p>Please ensure timely payment to avoid policy lapse.</p>
                <a href="${config.cors.origin}/payments" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Pay Now</a>
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(customer, resetToken) {
        const resetUrl = `${config.cors.origin}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1976d2;">Password Reset Request</h1>
                <p>Dear ${customer.name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send document upload notification
     */
    async sendDocumentUploadNotification(customer, documentType) {
        const subject = 'Document Upload Confirmation';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4caf50;">Document Uploaded Successfully</h1>
                <p>Dear ${customer.name},</p>
                <p>Your ${documentType} has been uploaded successfully and is now being reviewed.</p>
                <p>You will be notified once the review is complete.</p>
                <p>Best regards,<br>Insurance Team</p>
            </div>
        `;

        return this.sendEmail(customer.email, subject, html);
    }

    /**
     * Send admin notification for high-value claims
     */
    async sendAdminHighValueClaimAlert(admin, claim) {
        const subject = `High-Value Claim Alert - ${claim.claim_id}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f44336;">High-Value Claim Alert</h1>
                <p>A high-value claim has been filed and requires immediate attention.</p>
                <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                    <p><strong>Claim ID:</strong> ${claim.claim_id}</p>
                    <p><strong>Customer:</strong> ${claim.customer_id}</p>
                    <p><strong>Amount:</strong> ₹${claim.amount}</p>
                    <p><strong>Description:</strong> ${claim.description}</p>
                    <p><strong>Risk Score:</strong> ${claim.risk_score || 'N/A'}</p>
                </div>
                <a href="${config.cors.origin}/admin/claims/${claim.claim_id}" style="display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 5px;">Review Claim</a>
            </div>
        `;

        return this.sendEmail(admin.email, subject, html);
    }

    /**
     * Strip HTML tags from string
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Send in-app notification (store in database)
     */
    async sendInAppNotification(userId, userType, title, message, type = 'INFO') {
        const { executeQuery } = require('../config/database');
        
        try {
            await executeQuery(
                `INSERT INTO notifications (user_id, user_type, title, message, type, is_read, created_at)
                 VALUES (?, ?, ?, ?, ?, false, NOW())`,
                [userId, userType, title, message, type]
            );

            logger.info('In-app notification sent', { userId, userType, title });
            return { success: true };
        } catch (error) {
            logger.error('Failed to send in-app notification', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send SMS notification (placeholder for Twilio integration)
     */
    async sendSMS(phoneNumber, message) {
        // TODO: Integrate with Twilio
        logger.info('SMS notification (mock)', { phoneNumber, message });
        return { success: true, message: 'SMS integration not configured' };
    }
}

module.exports = new NotificationService();
