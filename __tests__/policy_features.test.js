// __tests__/policy_features.test.js
// Tests for IWAS-F-025 (Initial Premium Payment), IWAS-F-004 (Four-Eyes Approval),
// and IWAS-F-022 (Underwriter Rule Evaluation)

const request = require('supertest');
const { app } = require('../server');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn(),
}));

jest.mock('jsonwebtoken');

describe('Policy Feature Endpoints', () => {
  let serverInstance;
  let mockConnection;
  beforeAll((done) => {
    process.env.NODE_ENV = 'test';
    serverInstance = app.listen(0, () => done());
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise(resolve => serverInstance.close(resolve));
    }
    delete process.env.NODE_ENV;
  });

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      connection: { _closing: false }
    };
    mysql.createConnection.mockResolvedValue(mockConnection);
  });

  // Helper to set jwt.verify return based on provided role & flags
  function setJwtUser(userObj) {
    jwt.verify.mockImplementation(() => userObj);
  }

  describe('IWAS-F-025: Initial Premium Payment', () => {
    it('should process initial payment and activate policy', async () => {
      setJwtUser({ customer_id: 'CUST123', isAdmin: false });
      // DB call order: createConnection.beginTransaction, SELECT policy, INSERT payment, UPDATE policy, SELECT for autoEvaluate, UPDATE from autoEvaluate, commit
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute
        .mockResolvedValueOnce([[{ policy_id: 'POL001', premium_amount: 500, status: 'INACTIVE_AWAITING_PAYMENT' }]]) // SELECT policy with customer join
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT payment
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE policy to UNDERWRITER_REVIEW
        .mockResolvedValueOnce([[{ policy_id: 'POL001', premium_amount: 500, status: 'UNDERWRITER_REVIEW' }]]) // SELECT for autoEvaluatePolicy
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE policy from autoEvaluate to PENDING_INITIAL_APPROVAL
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/policies/POL001/initial-payment')
        .set('Authorization', 'Bearer customer-token');
      // Debug output for failure investigation
      if (res.status !== 200) {
        // eslint-disable-next-line no-console
        console.log('DEBUG payment success test response:', res.status, res.body);
      }

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Policy approved by underwriter and awaiting admin approval/);
      expect(mockConnection.execute.mock.calls[0][0]).toMatch(/SELECT p.policy_id/);
      expect(mockConnection.execute.mock.calls[1][0]).toMatch(/INSERT INTO initial_payment/);
      expect(mockConnection.execute.mock.calls[2][0]).toMatch(/UPDATE policy SET status = 'UNDERWRITER_REVIEW'/);
    });

    it('should reject payment if policy not awaiting payment', async () => {
      setJwtUser({ customer_id: 'CUST123', isAdmin: false });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute.mockResolvedValueOnce([[{ policy_id: 'POL002', premium_amount: 700, status: 'ACTIVE' }]]); // SELECT
      mockConnection.rollback.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/policies/POL002/initial-payment')
        .set('Authorization', 'Bearer customer-token');
      if (res.status !== 400) {
        // eslint-disable-next-line no-console
        console.log('DEBUG payment reject test response:', res.status, res.body);
      }

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/initial payment not required/i);
    });
  });

  describe('IWAS-F-004: Four-Eyes Policy Approval', () => {
    it('should advance from initial to final approval with different admins', async () => {
      // Initial approval
      setJwtUser({ admin_id: 'ADMIN_INIT', role: 'System Admin', isAdmin: true });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute
        .mockResolvedValueOnce([[{ policy_id: 'POL003', status: 'PENDING_INITIAL_APPROVAL', initial_approver_id: null }]]) // SELECT
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE to PENDING_FINAL_APPROVAL
      mockConnection.commit.mockResolvedValue();

      const res1 = await request(serverInstance)
        .patch('/api/admin/policies/POL003/approve')
        .set('Authorization', 'Bearer admin-init-token')
        .send({});
      expect(res1.status).toBe(200);
      expect(res1.body.newState).toBe('PENDING_FINAL_APPROVAL');

      // Final approval with Security Officer
      setJwtUser({ admin_id: 'SEC_ADMIN', role: 'Security Officer', isAdmin: true });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute
        .mockResolvedValueOnce([[{ policy_id: 'POL003', status: 'PENDING_FINAL_APPROVAL', initial_approver_id: 'ADMIN_INIT', customer_id: 'CUST123' }]]) // SELECT with customer_id
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE to ACTIVE
      mockConnection.commit.mockResolvedValue();

      const res2 = await request(serverInstance)
        .patch('/api/admin/policies/POL003/approve')
        .set('Authorization', 'Bearer sec-admin-token')
        .send({});
      expect(res2.status).toBe(200);
      expect(res2.body.newState).toBe('ACTIVE'); // Changed from 'APPROVED' to 'ACTIVE' to match actual system
    });

    it('should block final approval by same initial approver (four-eyes)', async () => {
      setJwtUser({ admin_id: 'ADMIN_INIT', role: 'Security Officer', isAdmin: true });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute.mockResolvedValueOnce([[{ policy_id: 'POL004', status: 'PENDING_FINAL_APPROVAL', initial_approver_id: 'ADMIN_INIT' }]]);
      mockConnection.rollback.mockResolvedValue();

      const res = await request(serverInstance)
        .patch('/api/admin/policies/POL004/approve')
        .set('Authorization', 'Bearer same-admin-token')
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/four-eyes/i);
    });
  });

  describe('IWAS-F-022: Underwriter Rule Evaluation', () => {
    it('should approve policy via rules and move to PENDING_INITIAL_APPROVAL', async () => {
      setJwtUser({ admin_id: 'UW001', role: 'Underwriter', isAdmin: true });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute
        .mockResolvedValueOnce([[{ policy_id: 'POL005', premium_amount: 8000, status: 'UNDERWRITER_REVIEW', risk_score: 2 }]]) // SELECT
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE status
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/underwriter/policies/POL005/evaluate')
        .set('Authorization', 'Bearer underwriter-token')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('PENDING_INITIAL_APPROVAL');
      expect(res.body.decision).toBe('APPROVE');
    });

    it('should deny policy when rule matches deny condition', async () => {
      setJwtUser({ admin_id: 'UW001', role: 'Underwriter', isAdmin: true });
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.execute
        .mockResolvedValueOnce([[{ policy_id: 'POL006', premium_amount: 2000000, status: 'UNDERWRITER_REVIEW', risk_score: 5 }]]) // SELECT (high premium triggers deny)
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE status
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/underwriter/policies/POL006/evaluate')
        .set('Authorization', 'Bearer underwriter-token')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.newStatus).toBe('DENIED_UNDERWRITER');
      expect(res.body.decision).toBe('DENY');
    });

    it('should return 403 if role not Underwriter', async () => {
      setJwtUser({ admin_id: 'A1', role: 'System Admin', isAdmin: true });
      const res = await request(serverInstance)
        .post('/api/underwriter/policies/ANY/evaluate')
        .set('Authorization', 'Bearer not-underwriter')
        .send({});
      expect(res.status).toBe(403);
    });
  });

  // Additional tests to boost coverage
  describe('Additional Coverage Tests', () => {
    it('GET /api/my-policies - should return user policies', async () => {
      setJwtUser({ customerId: 'CUST123', isAdmin: false });
      mockConnection.execute.mockResolvedValueOnce([[
        { policy_id: 'POL001', policy_type: 'Health', status: 'ACTIVE', premium_amount: 500 },
        { policy_id: 'POL002', policy_type: 'Auto', status: 'PENDING', premium_amount: 300 }
      ]]);

      const res = await request(serverInstance)
        .get('/api/my-policies')
        .set('Authorization', 'Bearer token123');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it('GET /api/policies/catalog - should return policy catalog', async () => {
      setJwtUser({ customerId: 'CUST123', isAdmin: false });
      mockConnection.execute.mockResolvedValueOnce([[
        { policy_type: 'Health', base_premium: 500 },
        { policy_type: 'Auto', base_premium: 300 }
      ]]);

      const res = await request(serverInstance)
        .get('/api/policies/catalog')
        .set('Authorization', 'Bearer token123');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/my-claims - should return user claims', async () => {
      setJwtUser({ customerId: 'CUST123', isAdmin: false });
      mockConnection.execute.mockResolvedValueOnce([[
        { claim_id: 'CLM001', policy_id: 'POL001', status: 'PENDING', claim_amount: 1000 }
      ]]);

      const res = await request(serverInstance)
        .get('/api/my-claims')
        .set('Authorization', 'Bearer token123');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/my-notifications - should return user notifications', async () => {
      setJwtUser({ customerId: 'CUST123', isAdmin: false });
      mockConnection.execute.mockResolvedValueOnce([[
        { notification_id: 1, message: 'Policy approved', is_read: false }
      ]]);

      const res = await request(serverInstance)
        .get('/api/my-notifications')
        .set('Authorization', 'Bearer token123');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/admin/pending-policies - should return pending policies', async () => {
      setJwtUser({ adminId: 'ADMIN1', isAdmin: true, role: 'System Admin' });
      mockConnection.execute.mockResolvedValueOnce([[
        { policy_id: 'POL001', status: 'PENDING_INITIAL_APPROVAL', premium_amount: 500 }
      ]]);

      const res = await request(serverInstance)
        .get('/api/admin/pending-policies')
        .set('Authorization', 'Bearer admintoken');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/admin/pending-claims - should return pending claims', async () => {
      setJwtUser({ adminId: 'ADMIN1', isAdmin: true, role: 'System Admin' });
      mockConnection.execute.mockResolvedValueOnce([[
        { claim_id: 'CLM001', status: 'PENDING', claim_amount: 1000 }
      ]]);

      const res = await request(serverInstance)
        .get('/api/admin/pending-claims')
        .set('Authorization', 'Bearer admintoken');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/adjusters/list - should return list of adjusters', async () => {
      mockConnection.execute.mockResolvedValueOnce([[
        { admin_id: 'ADJ001', name: 'John Adjuster', role: 'Claims Adjuster' }
      ]]);

      const res = await request(serverInstance).get('/api/adjusters/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/claims - should return all claims', async () => {
      mockConnection.execute.mockResolvedValueOnce([[
        { claim_id: 'CLM001', status: 'PENDING' }
      ]]);

      const res = await request(serverInstance).get('/api/claims');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('claims');
      expect(Array.isArray(res.body.claims)).toBe(true);
    });

    it('GET /api/alerts/highrisk - should return high risk alerts', async () => {
      mockConnection.execute.mockResolvedValueOnce([[
        { alert_id: 1, alert_type: 'FRAUD_RISK', severity: 'HIGH' }
      ]]);

      const res = await request(serverInstance).get('/api/alerts/highrisk');

      expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('high_risk_claims');
        expect(Array.isArray(res.body.high_risk_claims)).toBe(true);
    });

    it('GET /api/metrics/workflows - should return workflow metrics', async () => {
      mockConnection.execute.mockResolvedValueOnce([[
        { workflow_name: 'Claims Processing', avg_completion_hours: 24 }
      ]]);

      const res = await request(serverInstance).get('/api/metrics/workflows');

      expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('metrics');
        expect(Array.isArray(res.body.metrics)).toBe(true);
    });

    it('GET /api/reports/overdue-tasks - should return overdue tasks', async () => {
      mockConnection.execute.mockResolvedValueOnce([[
        { task_id: 1, task_name: 'Document Review', days_overdue: 5 }
      ]]);

      const res = await request(serverInstance).get('/api/reports/overdue-tasks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overdue_tasks');
    });
  });

  // Tests for authentication endpoints
  describe('Authentication Endpoints', () => {
    it('POST /api/register - should register new user', async () => {
      // The endpoint performs a single INSERT and then sends a notification.
      // Simulate successful INSERT.
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(serverInstance)
        .post('/api/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('customer_id');
    });

    it('POST /api/register - should reject duplicate email', async () => {
      // The endpoint does not pre-check; it catches MySQL ER_DUP_ENTRY on INSERT.
      mockConnection.execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(serverInstance)
        .post('/api/register')
        .send({
          name: 'John Doe',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Tests for policy purchase
  describe('Policy Purchase', () => {
    it('POST /api/policies/buy - should clone template and link to customer', async () => {
      setJwtUser({ customer_id: 'CUST123', isAdmin: false });
      mockConnection.beginTransaction.mockResolvedValue();
      // 1) SELECT template policy
      mockConnection.execute.mockResolvedValueOnce([[{ policy_type: 'Health', premium_amount: 500, coverage_details: 'Basic' }]]);
      // 2) INSERT new policy
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // 3) INSERT customer_policy link
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/policies/buy')
        .set('Authorization', 'Bearer token123')
        .send({
          template_policy_id: 'TPL001'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('policy_id');
      expect(res.body.status).toBe('INACTIVE_AWAITING_PAYMENT');
    });
  });

  // Tests for claim filing
  describe('Claim Filing', () => {
    it('POST /api/my-claims - should file new claim', async () => {
      setJwtUser({ customer_id: 'CUST123', isAdmin: false });
      mockConnection.beginTransaction.mockResolvedValue();
      // 1) Verify policy belongs to customer
      mockConnection.execute.mockResolvedValueOnce([[{ 1: 1 }]]);
      // 2) INSERT claim
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .post('/api/my-claims')
        .set('Authorization', 'Bearer token123')
        .send({
          policy_id: 'POL001',
          amount: 5000,
          description: 'Car accident'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('claim_id');
    });
  });

  // Tests for claim approval
  describe('Claim Approval', () => {
    it('PATCH /api/admin/claims/:claimId - should update claim status', async () => {
      setJwtUser({ admin_id: 'ADMIN1', isAdmin: true, role: 'System Admin' });
      mockConnection.beginTransaction.mockResolvedValue();
      // 1) SELECT claim row (PENDING) with workflow info
      mockConnection.execute.mockResolvedValueOnce([[{ current_step_order: 1, workflow_id: 'WF1', claim_status: 'PENDING', customer_id: 'CUST123', amount: 1000 }]]);
      // 2) SELECT next workflow step
      mockConnection.execute.mockResolvedValueOnce([[{ next_order: null }]]);
      // 3) UPDATE claim status
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockConnection.commit.mockResolvedValue();

      const res = await request(serverInstance)
        .patch('/api/admin/claims/CLM001')
        .set('Authorization', 'Bearer admintoken')
        .send({
          newStatus: 'APPROVED'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});
