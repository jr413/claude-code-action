import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  planType: string;
  ageVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  isOver18: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Set auth header
  const setAuthHeader = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  };

  // Remove auth header
  const removeAuthHeader = () => {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken) {
        setAuthHeader(accessToken);
        try {
          const response = await axios.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          if (refreshToken) {
            try {
              await refreshTokenFunc();
            } catch {
              removeAuthHeader();
            }
          } else {
            removeAuthHeader();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      setAuthHeader(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      toast.success('ログインしました');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ログインに失敗しました');
      throw error;
    }
  };

  // Register
  const register = async (data: RegisterData) => {
    try {
      await axios.post('/auth/register', data);
      toast.success('登録が完了しました。メールを確認してください。');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '登録に失敗しました');
      throw error;
    }
  };

  // Logout
  const logout = () => {
    removeAuthHeader();
    setUser(null);
    toast.success('ログアウトしました');
    navigate('/login');
  };

  // Refresh token
  const refreshTokenFunc = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    try {
      const response = await axios.post('/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      setAuthHeader(accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Get user data
      const userResponse = await axios.get('/auth/me');
      setUser(userResponse.data.data);
    } catch (error) {
      removeAuthHeader();
      throw error;
    }
  };

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshTokenFunc();
            return axios(originalRequest);
          } catch {
            logout();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken: refreshTokenFunc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};