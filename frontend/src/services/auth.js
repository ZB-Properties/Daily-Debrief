import api from './api';

const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('🔧 authService.login response:', response);
      return response;
    } catch (error) {
      console.error('🔧 authService.login error:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },

  async refreshToken(refreshToken) {
    return api.post('/auth/refresh', { refreshToken });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(resetToken, password) {
    return api.put(`/auth/reset-password/${resetToken}`, { password });
  },

  async changePassword(currentPassword, newPassword) {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async updateProfile(profileData) {
    return api.put('/users/profile', profileData);
  },

  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return api.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async deleteProfileImage() {
    return api.delete('/users/profile/image');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`
    };
  }
};

export default authService;