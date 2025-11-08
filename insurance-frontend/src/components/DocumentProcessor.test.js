import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import DocumentProcessor from './DocumentProcessor';

jest.mock('axios');

describe('DocumentProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render document processor form', () => {
    render(<DocumentProcessor />);
    expect(screen.getByText('Intelligent Document Processor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload & Process' })).toBeInTheDocument();
  });

  it('should show error when uploading without file', () => {
    render(<DocumentProcessor />);
    const uploadButton = screen.getByRole('button', { name: 'Upload & Process' });
    fireEvent.click(uploadButton);
    expect(screen.getByText('Please choose a file first.')).toBeInTheDocument();
  });

  it('should upload file and display extracted data', async () => {
    const mockResponse = {
      data: {
        extracted: {
          claim_id: 'CLM12345',
          amount: 10000,
          confidence: 0.95
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    render(<DocumentProcessor />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button', { name: 'Upload & Process' }).previousSibling;
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(() => {
      expect(screen.getByText('Extracted Data')).toBeInTheDocument();
      expect(screen.getByText(/CLM12345/)).toBeInTheDocument();
      expect(screen.getByText(/10000/)).toBeInTheDocument();
      expect(screen.getByText(/95\.0%/)).toBeInTheDocument();
    });
  });

  it('should display error when API fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(<DocumentProcessor />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button', { name: 'Upload & Process' }).previousSibling;
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(() => {
      expect(screen.getByText('Document processing failed.')).toBeInTheDocument();
    });
  });
});
