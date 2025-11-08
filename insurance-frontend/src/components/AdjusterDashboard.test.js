import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import AdjusterDashboard from './AdjusterDashboard';

jest.mock('axios');

describe('AdjusterDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AdjusterDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should display claims when API returns data', async () => {
    const mockClaims = [
      {
        claim_id: 'CLM001',
        description: 'Test claim',
        amount: 5000,
        claim_status: 'PENDING',
        claim_date: '2025-01-01'
      }
    ];

    axios.get.mockResolvedValueOnce({ data: { assigned_claims: mockClaims } });

    render(<AdjusterDashboard adminId="ADM1001" />);

    await waitFor(() => {
      expect(screen.getByText('CLM001')).toBeInTheDocument();
      expect(screen.getByText('Test claim')).toBeInTheDocument();
      expect(screen.getByText('₹5000')).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data.')).toBeInTheDocument();
    });
  });

  it('should display message when no claims are assigned', async () => {
    axios.get.mockResolvedValueOnce({ data: { assigned_claims: [] } });

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No assigned claims.')).toBeInTheDocument();
    });
  });
});
