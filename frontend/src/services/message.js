import api from './api';

const messageService = {
  // Get message by ID
  getMessage: async (messageId) => {
    try {
      const response = await api.get(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching message:', error);
      throw error;
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      console.log('✏️ Editing message:', { messageId, content });
      const response = await api.put(`/messages/${messageId}`, { content });
      console.log('✏️ Edit response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // React to message
  reactToMessage: async (messageId, emoji) => {
    try {
      const response = await api.post(`/messages/${messageId}/react`, { emoji });
      return response.data;
    } catch (error) {
      console.error('Error reacting to message:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

export default messageService;