import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileClaim from './FileClaim';

describe('FileClaim Component', () => {
  // Mock the fetch function
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock onClaimFiled callback
  const mockOnClaimFiled = jest.fn();

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Claim filed successfully' })
    }));
    localStorage.setItem('token', 'mock.jwt.token');
  });

  test('renders FileClaim form', () => {
    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);
    
    // Check if all form elements are present
    expect(screen.getByLabelText(/Policy ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Claim Amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Claim/i })).toBeInTheDocument();
  });

  test('handles successful claim submission', async () => {
    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Policy ID/i), {
      target: { value: 'POL1001' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Annual check-up' }
    });
    fireEvent.change(screen.getByLabelText(/Claim Amount/i), {
      target: { value: '250.00' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/my-claims'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock.jwt.token'
          }),
          body: JSON.stringify({
            policy_id: 'POL1001',
            description: 'Annual check-up',
            amount: 250
          })
        })
      );
    });

    // Verify callback was called
    await waitFor(() => {
      expect(mockOnClaimFiled).toHaveBeenCalled();
    });
  });

  test('handles API errors', async () => {
    // Mock API error response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid policy ID' })
    }));

    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Policy ID/i), {
      target: { value: 'INVALID' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/Claim Amount/i), {
      target: { value: '100' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Invalid policy ID/i)).toBeInTheDocument();
    });

    // Verify callback was not called
    expect(mockOnClaimFiled).not.toHaveBeenCalled();
  });

  test('handles network errors', async () => {
    // Mock network failure
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Policy ID/i), {
      target: { value: 'POL1001' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/Claim Amount/i), {
      target: { value: '100' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', () => {
    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Fetch should not be called due to HTML5 validation
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('validates claim amount is positive', () => {
    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Fill form with negative amount
    fireEvent.change(screen.getByLabelText(/Policy ID/i), {
      target: { value: 'POL1001' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/Claim Amount/i), {
      target: { value: '-100' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Fetch should not be called due to HTML5 validation
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('clears form after successful submission', async () => {
    render(<FileClaim onClaimFiled={mockOnClaimFiled} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Policy ID/i), {
      target: { value: 'POL1001' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test claim' }
    });
    fireEvent.change(screen.getByLabelText(/Claim Amount/i), {
      target: { value: '100' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit Claim/i }));

    // Wait for form to be cleared
    await waitFor(() => {
      expect(screen.getByLabelText(/Policy ID/i)).toHaveValue('');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('');
      expect(screen.getByLabelText(/Claim Amount/i)).toHaveValue(null);
    });
  });
});