import api from './api';

const pinService = {
  // Pin/unpin a message
  togglePin: async (messageId) => {
    try {
      const response = await api.post(`/messages/${messageId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Get pinned message in conversation
  getPinnedMessage: async (conversationId) => {
    try {
      const response = await api.get(`/messages/conversation/${conversationId}/pinned`);
      return response.data;
    } catch (error) {
      console.error('Error getting pinned message:', error);
      throw error;
    }
  }
};

export default pinService;