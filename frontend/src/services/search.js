import api from './api';

const searchService = {
  // Search messages in a specific conversation
  searchMessages: async (query, conversationId = null, page = 1) => {
    try {
      const params = { q: query, page };
      if (conversationId) {
        params.conversationId = conversationId;
      }
      
      const response = await api.get('/search/messages', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },

  // Global search across users, conversations, and messages
  globalSearch: async (query) => {
    try {
      const response = await api.get('/search/global', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error in global search:', error);
      throw error;
    }
  }
};

export default searchService;