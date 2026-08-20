import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      // Backend returns { success: true, message: '...', user: {...} }
      setUser(data.user || null);
    } catch (error) {
      // 401 or network error â€” not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for unauthorized events from the API interceptor
    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [fetchUser]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    // Do not set user here. User must verify email and then log in.
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

