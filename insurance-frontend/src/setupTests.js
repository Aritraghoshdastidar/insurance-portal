// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// --- Mock 1: localStorage (For all tests) ---
const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = value.toString(); },
    clear() { store = {}; },
    removeItem(key) { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// --- Mock 2: reactflow (for WorkflowDesigner.test.js) ---
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  __esModule: true,
  default: (props) => <div data-testid="react-flow-mock">{props.children}</div>,
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

// --- Mock 3: jwt-decode ---
// Provide both default and named exports and avoid referencing any out-of-scope variables
jest.mock('jwt-decode', () => {
  // Use jest.requireActual inside the factory so there's no external lexical reference
  const actual = jest.requireActual('jwt-decode');

  const decodeImpl = (token) => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    // For App.workflow-designer.test.js
    if (token === 'mock-admin-token') {
      return { isAdmin: true, exp: futureExp, role: 'Admin', email: 'admin@example.com' };
    }
    // For App.routes.test.js and App.workflow-designer.test.js
    if (token === 'admin.jwt.token' || token === 'admin-token') {
      return { isAdmin: true, exp: futureExp, role: 'Admin' };
    }
    // For App.routes.test.js
    if (token === 'user.jwt.token') {
      return { isAdmin: false, exp: futureExp, role: 'Customer' };
    }
    // For App.login.test.js
    if (token === 'token-app') {
      return { isAdmin: false, exp: futureExp, role: 'Customer' };
    }
    // For the "expired token" test in App.routes.test.js
    if (token === 'expired.jwt') {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      return { isAdmin: true, exp: pastExp };
    }
    // For the "bad token" test in App.routes.test.js
    if (token === 'bad.jwt') {
      throw new Error('bad token');
    }

    // Fallback: try the real decoder (actual may have a default export)
    try {
      const realDecoder = actual && (actual.default || actual);
      return typeof realDecoder === 'function' ? realDecoder(token) : { isAdmin: false, exp: futureExp };
    } catch (e) {
      return { isAdmin: false, exp: futureExp };
    }
  };

  return {
    __esModule: true,
    // Provide both the default export and a named export `jwtDecode` to match different import styles
    default: jest.fn().mockImplementation(decodeImpl),
    jwtDecode: jest.fn().mockImplementation(decodeImpl),
  };
});