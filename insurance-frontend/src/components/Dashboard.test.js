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
});