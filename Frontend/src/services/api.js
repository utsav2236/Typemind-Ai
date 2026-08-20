import axios from 'axios';

// For this frontend-only implementation with a ready backend,
// we'll assume the backend runs on http://localhost:5000/api
// and we'll use credentials for HTTP-only cookies.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to attach the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401, it means the session is invalid.
    if (error.response && error.response.status === 401) {
      // We can emit a custom event or let the AuthContext handle it
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
