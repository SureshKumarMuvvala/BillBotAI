import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  clearSession,
  isLocalEnvironment,
  isSessionValid,
  setSession,
  validateCredentials,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const isLocalBypass = isLocalEnvironment();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(isLocalBypass || isSessionValid());
    setIsLoading(false);
  }, [isLocalBypass]);

  const login = useCallback(async (username, password) => {
    await new Promise((r) => setTimeout(r, 280));
    if (validateCredentials(username, password)) {
      setSession();
      setIsAuthenticated(true);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid username or password.' };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      isLocalBypass,
      requiresAuth: !isLocalBypass,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, isLocalBypass, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
