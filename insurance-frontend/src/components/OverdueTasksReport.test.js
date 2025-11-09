import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OverdueTasksReport from './OverdueTasksReport';

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
    localStorage.setItem('token', 'mock.jwt.token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ overdue_tasks: mockTasks })
    });
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
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch overdue tasks' })
    });

    render(<OverdueTasksReport />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch overdue tasks')).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<OverdueTasksReport />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('displays loading state', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<OverdueTasksReport />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows empty state when no tasks', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ overdue_tasks: [] })
    });
    
    render(<OverdueTasksReport />);

    await waitFor(() => {
      expect(screen.getByText('All tasks are within SLA. No overdue tasks found.')).toBeInTheDocument();
    });
  });

  test('handles table not found error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error("ER_NO_SUCH_TABLE: Table 'insurance_db_dev.workflow_steps' doesn't exist"));

    render(<OverdueTasksReport />);

    await waitFor(() => {
      expect(screen.getByText(/Workflow tracking is not yet configured/i)).toBeInTheDocument();
    });
  });

  test('displays severity colors for different overdue durations', async () => {
    const tasksWithDifferentSeverity = [
      {
        step_id: 3,
        workflow_id: 'WF003',
        step_name: 'Critical Task',
        assigned_role: 'Manager',
        hours_overdue: 60
      },
      {
        step_id: 4,
        workflow_id: 'WF004',
        step_name: 'Warning Task',
        assigned_role: 'Adjuster',
        hours_overdue: 30
      },
      {
        step_id: 5,
        workflow_id: 'WF005',
        step_name: 'Info Task',
        assigned_role: 'Clerk',
        hours_overdue: 10
      }
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ overdue_tasks: tasksWithDifferentSeverity })
    });
    
    render(<OverdueTasksReport />);

    await waitFor(() => {
      expect(screen.getByText('Critical Task')).toBeInTheDocument();
      expect(screen.getByText('Warning Task')).toBeInTheDocument();
      expect(screen.getByText('Info Task')).toBeInTheDocument();
    });
  });
});
