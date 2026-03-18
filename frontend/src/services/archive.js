import api from './api';

const archiveService = {
  // Get archived conversations
  getArchivedConversations: async () => {
    try {
      const response = await api.get('/chats/archived');
      return response.data;
    } catch (error) {
      console.error('Error getting archived conversations:', error);
      throw error;
    }
  },

  // Archive a conversation
  archiveConversation: async (conversationId) => {
    try {
      const response = await api.put(`/chats/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  },

  // Unarchive a conversation
  unarchiveConversation: async (conversationId) => {
    try {
      const response = await api.put(`/chats/${conversationId}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      throw error;
    }
  },

  // Delete archived conversation permanently
  deleteArchivedConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/chats/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error deleting archived conversation:', error);
      throw error;
    }
  }
};

export default archiveService;