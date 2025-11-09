import React from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Create axios instance with defaults
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(
                        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v2/auth/refresh`,
                        { refreshToken }
                    );
                    
                    const { token } = response.data.data;
                    localStorage.setItem('token', token);
                    
                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || 'An error occurred';
        
        // Don't show toast for certain status codes (handled by component)
        if (![401, 403, 404].includes(error.response?.status)) {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);

// Export axios instance
export default api;

// Toast notification component wrapper
export const ToastNotifications = () => (
    <Toaster
        position="top-right"
        toastOptions={{
            duration: 4000,
            style: {
                background: '#363636',
                color: '#fff',
            },
            success: {
                duration: 3000,
                iconTheme: {
                    primary: '#4caf50',
                    secondary: '#fff',
                },
            },
            error: {
                duration: 4000,
                iconTheme: {
                    primary: '#f44336',
                    secondary: '#fff',
                },
            },
        }}
    />
);
