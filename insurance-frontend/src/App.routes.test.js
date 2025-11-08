import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

// Mock child components to keep tests lightweight and focus on App routing logic
jest.mock('./components/AdminDashboard', () => () => <div>Admin Dashboard</div>);
jest.mock('./components/Dashboard', () => () => <div>User Dashboard</div>);
jest.mock('./components/RegistrationPage', () => () => <div>Register Page</div>);
jest.mock('./components/WorkflowList', () => () => <div>Workflow List</div>);
jest.mock('./components/WorkflowEditor', () => () => <div>Workflow Editor</div>);
jest.mock('./components/AdjusterDashboard', () => () => <div>Adjuster</div>);
jest.mock('./components/DocumentProcessor', () => () => <div>Docs</div>);
jest.mock('./components/HighRiskAlerts', () => () => <div>Alerts</div>);
jest.mock('./components/WorkflowMetricsDashboard', () => () => <div>Metrics</div>);
jest.mock('./components/OverdueTasksReport', () => () => <div>Overdue</div>);

// Mock jwt-decode to control user and expiry
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({ isAdmin: true, exp: Math.floor(Date.now() / 1000) + 3600 })),
}));

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
    const { jwtDecode } = require('jwt-decode');
    jest.clearAllMocks();
    jwtDecode.mockImplementation(() => ({ isAdmin: true, exp: Math.floor(Date.now() / 1000) + 3600 }));
  });

  test('redirects to login when no token', () => {
    render(
  <MemoryRouter>
    <App />
  </MemoryRouter>
  );
    expect(screen.getByText(/Customer Login/i)).toBeInTheDocument();
  });

  test('shows admin dashboard when admin token present', () => {
    // Mock the admin token decode result
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockImplementation(() => ({ 
      isAdmin: true, 
      exp: Math.floor(Date.now() / 1000) + 3600 
    }));
    
    localStorage.setItem('token', 'admin.jwt.token');
    
    render(
      <MemoryRouter initialEntries={['/admin-dashboard']}>
        <App />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  test('shows user dashboard when non-admin token present', () => {
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockImplementation(() => ({ isAdmin: false, exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('token', 'user.jwt.token');
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    expect(screen.getByText(/User Dashboard/i)).toBeInTheDocument();
  });

  test('logout button clears token and returns to login', () => {
    localStorage.setItem('token', 'admin.jwt.token');
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button', { name: /logout/i })[0]);
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText(/Customer Login/i)).toBeInTheDocument();
  });

  test('expired token triggers logout and shows login', () => {
    // Override jwt-decode to return expired token
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockImplementation(() => ({ isAdmin: false, exp: Math.floor(Date.now() / 1000) - 10 }));
    localStorage.setItem('token', 'expired.jwt');

    render(
  <MemoryRouter>
    <App />
  </MemoryRouter>
  );
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText(/Customer Login/i)).toBeInTheDocument();
  });

  test('decode error clears token and shows login', () => {
    const { jwtDecode } = require('jwt-decode');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock a token decode error
    jwtDecode.mockImplementation(() => { 
      throw new Error('bad token'); 
    });
    
    localStorage.setItem('token', 'bad.jwt');
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Check that token was cleared and user is sent to login
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText(/Customer Login/i)).toBeInTheDocument();
    
    // Verify error was logged (but not shown to user)
    expect(consoleError).toHaveBeenCalledWith('Invalid token:', expect.any(Error));
    
    // Clean up
    consoleError.mockRestore();
  });
});