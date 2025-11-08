import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import WorkflowMetricsDashboard from './WorkflowMetricsDashboard';

jest.mock('axios');

describe('WorkflowMetricsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render workflow metrics dashboard', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    render(<WorkflowMetricsDashboard />);
    expect(screen.getByText('Workflow Metrics')).toBeInTheDocument();
  });

  it('should display metrics when API returns data', async () => {
    const mockMetrics = [
      {
        workflow_id: 'WF001',
        workflow_name: 'Claim Approval',
        total_claims: 150,
        avg_processing_time_hrs: 24.5
      }
    ];

    axios.get.mockResolvedValueOnce({ data: { metrics: mockMetrics } });

    render(<WorkflowMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('WF001')).toBeInTheDocument();
      expect(screen.getByText('Claim Approval')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('24.50')).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<WorkflowMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Could not load workflow metrics.')).toBeInTheDocument();
    });
  });

  it('should display message when no workflows found', async () => {
    axios.get.mockResolvedValueOnce({ data: { metrics: [] } });

    render(<WorkflowMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No workflows found.')).toBeInTheDocument();
    });
  });
});
