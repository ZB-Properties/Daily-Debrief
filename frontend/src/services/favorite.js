import api from './api';

const favoritesService = {
  // Get all favorite conversations
  getFavorites: async () => {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  },

  // Get favorite contacts
  getFavoriteContacts: async () => {
    try {
      const response = await api.get('/favorites/contacts');
      return response.data;
    } catch (error) {
      console.error('Error getting favorite contacts:', error);
      throw error;
    }
  },

  // Toggle favorite for a conversation
  toggleFavorite: async (conversationId) => {
    try {
      const response = await api.post(`/favorites/toggle/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  // Toggle favorite for a user
  toggleUserFavorite: async (userId) => {
    try {
      const response = await api.post(`/favorites/user/${userId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling user favorite:', error);
      throw error;
    }
  },

  // Check if a conversation is favorited
  isFavorite: (conversation, userId) => {
    return conversation?.pinnedBy?.some(id => id.toString() === userId?.toString()) || false;
  },

  // Check if a user is favorited (via conversation)
  isUserFavorite: async (userId, currentUserId) => {
    try {
      const response = await api.get('/favorites/contacts');
      if (response.data.success) {
        return response.data.data.some(fav => fav._id === userId);
      }
      return false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }
};

export default favoritesService;