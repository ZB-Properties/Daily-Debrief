import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('🔍 Checking auth with token...');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/auth/me');
      console.log('🔍 Auth check response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data?.user || response.data.user || response.data;
        console.log('✅ User authenticated:', userData);
        setUser(userData);
      }
    } catch (err) {
      console.error('❌ Auth check failed:', err.response?.data || err.message);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 login - Attempting login for:', email);
    setError(null);
    setAuthLoading(true);
    
    try {
      // Send ONLY email and password - no extra data
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });
      
      console.log('✅ Login response:', response.data);

      // Check for 2FA requirement
      if (response.data.requires2FA) {
        setAuthLoading(false);
        return { 
          requires2FA: true, 
          userId: response.data.userId 
        };
      }
      
      // Check for email verification requirement
      if (response.data.requiresVerification) {
        setAuthLoading(false);
        return { 
          requiresVerification: true, 
          email: response.data.email 
        };
      }

      // Handle successful login
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        console.log('✅ Login successful! User:', userData);
        
        // Store tokens
        if (tokens?.accessToken) {
          localStorage.setItem('token', tokens.accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        
        if (tokens?.refreshToken) {
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        
        // Set user state
        setUser(userData);
        setError(null);
        
        // Navigate to chats
        console.log('🚀 Navigating to /chats');
        navigate('/chats');
        
        return { success: true, data: userData };
      } else {
        const errorMsg = response.data.error || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      const errorMsg = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (userData) => {
    setAuthLoading(true);
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      console.log('📝 Register response:', response.data);
      
      if (response.data.success) {
        // Handle verification URL if present
        const verificationUrl = response.data.verificationUrl;
        
        // Store tokens if provided (for auto-login)
        if (response.data.data?.tokens) {
          const { tokens } = response.data.data;
          if (tokens?.accessToken) {
            localStorage.setItem('token', tokens.accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
          }
          if (tokens?.refreshToken) {
            localStorage.setItem('refreshToken', tokens.refreshToken);
          }
        }
        
        // Set user if provided
        if (response.data.data?.user) {
          setUser(response.data.data.user);
        }
        
        return { 
          success: true, 
          data: response.data.data,
          verificationUrl 
        };
      } else {
        setError(response.data.error || 'Registration failed');
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      console.error('❌ Registration error:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);
      navigate('/login');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('📤 Updating profile with:', profileData);
      
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.success) {
        const updatedUser = response.data.data?.user || profileData;
        
        setUser(currentUser => ({
          ...currentUser,
          ...updatedUser
        }));
        
        return { success: true, data: updatedUser };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      console.error('❌ Update profile error:', err);
      const errorMsg = err.response?.data?.error || 'Update failed';
      return { success: false, error: errorMsg };
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('refreshToken');
      if (!token) {
        logout();
        return null;
      }

      const response = await api.post('/auth/refresh', { refreshToken: token });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return accessToken;
      } else {
        logout();
        return null;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return null;
    }
  };

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    authLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    checkAuth,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;