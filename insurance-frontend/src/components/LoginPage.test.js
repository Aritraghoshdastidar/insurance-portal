// insurance-frontend/src/components/LoginPage.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

test('renders login form', () => {
  render(
    <BrowserRouter>
      <LoginPage onLoginSuccess={() => {}} />
    </BrowserRouter>
  );

  // Check if the "Customer Login" title is on the page
  expect(screen.getByText(/Customer Login/i)).toBeInTheDocument();
  // Check if the email field is on the page
  expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  // Check if the password field is on the page
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});

test('navigates back to home when back button is clicked', () => {
  render(
    <BrowserRouter>
      <LoginPage onLoginSuccess={() => {}} />
    </BrowserRouter>
  );

  const backButton = screen.getByRole('button', { name: /Back to Home/i });
  fireEvent.click(backButton);
  
  expect(mockNavigate).toHaveBeenCalledWith('/');
});

test('toggles password visibility when eye icon is clicked', () => {
  render(
    <BrowserRouter>
      <LoginPage onLoginSuccess={() => {}} />
    </BrowserRouter>
  );

  const passwordInput = screen.getByLabelText(/Password/i);
  expect(passwordInput).toHaveAttribute('type', 'password');

  // Find the visibility toggle button (it's in the endAdornment)
  const toggleButton = screen.getByRole('button', { name: '' });
  fireEvent.click(toggleButton);

  // After click, password should be visible (type="text")
  expect(passwordInput).toHaveAttribute('type', 'text');

  // Click again to hide
  fireEvent.click(toggleButton);
  expect(passwordInput).toHaveAttribute('type', 'password');
});

