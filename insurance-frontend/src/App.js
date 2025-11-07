import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ReactFlowProvider } from 'reactflow';
import './App.css';

// Import components
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FileClaim from './components/FileClaim';
import WorkflowDesigner from './components/WorkflowDesigner';
import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import AdjusterDashboard from './components/AdjusterDashboard';
import DocumentProcessor from './components/DocumentProcessor';
import HighRiskAlerts from './components/HighRiskAlerts';
import WorkflowMetricsDashboard from './components/WorkflowMetricsDashboard';
import OverdueTasksReport from './components/OverdueTasksReport';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          handleLogout();
        } else {
          setUser(decoded);
        }
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

  // Render logout button for authenticated users
  const LogoutButton = () => (
    <button onClick={handleLogout} role="button">Logout</button>
  );

  return (
    <div className="App">
      {token && <LogoutButton />}
      <Routes>
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
        <Route path="/register" element={<RegistrationPage />} />
        <Route
          path="/dashboard"
          element={
            token ? (
              user?.isAdmin ? (
                <Navigate to="/admin-dashboard" replace />
              ) : (
                <Dashboard />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Support both admin dashboard URLs */}
        <Route
          path="/admin/dashboard"
          element={token && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin-dashboard"
          element={token && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/file-claim"
          element={token ? <FileClaim /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/workflows"
          element={token && user?.isAdmin ? <WorkflowList /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/workflow-editor/:workflowId"
          element={token && user?.isAdmin ? <WorkflowEditor /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/workflow-designer/:workflowId"
          element={
            token && user?.isAdmin ? (
              <ReactFlowProvider>
                <WorkflowDesigner />
              </ReactFlowProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/adjuster-dashboard"
          element={token ? <AdjusterDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/document-processor"
          element={token ? <DocumentProcessor /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/high-risk-alerts"
          element={token ? <HighRiskAlerts /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/workflow-metrics"
          element={token && user?.isAdmin ? <WorkflowMetricsDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/overdue-tasks"
          element={token ? <OverdueTasksReport /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={
            token ? (
              <Navigate to={user?.isAdmin ? '/admin-dashboard' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;