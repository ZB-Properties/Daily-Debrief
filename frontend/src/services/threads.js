import api from './api';

const threadService = {
  // Reply to a message
  replyToMessage: async (messageId, content, type = 'text') => {
    try {
      const response = await api.post(`/messages/${messageId}/reply`, {
        content,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  },

  // Get message thread
  getMessageThread: async (messageId) => {
    try {
      const response = await api.get(`/messages/${messageId}/thread`);
      return response.data;
    } catch (error) {
      console.error('Error getting message thread:', error);
      throw error;
    }
  }
};

export default threadService;