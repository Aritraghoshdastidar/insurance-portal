import React from 'react';

// Mock react-dom/client default export with createRoot using in-factory locals
jest.mock('react-dom/client', () => {
  const mockRender = jest.fn();
  const mockCreateRoot = jest.fn(() => ({ render: mockRender }));
  return {
    __esModule: true,
    default: {
      createRoot: mockCreateRoot,
    },
    // expose internals for assertions
    mockInternals: { mockCreateRoot, mockRender },
  };
});

// Ensure BrowserRouter renders without needing DOM APIs beyond basic root
jest.mock('react-router-dom', () => ({
  __esModule: true,
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
}));

// Create a root element for index.js to mount into
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  // clear via exported internals
  const mod = require('react-dom/client');
  mod.mockInternals.mockRender.mockClear();
  mod.mockInternals.mockCreateRoot.mockClear();
});

it('boots the app and renders into #root', async () => {
  // Load the entry after mocks are set up
  await import('./index');
  const { mockInternals } = await import('react-dom/client');
  const { mockCreateRoot, mockRender } = mockInternals;
  expect(mockCreateRoot).toHaveBeenCalledTimes(1);
  const rootEl = document.getElementById('root');
  expect(mockCreateRoot).toHaveBeenCalledWith(rootEl);
  expect(mockRender).toHaveBeenCalledTimes(1);
});
