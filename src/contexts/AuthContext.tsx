import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.js';
import { apiClient } from '../services/apiClient.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (fullName: string, userName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('datahub_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiClient.get<User>('/auth/me');
        setUser(currentUser);
      } catch (err) {
        console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
        apiClient.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const data = await apiClient.post<{ token: string; user: User }>('/auth/login', {
      usernameOrEmail,
      password,
    });
    apiClient.setToken(data.token);
    setUser(data.user);
  };

  const register = async (fullName: string, userName: string, email: string, password: string) => {
    const data = await apiClient.post<{ token: string; user: User }>('/auth/register', {
      fullName,
      userName,
      email,
      password,
    });
    apiClient.setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
