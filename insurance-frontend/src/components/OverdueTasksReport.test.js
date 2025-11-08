import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import OverdueTasksReport from './OverdueTasksReport';

// Mock axios
jest.mock('axios');

describe('OverdueTasksReport Component', () => {
  const mockTasks = [
    {
      step_id: 1,
      workflow_id: 'WF001',
      step_name: 'Document Review',
      assigned_role: 'Claims Adjuster',
      hours_overdue: 24
    },
    {
      step_id: 2,
      workflow_id: 'WF002',
      step_name: 'Medical Assessment',
      assigned_role: 'Medical Officer',
      hours_overdue: 12
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { overdue_tasks: mockTasks } });
    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders overdue tasks', async () => {
    render(<OverdueTasksReport />);

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Document Review')).toBeInTheDocument();
      expect(screen.getByText('Medical Assessment')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch tasks'));

    render(<OverdueTasksReport />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch overdue tasks/i)).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<OverdueTasksReport />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch overdue tasks/i)).toBeInTheDocument();
    });
  });

  test('displays loading state', async () => {
    render(<OverdueTasksReport />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows empty state when no tasks', async () => {
    axios.get.mockResolvedValueOnce({ data: { overdue_tasks: [] } });
    
    render(<OverdueTasksReport />);

    await waitFor(() => {
      expect(screen.getByText('All tasks are within SLA.')).toBeInTheDocument();
    });
  });
});