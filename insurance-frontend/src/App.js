import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ReactFlowProvider } from 'reactflow';
import { Box } from '@mui/material';
import './App.css';

// Import components
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminLoginPage from './components/AdminLoginPage';
import RegistrationPage from './components/RegistrationPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FileClaim from './components/FileClaim';
import WorkflowDesigner from './components/WorkflowDesigner';
import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import AdjusterDashboard from './components/AdjusterDashboard';
import ClaimAssignment from './components/ClaimAssignment';
import DocumentProcessor from './components/DocumentProcessor';
import HighRiskAlerts from './components/HighRiskAlerts';
import WorkflowMetricsDashboard from './components/WorkflowMetricsDashboard'; // legacy admin metrics (route removed)
import CustomerMetricsDashboard from './components/CustomerMetricsDashboard';
import OverdueTasksReport from './components/OverdueTasksReport';
import BuyPolicy from './components/BuyPolicy';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (!decoded || (decoded.exp && decoded.exp < Date.now() / 1000)) {
          handleLogout();
          return;
        }
        // Ensure we have the required fields
        if (typeof decoded.isAdmin !== 'boolean') {
          console.error('Invalid token format: missing isAdmin field');
          handleLogout();
          return;
        }
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token:', error);
        handleLogout();
      }
    }
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Wrapper component for authenticated routes with layout
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    if (requireAdmin && !user?.isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Layout onLogout={handleLogout}>{children}</Layout>;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={token ? <Navigate to={user?.isAdmin ? '/admin-dashboard' : '/dashboard'} replace /> : <LandingPage />} />
        
        {/* Login Routes */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to={user?.isAdmin ? '/admin-dashboard' : '/dashboard'} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/admin/login"
          element={
            token ? (
              <Navigate to={user?.isAdmin ? '/admin-dashboard' : '/dashboard'} replace />
            ) : (
              <AdminLoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/register" element={<RegistrationPage />} />
        
        {/* Customer Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.isAdmin ? <Navigate to="/admin-dashboard" replace /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/buy-policy"
          element={
            <ProtectedRoute>
              <BuyPolicy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-claim"
          element={
            <ProtectedRoute>
              <FileClaim />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-processor"
          element={
            <ProtectedRoute>
              <DocumentProcessor />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workflows"
          element={
            <ProtectedRoute requireAdmin>
              <WorkflowList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workflow-editor/:workflowId"
          element={
            <ProtectedRoute requireAdmin>
              <WorkflowEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workflow-designer/:workflowId"
          element={
            <ProtectedRoute requireAdmin>
              <ReactFlowProvider>
                <WorkflowDesigner />
              </ReactFlowProvider>
            </ProtectedRoute>
          }
        />
        {/* Customer Metrics Route */}
        <Route
          path="/my-metrics"
          element={
            <ProtectedRoute>
              {user?.isAdmin ? <Navigate to="/admin-dashboard" replace /> : <CustomerMetricsDashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/high-risk-alerts"
          element={
            <ProtectedRoute requireAdmin>
              <HighRiskAlerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adjuster-dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdjusterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claim-assignment"
          element={
            <ProtectedRoute requireAdmin>
              <ClaimAssignment />
            </ProtectedRoute>
          }
        />
        
        {/* Shared Routes (Customer and Admin) */}
        <Route
          path="/overdue-tasks"
          element={
            <ProtectedRoute requireAdmin>
              <OverdueTasksReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  );
}

export default App;