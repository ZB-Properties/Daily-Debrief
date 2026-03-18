import api from './api';

const reactionService = {
  // Add or remove reaction
  toggleReaction: async (messageId, emoji) => {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
      return response.data;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  },

  // Get reactions for message
  getReactions: async (messageId) => {
    try {
      const response = await api.get(`/messages/${messageId}/reactions`);
      return response.data;
    } catch (error) {
      console.error('Error getting reactions:', error);
      throw error;
    }
  }
};

export default reactionService;