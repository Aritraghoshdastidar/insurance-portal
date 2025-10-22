// --- 1. Import Required Tools ---
const express = require('express');
const mysql = require('mysql2/promise'); // Using the 'promise' version for modern async/await
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard for bcrypt
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_12345'; // Change this to a random string


// --- 2. Setup the Express App ---
const app = express();
const port = 3001; // We'll run the backend on port 3001
app.use(cors());
app.use(express.json());


// --- 3. Database Connection Configuration ---
const dbConfig = {
    host: 'localhost',
    user: 'insurance_app',
    password: 'app_password_123',
    database: 'insurance_db_dev'
};


// --- 5. Middleware for checking the "digital access card" (JWT) ---
const checkAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN_STRING"
        const decodedToken = jwt.verify(token, JWT_SECRET);
        req.user = decodedToken;
        next(); // User is valid, proceed to the endpoint
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed!' });
    }
};


// --- 4. The "Quote" API Endpoint ---
app.post('/api/quote', async (req, res) => {
    try {
        const { customer_id, policy_id } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT c.dob, p.premium_amount AS base_premium
             FROM customer c, policy p
             WHERE c.customer_id = ? AND p.policy_id = ?`,
            [customer_id, policy_id]
        );
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer or Policy not found' });
        }

        const { dob, base_premium } = rows[0];
        const basePremiumNum = parseFloat(base_premium);

        const birthDate = new Date(dob);
        const today = new Date('2025-10-21'); // Consider using current date dynamically
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        let finalPremium = basePremiumNum;
        let discount = 0;

        if (age > 40 && policy_id === 'POL1002') {
            discount = basePremiumNum * 0.08;
            finalPremium = basePremiumNum - discount;
        }

        res.json({
            customer_id,
            policy_id,
            age,
            base_premium: basePremiumNum,
            discount,
            final_premium: finalPremium
        });

    } catch (error) {
        console.error('Error generating quote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 7. User Registration Endpoint ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const customer_id = 'CUST_' + Date.now();

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO customer (customer_id, name, email, password) VALUES (?, ?, ?, ?)`,
            [customer_id, name, email, hashedPassword]
        );
        await connection.end();

        res.status(201).json({
            message: 'User registered successfully!',
            customer_id
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 8. User Login Endpoint ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT * FROM customer WHERE email = ?`,
            [email]
        );
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                customer_id: user.customer_id,
                name: user.name,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful!',
            token
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 9. Secure Endpoint to Get a User's Claims ---
app.get('/api/my-claims', checkAuth, async (req, res) => {
    try {
        const customer_id = req.user.customer_id;

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT claim_id, description, claim_date, claim_status, amount
             FROM claim
             WHERE customer_id = ?
             ORDER BY claim_date DESC`,
            [customer_id]
        );
        await connection.end();

        res.json(rows);

    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 10. Secure Endpoint to FILE a New Claim ---
app.post('/api/my-claims', checkAuth, async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const { policy_id, description, amount } = req.body;
        const claim_id = 'CLM_' + Date.now();

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO claim (claim_id, policy_id, customer_id, description, claim_date, claim_status, amount, status_log)
             VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', ?, ?)`,
            [claim_id, policy_id, customer_id, description, amount, 'Claim submitted by user.']
        );
        await connection.end();

        res.status(201).json({
            message: 'Claim filed successfully!',
            claim_id
        });

    } catch (error) {
        console.error('Error filing claim:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 11. Admin Login Endpoint ---
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT * FROM administrator WHERE email = ?`,
            [email]
        );
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const admin = rows[0];
        // Ensure admin.password is not null before comparing
        if (!admin.password) {
             console.error(`Admin ${admin.admin_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isPasswordMatch = await bcrypt.compare(password, admin.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create a JWT
        const token = jwt.sign(
            {
                admin_id: admin.admin_id,
                name: admin.name,
                role: admin.role,
                isAdmin: true // Add a flag to identify admins
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Admin login successful!',
            token
        });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 12. Admin Endpoint to Get PENDING Claims ---
app.get('/api/admin/pending-claims', checkAuth, async (req, res) => {
    try {
        // 1. Check if the logged-in user is actually an admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }

        // 2. Fetch pending claims from the database
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT claim_id, customer_id, description, claim_date, amount
             FROM claim
             WHERE claim_status = 'PENDING'
             ORDER BY claim_date ASC`
        );
        await connection.end();

        // 3. Send the list of pending claims back
        res.json(rows);

    } catch (error) {
        console.error('Error fetching pending claims:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); // <-- GET PENDING CLAIMS ENDS HERE


// --- 13. Admin Endpoint to UPDATE a Claim Status ---
// (Moved to its correct place after the GET endpoint)
app.patch('/api/admin/claims/:claimId', checkAuth, async (req, res) => {
    try {
        // 1. Check if the user is an admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }

        // 2. Get claim ID from URL and new status from request body
        const claimId = req.params.claimId;
        const { newStatus } = req.body; // Expecting 'APPROVED' or 'DECLINED'

        // 3. Validate the new status
        if (newStatus !== 'APPROVED' && newStatus !== 'DECLINED') {
            return res.status(400).json({ error: 'Invalid status provided.' });
        }

        // 4. Update the claim in the database
        const connection = await mysql.createConnection(dbConfig);
        const logMessage = `\nClaim ${newStatus.toLowerCase()} by admin ${req.user.admin_id}.`;

        const [result] = await connection.execute(
            `UPDATE claim
             SET claim_status = ?,
                 status_log = CONCAT(IFNULL(status_log, ''), ?)
             WHERE claim_id = ? AND claim_status = 'PENDING'`, // Only update if still pending
            [newStatus, logMessage, claimId]
        );
        await connection.end();

        // 5. Check if the update actually happened
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Claim not found or not pending.' });
        }

        // 6. Send success response
        res.json({ message: `Claim ${claimId} status updated to ${newStatus}.` });

    } catch (error) {
        console.error('Error updating claim status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- 14. Start the Server --- (Corrected comment number)
app.listen(port, () => {
    console.log(`✅ Backend API server running at http://localhost:${port}`);
});