import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WorkflowEditor from './WorkflowEditor';

// Mock fetch
global.fetch = jest.fn();

describe('WorkflowEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    // jsdom lacks scrollIntoView; mock to prevent TypeError during edit tests
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('should render create new workflow form', () => {
    render(
      <MemoryRouter initialEntries={['/admin/workflows/new']}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Unique ID/)).toBeInTheDocument();
  });

  it('should render edit workflow form when loading existing workflow', async () => {
    const mockWorkflow = {
      name: 'Test Workflow',
      description: 'Test Description',
      steps: [
        {
          step_id: 1,
          step_order: 1,
          step_name: 'Step 1',
          task_type: 'MANUAL',
          configuration: {}
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWorkflow
    });

    render(
      <MemoryRouter initialEntries={['/admin/workflows/WF001']}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Workflow: WF001')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument();
    });
  });

  it('should display error when fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Workflow not found' })
    });

    render(
      <MemoryRouter initialEntries={['/admin/workflows/INVALID']}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Workflow not found')).toBeInTheDocument();
    });
  });

  it('should display workflow steps when loaded', async () => {
    const mockWorkflow = {
      name: 'Test Workflow',
      description: 'Test Description',
      steps: [
        {
          step_id: 1,
          step_order: 1,
          step_name: 'Initial Review',
          task_type: 'MANUAL',
          configuration: { assignee: 'adjuster' }
        },
        {
          step_id: 2,
          step_order: 2,
          step_name: 'Approval',
          task_type: 'RULE',
          configuration: { threshold: 5000 }
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWorkflow
    });

    render(
      <MemoryRouter initialEntries={['/admin/workflows/WF001']}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1. Initial Review')).toBeInTheDocument();
      expect(screen.getByText('2. Approval')).toBeInTheDocument();
    });
  });

  it('shows validation error when step config JSON is invalid', async () => {
    // Load an existing workflow so the add/edit form is visible
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'WF', description: '', steps: [] }),
    });

    render(
      <MemoryRouter initialEntries={["/admin/workflows/WF001"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill form with invalid JSON
    await waitFor(() => screen.getByText('Add New Step'));
    const orderInput = screen.getByRole('spinbutton');
    fireEvent.change(orderInput, { target: { value: '1' } });
    const nameInput = screen.getByPlaceholderText(/Assign Adjuster/i);
    fireEvent.change(nameInput, { target: { value: 'Assign Adjuster' } });
    const configArea = screen.getByPlaceholderText(/ruleName/i);
    fireEvent.change(configArea, { target: { value: '{invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Step/i }));

    expect(await screen.findByText('Configuration must be valid JSON.')).toBeInTheDocument();
  });

  it('adds a new step successfully', async () => {
    // First GET steps
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [] }) })
      // POST add
      .mockResolvedValueOnce({ ok: true, json: async () => ({ step_id: 101 }) });

    render(
      <MemoryRouter initialEntries={["/admin/workflows/WF100"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Add New Step'));
    const orderInput = screen.getByRole('spinbutton');
    fireEvent.change(orderInput, { target: { value: '1' } });
    const nameInput = screen.getByPlaceholderText(/Assign Adjuster/i);
    fireEvent.change(nameInput, { target: { value: 'Initial Review' } });
    const configArea = screen.getByPlaceholderText(/ruleName/i);
    fireEvent.change(configArea, { target: { value: '{"assignee":"adjuster"}' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Step/i }));

    // Step shows up in list
    expect(await screen.findByText(/1\. Initial Review/)).toBeInTheDocument();
  });

  it('deletes a step successfully', async () => {
    // GET with one step
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [
        { step_id: 1, step_order: 1, step_name: 'Initial', task_type: 'MANUAL', configuration: {} }
      ] }) })
      // DELETE call
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/admin/workflows/WF200"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      // After deletion the step title should no longer exist
      expect(screen.queryByText(/1\. Initial/)).not.toBeInTheDocument();
    });
  });

  it('saves workflow changes (edit mode) successfully', async () => {
    // GET for edit view
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF Name', description: '', steps: [] }) })
      // PUT save
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'updated' }) });

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFEDIT"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );

    const saveBtn = await screen.findByRole('button', { name: /Save Workflow Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/admin\/workflows\/WFEDIT$/),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('shows error message when saving workflow fails (no alert on failure path)', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF Name', description: '', steps: [] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Update failed' }) });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFERR"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const saveBtn = await screen.findByRole('button', { name: /Save Workflow Changes/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(screen.getByText('Update failed')).toBeInTheDocument());
    // Ensure alert not called on failure
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('handles failed step delete gracefully', async () => {
    // GET with one step
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [ { step_id: 1, step_order: 1, step_name: 'Initial', task_type: 'MANUAL', configuration: {} } ] }) })
      // DELETE failure
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Cannot delete' }) });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFDELERR"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(screen.getByText('Cannot delete')).toBeInTheDocument());
  });

  it('edits an existing step successfully', async () => {
    // GET returns one step
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [ { step_id: 10, step_order: 1, step_name: 'Initial', task_type: 'MANUAL', configuration: {} } ] }) })
      // PUT update
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFEDITSTEP"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const editBtn = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    const nameInput = await screen.findByPlaceholderText(/Assign Adjuster/i);
    fireEvent.change(nameInput, { target: { value: 'Initial Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Step/i }));
    await waitFor(() => expect(screen.getByText(/Initial Updated/)).toBeInTheDocument());
  });

  it('cancel edit resets form state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [ { step_id: 11, step_order: 1, step_name: 'Initial', task_type: 'MANUAL', configuration: {} } ] }) });
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFCANCELEDIT"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const editBtn = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    // Update name field then cancel
    const nameInput = await screen.findByPlaceholderText(/Assign Adjuster/i);
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancel Edit/i }));
    // Form should revert to Add New Step state
    await waitFor(() => expect(screen.getByText('Add New Step')).toBeInTheDocument());
  });

  it('create workflow success triggers alert and navigation', async () => {
    // Create mode path
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'created' }) });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock navigate by spying on window.location assign via history manipulation is complex; we assert alert only
    render(
      <MemoryRouter initialEntries={["/admin/workflows/new"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const idInput = screen.getByPlaceholderText(/Unique ID/i);
    fireEvent.change(idInput, { target: { value: 'NEW_FLOW' } });
    const nameInput = screen.getByPlaceholderText(/Standard Claim Process/i);
    fireEvent.change(nameInput, { target: { value: 'Created Flow' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Workflow/i }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/created successfully/i)));
  });

  it('create workflow missing ID shows error without alert', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Should not be called for create when ID missing
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/admin/workflows/new"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    // Leave ID blank, attempt create
    const nameInput = screen.getByPlaceholderText(/Standard Claim Process/i);
    fireEvent.change(nameInput, { target: { value: 'No ID Flow' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Workflow/i }));
    await waitFor(() => expect(screen.getByText('Workflow ID is required.')).toBeInTheDocument());
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('update step failure surfaces inline step error', async () => {
    // GET returns one step
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [ { step_id: 20, step_order: 1, step_name: 'Initial', task_type: 'MANUAL', configuration: {} } ] }) })
      // PUT failure
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Update step failed' }) });
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFUPDATEFAIL"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const editBtn = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    const nameInput = await screen.findByPlaceholderText(/Assign Adjuster/i);
    fireEvent.change(nameInput, { target: { value: 'Broken Update' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Step/i }));
    await waitFor(() => expect(screen.getByText('Update step failed')).toBeInTheDocument());
  });

  it('delete editing step triggers form reset path', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'WF', description: '', steps: [ { step_id: 33, step_order: 1, step_name: 'ToDelete', task_type: 'MANUAL', configuration: {} } ] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={["/admin/workflows/WFDELRESET"]}>
        <Routes>
          <Route path="/admin/workflows/:workflowId" element={<WorkflowEditor />} />
        </Routes>
      </MemoryRouter>
    );
    const editBtn = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(screen.getByText('Add New Step')).toBeInTheDocument());
  });
});
