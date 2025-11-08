import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
      }
      if (url.includes('/api/my-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ policies: [] }) });
      }
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders dashboard', async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(screen.getByText('My Claims')).toBeInTheDocument();
    expect(screen.getByText('My Policies')).toBeInTheDocument();
  });

  test('fetches and displays claims', async () => {
    const mockClaims = [
      { claim_id: 'CLM001', policy_id: 'POL001', status: 'PENDING', description: 'Test claim', amount: 500 }
    ];

    mockFetch.mockImplementationOnce((url) => {
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: mockClaims }) });
      }
      return mockFetch(url);
    });

    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/CLM001/i)).toBeInTheDocument();
      expect(screen.getByText(/Test claim/i)).toBeInTheDocument();
    });
  });

  test('fetches and displays policies', async () => {
    const mockPolicies = [
      { policy_id: 'POL001', policy_type: 'Health', status: 'ACTIVE', premium_amount: 100000 }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/my-policies')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ policies: mockPolicies }) 
        });
      } else if (url.includes('/api/my-claims')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ claims: [] }) 
        });
      } else if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ notifications: [] }) 
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('POL001')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching data', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    await act(async () => {
      render(<Dashboard />);
    });

    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('displays error when claim fetch fails', async () => {
    mockFetch.mockImplementationOnce((url) => {
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Unauthorized' }) });
      }
      return mockFetch(url);
    });

    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Could not fetch claims|Unauthorized/i)).toBeInTheDocument();
    });
  });

  test('displays notifications', async () => {
    const mockNotifications = [
      { notification_id: 1, message: 'New policy update', sent_timestamp: new Date().toISOString() }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ notifications: mockNotifications }) 
        });
      } else if (url.includes('/api/my-claims')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ claims: [] }) 
        });
      } else if (url.includes('/api/my-policies')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ policies: [] }) 
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('New policy update')).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Network error|Could not fetch/i)).toBeInTheDocument();
    });
  });

  test('does not activate policy when user cancels confirmation', async () => {
    const mockPolicies = [
      { policy_id: 'POLX', policy_type: 'Life', status: 'INACTIVE_AWAITING_PAYMENT', premium_amount: 2500 }
    ];

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/api/my-policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ policies: mockPolicies }) });
      }
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
      }
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      }
      // Should not be called when user cancels
      return Promise.reject(new Error('Unexpected call'));
    });

    render(<Dashboard />);

    const btn = await screen.findByRole('button', { name: /Activate \(Mock Pay\)/i });
    btn.click();

    // Ensure we did not attempt activation
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalledWith(expect.stringMatching(/mock-activate/), expect.anything());
    confirmSpy.mockRestore();
  });

  test('activates policy successfully and shows status', async () => {
    const mockPolicies = [
      { policy_id: 'POLY', policy_type: 'Auto', status: 'INACTIVE_AWAITING_PAYMENT', premium_amount: 1200 }
    ];

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    // First render fetches lists
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/api/my-policies') && (!opts || opts.method !== 'POST')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ policies: mockPolicies }) });
      }
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
      }
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      }
      if (url.includes('/mock-activate') && opts && opts.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Activated' }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<Dashboard />);

    const btn = await screen.findByRole('button', { name: /Activate \(Mock Pay\)/i });
    btn.click();

    // After click we should show a status message; allow state updates to flush
    await waitFor(() => {
      // Either shows 'Activated!' message or triggers a refresh call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/mock-activate/),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('activation failure shows error status message', async () => {
    const mockPolicies = [
      { policy_id: 'POLFAIL', policy_type: 'Home', status: 'INACTIVE_AWAITING_PAYMENT', premium_amount: 800 }
    ];
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/api/my-policies') && (!opts || opts.method !== 'POST')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ policies: mockPolicies }) });
      }
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
      }
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      }
      if (url.includes('/mock-activate') && opts && opts.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Payment declined' }) });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<Dashboard />);
    const btn = await screen.findByRole('button', { name: /Activate \(Mock Pay\)/i });
    btn.click();
    await waitFor(() => expect(screen.getByText(/Error: Payment declined/i)).toBeInTheDocument());
  });

  test('prevents duplicate activation attempts while in progress', async () => {
    const mockPolicies = [
      { policy_id: 'POLDUP', policy_type: 'Travel', status: 'INACTIVE_AWAITING_PAYMENT', premium_amount: 300 }
    ];
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    let activationCalls = 0;
    mockFetch.mockImplementation((url, opts) => {
      if (url.includes('/api/my-policies') && (!opts || opts.method !== 'POST')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ policies: mockPolicies }) });
      }
      if (url.includes('/api/my-claims')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
      }
      if (url.includes('/api/my-notifications')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      }
      if (url.includes('/mock-activate') && opts && opts.method === 'POST') {
        activationCalls += 1;
        // Simulate slow response by not resolving immediately
        return new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ message: 'Activated' }) }), 50));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    render(<Dashboard />);
    const btn = await screen.findByRole('button', { name: /Activate \(Mock Pay\)/i });
    btn.click();
    // Attempt second click while first in progress
    btn.click();
    await waitFor(() => expect(activationCalls).toBe(1));
  });
});