/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthToken, setAuthToken, clearAuthToken, fetchApi } from '../lib/api';

// User type
interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'COACH' | 'STATISTICIAN' | 'VIEWER';
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        // Validate token and get user
        const userData = await fetchApi<{ user: User }>('/auth/me');
        setUser(userData.user);
      }
    } catch (error) {
      // Token invalid or expired
      await clearAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await setAuthToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await fetchApi<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    await setAuthToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchApi<{ user: User }>('/auth/me');
      setUser(userData.user);
    } catch {
      await logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
