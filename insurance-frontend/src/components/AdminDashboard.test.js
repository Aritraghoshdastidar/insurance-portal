import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
});