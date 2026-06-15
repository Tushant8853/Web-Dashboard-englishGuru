import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { adminLogin } from '../api/client';
import { clearAdminToken, getAdminToken, setAdminToken } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAdminToken());

  const login = useCallback(async (username, password) => {
    const nextToken = await adminLogin(username, password);
    setAdminToken(nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
