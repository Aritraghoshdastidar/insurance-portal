import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import AdjusterDashboard from './AdjusterDashboard';

jest.mock('axios');
jest.mock('jwt-decode', () => {
  return {
    jwtDecode: jest.fn(() => ({ admin_id: 'ADM1001', name: 'Test Adjuster' }))
  };
});

describe('AdjusterDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock.admin.token');
    
    // Ensure jwt-decode mock returns proper value
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockReturnValue({ admin_id: 'ADM1001', name: 'Test Adjuster' });
  });

  it('should render loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AdjusterDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('CLM001')).toBeInTheDocument();
      expect(screen.getByText('Test claim')).toBeInTheDocument();
      expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  it('should display message when no claims are assigned', async () => {
    axios.get.mockResolvedValueOnce({ data: { assigned_claims: [] } });

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No claims assigned to you yet.')).toBeInTheDocument();
    });
  });

  it('should render APPROVED status with success color', async () => {
    const mockClaims = [
      {
        claim_id: 'CLM002',
        description: 'Approved claim',
        amount: 3000,
        claim_status: 'APPROVED',
        claim_date: '2025-01-01'
      }
    ];

    axios.get.mockResolvedValueOnce({ data: { assigned_claims: mockClaims } });

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  it('should render DECLINED status with error color', async () => {
    const mockClaims = [
      {
        claim_id: 'CLM003',
        description: 'Declined claim',
        amount: 2000,
        claim_status: 'DECLINED',
        claim_date: '2025-01-01'
      }
    ];

    axios.get.mockResolvedValueOnce({ data: { assigned_claims: mockClaims } });

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('DECLINED')).toBeInTheDocument();
    });
  });

  it('should render unknown status with default color', async () => {
    const mockClaims = [
      {
        claim_id: 'CLM004',
        description: 'Unknown status claim',
        amount: 1000,
        claim_status: 'UNKNOWN',
        claim_date: '2025-01-01'
      }
    ];

    axios.get.mockResolvedValueOnce({ data: { assigned_claims: mockClaims } });

    render(<AdjusterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    });
  });
});
