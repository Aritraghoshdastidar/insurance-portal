import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom to avoid resolving the actual package in tests
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    // Minimal pass-through wrappers
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    // Render the provided element directly so routes "match"
    Route: ({ element }) => (element || null),
    Navigate: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  };
});

test('renders login page by default', () => {
  render(<App />);
  // Login page renders heading "Customer Login" by default
  expect(screen.getByText(/customer login/i)).toBeInTheDocument();
});
