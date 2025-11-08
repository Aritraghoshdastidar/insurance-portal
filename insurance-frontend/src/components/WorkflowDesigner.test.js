//frontend unit test -- tests the component in isolation

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkflowDesigner from './WorkflowDesigner';


// Mock React Flow
// In WorkflowDesigner.test.js
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  __esModule: true,
  default: ({ nodes = [], onNodeDoubleClick, children }) => (
    <div data-testid="react-flow-mock">
      {nodes.map(n => (
        <div
          key={n.id}
            data-testid={`node-${n.id}`}
          onDoubleClick={(e) => onNodeDoubleClick && onNodeDoubleClick(e, n)}
          style={{ padding: '4px', border: '1px solid #ccc', margin: '2px' }}
        >
          {n.data?.label}
        </div>
      ))}
      {children}
    </div>
  ),
  useReactFlow: () => ({
    project: jest.fn((coords) => coords),
    fitView: jest.fn(),
  }),
  Controls: () => <div data-testid="controls-mock" />,
  Background: () => <div data-testid="background-mock" />,
  MiniMap: () => <div data-testid="minimap-mock" />,
  applyNodeChanges: jest.fn((changes, nodes) => nodes),
  applyEdgeChanges: jest.fn((changes, edges) => edges),
  addEdge: jest.fn((edge, edges) => [edge, ...edges]),
}));

// This will hold our isolated mock
let localStorageMock = {};

beforeEach(() => {
  // Reset the mock before each test
  localStorageMock = {};

  // Spy on localStorage's functions
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    return localStorageMock[key] || null;
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    localStorageMock[key] = value.toString();
  });
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    localStorageMock = {};
  });

  // Now, set the token for THIS test run
  localStorage.setItem('token', 'mock-token');
});

afterEach(() => {
  // Clean up and restore the original functions after each test
  jest.restoreAllMocks();
});

// Mock global fetch
global.fetch = jest.fn();

const setup = (workflowId, { defOk = true, withDefinition = true } = {}) => {
  // Reset mocks before each setup
  global.fetch.mockClear();
  

  // Mock fetch responses
// In WorkflowDesigner.test.js, inside the setup() function

  // ...
  const mockFetch = (url, opts) => {
    if (url.includes(`/api/admin/workflows/${workflowId}`) && !url.includes('/definition')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Test Workflow' }) });
    }
    if (url.includes(`/api/admin/workflows/${workflowId}/definition`) && (!opts || opts.method === 'GET')) {
      if (!defOk) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(withDefinition ? { definition: { nodes: [{ id: 'node_5', type: 'rule', data: { label: 'Existing' }, position: { x: 0, y: 0 } }], edges: [] } } : { definition: null })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };
  // ...
  
  global.fetch.mockImplementation(mockFetch);

  render(
    <MemoryRouter initialEntries={[`/admin/workflow-designer/${workflowId}`]}>
      <ReactFlowProvider>{/* <--- ADD THIS WRAPPER */}
        <Routes>
          <Route path="/admin/workflow-designer/:workflowId" element={<WorkflowDesigner />} />
        </Routes>
      </ReactFlowProvider> {/* <--- AND THIS WRAPPER */}
    </MemoryRouter>
  );
};

describe('WorkflowDesigner', () => {

  /**
   * Test 1: Load Test
   */
  it('loads the workflow name and definition on render', async () => {
    setup('CLAIM_APPROVAL_V1');

    // Wait for loading to finish and data to be fetched
    await waitFor(() => {
      // Check if workflow name is fetched and displayed
      expect(screen.getByText('Visual Designer: Test Workflow')).toBeInTheDocument();
    });

    // Check that fetch was called twice (once for name, once for definition)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/workflows/CLAIM_APPROVAL_V1',
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/workflows/CLAIM_APPROVAL_V1/definition',
      expect.any(Object)
    );
  });

  /**
   * Test 2: Save Test
   */
  it('calls the PUT endpoint with the correct payload on save', async () => {
    setup('CLAIM_APPROVAL_V1');

    // Wait for the page to load
    await screen.findByText('Save Workflow');

    // Mock a successful save response
    global.fetch.mockImplementation((url, opts) => {
      if (url.includes('/definition') && opts && opts.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Saved!' }),
        });
      }
      // Preserve earlier successful GET mocks for name/definition if re-called
      if (url.includes('/CLAIM_APPROVAL_V1') && (!opts || opts.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    // Mock window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Click the save button
    const saveButton = screen.getByText('Save Workflow');
    await userEvent.click(saveButton);

    // Check that the PUT request was sent
    await waitFor(() => {
      const putCall = global.fetch.mock.calls.find(([u, o]) => u === '/api/admin/workflows/CLAIM_APPROVAL_V1/definition' && o && o.method === 'PUT');
      expect(putCall).toBeTruthy();
      expect(putCall[1]).toEqual(expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        })
      }));
      const parsed = JSON.parse(putCall[1].body);
      expect(parsed.definition).toBeTruthy();
      expect(parsed.definition.nodes.length).toBeGreaterThan(0); // At least one node present
    });

    // Check if success alert was shown
    expect(window.alert).toHaveBeenCalledWith('Workflow saved successfully!');
  });

  it('handles save error path showing alert and error state', async () => {
    setup('WF_SAVE_ERR');
    await screen.findByText('Save Workflow');
    // Force PUT failure
    global.fetch.mockImplementation((url, opts) => {
      if (url.includes('/definition') && opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Failed to save workflow' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    userEvent.click(screen.getByText('Save Workflow'));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Error saving workflow/i)));
  });

  it('displays error message when definition fetch fails', async () => {
    setup('WF_DEF_ERR', { defOk: false });
    // After failing definition fetch we expect an Error component
    await waitFor(() => expect(screen.getByText(/Error:/i)).toBeInTheDocument());
  });

  it('adds rule and manual nodes via buttons', async () => {
    setup('WF_ADD_NODES');
    await screen.findByText('Save Workflow');
    const ruleBtn = screen.getByText('Add Rule Node');
    const manualBtn = screen.getByText('Add Manual Task');
    userEvent.click(ruleBtn);
    userEvent.click(manualBtn);
    // After adding nodes, attempt save to ensure payload contains them
    global.fetch.mockImplementation((url, opts) => {
      if (url.includes('/definition') && opts && opts.method === 'PUT') {
        const body = JSON.parse(opts.body);
        expect(body.definition.nodes.length).toBeGreaterThanOrEqual(3); // Start + 2 added
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    userEvent.click(screen.getByText('Save Workflow'));
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
  });

  it('opens edit modal on node double click and saves label', async () => {
    setup('WF_EDIT_LABEL', { withDefinition: true });
    await screen.findByText('Save Workflow');
    userEvent.click(screen.getByText('Add Rule Node'));
    const ruleNode = screen.getAllByTestId(/node-/).find(el => /New Rule/i.test(el.textContent));
    expect(ruleNode).toBeTruthy();
    await userEvent.dblClick(ruleNode);
    const modalHeading = await screen.findByText(/Edit Node Label/i);
    expect(modalHeading).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Rule Updated');
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch.mockImplementation((url, opts) => {
      if (url.includes('/definition') && opts && opts.method === 'PUT') {
        const body = JSON.parse(opts.body);
        const updatedNode = body.definition.nodes.find(n => n.data?.label === 'Rule Updated');
        expect(updatedNode).toBeTruthy();
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    userEvent.click(screen.getByText('Save'));
    userEvent.click(screen.getByText('Save Workflow'));
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
  });

  it('cancels label edit without persisting changes', async () => {
    setup('WF_EDIT_CANCEL', { withDefinition: true });
    await screen.findByText('Save Workflow');
    userEvent.click(screen.getByText('Add Rule Node'));
    const ruleNode = screen.getAllByTestId(/node-/).find(el => /New Rule/i.test(el.textContent));
    await userEvent.dblClick(ruleNode);
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Temp Change');
    userEvent.click(screen.getByText('Cancel'));
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch.mockImplementation((url, opts) => {
      if (url.includes('/definition') && opts && opts.method === 'PUT') {
        const body = JSON.parse(opts.body);
        const hasTemp = body.definition.nodes.some(n => n.data?.label === 'Temp Change');
        expect(hasTemp).toBe(false);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    userEvent.click(screen.getByText('Save Workflow'));
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
  });
});