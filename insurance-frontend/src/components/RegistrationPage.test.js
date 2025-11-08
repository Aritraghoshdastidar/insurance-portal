import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegistrationPage from './RegistrationPage';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('RegistrationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Registration successful' })
    }));
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <RegistrationPage />
      </BrowserRouter>
    );
  };

  test('renders registration form', () => {
    renderComponent();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
          })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
    });

    // Should redirect to login after successful registration
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays error message on registration failure', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Email already exists' })
    }));

    renderComponent();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });

    // Should not redirect on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles network error', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    renderComponent();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // HTML5 validation should prevent form submission
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('validates email format', async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // HTML5 validation should prevent form submission
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('clears error message when form is modified', () => {
    renderComponent();

    // Set initial error state
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Modify form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Input' }
    });

    // Error should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});