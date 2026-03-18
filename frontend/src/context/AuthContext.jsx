import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/auth';

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
      
      const response = await api.get('/auth/me');
      console.log('🔍 Auth check response:', response.data);
      
      if (response.data.success) {
        // Handle different response structures
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
    
    try {
      const response = await authService.login(email, password);
      console.log('🔐 login - Full response:', response);
      console.log('🔐 login - Response data:', response.data);

      if (response.data.success) {
        // LOG THE ENTIRE RESPONSE STRUCTURE
        console.log('🔐 SUCCESS - Response structure:', {
          hasData: !!response.data.data,
          hasUser: !!response.data.user,
          dataKeys: response.data.data ? Object.keys(response.data.data) : [],
          responseKeys: Object.keys(response.data)
        });

        // Extract user data - handle multiple possible structures
        let userData = null;
        let accessToken = null;
        let refreshToken = null;

        // Structure 1: { data: { user: {...}, tokens: {...} } }
        if (response.data.data?.user) {
          userData = response.data.data.user;
          accessToken = response.data.data.tokens?.accessToken;
          refreshToken = response.data.data.tokens?.refreshToken;
          console.log('🔐 Structure 1: data.user');
        }
        // Structure 2: { user: {...}, tokens: {...} }
        else if (response.data.user) {
          userData = response.data.user;
          accessToken = response.data.tokens?.accessToken;
          refreshToken = response.data.tokens?.refreshToken;
          console.log('🔐 Structure 2: response.user');
        }
        // Structure 3: { data: {...} } where data is the user object
        else if (response.data.data && !response.data.data.user) {
          userData = response.data.data;
          accessToken = response.data.data.accessToken || response.data.token;
          refreshToken = response.data.data.refreshToken;
          console.log('🔐 Structure 3: data is user');
        }
        // Structure 4: response itself is user data
        else {
          userData = response.data;
          accessToken = response.data.accessToken || response.data.token;
          refreshToken = response.data.refreshToken;
          console.log('🔐 Structure 4: response is user');
        }

        if (!userData) {
          console.error('❌ Could not extract user data from response');
          setError('Invalid response format');
          return { success: false, error: 'Invalid response format' };
        }

        // Normalize user data
        const normalizedUser = {
          _id: userData._id || userData.id,
          id: userData._id || userData.id,
          name: userData.name || userData.username || 'User',
          email: userData.email,
          profileImage: userData.profileImage || userData.avatar || '',
          status: userData.status || 'offline',
          bio: userData.bio || "Hey there! I'm using Daily-Debrief",
          lastSeen: userData.lastSeen || new Date()
        };

        console.log('🔐 login - Normalized user:', normalizedUser);

        // Store tokens - handle multiple possible locations
        const finalAccessToken = accessToken || response.data.data?.accessToken || response.data.accessToken;
        const finalRefreshToken = refreshToken || response.data.data?.refreshToken || response.data.refreshToken;
        
        if (finalAccessToken) {
          localStorage.setItem('token', finalAccessToken);
          console.log('🔐 Token stored');
        } else {
          console.warn('⚠️ No access token found in response');
        }
        
        if (finalRefreshToken) {
          localStorage.setItem('refreshToken', finalRefreshToken);
        }
        
        // Set axios header
        if (finalAccessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${finalAccessToken}`;
        }
        
        setUser(normalizedUser);
        console.log('🔐 login - Success, navigating to /chats');
        navigate('/chats');
        return { success: true, data: normalizedUser };
      } else {
        console.error('❌ Login failed - server returned success: false');
        setError(response.data.error || 'Login failed');
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      console.error('🔐 login - Error object:', err);
      console.error('🔐 login - Error response:', err.response?.data);
      console.error('🔐 login - Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      console.error('🔐 login - Error message:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      console.log('📝 Register response:', response.data);
      
      if (response.data.success) {
        // Handle different response structures for registration
        let user = null;
        let tokens = null;
        
        if (response.data.data?.user) {
          user = response.data.data.user;
          tokens = response.data.data.tokens;
        } else if (response.data.user) {
          user = response.data.user;
          tokens = response.data.tokens;
        } else {
          user = response.data;
        }
        
        // Store tokens
        if (tokens?.accessToken) {
          localStorage.setItem('token', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        
        setUser(user);
        navigate('/chats');
        return { success: true, data: user };
      } else {
        setError(response.data.error || 'Registration failed');
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      console.error('❌ Registration error:', errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
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
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return null;
      }

      const response = await authService.refreshToken(refreshToken);
      
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