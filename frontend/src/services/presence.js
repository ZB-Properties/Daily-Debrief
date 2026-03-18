import api from './api';

const presenceService = {
  // Get user presence
  getUserPresence: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/presence`);
      return response.data;
    } catch (error) {
      console.error('Error getting user presence:', error);
      throw error;
    }
  },

  // Format last seen text
  formatLastSeen: (lastSeen) => {
    if (!lastSeen) return 'offline';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return lastSeenDate.toLocaleDateString();
  }
};

export default presenceService;