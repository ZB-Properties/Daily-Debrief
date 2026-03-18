import api from './api';

const conversationService = {
  // Get all conversations
  getConversations: async () => {
    try {
      const response = await api.get('/chats/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get single conversation by ID
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    try {
      const response = await api.post(`/chats/conversation/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  },

  // Update conversation in local state array
  updateConversationInList: (conversations, updatedConv) => {
    const exists = conversations.some(c => c._id === updatedConv._id);
    
    if (exists) {
      // Update existing conversation
      return conversations.map(c => 
        c._id === updatedConv._id ? { ...c, ...updatedConv } : c
      ).sort((a, b) => 
        new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
      );
    } else {
      // Add new conversation
      return [updatedConv, ...conversations].sort((a, b) => 
        new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
      );
    }
  },

  // Format conversation for consistent structure
  formatConversation: (conv, userId) => {
    const isGroup = conv.isGroup === true;
    
    if (isGroup) {
      return {
        _id: conv._id,
        isGroup: true,
        groupName: conv.groupName || 'Group Chat',
        groupAvatar: conv.groupAvatar || '',
        participants: conv.participants || [],
        lastMessage: conv.lastMessage || null,
        lastActivity: conv.lastActivity || conv.createdAt || new Date(),
        unreadCount: conv.unreadCount || 0,
        isMuted: conv.isMuted || false,
        isPinned: conv.isPinned || false,
        isArchived: conv.isArchived || false
      };
    } else {
      const otherParticipant = conv.participant || 
        (conv.participants?.find(p => p._id !== userId) || {});
      
      return {
        _id: conv._id,
        isGroup: false,
        participant: otherParticipant,
        lastMessage: conv.lastMessage || null,
        lastActivity: conv.lastActivity || conv.createdAt || new Date(),
        unreadCount: conv.unreadCount || 0,
        isMuted: conv.isMuted || false,
        isPinned: conv.isPinned || false,
        isArchived: conv.isArchived || false
      };
    }
  }
};

export default conversationService;