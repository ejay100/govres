/**
 * GOVRES — Auth Context
 * React context + Zustand store for authentication state.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from './api';

export interface AuthUser {
  userId: string;
  accountId: string;
  role: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  kycVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('govres_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('govres_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verify token on mount
    if (token && !user) {
      authAPI.me()
        .then(res => {
          const u = res.data.data;
          const authUser: AuthUser = {
            userId: u.id,
            accountId: u.account_id,
            role: u.role,
            fullName: u.full_name,
            email: u.email,
            organizationId: u.org_code || '',
            organizationName: u.org_name || '',
            kycVerified: u.kyc_verified,
          };
          setUser(authUser);
          localStorage.setItem('govres_user', JSON.stringify(authUser));
        })
        .catch(() => {
          logout();
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const { token: newToken, user: userData } = res.data.data;
      const authUser: AuthUser = {
        userId: userData.userId,
        accountId: userData.accountId,
        role: userData.role,
        fullName: userData.fullName,
        email: userData.email,
        organizationId: userData.organizationId || '',
        organizationName: userData.organizationName || '',
        kycVerified: userData.kycVerified,
      };
      setToken(newToken);
      setUser(authUser);
      localStorage.setItem('govres_token', newToken);
      localStorage.setItem('govres_user', JSON.stringify(authUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('govres_token');
    localStorage.removeItem('govres_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Role-based route guard helper
export function getRoleDashboard(role: string): string {
  switch (role) {
    case 'BOG_ADMIN': return '/bog';
    case 'BOG_AUDITOR': return '/bog';
    case 'COMMERCIAL_BANK': return '/bank';
    case 'GOVT_AGENCY': return '/agency';
    case 'CONTRACTOR': return '/contractor';
    case 'FARMER': return '/farmer';
    case 'LBC': return '/farmer';
    case 'DIASPORA': return '/diaspora';
    default: return '/';
  }
}
