import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [csrfToken, setCsrfToken] = useState(null);

  const applySession = useCallback((data) => {
    setUser(data?.authenticated ? data.user : null);
    setCsrfToken(data?.csrfToken || null);
  }, []);

  const refresh = useCallback(async () => {
    const response = await api('/api/auth/me');
    applySession(response.data);
    return response;
  }, [applySession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const response = await api('/api/auth/login', { method: 'POST', body: { username, password } });
    if (response.ok) {
      setUser(response.data.user);
      setCsrfToken(response.data.csrfToken);
    }
    return response;
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCsrfToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading: user === undefined, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
