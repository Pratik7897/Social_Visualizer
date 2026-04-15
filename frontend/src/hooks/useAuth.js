import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sc_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('sc_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('sc_token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.warn('Backend login failed, using bypass mode', err);
      // BYPASS: If backend fails, use mock alex user
      const mockUser = {
        _id: 'user_1',
        username: 'alex_m',
        displayName: 'Alex Morgan',
        email: email || 'alex@example.com',
        avatarColor: '#6366f1'
      };
      localStorage.setItem('sc_token', 'mock_token_bypass');
      setUser(mockUser);
      return mockUser;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      localStorage.setItem('sc_token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.warn('Backend registration failed, using bypass mode', err);
      const mockUser = {
        _id: 'user_new',
        username: data.username || 'new_user',
        displayName: data.displayName || 'New User',
        email: data.email || 'new@example.com',
        avatarColor: '#10b981'
      };
      localStorage.setItem('sc_token', 'mock_token_bypass');
      setUser(mockUser);
      return mockUser;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sc_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
