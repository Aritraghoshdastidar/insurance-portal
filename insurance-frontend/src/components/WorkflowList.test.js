import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkflowList from './WorkflowList';

describe('WorkflowList Component', () => {
  const mockWorkflows = [
    { workflow_id: 1, name: 'Auto Claims', description: 'Process auto insurance claims', status: 'active' },
    { workflow_id: 2, name: 'Health Claims', description: 'Process health insurance claims', status: 'draft' }
  ];

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockWorkflows) }));
    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders workflow list', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <WorkflowList />
        </MemoryRouter>
      );
    });

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('Auto Claims')).toBeInTheDocument();
      expect(screen.getByText('Health Claims')).toBeInTheDocument();
    });

    // Check if workflow descriptions are rendered
    expect(screen.getByText('Process auto insurance claims')).toBeInTheDocument();
    expect(screen.getByText('Process health insurance claims')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Failed to fetch workflows' }) }));

    await act(async () => {
      render(
        <MemoryRouter>
          <WorkflowList />
        </MemoryRouter>
      );
    });

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch workflows/i)).toBeInTheDocument();
    });
  });

  test('displays loading state', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      render(
        <MemoryRouter>
          <WorkflowList />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Loading workflows/i)).toBeInTheDocument();
  });

  test('renders correct editor links', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <WorkflowList />
        </MemoryRouter>
      );
    });

    // Ensure Edit Steps/Visual buttons link to the expected workflow id paths
    const editStepsLinks = screen.getAllByRole('link', { name: /Edit Steps/i });
    const editVisualLinks = screen.getAllByRole('link', { name: /Edit Visual/i });
    expect(editStepsLinks[0].getAttribute('href')).toContain('/admin/workflow-editor/1');
    expect(editVisualLinks[0].getAttribute('href')).toContain('/admin/workflow-designer/1');
  });
});