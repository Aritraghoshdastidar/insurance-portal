// Notification Helper for Backend
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'insurance_app',
  password: 'app_password_123',
  database: 'insurance_db_dev'
};

// Send notification to customer
async function sendNotification(customerId, message, type = 'INFO') {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      `INSERT INTO notification (customer_id, message, type, sent_timestamp, read_status) 
       VALUES (?, ?, ?, NOW(), 0)`,
      [customerId, message, type]
    );
    
    // Emit real-time notification via socket.io if available
    if (global.io) {
      global.io.emit('notification', {
        customer_id: customerId,
        message,
        type,
        timestamp: new Date().toISOString(),
        read_status: 0
      });
    }
    
    return true;
  } catch (error) {
    // Silently fail - don't clutter console
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

// Send welcome notification to new customer
async function sendWelcomeNotification(customerId, customerName) {
  const message = `Welcome to InsuranceFlow, ${customerName}! 🎉 Your account has been successfully created. Start by exploring our policies and file your first claim.`;
  return await sendNotification(customerId, message, 'WELCOME');
}

// Send policy purchase notification
async function sendPolicyPurchaseNotification(customerId, policyId, policyType) {
  const message = `✅ Policy ${policyId} (${policyType}) has been successfully purchased and is now under review by our underwriters.`;
  return await sendNotification(customerId, message, 'POLICY_CREATED');
}

// Send policy approval notification
async function sendPolicyApprovalNotification(customerId, policyId) {
  const message = `🎉 Great news! Your policy ${policyId} has been approved and is now ACTIVE. You're fully covered!`;
  return await sendNotification(customerId, message, 'POLICY_APPROVED');
}

// Send policy decline notification
async function sendPolicyDeclineNotification(customerId, policyId, reason = '') {
  const message = `Your policy ${policyId} could not be approved at this time. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`;
  return await sendNotification(customerId, message, 'POLICY_DECLINED');
}

// Send claim submitted notification
async function sendClaimSubmittedNotification(customerId, claimId) {
  const message = `📋 Your claim ${claimId} has been successfully submitted and is being reviewed by our claims team.`;
  return await sendNotification(customerId, message, 'CLAIM_SUBMITTED');
}

// Send claim approved notification
async function sendClaimApprovedNotification(customerId, claimId, amount) {
  const message = `✅ Congratulations! Your claim ${claimId} has been APPROVED for ₹${amount}. Payment will be processed within 3-5 business days.`;
  return await sendNotification(customerId, message, 'CLAIM_APPROVED');
}

// Send claim declined notification
async function sendClaimDeclinedNotification(customerId, claimId, reason = '') {
  const message = `❌ Your claim ${claimId} has been declined. ${reason ? `Reason: ${reason}` : 'Please review your claim details or contact support.'}`;
  return await sendNotification(customerId, message, 'CLAIM_DECLINED');
}

// Send payment notification
async function sendPaymentNotification(customerId, amount, policyId) {
  const message = `💳 Payment of ₹${amount} received for policy ${policyId}. Thank you for your payment!`;
  return await sendNotification(customerId, message, 'PAYMENT_RECEIVED');
}

// Send reminder notification
async function sendReminderNotification(customerId, message) {
  return await sendNotification(customerId, `⏰ Reminder: ${message}`, 'REMINDER');
}

// Send document upload notification
async function sendDocumentUploadNotification(customerId, documentType) {
  const message = `📄 Your ${documentType} has been successfully uploaded and is being verified.`;
  return await sendNotification(customerId, message, 'DOCUMENT_UPLOADED');
}

module.exports = {
  sendNotification,
  sendWelcomeNotification,
  sendPolicyPurchaseNotification,
  sendPolicyApprovalNotification,
  sendPolicyDeclineNotification,
  sendClaimSubmittedNotification,
  sendClaimApprovedNotification,
  sendClaimDeclinedNotification,
  sendPaymentNotification,
  sendReminderNotification,
  sendDocumentUploadNotification,
};
