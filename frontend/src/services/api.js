import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${import.meta.env.REACT_APP_API_URL}/auth/refresh`,
          { refreshToken }
        );
        
        if (response.data.success) {
          const { accessToken } = response.data.data;
          localStorage.setItem('token', accessToken);
          
          // Update socket auth
          if (window.__socket) {
            window.__socket.auth.token = accessToken;
          }
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);


// API helper functions
const get = (url, params = {}, config = {}) => {
  return api.get(url, { params, ...config });
};

const post = (url, data = {}, config = {}) => {
  return api.post(url, data, config);
};

const put = (url, data = {}, config = {}) => {
  return api.put(url, data, config);
};

const patch = (url, data = {}, config = {}) => {
  return api.patch(url, data, config);
};

const del = (url, config = {}) => {
  return api.delete(url, config);
};

export default {
  ...api,
  get,
  post,
  put,
  patch,
  delete: del
};