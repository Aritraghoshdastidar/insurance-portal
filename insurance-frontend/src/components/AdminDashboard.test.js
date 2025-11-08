import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode
jest.mock('jwt-decode');

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock JWT decode default implementation
    jwtDecode.mockImplementation(() => ({
      admin_id: 'ADMIN123',
      role: 'Security Officer',
      isAdmin: true
    }));
    
    // Mock fetch default success response
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        pending_claims: [],
        pending_policies: []
      })
    }));

    // Set mock token in localStorage
    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders admin dashboard title', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  test('renders workflow management link', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(/Manage Workflows/i)).toBeInTheDocument();
  });

  test('fetches pending claims on mount', async () => {
    const mockClaims = [
      { claim_id: 'CLM001', status: 'PENDING', customer_name: 'John Doe' }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/admin/pending-claims')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pending_claims: mockClaims, pending_policies: [] })
        });
      }
      // fallback to default from beforeEach
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pending_claims: [], pending_policies: [] })
      });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/pending-claims'),
        expect.any(Object)
      );
    });
  });

  test('fetches pending policies on mount', async () => {
    const mockPolicies = [
      { policy_id: 'POL001', status: 'PENDING_INITIAL_APPROVAL', customer_name: 'Jane Doe' }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/admin/pending-policies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pending_claims: [], pending_policies: mockPolicies })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pending_claims: [], pending_policies: [] })
      });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/pending-policies'),
        expect.any(Object)
      );
    });
  });

  test('displays error state when fetch fails', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('handles policy approval correctly', async () => {
    const mockPolicy = {
      policy_id: 'POL001',
      status: 'PENDING_INITIAL_APPROVAL',
      customer_name: 'Jane Doe',
      policy_type: 'Health',
      premium_amount: 1000
    };
    // Use a URL-based mock so the correct endpoint returns the desired response
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/admin/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [mockPolicy] }) });
      }
      if (url.includes(`/api/admin/policies/${mockPolicy.policy_id}/approve`)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Policy approved' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    // Wait for the table to load and show the policy
    await waitFor(() => {
      expect(screen.getByText('POL001')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Initial Approve');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/policies/${mockPolicy.policy_id}/approve`),
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });
  });

  test('successful final policy approval path passes role & different approver checks', async () => {
    // First load policy needing final approval with different initial approver
    const mockPolicy = {
      policy_id: 'POLFIN2',
      status: 'PENDING_FINAL_APPROVAL',
      policy_type: 'Life',
      premium_amount: 3000,
      initial_approver_id: 'ADMININIT1',
      initial_approver_name: 'Initial Guy'
    };
    // Current user is security officer and different id
    jwtDecode.mockImplementation(() => ({ admin_id: 'ADMINSEC2', role: 'Security Officer' }));
    let approved = false;
    mockFetch.mockImplementation((url) => {
      if (url.includes('/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: approved ? [] : [mockPolicy] }) });
      }
      if (url.includes(`/api/admin/policies/${mockPolicy.policy_id}/approve`)) {
        approved = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Final approved' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('POLFIN2')).toBeInTheDocument());
    // Should render Final Approve button (role ok & different approver)
    const finalBtn = screen.getByText('Final Approve');
    fireEvent.click(finalBtn);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/admin/policies/${mockPolicy.policy_id}/approve`),
      expect.objectContaining({ method: 'PATCH' })
    ));
  });

  test('shows policy fetch error separately from claims fetch', async () => {
    // Make policies fail but claims succeed to exercise distinct error branch
    mockFetch.mockImplementation((url) => {
      if (url.includes('/pending-policies')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Policies failure' }) });
      }
      if (url.includes('/pending-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText(/Policies failure/i)).toBeInTheDocument());
  });

  test('claim row shows loading indicator then clears on success', async () => {
    const mockClaim = { claim_id: 'CLMLOAD1', customer_name: 'Loader', description: 'Test', claim_date: new Date().toISOString(), amount: 50 };
    let updated = false;
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/pending-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: updated ? [] : [mockClaim], pending_policies: [] }) });
      }
      if (url.includes(`/api/admin/claims/${mockClaim.claim_id}`)) {
        updated = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'done' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('CLMLOAD1')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    // Loading indicator
    await waitFor(() => expect(screen.getByText('Updating...')).toBeInTheDocument());
    // Eventually claim removed
    await waitFor(() => expect(screen.queryByText('CLMLOAD1')).not.toBeInTheDocument());
  });

  test('displays loading state while fetching data', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    const loadingElems = screen.getAllByText(/loading/i);
    expect(loadingElems.length).toBeGreaterThan(0);
  });

  test('updates UI after successful policy approval', async () => {
    const mockPolicy = {
      policy_id: 'POL001',
      status: 'PENDING_INITIAL_APPROVAL',
      customer_name: 'Jane Doe',
      policy_type: 'Health',
      premium_amount: 1000
    };
    // Track approval state so subsequent pending-policies calls return empty
    let approved = false;
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/admin/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: approved ? [] : [mockPolicy] }) });
      }
      if (url.includes(`/api/admin/policies/${mockPolicy.policy_id}/approve`)) {
        approved = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Policy approved' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });

    // Wait for the table to load and show the policy
    await waitFor(() => {
      expect(screen.getByText('POL001')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Initial Approve');
    fireEvent.click(approveButton);

    // After approval, the policy should be removed
    await waitFor(() => {
      expect(screen.getByText('There are no policies awaiting approval.')).toBeInTheDocument();
    });
  });

  test('handles claim approve and decline paths', async () => {
    const mockClaim = {
      claim_id: 'CLM900',
      customer_name: 'Bob Smith',
      description: 'Broken window',
      claim_date: new Date().toISOString(),
      amount: 250,
    };
    let claimUpdatedStatus = null;
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/pending-claims')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pending_claims: [mockClaim], pending_policies: [] })
        });
      }
      if (url.includes(`/api/admin/claims/${mockClaim.claim_id}`)) {
        // capture status body
        const body = JSON.parse(opts.body);
        claimUpdatedStatus = body.newStatus;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'updated' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });

    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });

    await waitFor(() => expect(screen.getByText('CLM900')).toBeInTheDocument());
    const approveBtn = screen.getByText('Approve');
    fireEvent.click(approveBtn);
    await waitFor(() => expect(claimUpdatedStatus).toBe('APPROVED'));

    // Re-render with decline scenario
    claimUpdatedStatus = null;
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/pending-claims')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pending_claims: [mockClaim], pending_policies: [] })
        });
      }
      if (url.includes(`/api/admin/claims/${mockClaim.claim_id}`)) {
        const body = JSON.parse(opts.body);
        claimUpdatedStatus = body.newStatus;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'updated' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });

    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('CLM900')).toBeInTheDocument());
    const declineBtn = screen.getByText('Decline');
    fireEvent.click(declineBtn);
    await waitFor(() => expect(claimUpdatedStatus).toBe('DECLINED'));
  });

  test('renders error inline when claim update fails', async () => {
    const mockClaim = {
      claim_id: 'CLM901',
      customer_name: 'Alice',
      description: 'Roof leak',
      claim_date: new Date().toISOString(),
      amount: 1200,
    };
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/pending-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [mockClaim], pending_policies: [] }) });
      }
      if (url.includes(`/api/admin/claims/${mockClaim.claim_id}`)) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Bad claim' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });

    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('CLM901')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Approve'));
    await waitFor(() => expect(screen.getByText(/Error:/i)).toBeInTheDocument());
  });

  test('policy final approval blocked for wrong role and same approver', async () => {
    const mockPolicy = {
      policy_id: 'POLFIN1',
      status: 'PENDING_FINAL_APPROVAL',
      policy_type: 'Life',
      premium_amount: 2000,
      initial_approver_id: 'ADMIN123',
      initial_approver_name: 'Orig Approver'
    };

    // First render with non-security officer role
    jwtDecode.mockImplementation(() => ({ admin_id: 'ADMIN999', role: 'Junior Adjuster' }));
    mockFetch.mockImplementation((url) => {
      if (url.includes('/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [mockPolicy] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('POLFIN1')).toBeInTheDocument());
    expect(screen.getByText(/Requires 'Security Officer' role/)).toBeInTheDocument();

    // Second render with security officer but same approver id
    jwtDecode.mockImplementation(() => ({ admin_id: 'ADMIN123', role: 'Security Officer' }));
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getAllByText('POLFIN1')[0]).toBeInTheDocument());
    expect(screen.getByText(/Cannot be same approver/)).toBeInTheDocument();
  });

  test('policy action shows status text when not pending states', async () => {
    const mockPolicy = {
      policy_id: 'POLDONE1',
      status: 'APPROVED',
      policy_type: 'Auto',
      premium_amount: 500,
      initial_approver_id: 'ADMIN777'
    };
    mockFetch.mockImplementation((url) => {
      if (url.includes('/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [mockPolicy] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    await waitFor(() => expect(screen.getByText('POLDONE1')).toBeInTheDocument());
    // Row should contain both the status cell and the action cell span with APPROVED
    const row = screen.getByText('POLDONE1').closest('tr');
    expect(row).toBeTruthy();
    const approvedInstances = within(row).getAllByText('APPROVED');
    expect(approvedInstances.length).toBeGreaterThanOrEqual(2);
  });

  test('renders loading user when currentUser not yet decoded', async () => {
    // Simulate absence of token so jwtDecode never called
    localStorage.clear();
    mockFetch.mockImplementation((url) => {
      if (url.includes('/pending-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [{ policy_id: 'POLX', status: 'PENDING_INITIAL_APPROVAL', policy_type: 'Home', premium_amount: 100 }] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ pending_claims: [], pending_policies: [] }) });
    });
    await act(async () => {
      render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
    });
    // We expect the action cell to show 'Loading user...' because currentUser is null
    await waitFor(() => expect(screen.getByText('POLX')).toBeInTheDocument());
    expect(screen.getByText(/Loading user.../i)).toBeInTheDocument();
  });
});