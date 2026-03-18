import api from './api';

const blockService = {
  // Block a user
  blockUser: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/block`);
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: true, data: { blockedUsers: [] } };
    }
  },

  // Unblock a user
  unblockUser: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/unblock`);
      return response.data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return { success: true };
    }
  },

  // Get blocked users list
  getBlockedUsers: async () => {
    try {
      const response = await api.get('/users/blocked');
      return response.data;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return { 
        success: true, 
        data: { blockedUsers: [] } 
      };
    }
  },

  // Check if user is blocked
  checkBlockStatus: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/block-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking block status:', error);
      return { 
        success: true, 
        data: { isBlocked: false } 
      };
    }
  }
};

export default blockService;