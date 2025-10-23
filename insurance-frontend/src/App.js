import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './App.css';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // A helper function to get user info from the token
  const getUser = () => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (e) {
      localStorage.removeItem('token');
      return null;
    }
  };
  const user = getUser();

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // Main App Shell with navigation (for logged-in users)
  const AppShell = ({ children }) => {
    const navigate = useNavigate();
    const handleLogoutAndRedirect = () => {
      handleLogout();
      navigate('/login');
    };
    return (
      <>
        <nav className="main-nav">
          <h1>Insurance Portal {user && user.isAdmin && '- ADMIN'}</h1>
          {user && (
            <button onClick={handleLogoutAndRedirect} className="logout-button">
              Logout
            </button>
          )}
        </nav>
        <div className="content">{children}</div>
      </>
    );
  };

  // This is the main view of our app
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Login Page Route */}
          <Route 
            path="/login" 
            element={
              !user ? (
                // 👇 WRAPPED IN THE CONTENT DIV
                <div className="content">
                  <LoginPage onLoginSuccess={handleLogin} />
                </div>
              ) : <Navigate to="/dashboard" />
            } 
          />
          
          {/* Registration Page Route */}
          <Route 
            path="/register" 
            element={
              !user ? (
                // 👇 WRAPPED IN THE CONTENT DIV
                <div className="content">
                  <RegistrationPage />
                </div>
              ) : <Navigate to="/dashboard" />
            } 
          />

          {/* Dashboard Route (Protected) */}
          <Route 
            path="/dashboard"
            element={
              user ? (
                <AppShell>
                  {user.isAdmin ? <AdminDashboard /> : <Dashboard />}
                </AppShell>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Default Route */}
          <Route 
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;