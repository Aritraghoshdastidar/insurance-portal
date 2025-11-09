import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HighRiskAlerts from './HighRiskAlerts';
import axios from 'axios';

jest.mock('axios');

describe('HighRiskAlerts Component', () => {
  const mockAlerts = {
    high_risk_claims: [
      {
        claim_id: 'CLM001',
        customer_id: 'CUST001',
        amount: 50000,
        claim_status: 'PENDING',
        risk_score: 0.85
      },
      {
        claim_id: 'CLM002',
        customer_id: 'CUST002',
        amount: 75000,
        claim_status: 'PENDING',
        risk_score: 0.92
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure axios.get is a jest mock and set the default resolved value
    axios.get.mockResolvedValue({ data: mockAlerts });
    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders high risk alerts', async () => {
    render(<HighRiskAlerts />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('CLM001')).toBeInTheDocument();
      expect(screen.getByText('CLM002')).toBeInTheDocument();
      expect(screen.getByText('CUST001')).toBeInTheDocument();
      expect(screen.getByText('CUST002')).toBeInTheDocument();
  expect(screen.getByText('₹50000.00')).toBeInTheDocument();
  expect(screen.getByText('₹75000.00')).toBeInTheDocument();
    });
  });

  test('displays risk scores', async () => {
    render(<HighRiskAlerts />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('0.85')).toBeInTheDocument();
      expect(screen.getByText('0.92')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    const mockError = new Error('Failed to fetch alerts.');
    axios.get.mockRejectedValueOnce(mockError);

    render(<HighRiskAlerts />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch alerts.')).toBeInTheDocument();
    });
  });

  test('displays loading state', async () => {
    axios.get.mockReturnValue(new Promise(() => {}));

    render(<HighRiskAlerts />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays no alerts message', async () => {
    axios.get.mockResolvedValueOnce({ data: { high_risk_claims: [] } });

    render(<HighRiskAlerts />);

    await waitFor(() => {
      expect(screen.getByText('No high-risk claims detected.')).toBeInTheDocument();
    });
  });

  test('displays correct table headers', async () => {
    render(<HighRiskAlerts />);

    await waitFor(() => {
      expect(screen.getByText('Claim ID')).toBeInTheDocument();
      expect(screen.getByText('Customer ID')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Risk Score')).toBeInTheDocument();
    });
  });

  test('displays APPROVED status with success color', async () => {
    const approvedAlerts = {
      high_risk_claims: [
        {
          claim_id: 'CLM003',
          customer_id: 'CUST003',
          amount: 30000,
          claim_status: 'APPROVED',
          risk_score: 0.75
        }
      ]
    };
    axios.get.mockResolvedValueOnce({ data: approvedAlerts });

    render(<HighRiskAlerts />);

    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  test('displays DECLINED status with error color', async () => {
    const declinedAlerts = {
      high_risk_claims: [
        {
          claim_id: 'CLM004',
          customer_id: 'CUST004',
          amount: 40000,
          claim_status: 'DECLINED',
          risk_score: 0.95
        }
      ]
    };
    axios.get.mockResolvedValueOnce({ data: declinedAlerts });

    render(<HighRiskAlerts />);

    await waitFor(() => {
      expect(screen.getByText('DECLINED')).toBeInTheDocument();
    });
  });

  test('displays high risk score (>8) with error color', async () => {
    const highRiskAlerts = {
      high_risk_claims: [
        {
          claim_id: 'CLM005',
          customer_id: 'CUST005',
          amount: 60000,
          claim_status: 'PENDING',
          risk_score: 8.5
        }
      ]
    };
    axios.get.mockResolvedValueOnce({ data: highRiskAlerts });

    render(<HighRiskAlerts />);

    await waitFor(() => {
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });
  });
});
