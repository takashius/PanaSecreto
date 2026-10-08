import { createContext, useState, useEffect, ReactNode } from 'react';
import type { AuthContextType, AuthUser, LoginResponse } from '@app-types/auth';
import { canAccessWeb } from '../constants/roles';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('Token');
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('Token', token);
    } else {
      localStorage.removeItem('Token');
    }
  }, [token]);

  const login = (userData: LoginResponse) => {
    const { token: userToken, ...restUser } = userData;
    setToken(userToken);
    setUser(restUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('Token');
    localStorage.removeItem('user');
    window.location.assign('/login');
  };

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const getUser = (): AuthUser | null => {
    return user;
  };

  const hasWebAccess = (): boolean => {
    if (!user) return false;
    return canAccessWeb(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, getUser, hasWebAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
