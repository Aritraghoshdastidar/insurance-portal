// --- 1. Import Required Tools ---
require('dotenv').config(); // <-- ADDED: Loads .env file
const express = require('express');
const mysql = require('mysql2/promise'); // Using the 'promise' version for modern async/await
const cron = require('node-cron');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard for bcrypt
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const multer = require('multer'); // --- NEW (IWAS-F-013)
const fs = require('fs');         // --- NEW (IWAS-F-013)
const notificationHelper = require('./src/utils/notificationHelper');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_12345';


// --- 2. Setup the Express App ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Frontend URL
        methods: ['GET', 'POST']
    }
});
const port = 3001; // We'll run the backend on port 3001
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Allow the server to read JSON from requests

// Socket.io connection handling
io.on('connection', (socket) => {
    // Client connected - silent
    
    socket.on('disconnect', () => {
        // Client disconnected - silent
    });
});

// Export io for use in notification helper
global.io = io;


// --- 3. Database Connection Configuration ---
const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev' // Development database
};

// Debug logging flag - set to false to silence workflow and other logs
const ENABLE_DEBUG_LOGS = false;

// --- AUDIT LOG HELPER FUNCTION (IWAS-F-042) ---
const logAuditEvent = async (userId, userType, actionType, entityId = null, details = null) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO audit_log (user_id, user_type, action_type, entity_id, details)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, userType, actionType, entityId, details ? JSON.stringify(details) : null]
        );
        // Audit logged silently
    } catch (error) {
        // Silently fail
    } finally {
        if (connection) await connection.end();
    }
};

// --- 4. Notification Sending Job (IWAS-F-041) ---
// (Runs every 1 minute for easy testing. Change to '*/5 * * * * *' for 5 mins in prod)
// Notification Scheduler Job - TEMPORARILY DISABLED
// To enable: Fix DB password in .env, then uncomment the cron.schedule code below

const task = null; // Placeholder - cron job disabled

// --- 4. Middleware ---
// ... (Your existing checkAuth and checkAdmin middleware - no changes) ...
// Middleware for checking the JWT token
const checkAuth = (req, res, next) => {
    try {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            throw new Error('No token provided');
        }
        const token = req.headers.authorization.split(' ')[1]; // Extract token after "Bearer "
        const decodedToken = jwt.verify(token, JWT_SECRET);
        req.user = decodedToken; // Add decoded user info (like customer_id, admin_id, isAdmin) to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Auth Error:", error.message);
        // Differentiate between token missing/malformed and token expired/invalid signature
        if (error.name === 'JsonWebTokenError' || error.name === 'SyntaxError' || error.message === 'No token provided') {
             res.status(401).json({ error: 'Authentication failed: Invalid token format.' });
        } else if (error.name === 'TokenExpiredError') {
             res.status(401).json({ error: 'Authentication failed: Token expired.' });
        }
        else {
            res.status(401).json({ error: 'Authentication failed!' });
        }
    }
};

// Middleware to check if the authenticated user is an Admin
const checkAdmin = (req, res, next) => {
    // Assumes checkAuth has already run and added req.user
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' }); // Send 403 Forbidden
    }
    next(); // User is an admin, proceed
};


// --- 5. Workflow Engine Logic ---
// ... (Your existing executeWorkflowStep logic - no changes) ...
async function executeWorkflowStep(claimId) {
    let connection;
    if (ENABLE_DEBUG_LOGS) if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Processing claim: ${claimId}`);
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction(); // Use transactions for safety

        // 1. Get current claim state (Lock the row for update)
        const [claimRows] = await connection.execute(
            'SELECT * FROM claim WHERE claim_id = ? FOR UPDATE', // Lock row
            [claimId]
        );
        if (claimRows.length === 0) {
            console.error(`[WF Engine] Claim ${claimId} not found during execution.`);
            await connection.rollback();
            return;
        }
        const claim = claimRows[0];
        const currentWorkflowId = claim.workflow_id;
        const currentStepOrder = claim.current_step_order;

        if (!currentWorkflowId || currentStepOrder == null) {
            if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Claim ${claimId} workflow already complete or not assigned.`);
            await connection.rollback(); // No changes needed
            return; // Workflow complete or not assigned
        }

        // 2. Get the definition for the current step
        const [stepRows] = await connection.execute(
            'SELECT * FROM workflow_steps WHERE workflow_id = ? AND step_order = ?',
            [currentWorkflowId, currentStepOrder]
        );

        if (stepRows.length === 0) {
            if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Workflow ${currentWorkflowId} completed for claim ${claimId}. No step found at order ${currentStepOrder}.`);
            await connection.execute('UPDATE claim SET current_step_order = NULL WHERE claim_id = ?', [claimId]);
            await connection.commit(); // Commit completion
            return; // End of workflow
        }
        const currentStep = stepRows[0];
        // Ensure configuration is parsed safely if it's stored as a string
        let stepConfig = {};
        try {
            stepConfig = (typeof currentStep.configuration === 'string')
                           ? JSON.parse(currentStep.configuration || '{}')
                           : (currentStep.configuration || {});
        } catch(e){
            console.error(`[WF Engine] Failed to parse configuration JSON for step ${currentStep.step_id}: ${currentStep.configuration}`);
            throw new Error("Invalid step configuration JSON"); // Throw error to halt workflow
        }


        if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Current Step (${currentStep.step_order} - ${currentStep.step_name}): ${currentStep.task_type}`);

        // 3. Execute step based on type
        let stepCompleted = false;
        let skipNextStepLogic = false; // Flag for conditional skips
        let nextStepOrder = null; // Default to null (complete) unless next step found

        // Find the *next* defined step in the workflow to jump to (do this early)
        const [nextStepRows] = await connection.execute(
             'SELECT MIN(step_order) as next_order FROM workflow_steps WHERE workflow_id = ? AND step_order > ?',
             [currentWorkflowId, currentStepOrder]
        );
        if (nextStepRows.length > 0 && nextStepRows[0].next_order != null) {
            nextStepOrder = nextStepRows[0].next_order;
        } else {
             if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] No steps found after step ${currentStepOrder} for workflow ${currentWorkflowId}.`);
        }


        switch (currentStep.task_type) {
            case 'RULE':
                if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Executing RULE: ${stepConfig.ruleName || 'Unnamed'}`);
                // --- Rule Logic ---
                if (stepConfig.ruleName === 'assignByAmount') {
                    if (parseFloat(claim.amount) < stepConfig.threshold) {
                        if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in assignByAmount rule config.");
                        await connection.execute('UPDATE claim SET admin_id = ? WHERE claim_id = ?', [stepConfig.targetAdminId, claimId]);
                        if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Assigned claim ${claimId} to admin ${stepConfig.targetAdminId}`);
                    } else {
                        if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Claim ${claimId} amount (${claim.amount}) >= threshold (${stepConfig.threshold}). Skipping assignment.`);
                        // Optional: Assign to different admin/group if needed
                    }
                } else if (stepConfig.ruleName === 'autoApproveSimple') {
                    await connection.execute( `UPDATE claim SET claim_status = 'APPROVED', status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?`, ['\nClaim auto-approved by workflow rule.', claimId]);
                    if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Claim ${claimId} auto-approved by rule.`);
                } else if (stepConfig.ruleName === 'checkStatus') {
                    if (!stepConfig.expectedStatus) throw new Error("Missing expectedStatus in checkStatus rule config.");
                    if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Checking if claim status is ${stepConfig.expectedStatus}. Current: ${claim.claim_status}`);
                    if (claim.claim_status !== stepConfig.expectedStatus) {
                        if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Status check failed. Halting branch.`);
                        skipNextStepLogic = true; // Don't proceed further down this path
                        nextStepOrder = null; // Mark workflow as complete/halted for this branch
                    } else {
                        if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Status check passed.`);
                    }
                } else if (stepConfig.ruleName === 'reassignClaim') {
                     if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in reassignClaim rule config.");
                     await connection.execute("UPDATE claim SET admin_id = ?, status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?",
                         [stepConfig.targetAdminId, '\nClaim escalated and reassigned.', claimId]);
                     if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Escalated claim ${claimId} assignment to admin ${stepConfig.targetAdminId}`);
                }
                else {
                     console.warn(`[WF Engine] Unknown rule name: ${stepConfig.ruleName}`);
                     // Decide: should unknown rule halt or proceed? Let's proceed for now.
                }
                if (!skipNextStepLogic) stepCompleted = true; // Mark step as done unless branch halted
                break;

            case 'MANUAL':
                if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Waiting for MANUAL action. Assigned: ${claim.admin_id || stepConfig.assignedRole || 'Unspecified Role'}`);
                // The engine pauses here. Status should be PENDING.
                stepCompleted = false;
                break;

            case 'TIMER':
                const delaySeconds = stepConfig.durationSeconds || 60; // Default 1 min if not specified
                if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Starting TIMER: Wait for ${delaySeconds} seconds.`);
                // IMPORTANT: setTimeout is NOT persistent. Production needs a job queue.
                setTimeout(async () => {
                    if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] TIMER completed for claim ${claimId} after ${delaySeconds}s.`);
                    let timerConnection;
                    try {
                        timerConnection = await mysql.createConnection(dbConfig);
                        // Only advance if the claim is *still* on the timer step
                        const [updateResult] = await timerConnection.execute(
                            'UPDATE claim SET current_step_order = ? WHERE claim_id = ? AND current_step_order = ?',
                            [nextStepOrder, claimId, currentStepOrder] // Use pre-calculated next step
                        );
                        await timerConnection.end();

                        if (updateResult.affectedRows > 0) {
                             if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Timer advanced claim ${claimId} to step ${nextStepOrder}. Triggering engine.`);
                             setImmediate(() => executeWorkflowStep(claimId)); // Trigger next step
                        } else {
                             if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Timer finished for claim ${claimId}, but it was already advanced or completed.`);
                        }
                    } catch (timerError) {
                        console.error(`[WF Engine] Error advancing step after timer for claim ${claimId}:`, timerError);
                         if (timerConnection) await timerConnection.end();
                    }
                }, delaySeconds * 1000);
                // The current step execution finishes immediately, pauses workflow externally.
                stepCompleted = false; // Workflow pauses externally
                skipNextStepLogic = true; // Prevent internal step advancement
                break;

            case 'API':
                if (ENABLE_DEBUG_LOGS) console.log('[WF Engine] Executing API call (Placeholder):', stepConfig.task);
                // Placeholder for Notification/API calls
                if (stepConfig.task === 'sendNotification') {
                     if (!stepConfig.template) throw new Error("Missing template in sendNotification API config.");
                     if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Sending notification '${stepConfig.template}' for claim ${claimId}.`);
                     // TODO: Implement actual notification logic (email, etc.)
                } else {
                     console.warn(`[WF Engine] Unknown API task: ${stepConfig.task}`);
                     // Decide: should unknown API task halt or proceed? Let's proceed.
                }
                stepCompleted = true; // Assume success for now
                break;

            default:
                console.error(`[WF Engine] Unknown task type: ${currentStep.task_type}`);
                stepCompleted = false;
                nextStepOrder = null; // Halt workflow
                await connection.execute('UPDATE claim SET current_step_order = NULL, status_log = CONCAT(IFNULL(status_log, \'\'), ?) WHERE claim_id = ?',
                     [`\nWorkflow Error: Unknown task type '${currentStep.task_type}' at step ${currentStepOrder}.`, claimId]);
        }

        // 4. Advance workflow if step completed (and not handled asynchronously)
        if (stepCompleted && !skipNextStepLogic) {
            if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Advancing workflow for claim ${claimId} from ${currentStepOrder} to step ${nextStepOrder}`);
            await connection.execute(
                'UPDATE claim SET current_step_order = ? WHERE claim_id = ?',
                [nextStepOrder, claimId] // Update to next step (could be null if last step)
            );
            await connection.commit(); // Commit transaction for this step
            // Recursively call for the next step only if there is one
            if (nextStepOrder !== null) {
                setImmediate(() => executeWorkflowStep(claimId));
            } else {
                if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Workflow for claim ${claimId} finished after step ${currentStepOrder}.`);
            }
        } else if (skipNextStepLogic && nextStepOrder === null) {
             if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Workflow branch halted for claim ${claimId}.`);
             await connection.commit(); // Commit the halt/completion
        } else if (skipNextStepLogic) {
             if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Step ${currentStepOrder} initiated async action (Timer). Main execution pauses for claim ${claimId}.`);
             await connection.commit(); // Commit the state before async action takes over
        } else {
            if (ENABLE_DEBUG_LOGS) console.log(`[WF Engine] Workflow paused at step ${currentStepOrder} for claim ${claimId} (Manual/Error).`);
            await connection.commit(); // Commit the paused state
        }

    } catch (error) {
        console.error(`[WF Engine] CRITICAL Error processing workflow for claim ${claimId}:`, error);
        if (connection) {
             try { await connection.rollback(); } catch (rbError) { console.error("Rollback failed:", rbError); }
        }
        // Attempt to update claim status to indicate error
        try {
             connection = await mysql.createConnection(dbConfig); // Reconnect if needed
             await connection.execute('UPDATE claim SET current_step_order = NULL, status_log = CONCAT(IFNULL(status_log, \'\'), ?) WHERE claim_id = ?',
                 [`\nWorkflow Engine CRITICAL Error: ${error.message}`, claimId]);
        } catch (dbError) {
             console.error(`[WF Engine] Failed to update claim ${claimId} status after critical workflow error:`, dbError);
        }
    } finally {
        // Ensure connection is closed reliably
        if (connection && connection.connection._closing === false) {
             try { await connection.end(); } catch (endError) { console.error("Failed to close connection:", endError); }
        }
    }
}


// --- 6. Public API Endpoints ---
// ... (Your existing /api/quote, /api/register, /api/login, /api/admin/login endpoints - no changes) ...
// Quote Generation Endpoint
app.post('/api/quote', async (req, res) => {
    let connection;
    try {
        const { customer_id, policy_id } = req.body;
        if (!customer_id || !policy_id) {
             return res.status(400).json({ error: 'Customer ID and Policy ID are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT c.dob, p.premium_amount AS base_premium
             FROM customer c JOIN policy p ON p.policy_id = ?
             WHERE c.customer_id = ?`,
            [policy_id, customer_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer or Policy template not found' });
        }

        const { dob, base_premium } = rows[0];
        if (!dob || base_premium == null) {
            return res.status(400).json({ error: 'Missing required data (DOB or Base Premium) for calculation.' });
        }
        const basePremiumNum = parseFloat(base_premium);
        if (isNaN(basePremiumNum)) return res.status(400).json({ error: 'Invalid base premium value.'});


        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return res.status(400).json({ error: 'Invalid date of birth.'});
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        let finalPremium = basePremiumNum;
        let discount = 0;

        // Example Rule
        if (age > 40 && policy_id === 'POL1002') {
            discount = basePremiumNum * 0.08;
            finalPremium = basePremiumNum - discount;
        }

        res.json({ customer_id, policy_id, age, base_premium: basePremiumNum, discount, final_premium: finalPremium });

    } catch (error) {
        console.error('Error generating quote:', error);
        res.status(500).json({ error: 'Internal server error during quote generation.' });
    } finally {
        if (connection) await connection.end();
    }
});

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    let connection;
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        // Basic email format check
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }
        // Basic password length check
        if (password.length < 6) {
             return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }


        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const customer_id = 'CUST_' + Date.now();

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO customer (customer_id, name, email, password) VALUES (?, ?, ?, ?)`,
            [customer_id, name, email, hashedPassword]
        );

        // Send welcome notification
        await notificationHelper.sendWelcomeNotification(customer_id, name);

        res.status(201).json({ message: 'User registered successfully!', customer_id });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error during registration.' });
    } finally {
        if (connection) await connection.end();
    }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
             return res.status(400).json({ error: 'Email and password are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute( `SELECT * FROM customer WHERE email = ?`, [email] );

        if (rows.length === 0) {
            // [AUDIT] Log failed login (user not found)
            logAuditEvent(email, 'CUSTOMER', 'LOGIN_FAILED_USER_NOT_FOUND', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // User not found
        }
        const user = rows[0];
        if (!user.password) {
             console.error(`User ${user.customer_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            // [AUDIT] Log failed login (wrong password)
            logAuditEvent(user.customer_id, 'CUSTOMER', 'LOGIN_FAILED_PASSWORD', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

        // [AUDIT] Log successful login
        logAuditEvent(user.customer_id, 'CUSTOMER', 'LOGIN_SUCCESS');

        // Generate JWT for customer
        const token = jwt.sign(
            { customer_id: user.customer_id, name: user.name, email: user.email, isAdmin: false },
            JWT_SECRET, { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful!', token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Admin Login Endpoint
app.post('/api/admin/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
             return res.status(400).json({ error: 'Email and password are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute( `SELECT * FROM administrator WHERE email = ?`, [email] );

        if (rows.length === 0) {
            // [AUDIT] Log failed admin login (user not found)
            logAuditEvent(email, 'ADMIN', 'ADMIN_LOGIN_FAILED_USER_NOT_FOUND', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Admin not found
        }
        const admin = rows[0];
        if (!admin.password) {
             console.error(`Admin ${admin.admin_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            // [AUDIT] Log failed admin login (wrong password)
            logAuditEvent(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_FAILED_PASSWORD', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

        // [AUDIT] Log successful admin login
        logAuditEvent(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_SUCCESS');

        // Generate JWT for admin
        const token = jwt.sign(
            { admin_id: admin.admin_id, name: admin.name, role: admin.role, isAdmin: true },
            JWT_SECRET, { expiresIn: '1h' }
        );

        res.json({ message: 'Admin login successful!', token });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ error: 'Internal server error during admin login.' });
    } finally {
        if (connection) await connection.end();
    }
});

// --- 7. Secure Customer API Endpoints ---

// Get Claims for Logged-in Customer
// ... (Your existing /api/my-claims GET endpoint - no changes) ...
app.get('/api/my-claims', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT claim_id, description, claim_date, claim_status as status, amount
             FROM claim WHERE customer_id = ? ORDER BY claim_date DESC`,
            [customer_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ error: 'Internal server error fetching claims.' });
    } finally {
        if (connection) await connection.end();
    }
});


// File a New Claim for Logged-in Customer (Triggers Workflow)
// ... (Your existing /api/my-claims POST endpoint - no changes) ...
app.post('/api/my-claims', checkAuth, async (req, res) => {
    let connection;
    let claim_id; // Define claim_id outside try for use in triggering
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;
        const { policy_id, description, amount } = req.body;

        if (!policy_id || !description || amount == null) {
            return res.status(400).json({ error: 'Policy ID, description, and amount are required.' });
        }
        const claimAmount = parseFloat(amount);
        if (isNaN(claimAmount) || claimAmount <= 0) {
             return res.status(400).json({ error: 'Invalid claim amount.' });
        }

        claim_id = 'CLM_' + Date.now(); // Assign value here
        const workflow_id_to_assign = 'CLAIM_APPROVAL_V1';

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction(); // Start transaction

        // Verify policy belongs to customer and get policy details
        const [policyCheck] = await connection.execute(
             `SELECT p.policy_date, p.policy_id 
              FROM customer_policy cp
              JOIN policy p ON cp.policy_id = p.policy_id
              WHERE cp.customer_id = ? AND cp.policy_id = ?`,
             [customer_id, policy_id]
        );
        if (policyCheck.length === 0) {
             await connection.rollback();
             return res.status(403).json({ error: `Policy ${policy_id} does not belong to this customer.` });
        }

        const policyDate = policyCheck[0].policy_date;
        const daysSincePurchase = policyDate ? Math.floor((new Date() - new Date(policyDate)) / (1000 * 60 * 60 * 24)) : 365;

        // Count previous claims by this customer
        const [claimCount] = await connection.execute(
            `SELECT COUNT(*) as claim_count FROM claim WHERE customer_id = ?`,
            [customer_id]
        );
        const previousClaims = claimCount[0].claim_count || 0;

        // Calculate risk score for the claim
        const premiumCalcService = require('./src/services/premiumCalculatorService');
        const riskScoreResult = premiumCalcService.calculateRiskScore({
            amount: claimAmount,
            previous_claims: previousClaims,
            days_since_purchase: daysSincePurchase,
            has_all_documents: true // Can be enhanced based on file uploads
        });

        // Insert claim WITH workflow details and risk score
        await connection.execute(
            `INSERT INTO claim (claim_id, policy_id, customer_id, description, claim_date, claim_status, amount, status_log, workflow_id, current_step_order, risk_score)
             VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', ?, ?, ?, 1, ?)`,
            [claim_id, policy_id, customer_id, description, claimAmount, 'Claim submitted by user.', workflow_id_to_assign, riskScoreResult.riskScore]
        );

        await connection.commit(); // Commit transaction
        await connection.end(); // Close connection BEFORE triggering workflow

        // Send claim submission notification to customer
        await notificationHelper.sendClaimSubmittedNotification(customer_id, claim_id);

        res.status(201).json({ message: 'Claim filed successfully!', claim_id });

        // --- Trigger Workflow Execution Asynchronously ---
        if (claim_id) { // Ensure claim_id was set
             setImmediate(() => executeWorkflowStep(claim_id));
        }

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('Error filing claim:', error);
        res.status(500).json({ error: 'Internal server error filing claim.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// --- Get Notifications for Logged-in Customer (IWAS-F-041) ---
app.get('/api/my-notifications', checkAuth, async (req, res) => {
  let connection;
  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const customer_id = req.user.customer_id;

    connection = await mysql.createConnection(dbConfig);
    // Fetch recent notifications for this user
    const [rows] = await connection.execute(
      `SELECT notification_id, message, type, sent_timestamp, read_status 
       FROM notification 
       WHERE customer_id = ?
       ORDER BY sent_timestamp DESC 
       LIMIT 10`, // Get the 10 most recent
      [customer_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error fetching notifications.' });
  } finally {
    if (connection) await connection.end();
  }
});

// --- Get Policies for Logged-in Customer ---
app.get('/api/my-policies', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;

        connection = await mysql.createConnection(dbConfig);
        // Join customer_policy with policy to get details
        const [rows] = await connection.execute(
            `SELECT p.policy_id, p.policy_type, p.premium_amount, p.status, p.start_date, p.end_date
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE cp.customer_id = ?
             ORDER BY p.policy_date DESC`,
            [customer_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customer policies:', error);
        res.status(500).json({ error: 'Internal server error fetching policies.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ================= Customer Policy Purchase (Catalog + Buy) =================
// Get catalog of policies available to buy (use ACTIVE as templates)
app.get('/api/policies/catalog', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT policy_id, policy_type, premium_amount, coverage_details
             FROM policy
             WHERE status = 'ACTIVE'
             ORDER BY policy_type, premium_amount ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching policy catalog:', error);
        res.status(500).json({ error: 'Internal server error fetching catalog.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Buy a policy by cloning a template (creates a fresh policy + customer_policy link)
app.post('/api/policies/buy', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;
        const { template_policy_id, premium_amount, coverage_amount, policy_term, coverage_details } = req.body || {};
        if (!template_policy_id) {
            return res.status(400).json({ error: 'template_policy_id is required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Load template policy
        const [rows] = await connection.execute(
            `SELECT policy_type, premium_amount, coverage_details FROM policy WHERE policy_id = ?`,
            [template_policy_id]
        );
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: `Template policy ${template_policy_id} not found.` });
        }
        const tpl = rows[0];
        const newPolicyId = 'POL_BUY_' + Date.now();

        // Use calculated premium from frontend if provided, otherwise use template premium
        const finalPremium = premium_amount || tpl.premium_amount;
        const finalCoverageDetails = coverage_details || tpl.coverage_details || null;

        // Create a fresh policy for this purchase
        await connection.execute(
            `INSERT INTO policy (policy_id, policy_date, start_date, end_date, premium_amount, coverage_details, status, policy_type)
             VALUES (?, CURDATE(), NULL, NULL, ?, ?, 'INACTIVE_AWAITING_PAYMENT', ?)`,
            [newPolicyId, finalPremium, finalCoverageDetails, tpl.policy_type]
        );

        // Link to customer
        await connection.execute(
            `INSERT INTO customer_policy (customer_id, policy_id) VALUES (?, ?)`,
            [customer_id, newPolicyId]
        );

        await connection.commit();

        // Audit log purchase intent
        logAuditEvent(customer_id, 'CUSTOMER', 'POLICY_PURCHASED', newPolicyId, { template_policy_id });

        // Send notification to customer
        await notificationHelper.sendPolicyPurchaseNotification(customer_id, newPolicyId, tpl.policy_type);

        res.status(201).json({ message: 'Policy created, pending initial payment.', policy_id: newPolicyId, status: 'INACTIVE_AWAITING_PAYMENT' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error buying policy:', error);
        res.status(500).json({ error: 'Internal server error buying policy.' });
    } finally {
        if (connection && typeof connection.end === 'function') {
            try { await connection.end(); } catch (_) {}
        }
    }
});


// --- [NEW] Mock Policy Activation Endpoint ---
app.post('/api/policies/:policyId/mock-activate', checkAuth, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const customer_id = req.user.customer_id; // Get customer ID from authenticated user

    if (req.user.isAdmin) return res.status(403).json({ error: 'Admins cannot activate customer policies.' });

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Verify policy exists, belongs to the customer, and needs payment
        const [policyRows] = await connection.execute(
            `SELECT p.policy_id, p.premium_amount, p.status
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE p.policy_id = ? AND cp.customer_id = ? FOR UPDATE`, // Lock row
            [policyId, customer_id]
        );

        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found or does not belong to this customer.' });
        }

        const policy = policyRows[0];
        const amountToPay = policy.premium_amount;

        if (policy.status !== 'INACTIVE_AWAITING_PAYMENT') {
            await connection.rollback();
            return res.status(400).json({ error: `Policy status is "${policy.status}", activation not required or already active.` });
        }
        
        // 2. Create a 'SUCCESS' record in initial_payment table immediately
        const payment_id = 'MOCKPAY_' + Date.now();
        const transaction_id = 'MOCK_TXN_' + Date.now();
        
        await connection.execute(
            `INSERT INTO initial_payment (payment_id, policy_id, customer_id, amount, payment_gateway, transaction_id, payment_status)
             VALUES (?, ?, ?, ?, 'MOCK_PAYMENT', ?, 'SUCCESS')`,
            [payment_id, policyId, customer_id, amountToPay, transaction_id]
        );

        // 3. Update the policy status to UNDERWRITER_REVIEW (enters approval workflow)
        await connection.execute(
            `UPDATE policy SET status = 'UNDERWRITER_REVIEW'
             WHERE policy_id = ? AND status = 'INACTIVE_AWAITING_PAYMENT'`,
            [policyId]
        );

        // 4. Auto-evaluate the policy with underwriter rules
        const finalStatus = await autoEvaluatePolicy(policyId, connection);

        await connection.commit();

        // 5. Send success response
        res.json({
            message: finalStatus === 'PENDING_INITIAL_APPROVAL' 
                ? 'Payment successful! Policy approved by underwriter rules and awaiting admin approval.' 
                : finalStatus === 'DENIED_UNDERWRITER'
                ? 'Payment received but policy was denied by underwriter rules.'
                : 'Payment successful! Policy is under manual review.',
            paymentId: payment_id,
            transaction_id: transaction_id,
            status: finalStatus
         });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error in mock activation for policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during mock activation.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// =====================================================================
// IWAS-F-025: Initial Premium Payment & Instant Activation
// Provides a realistic (still mocked) initial payment endpoint separate
// from the older mock-activate route. This enforces status checks and
// writes an initial_payment record, then activates the policy.
// Endpoint: POST /api/policies/:policyId/initial-payment
// Request Body: { payment_gateway?: string }
// Response: { message, paymentId, transaction_id }
// =====================================================================
app.post('/api/policies/:policyId/initial-payment', checkAuth, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const customer_id = req.user.customer_id;
    // Safely read payment_gateway even if body missing or not parsed
    const payment_gateway = (req.body && req.body.payment_gateway) ? req.body.payment_gateway : 'MOCK_GATEWAY';

    if (req.user.isAdmin) return res.status(403).json({ error: 'Admins cannot pay customer policies.' });

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Lock policy row and verify ownership & status
        const [policyRows] = await connection.execute(
            `SELECT p.policy_id, p.premium_amount, p.status
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE p.policy_id = ? AND cp.customer_id = ? FOR UPDATE`,
            [policyId, customer_id]
        );

        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found or does not belong to this customer.' });
        }
        const policy = policyRows[0];
        if (policy.status !== 'INACTIVE_AWAITING_PAYMENT') {
            await connection.rollback();
            return res.status(400).json({ error: `Policy status is "${policy.status}"; initial payment not required.` });
        }

        const payment_id = 'PAY_' + Date.now();
        const transaction_id = 'TXN_' + Date.now();

        await connection.execute(
            `INSERT INTO initial_payment (payment_id, policy_id, customer_id, amount, payment_gateway, transaction_id, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')`,
            [payment_id, policyId, customer_id, policy.premium_amount, payment_gateway, transaction_id]
        );

        await connection.execute(
            `UPDATE policy SET status = 'UNDERWRITER_REVIEW' WHERE policy_id = ? AND status = 'INACTIVE_AWAITING_PAYMENT'`,
            [policyId]
        );

        // Auto-evaluate the policy with underwriter rules
        const finalStatus = await autoEvaluatePolicy(policyId, connection);

        await connection.commit();

        // Send payment notification to customer
        await notificationHelper.sendPaymentNotification(customer_id, policy.premium_amount, policyId);

        // Audit log
        logAuditEvent(customer_id, 'CUSTOMER', 'INITIAL_PREMIUM_PAYMENT', policyId, { payment_id, transaction_id, finalStatus });

        res.json({ 
            message: finalStatus === 'PENDING_INITIAL_APPROVAL' 
                ? 'Payment successful! Policy approved by underwriter and awaiting admin approval.' 
                : finalStatus === 'DENIED_UNDERWRITER'
                ? 'Payment received but policy was denied by underwriter rules.'
                : 'Payment successful! Policy is under manual review.',
            paymentId: payment_id, 
            transaction_id, 
            status: finalStatus 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error processing initial payment for policy ${policyId}:`, error && error.stack ? error.stack : error);
        res.status(500).json({ error: 'Internal server error during initial payment.' });
    } finally {
        // Safer close for mocked connections in tests (avoid accessing internal driver props)
        if (connection && typeof connection.end === 'function') {
            try { await connection.end(); } catch (e) { console.error('Failed to close connection (initial-payment):', e); }
        }
    }
});


// --- 8. Secure Admin API Endpoints ---
// ... (Your existing Admin endpoints - no changes) ...
// Get All PENDING Claims (Admin Only)
app.get('/api/admin/pending-claims', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Join with customer table to get customer name
        const [rows] = await connection.execute(
            `SELECT c.claim_id, c.customer_id, cu.name as customer_name, c.description, c.claim_date, c.amount
             FROM claim c
             JOIN customer cu ON c.customer_id = cu.customer_id
             WHERE c.claim_status = 'PENDING'
             ORDER BY c.claim_date ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending claims:', error);
        res.status(500).json({ error: 'Internal server error fetching pending claims.' });
    } finally {
        if (connection) await connection.end();
    }
});

// ================= Claim: Mock pay then file =================
// Combines a mock payment step with filing a claim for convenience from UI
app.post('/api/my-claims/:policyId/mock-pay-then-file', checkAuth, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;
        const { description, amount } = req.body || {};
        if (!description || amount == null) {
            return res.status(400).json({ error: 'Description and amount are required.' });
        }
        const claimAmount = parseFloat(amount);
        if (isNaN(claimAmount) || claimAmount <= 0) {
            return res.status(400).json({ error: 'Invalid claim amount.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Verify policy belongs to customer and is ACTIVE
        const [polRows] = await connection.execute(
            `SELECT p.status FROM policy p JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE p.policy_id = ? AND cp.customer_id = ? FOR UPDATE`,
            [policyId, customer_id]
        );
        if (polRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found for this customer.' });
        }
        if (polRows[0].status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(400).json({ error: `Policy is ${polRows[0].status}. Only ACTIVE policies can file claims.` });
        }

        // Mock payment step: just audit log
        logAuditEvent(customer_id, 'CUSTOMER', 'CLAIM_MOCK_PAYMENT', policyId, { amount: claimAmount });

        const claim_id = 'CLM_' + Date.now();
        const workflow_id_to_assign = 'CLAIM_APPROVAL_V1';

        // Insert claim with workflow details
        await connection.execute(
            `INSERT INTO claim (claim_id, policy_id, customer_id, description, claim_date, claim_status, amount, status_log, workflow_id, current_step_order)
             VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', ?, ?, ?, 1)`
            , [claim_id, policyId, customer_id, description, claimAmount, 'Claim submitted after mock payment.', workflow_id_to_assign]
        );

        await connection.commit();
        await connection.end();

        res.status(201).json({ message: 'Claim filed successfully after mock payment!', claim_id });

        // Trigger workflow
        setImmediate(() => executeWorkflowStep(claim_id));
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error in mock pay then file claim:', error);
        res.status(500).json({ error: 'Internal server error filing claim.' });
    } finally {
        if (connection && connection.connection && connection.connection._closing === false) {
            await connection.end();
        }
    }
});

// Update a Claim Status (Admin Only - Triggers Workflow)
app.patch('/api/admin/claims/:claimId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const claimId = req.params.claimId; // Define claimId in outer scope
    let nextStepOrder = null; // Define nextStepOrder in outer scope
    const { newStatus } = req.body; // Get newStatus early
    const adminId = req.user.admin_id; // Get adminId from JWT

    try {
        if (newStatus !== 'APPROVED' && newStatus !== 'DECLINED') {
            return res.status(400).json({ error: 'Invalid status provided. Must be APPROVED or DECLINED.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get current step order and workflow ID with customer info (Lock row)
        const [claimRows] = await connection.execute(
            'SELECT current_step_order, workflow_id, claim_status, customer_id, amount FROM claim WHERE claim_id = ? AND claim_status = \'PENDING\' FOR UPDATE', 
            [claimId]
        );
        
        if (claimRows.length === 0) {
             await connection.rollback();
             return res.status(404).json({ error: 'Claim not found or was not in PENDING status.' }); // More specific error
        }
        
        const oldStatus = claimRows[0].claim_status; // Should be 'PENDING'
        const currentStepBeforeUpdate = claimRows[0].current_step_order;
        const workflowId = claimRows[0].workflow_id;
        const customer_id = claimRows[0].customer_id;
        const claimAmount = claimRows[0].amount;

        // 2. Find the *next* defined step in the workflow to jump to
        if (workflowId && currentStepBeforeUpdate != null) {
            const [nextStepRows] = await connection.execute(
                 'SELECT MIN(step_order) as next_order FROM workflow_steps WHERE workflow_id = ? AND step_order > ?',
                 [workflowId, currentStepBeforeUpdate]
            );
            if (nextStepRows.length > 0 && nextStepRows[0].next_order != null) {
                nextStepOrder = nextStepRows[0].next_order;
            } else {
                 console.log(`[WF Update] No steps found after step ${currentStepBeforeUpdate} for workflow ${workflowId}. Marking complete.`);
                 // nextStepOrder remains null
            }
        } else {
             console.log(`[WF Update] Claim ${claimId} has no workflow or is already complete. Setting next step to NULL.`);
             // nextStepOrder remains null
        }

        // 3. Update the claim status, log, and step order
        const logMessage = `\nClaim ${newStatus.toLowerCase()} by admin ${adminId}.`;
        const [result] = await connection.execute(
            `UPDATE claim SET claim_status = ?, status_log = CONCAT(IFNULL(status_log, ''), ?), current_step_order = ?
             WHERE claim_id = ? AND claim_status = 'PENDING'`,
            [newStatus, logMessage, nextStepOrder, claimId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(409).json({ error: 'Claim status might have changed, or claim not found.' });
        }

        await connection.commit(); // Commit the transaction
        await connection.end(); // Close connection BEFORE logging and triggering workflow

        // Send notification to customer based on status
        if (customer_id) {
            if (newStatus === 'APPROVED') {
                await notificationHelper.sendClaimApprovedNotification(customer_id, claimId, claimAmount);
            } else if (newStatus === 'DECLINED') {
                await notificationHelper.sendClaimDeclinedNotification(customer_id, claimId, 'Claim did not meet approval criteria');
            }
        }

        // --- [NEW] AUDIT LOGGING ---
        // Log this sensitive action AFTER the transaction is committed
        logAuditEvent(adminId, 'ADMIN', `CLAIM_STATUS_UPDATE_${newStatus}`, claimId, { oldStatus: oldStatus, newStatus: newStatus });

        res.json({ message: `Claim ${claimId} status updated to ${newStatus}.` });

        // --- Trigger Next Workflow Step (if any) ---
        if (nextStepOrder !== null) {
             setImmediate(() => executeWorkflowStep(claimId));
        } else {
             console.log(`[WF Update] Workflow for claim ${claimId} considered complete after manual action.`);
        }

    } catch (error) {
        console.error('Error updating claim status:', error);
        if (connection) await connection.rollback(); // Rollback on any error
        res.status(500).json({ error: 'Internal server error updating claim status.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// Get All PENDING Policies (Admin Only)
app.get('/api/admin/pending-policies', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Join with administrator table to get the name of the initial approver, if one exists
        const [rows] = await connection.execute(
            `SELECT 
                p.policy_id, 
                p.policy_type, 
                p.premium_amount,
                p.status, 
                p.initial_approver_id,
                a.name as initial_approver_name,
                p.initial_approval_date
             FROM policy p
             LEFT JOIN administrator a ON p.initial_approver_id = a.admin_id
             WHERE p.status = 'PENDING_INITIAL_APPROVAL' OR p.status = 'PENDING_FINAL_APPROVAL'
             ORDER BY p.policy_date ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending policies:', error);
        res.status(500).json({ error: 'Internal server error fetching pending policies.' });
    } finally {
        if (connection) await connection.end();
    }
});


app.patch('/api/admin/policies/:policyId/approve', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const { admin_id: currentAdminId, role: currentAdminRole } = req.user; // Get details from JWT

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get the current policy state (and lock the row) with customer_id
        const [policyRows] = await connection.execute(
            `SELECT p.policy_id, p.status, p.initial_approver_id, cp.customer_id 
             FROM policy p 
             LEFT JOIN customer_policy cp ON p.policy_id = cp.policy_id 
             WHERE p.policy_id = ? FOR UPDATE`,
            [policyId]
        );

        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found.' });
        }
        
        const policy = policyRows[0];
        let logMessage = "";
        let newStatus = "";

        // 2. State Machine Logic
        if (policy.status === 'PENDING_INITIAL_APPROVAL') {
            // --- Action: Initial Approval ---
            newStatus = 'PENDING_FINAL_APPROVAL';
            await connection.execute(
                `UPDATE policy SET 
                    status = ?, 
                    initial_approver_id = ?, 
                    initial_approval_date = NOW()
                 WHERE policy_id = ?`,
                [newStatus, currentAdminId, policyId]
            );
            logMessage = `Policy ${policyId} moved to PENDING_FINAL_APPROVAL by ${currentAdminId}.`;
            // Audit log initial approval attempt
            logAuditEvent(currentAdminId, 'ADMIN', 'POLICY_INITIAL_APPROVAL', policyId, { newStatus });

        } else if (policy.status === 'PENDING_FINAL_APPROVAL') {
            // --- Action: Final Approval (with checks) ---
            
            // Check 1: Role check
            if (currentAdminRole !== 'Security Officer' && currentAdminRole !== 'Requires Security Officer') {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Final approval requires "Security Officer" role.' });
            }

            // Check 2: Four-Eyes check (different user)
            if (policy.initial_approver_id === currentAdminId) {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Four-eyes principle violation. Final approver must be different from the initial approver.' });
            }

            // All checks passed
            newStatus = 'ACTIVE';
            await connection.execute(
                `UPDATE policy SET 
                    status = ?, 
                    final_approver_id = ?, 
                    final_approval_date = NOW()
                 WHERE policy_id = ?`,
                [newStatus, currentAdminId, policyId]
            );
            logMessage = `Policy ${policyId} has been fully APPROVED and is now ACTIVE by ${currentAdminId}.`;
            logAuditEvent(currentAdminId, 'ADMIN', 'POLICY_FINAL_APPROVAL', policyId, { newStatus });

            // Send approval notification to customer
            if (policy.customer_id) {
                await notificationHelper.sendPolicyApprovalNotification(policy.customer_id, policyId);
            }

        } else {
            // --- Action: No action needed ---
            await connection.rollback();
            return res.status(400).json({ error: `Policy is in status "${policy.status}" and cannot be approved.` });
        }

        // 3. Commit and respond
        await connection.commit();
        // Policy approval completed silently
        res.json({ message: 'Policy approval status updated successfully!', newState: newStatus });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error approving policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during policy approval.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// =====================================================================
// AUTOMATIC Underwriter Rule Evaluation Function
// Called internally after payment to auto-evaluate policies
// Returns the new status after evaluation
// =====================================================================
async function autoEvaluatePolicy(policyId, connection) {
    const rules = [
        { id: 'R_PREMIUM_LOW_AUTO_APPROVE', field: 'premium_amount', operator: '<=', value: 50000, approve: true },
        { id: 'R_PREMIUM_TOO_HIGH_DENY', field: 'premium_amount', operator: '>', value: 1000000, approve: false }
        // Risk score rule removed - column doesn't exist in policy table
    ];

    const [policyRows] = await connection.execute(
        'SELECT policy_id, premium_amount, status FROM policy WHERE policy_id = ?',
        [policyId]
    );
    
    if (policyRows.length === 0) {
        throw new Error('Policy not found for evaluation');
    }
    
    const policy = policyRows[0];
    if (policy.status !== 'UNDERWRITER_REVIEW') {
        return policy.status; // Already processed
    }

    let decision = null;
    let matchedRule = null;
    
    for (const rule of rules) {
        const fieldValue = policy[rule.field];
        if (fieldValue == null) continue;
        
        let conditionMet = false;
        switch (rule.operator) {
            case '<=': conditionMet = fieldValue <= rule.value; break;
            case '>': conditionMet = fieldValue > rule.value; break;
            case '>=': conditionMet = fieldValue >= rule.value; break;
            case '<': conditionMet = fieldValue < rule.value; break;
            case '==': conditionMet = fieldValue == rule.value; break;
            default: break;
        }
        
        if (conditionMet) {
            matchedRule = rule;
            decision = rule.approve ? 'APPROVE' : 'DENY';
            break;
        }
    }

    // Default decision if no rule matched
    if (!decision) {
        decision = 'MANUAL_REVIEW';
    }

    let newStatus;
    if (decision === 'APPROVE') {
        newStatus = 'PENDING_INITIAL_APPROVAL';
    } else if (decision === 'DENY') {
        newStatus = 'DENIED_UNDERWRITER';
    } else {
        newStatus = 'UNDERWRITER_REVIEW'; // Stays for manual review
    }

    if (newStatus !== policy.status) {
        await connection.execute(
            'UPDATE policy SET status = ? WHERE policy_id = ?',
            [newStatus, policyId]
        );
    }

    console.log(`Auto-evaluated policy ${policyId}: ${decision} (${policy.status} → ${newStatus})`);
    return newStatus;
}

// =====================================================================
// IWAS-F-022: Underwriter Rule Evaluation for Policy Applications
// Endpoint: POST /api/underwriter/policies/:policyId/evaluate
// Applies pre-configured rules to a policy currently in UNDERWRITER_REVIEW.
// If approved by rules -> status changes to PENDING_INITIAL_APPROVAL.
// If denied -> status changes to DENIED_UNDERWRITER.
// Rules are static here; could be moved to DB later.
// Requires admin JWT with role 'Underwriter'.
// =====================================================================
app.post('/api/underwriter/policies/:policyId/evaluate', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const { admin_id, role } = req.user;

    if (role !== 'Underwriter') {
        return res.status(403).json({ error: 'Forbidden: Underwriter role required.' });
    }

    // Static rule set (could be externalized)
    const rules = [
        { id: 'R_PREMIUM_LOW_AUTO_APPROVE', field: 'premium_amount', operator: '<=', value: 10000, approve: true },
        { id: 'R_PREMIUM_TOO_HIGH_DENY', field: 'premium_amount', operator: '>', value: 1000000, approve: false }
        // Risk score rule removed - column doesn't exist in policy table
    ];

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [policyRows] = await connection.execute(
            'SELECT policy_id, premium_amount, status FROM policy WHERE policy_id = ? FOR UPDATE',
            [policyId]
        );
        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found.' });
        }
        const policy = policyRows[0];
        if (policy.status !== 'UNDERWRITER_REVIEW') {
            await connection.rollback();
            return res.status(400).json({ error: `Policy is in status "${policy.status}"; cannot evaluate.` });
        }

        let decision = null;
        let matchedRule = null;
        for (const rule of rules) {
            const fieldValue = policy[rule.field];
            if (fieldValue == null) continue;
            let conditionMet = false;
            switch (rule.operator) {
                case '<=': conditionMet = fieldValue <= rule.value; break;
                case '>': conditionMet = fieldValue > rule.value; break;
                case '>=': conditionMet = fieldValue >= rule.value; break;
                case '<': conditionMet = fieldValue < rule.value; break;
                case '==': conditionMet = fieldValue == rule.value; break; // loose eq ok for numeric here
                default: break;
            }
            if (conditionMet) {
                matchedRule = rule;
                decision = rule.approve ? 'APPROVE' : 'DENY';
                break;
            }
        }

        // Default decision if no rule matched: manual review escalate
        if (!decision) {
            decision = 'MANUAL_REVIEW';
        }

        let newStatus;
        if (decision === 'APPROVE') {
            newStatus = 'PENDING_INITIAL_APPROVAL';
        } else if (decision === 'DENY') {
            newStatus = 'DENIED_UNDERWRITER';
        } else { // MANUAL_REVIEW
            newStatus = 'UNDERWRITER_REVIEW'; // keep same, but could escalate
        }

        if (newStatus !== policy.status) {
            await connection.execute(
                'UPDATE policy SET status = ? WHERE policy_id = ?',
                [newStatus, policyId]
            );
        }

        await connection.commit();
        logAuditEvent(admin_id, 'ADMIN', 'UNDERWRITER_RULE_EVAL', policyId, { decision, matchedRule });
        res.json({ policyId, previousStatus: policy.status, newStatus, decision, matchedRule });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error evaluating policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during underwriting evaluation.' });
    } finally {
        if (connection && typeof connection.end === 'function') {
            try { await connection.end(); } catch (e) { console.error('Failed to close connection (underwriter-eval):', e); }
        }
    }
});


// --- 9. Admin Endpoints for Workflow Management ---
// ... (Your existing Workflow endpoints - no changes) ...
// Get all workflows
app.get('/api/admin/workflows', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [workflows] = await connection.execute('SELECT workflow_id, name, description FROM workflows ORDER BY name');
        res.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Internal server error fetching workflows.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Get a single workflow (including its steps)
app.get('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        connection = await mysql.createConnection(dbConfig);
        const [workflowRows] = await connection.execute( 'SELECT * FROM workflows WHERE workflow_id = ?', [workflowId] );

        if (workflowRows.length === 0) {
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }
        const [stepsRows] = await connection.execute(
             'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [workflowId]
         );

        const workflowData = workflowRows[0];
        
        // Safely parse configuration JSON for each step
        workflowData.steps = stepsRows.map(step => {
             let config = {};
             try {
                  // ✅ FIX: Check if configuration is a string before parsing
                  config = (typeof step.configuration === 'string')
                               ? JSON.parse(step.configuration || '{}')
                               : (step.configuration || {}); // Use as-is if already an object
             } catch(e) {
                  console.error(`Invalid JSON configuration for step ${step.step_id}: ${step.configuration}`);
                  // Return empty object or specific error structure if needed
             }
             return { ...step, configuration: config };
        });
        res.json(workflowData);
    } catch (error) {
        console.error(`Error fetching workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error fetching workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT endpoint to save workflow definition
app.put('/api/admin/workflows/:workflowId/definition', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { workflowId } = req.params;
    const { definition } = req.body; 

    // --- DEBUG LOGGING 1 ---
    console.log(`[SAVE /api/admin/workflows/${workflowId}/definition] Received request.`);

    if (!definition || typeof definition !== 'object') {
        console.log('[SAVE] Request failed: Invalid definition format.');
        return res.status(400).json({ error: 'Invalid workflow definition format provided.' });
    }

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('[SAVE] Database connection created.');

        const sql = 'UPDATE workflows SET definition_json = ? WHERE workflow_id = ?';
        const params = [JSON.stringify(definition), workflowId];

        // --- DEBUG LOGGING 2 ---
        console.log(`[SAVE] Executing SQL: ${sql}`);
        console.log(`[SAVE] With Params: ${JSON.stringify(params)}`);

        const [result] = await connection.execute(sql, params);

        // --- DEBUG LOGGING 3 (THE MOST IMPORTANT ONE) ---
        console.log('[SAVE] SQL execute result:', JSON.stringify(result));

        if (result.affectedRows === 0) {
            console.log(`[SAVE] Save failed: Workflow ID ${workflowId} not found. (AffectedRows = 0)`);
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }
        
        console.log(`[SAVE] Save successful for ${workflowId}.`);
        res.json({ message: `Workflow definition for ${workflowId} updated successfully.` });

    } catch (error) {
        // --- DEBUG LOGGING 4 ---
        console.error(`[SAVE] CRITICAL ERROR for ${workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error saving workflow definition.' });
    } finally {
        if (connection) {
            await connection.end();
            console.log('[SAVE] Database connection closed.');
        }
    }
});

// GET endpoint to load workflow definition
app.get('/api/admin/workflows/:workflowId/definition', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { workflowId } = req.params;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT definition_json FROM workflows WHERE workflow_id = ?',
            [workflowId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }

        let definition = {}; 
        if (rows[0].definition_json) {
            try {
                definition = JSON.parse(rows[0].definition_json);
            } catch (parseError) {
                console.error(`Error parsing definition JSON for workflow ${workflowId}:`, parseError);
            }
        }
        res.json({ definition }); 

    } catch (error) {
        console.error(`Error loading workflow definition for ${workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error loading workflow definition.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Get steps for a specific workflow (redundant, consider removing later)
app.get('/api/admin/workflows/:workflowId/steps', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        connection = await mysql.createConnection(dbConfig);
        const [steps] = await connection.execute(
            'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [workflowId]
        );
         // Safely parse configuration
        const parsedSteps = steps.map(step => {
             let config = {};
             try {
                  // ✅ FIX: Check if configuration is a string before parsing
                  config = (typeof step.configuration === 'string')
                               ? JSON.parse(step.configuration || '{}')
                               : (step.configuration || {}); // Use as-is if already an object
             } catch(e) {
                 console.error(`Invalid JSON configuration for step ${step.step_id} (steps endpoint): ${step.configuration}`);
             }
            return { ...step, configuration: config };
        });
        res.json(parsedSteps);
    } catch (error) {
        console.error(`Error fetching steps for workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error fetching workflow steps.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Create a new workflow
app.post('/api/admin/workflows', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflow_id, name, description } = req.body;
        if (!workflow_id || !name) {
            return res.status(400).json({ error: 'Workflow ID and Name are required.' });
        }
        // Basic ID format validation (e.g., no spaces, uppercase)
         if (!/^[A-Z0-9_]+$/.test(workflow_id)) {
            return res.status(400).json({ error: 'Workflow ID can only contain uppercase letters, numbers, and underscores.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO workflows (workflow_id, name, description) VALUES (?, ?, ?)',
            [workflow_id, name, description || null]
        );
        res.status(201).json({ message: 'Workflow created successfully!', workflow_id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: `Workflow ID '${req.body.workflow_id}' already exists.` });
        }
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Internal server error creating workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Update workflow details (name/description)
app.put('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Workflow Name is required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'UPDATE workflows SET name = ?, description = ? WHERE workflow_id = ?',
            [name, description || null, workflowId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }
        res.json({ message: `Workflow ${workflowId} updated successfully.` });
    } catch (error) {
        console.error(`Error updating workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error updating workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});


// Add a step to a workflow
app.post('/api/admin/workflows/:workflowId/steps', checkAuth, checkAdmin, async (req, res) => {
     let connection;
     try {
        const workflowId = req.params.workflowId;
        const { step_order, step_name, task_type, configuration } = req.body;

        if (step_order == null || !step_name || !task_type) {
            return res.status(400).json({ error: 'Step order, name, and task type are required.'});
        }
        const orderNum = parseInt(step_order, 10);
        if (isNaN(orderNum) || orderNum <= 0) {
            return res.status(400).json({ error: 'Step order must be a positive integer.'});
        }

        const validTypes = ['MANUAL', 'API', 'RULE'];
        if (!validTypes.includes(task_type)) {
             return res.status(400).json({ error: 'Invalid task type. Must be MANUAL, API, or RULE.' });
        }
        // Ensure configuration is an object if provided
        if (configuration != null && typeof configuration !== 'object') {
             return res.status(400).json({ error: 'Configuration must be a valid JSON object or null.' });
        }

        const step_id = `STEP_${workflowId}_${Date.now()}`; // Use timestamp for unique ID

        connection = await mysql.createConnection(dbConfig);
        // Stringify configuration before inserting into JSON column
        await connection.execute(
            `INSERT INTO workflow_steps (step_id, workflow_id, step_order, step_name, task_type, configuration)
             VALUES (?, ?, ?, ?, ?, ?)`,
             [step_id, workflowId, orderNum, step_name, task_type, configuration ? JSON.stringify(configuration) : null]
        );
         res.status(201).json({ message: 'Workflow step added successfully!', step_id });
     } catch (error) {
          // Specific error handling for duplicate step order or invalid workflow ID
          if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('workflow_id_step_order')) {
               return res.status(409).json({ error: `Step order ${req.body.step_order} already exists for workflow ${req.params.workflowId}.` });
          }
           if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('workflow_steps_ibfk_1')) {
               return res.status(404).json({ error: `Workflow ID ${req.params.workflowId} not found.` });
          }
         console.error(`Error adding step to workflow ${req.params.workflowId}:`, error);
         res.status(500).json({ error: 'Internal server error adding workflow step.' });
     } finally {
          if (connection) await connection.end();
     }
});

// Update a specific workflow step
app.put('/api/admin/workflows/:workflowId/steps/:stepId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflowId, stepId } = req.params;
        const { step_order, step_name, task_type, configuration } = req.body;

        // --- Validation ---
        if (step_order == null || !step_name || !task_type) {
            return res.status(400).json({ error: 'Step order, name, and task type are required.'});
        }
        const orderNum = parseInt(step_order, 10);
        if (isNaN(orderNum) || orderNum <= 0) {
            return res.status(400).json({ error: 'Step order must be a positive integer.'});
        }
        const validTypes = ['MANUAL', 'API', 'RULE'];
        if (!validTypes.includes(task_type)) {
             return res.status(400).json({ error: 'Invalid task type.' });
        }
        if (configuration != null && typeof configuration !== 'object') {
             return res.status(400).json({ error: 'Configuration must be a valid JSON object or null.' });
        }
        // --- End Validation ---

        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `UPDATE workflow_steps
             SET step_order = ?, step_name = ?, task_type = ?, configuration = ?
             WHERE step_id = ? AND workflow_id = ?`,
             [
                 orderNum, step_name, task_type,
                 configuration ? JSON.stringify(configuration) : null,
                 stepId, workflowId
             ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Step ID ${stepId} not found in workflow ${workflowId}.` });
        }

        res.json({ message: `Workflow step ${stepId} updated successfully.` });

    } catch (error) {
         // Handle potential duplicate step order on update
         if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('workflow_id_step_order')) {
             return res.status(409).json({ error: `Step order ${req.body.step_order} already exists for workflow ${req.params.workflowId}.` });
         }
        console.error(`Error updating step ${req.params.stepId}:`, error);
        res.status(500).json({ error: 'Internal server error updating workflow step.' });
    } finally {
         if (connection) await connection.end();
    }
});

// Delete a specific workflow step
app.delete('/api/admin/workflows/:workflowId/steps/:stepId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflowId, stepId } = req.params;

        connection = await mysql.createConnection(dbConfig);
        // Optional: Add logic here to update step_order of subsequent steps if necessary
        const [result] = await connection.execute(
            'DELETE FROM workflow_steps WHERE step_id = ? AND workflow_id = ?',
            [stepId, workflowId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Step ID ${stepId} not found in workflow ${workflowId}.` });
        }

        res.json({ message: `Workflow step ${stepId} deleted successfully.` });

    } catch (error) {
        // Handle potential foreign key issues if other tables reference steps
        console.error(`Error deleting step ${req.params.stepId}:`, error);
        res.status(500).json({ error: 'Internal server error deleting workflow step.' });
    } finally {
         if (connection) await connection.end();
    }
});

// Delete an entire workflow (handle steps first)
app.delete('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Delete associated steps first
        await connection.execute('DELETE FROM workflow_steps WHERE workflow_id = ?', [workflowId]);

        // 2. Delete the workflow itself
        const [result] = await connection.execute('DELETE FROM workflows WHERE workflow_id = ?', [workflowId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Workflow didn't exist
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }

        await connection.commit(); // Commit both deletes
        res.json({ message: `Workflow ${workflowId} and its steps deleted successfully.` });

    } catch (error) {
         if (connection) await connection.rollback();
        // Handle potential foreign key issues if other tables reference workflows (e.g., claim table)
         if (error.code === 'ER_ROW_IS_REFERENCED_2' && error.sqlMessage.includes('fk_claim_workflow')) {
              return res.status(400).json({ error: `Cannot delete workflow ${req.params.workflowId} as it is currently assigned to one or more claims.` });
         }
        console.error(`Error deleting workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error deleting workflow.' });
    } finally {
         if (connection && connection.connection._closing === false) await connection.end();
    }
});


// (Your existing middlewares, workflow engine, and all routes remain the same)
// Everything up to the last admin workflow route stays unchanged.
// Just scroll to the end to find the new Epic 2 sections below 👇

// ================================================================
// =============== EPIC 2 FEATURE EXTENSIONS ======================
// ================================================================

// --- IWAS-F-012: Claims Adjuster Dashboard ---
app.get('/api/adjuster/dashboard/:adminId', async (req, res) => {
  let connection;
  try {
    const { adminId } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT claim_id, customer_id, description, claim_status, amount, claim_date
       FROM claim
       WHERE admin_id = ?
       ORDER BY claim_date DESC`,
      [adminId]
    );

    res.json({ admin_id: adminId, assigned_claims: rows });
  } catch (error) {
    console.error('Error fetching adjuster dashboard:', error);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get all adjusters/admins for assignment
app.get('/api/adjusters/list', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT admin_id, name, role FROM administrator ORDER BY name`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching adjusters:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Get all claims (for claim assignment)
app.get('/api/claims', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT claim_id, customer_id, description, claim_status as status, amount, claim_date, admin_id 
       FROM claim 
       ORDER BY claim_date DESC`
    );
    res.json({ claims: rows });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Assign claim to adjuster
app.post('/api/claims/:claimId/assign', async (req, res) => {
  let connection;
  try {
    const { claimId } = req.params;
    const { adminId } = req.body;
    
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE claim SET admin_id = ? WHERE claim_id = ?`,
      [adminId, claimId]
    );
    
    res.json({ message: 'Claim assigned successfully', claim_id: claimId, admin_id: adminId });
  } catch (error) {
    console.error('Error assigning claim:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-013: Intelligent Document Processing (Mock) ---
const upload = multer({ dest: 'uploads/' });

app.post('/api/documents/process', upload.single('document'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf8');

    // Enhanced pattern extraction to find both policy ID and claim information
    // Updated regex to match IDs with underscores and hyphens
    const policyIdMatch = content.match(/Policy\s*(?:ID|Number)?:\s*([\w_-]+)/i);
    const claimIdMatch = content.match(/Claim\s*(?:ID|Number)?:\s*([\w_-]+)/i);
    const amountMatch = content.match(/Amount:\s*[₹$]?\s*([\d,]+(?:\.\d{2})?)/i);
    const descriptionMatch = content.match(/(?:Description|Reason|Details):\s*(.+)/i);

    const extracted = {
      policy_id: policyIdMatch ? policyIdMatch[1] : null,
      claim_id: claimIdMatch ? claimIdMatch[1] : null,
      amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null,
      description: descriptionMatch ? descriptionMatch[1].trim() : null,
      confidence: 0.9
    };

    fs.unlinkSync(filePath); // clean up
    res.json({ message: 'Document processed successfully', extracted });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Document processing failed' });
  }
});

// --- IWAS-F-014: High-Risk Claim Alerts ---
app.get('/api/alerts/highrisk', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Filter for high-value claims (>₹80L) or high risk scores (>5)
    const [rows] = await connection.execute(
      `SELECT claim_id, customer_id, amount, claim_status, risk_score
       FROM claim
       WHERE amount > 8000000 OR risk_score > 5
       ORDER BY amount DESC, risk_score DESC`
    );

    res.json({ high_risk_claims: rows });
  } catch (error) {
    console.error('Error fetching high-risk claims:', error);
    res.status(500).json({ error: 'Internal server error fetching high-risk claims.' });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-030: Workflow Metrics Dashboard ---
app.get('/api/metrics/workflows', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(`
      SELECT w.workflow_id, w.name AS workflow_name,
             COUNT(c.claim_id) AS total_claims,
             AVG(TIMESTAMPDIFF(HOUR, c.claim_date, NOW())) AS avg_processing_time_hrs
      FROM workflows w
      LEFT JOIN claim c ON w.workflow_id = c.workflow_id
      GROUP BY w.workflow_id, w.name
      ORDER BY total_claims DESC
    `);

    res.json({ metrics: rows });
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    res.status(500).json({ error: 'Internal server error fetching metrics.' });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-031: SLA Overdue Task Report ---
app.get('/api/reports/overdue-tasks', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(`
      SELECT ws.step_id, ws.workflow_id, ws.step_name, ws.assigned_role,
             ws.due_date, NOW() AS current_time_value,
             TIMESTAMPDIFF(HOUR, ws.due_date, NOW()) AS hours_overdue,
             c.claim_id, c.claim_status, c.current_step_order
      FROM workflow_steps ws
      LEFT JOIN claim c ON ws.workflow_id = c.workflow_id 
        AND c.current_step_order = ws.step_order
      WHERE ws.due_date IS NOT NULL
        AND NOW() > ws.due_date
        AND (c.claim_status IS NULL OR c.claim_status IN ('PENDING', 'UNDER_REVIEW'))
      ORDER BY hours_overdue DESC
    `);

    res.json({ overdue_tasks: rows });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Internal server error fetching overdue tasks.' });
  } finally {
    if (connection) await connection.end();
  }
});


// --- 10. Start the Server ---

// Use process.env.PORT directly to fix the "PORT is not defined" ReferenceError in tests
const PORT_FOR_LISTEN = process.env.PORT || 3001;

// Only start the console.log listener if not in a test environment
let serverInstance;
if (process.env.NODE_ENV !== 'test') {
  serverInstance = server.listen(PORT_FOR_LISTEN, () => {
    console.log(`Server running on port ${PORT_FOR_LISTEN}`);
    console.log('Socket.io server ready for real-time notifications');
  });
} else {
  // In test, just export the app for supertest to listen on a random port
  serverInstance = app;
}

// Export app, server, AND the cron task (to fix the open handle)
// Temporarily disabled task export since cron job is commented out
module.exports = { app, server: serverInstance, io }; // task temporarily removed
