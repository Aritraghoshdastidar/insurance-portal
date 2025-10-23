// --- 1. Import Required Tools ---
const express = require('express');
const mysql = require('mysql2/promise'); // Using the 'promise' version for modern async/await
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard for bcrypt
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_12345'; // Change this to a random, secure string


// --- 2. Setup the Express App ---
const app = express();
const port = 3001; // We'll run the backend on port 3001
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Allow the server to read JSON from requests


// --- 3. Database Connection Configuration ---
const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',     // Dedicated app user
    password: 'app_password_123', // App user's password
    database: 'insurance_db_dev' // Development database
};


// --- 4. Middleware ---

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
async function executeWorkflowStep(claimId) {
    let connection;
    console.log(`[WF Engine] Processing claim: ${claimId}`); // Added prefix for clarity
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
            console.log(`[WF Engine] Claim ${claimId} workflow already complete or not assigned.`);
            await connection.rollback(); // No changes needed
            return; // Workflow complete or not assigned
        }

        // 2. Get the definition for the current step
        const [stepRows] = await connection.execute(
            'SELECT * FROM workflow_steps WHERE workflow_id = ? AND step_order = ?',
            [currentWorkflowId, currentStepOrder]
        );

        if (stepRows.length === 0) {
            console.log(`[WF Engine] Workflow ${currentWorkflowId} completed for claim ${claimId}. No step found at order ${currentStepOrder}.`);
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


        console.log(`[WF Engine] Current Step (${currentStep.step_order} - ${currentStep.step_name}): ${currentStep.task_type}`);

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
             console.log(`[WF Engine] No steps found after step ${currentStepOrder} for workflow ${currentWorkflowId}.`);
        }


        switch (currentStep.task_type) {
            case 'RULE':
                console.log(`[WF Engine] Executing RULE: ${stepConfig.ruleName || 'Unnamed'}`);
                // --- Rule Logic ---
                if (stepConfig.ruleName === 'assignByAmount') {
                    if (parseFloat(claim.amount) < stepConfig.threshold) {
                        if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in assignByAmount rule config.");
                        await connection.execute('UPDATE claim SET admin_id = ? WHERE claim_id = ?', [stepConfig.targetAdminId, claimId]);
                        console.log(`[WF Engine] Assigned claim ${claimId} to admin ${stepConfig.targetAdminId}`);
                    } else {
                        console.log(`[WF Engine] Claim ${claimId} amount (${claim.amount}) >= threshold (${stepConfig.threshold}). Skipping assignment.`);
                        // Optional: Assign to different admin/group if needed
                    }
                } else if (stepConfig.ruleName === 'autoApproveSimple') {
                    await connection.execute( `UPDATE claim SET claim_status = 'APPROVED', status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?`, ['\nClaim auto-approved by workflow rule.', claimId]);
                    console.log(`[WF Engine] Claim ${claimId} auto-approved by rule.`);
                } else if (stepConfig.ruleName === 'checkStatus') {
                    if (!stepConfig.expectedStatus) throw new Error("Missing expectedStatus in checkStatus rule config.");
                    console.log(`[WF Engine] Checking if claim status is ${stepConfig.expectedStatus}. Current: ${claim.claim_status}`);
                    if (claim.claim_status !== stepConfig.expectedStatus) {
                        console.log(`[WF Engine] Status check failed. Halting branch.`);
                        skipNextStepLogic = true; // Don't proceed further down this path
                        nextStepOrder = null; // Mark workflow as complete/halted for this branch
                    } else {
                        console.log(`[WF Engine] Status check passed.`);
                    }
                } else if (stepConfig.ruleName === 'reassignClaim') {
                     if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in reassignClaim rule config.");
                     await connection.execute("UPDATE claim SET admin_id = ?, status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?",
                         [stepConfig.targetAdminId, '\nClaim escalated and reassigned.', claimId]);
                     console.log(`[WF Engine] Escalated claim ${claimId} assignment to admin ${stepConfig.targetAdminId}`);
                }
                else {
                     console.warn(`[WF Engine] Unknown rule name: ${stepConfig.ruleName}`);
                     // Decide: should unknown rule halt or proceed? Let's proceed for now.
                }
                if (!skipNextStepLogic) stepCompleted = true; // Mark step as done unless branch halted
                break;

            case 'MANUAL':
                console.log(`[WF Engine] Waiting for MANUAL action. Assigned: ${claim.admin_id || stepConfig.assignedRole || 'Unspecified Role'}`);
                // The engine pauses here. Status should be PENDING.
                stepCompleted = false;
                break;

            case 'TIMER':
                const delaySeconds = stepConfig.durationSeconds || 60; // Default 1 min if not specified
                console.log(`[WF Engine] Starting TIMER: Wait for ${delaySeconds} seconds.`);
                // IMPORTANT: setTimeout is NOT persistent. Production needs a job queue.
                setTimeout(async () => {
                    console.log(`[WF Engine] TIMER completed for claim ${claimId} after ${delaySeconds}s.`);
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
                             console.log(`[WF Engine] Timer advanced claim ${claimId} to step ${nextStepOrder}. Triggering engine.`);
                             setImmediate(() => executeWorkflowStep(claimId)); // Trigger next step
                        } else {
                             console.log(`[WF Engine] Timer finished for claim ${claimId}, but it was already advanced or completed.`);
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
                console.log('[WF Engine] Executing API call (Placeholder):', stepConfig.task);
                // Placeholder for Notification/API calls
                if (stepConfig.task === 'sendNotification') {
                     if (!stepConfig.template) throw new Error("Missing template in sendNotification API config.");
                     console.log(`[WF Engine] Sending notification '${stepConfig.template}' for claim ${claimId}.`);
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
            console.log(`[WF Engine] Advancing workflow for claim ${claimId} from ${currentStepOrder} to step ${nextStepOrder}`);
            await connection.execute(
                'UPDATE claim SET current_step_order = ? WHERE claim_id = ?',
                [nextStepOrder, claimId] // Update to next step (could be null if last step)
            );
            await connection.commit(); // Commit transaction for this step
            // Recursively call for the next step only if there is one
            if (nextStepOrder !== null) {
                setImmediate(() => executeWorkflowStep(claimId));
            } else {
                console.log(`[WF Engine] Workflow for claim ${claimId} finished after step ${currentStepOrder}.`);
            }
        } else if (skipNextStepLogic && nextStepOrder === null) {
             console.log(`[WF Engine] Workflow branch halted for claim ${claimId}.`);
             await connection.commit(); // Commit the halt/completion
        } else if (skipNextStepLogic) {
             console.log(`[WF Engine] Step ${currentStepOrder} initiated async action (Timer). Main execution pauses for claim ${claimId}.`);
             await connection.commit(); // Commit the state before async action takes over
        } else {
            console.log(`[WF Engine] Workflow paused at step ${currentStepOrder} for claim ${claimId} (Manual/Error).`);
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
            return res.status(401).json({ error: 'Invalid email or password' }); // User not found
        }
        const user = rows[0];
        if (!user.password) {
             console.error(`User ${user.customer_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

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
            return res.status(401).json({ error: 'Invalid email or password' }); // Admin not found
        }
        const admin = rows[0];
        if (!admin.password) {
             console.error(`Admin ${admin.admin_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

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
app.get('/api/my-claims', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT claim_id, description, claim_date, claim_status, amount
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

        // Verify policy belongs to customer
        const [policyCheck] = await connection.execute(
             `SELECT 1 FROM customer_policy WHERE customer_id = ? AND policy_id = ?`,
             [customer_id, policy_id]
        );
        if (policyCheck.length === 0) {
             await connection.rollback();
             return res.status(403).json({ error: `Policy ${policy_id} does not belong to this customer.` });
        }

        // Insert claim WITH workflow details
        await connection.execute(
            `INSERT INTO claim (claim_id, policy_id, customer_id, description, claim_date, claim_status, amount, status_log, workflow_id, current_step_order)
             VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', ?, ?, ?, 1)`,
            [claim_id, policy_id, customer_id, description, claimAmount, 'Claim submitted by user.', workflow_id_to_assign]
        );

        await connection.commit(); // Commit transaction
        await connection.end(); // Close connection BEFORE triggering workflow

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


// --- 8. Secure Admin API Endpoints ---

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

// Update a Claim Status (Admin Only - Triggers Workflow)
app.patch('/api/admin/claims/:claimId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const claimId = req.params.claimId; // Define claimId in outer scope
    let nextStepOrder = null; // Define nextStepOrder in outer scope
    try {
        const { newStatus } = req.body;

        if (newStatus !== 'APPROVED' && newStatus !== 'DECLINED') {
            return res.status(400).json({ error: 'Invalid status provided. Must be APPROVED or DECLINED.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get current step order and workflow ID (Lock row)
        const [claimRows] = await connection.execute('SELECT current_step_order, workflow_id FROM claim WHERE claim_id = ? AND claim_status = \'PENDING\' FOR UPDATE', [claimId]);
        if (claimRows.length === 0) {
             await connection.rollback();
             return res.status(404).json({ error: 'Claim not found or was not in PENDING status.' }); // More specific error
        }
        const currentStepBeforeUpdate = claimRows[0].current_step_order;
        const workflowId = claimRows[0].workflow_id;

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
        const logMessage = `\nClaim ${newStatus.toLowerCase()} by admin ${req.user.admin_id}.`; // Assumes checkAuth added req.user
        const [result] = await connection.execute(
            `UPDATE claim SET claim_status = ?, status_log = CONCAT(IFNULL(status_log, ''), ?), current_step_order = ?
             WHERE claim_id = ? AND claim_status = 'PENDING'`, // Double-check it's still pending
            [newStatus, logMessage, nextStepOrder, claimId]
        );

        // Check if update happened (might have been processed by another request between SELECT FOR UPDATE and UPDATE)
        if (result.affectedRows === 0) {
            await connection.rollback();
            // It's possible the status changed between the SELECT FOR UPDATE and the UPDATE,
            // although less likely with FOR UPDATE. Send a conflict or not found status.
            return res.status(409).json({ error: 'Claim status might have changed, or claim not found.' });
        }

        await connection.commit(); // Commit the transaction
        await connection.end(); // Close connection BEFORE triggering workflow


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


// ==================================================================
// === [NEW] CODE FOR IWAS-F-004 (FOUR-EYES POLICY) STARTS HERE ===
// ==================================================================

// [NEW] Get All PENDING Policies (Admin Only)
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

// [NEW] Approve a Policy (Four-Eyes Principle Logic)
app.patch('/api/admin/policies/:policyId/approve', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const { admin_id: currentAdminId, role: currentAdminRole } = req.user; // Get details from JWT

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get the current policy state (and lock the row)
        const [policyRows] = await connection.execute(
            'SELECT policy_id, status, initial_approver_id FROM policy WHERE policy_id = ? FOR UPDATE',
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

        } else if (policy.status === 'PENDING_FINAL_APPROVAL') {
            // --- Action: Final Approval (with checks) ---
            
            // Check 1: Role check
            if (currentAdminRole !== 'Security Officer') {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Final approval requires "Security Officer" role.' });
            }

            // Check 2: Four-Eyes check (different user)
            if (policy.initial_approver_id === currentAdminId) {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Four-eyes principle violation. Final approver must be different from the initial approver.' });
            }

            // All checks passed
            newStatus = 'APPROVED';
            await connection.execute(
                `UPDATE policy SET 
                    status = ?, 
                    final_approver_id = ?, 
                    final_approval_date = NOW()
                 WHERE policy_id = ?`,
                [newStatus, currentAdminId, policyId]
            );
            logMessage = `Policy ${policyId} has been fully APPROVED by ${currentAdminId}.`;

        } else {
            // --- Action: No action needed ---
            await connection.rollback();
            return res.status(400).json({ error: `Policy is in status "${policy.status}" and cannot be approved.` });
        }

        // 3. Commit and respond
        await connection.commit();
        console.log(logMessage);
        res.json({ message: 'Policy approval status updated successfully!', newState: newStatus });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error approving policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during policy approval.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// ==================================================================
// === [NEW] CODE FOR IWAS-F-004 (FOUR-EYES POLICY) ENDS HERE ===
// ==================================================================


// --- 9. Admin Endpoints for Workflow Management ---

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
                  config = step.configuration ? JSON.parse(step.configuration) : {};
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
                  config = step.configuration ? JSON.parse(step.configuration) : {};
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


// --- 10. Start the Server ---
app.listen(port, () => {
    console.log(`✅ Backend API server running at http://localhost:${port}`);
});