import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. IMPORT
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { ToastNotifications } from './services/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter> {/* <-- 2. ADD THIS WRAPPER */}
        <ToastNotifications />
        <App />
      </BrowserRouter> {/* <-- 3. AND THIS WRAPPER */}
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();