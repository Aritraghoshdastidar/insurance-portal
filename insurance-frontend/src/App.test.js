import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

test('renders login page by default', () => {
  render(
  <MemoryRouter>
    <App />
  </MemoryRouter>
  );
  // Login page renders heading "Customer Login" by default
  expect(screen.getByText(/customer login/i)).toBeInTheDocument();
});
