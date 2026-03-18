import api from './api';

const chatService = {
  // Get all conversations for current user
  getConversations: async () => {
    try {
      const response = await api.get('/chats/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      const response = await api.get('/users/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Get all users (for contact list)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user's contacts
  getContacts: async () => {
    try {
      const response = await api.get('/users/contacts');
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  },

  // Add contact
  addContact: async (userId) => {
    try {
      const response = await api.post(`/users/contacts/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  },

  // Get or create private conversation
  getOrCreatePrivateConversation: async (userId) => {
    try {
      console.log('📤 Creating conversation with user:', userId);
      const response = await api.post('/chats/conversation', { userId });
      console.log('📥 Conversation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (conversationId, content, type = 'text', replyTo = null) => {
    try {
      console.log('📤 Sending message:', { conversationId, content, type, replyTo });
      
      const payload = {
        conversationId,
        content,
        type
      };
      
      // Add replyTo if provided
      if (replyTo) {
        payload.replyTo = replyTo;
      }
      
      const response = await api.post('/messages', payload);
      
      console.log('📥 Message response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error.response?.data || error.message);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, messageIds) => {
    try {
      const response = await api.post(`/chats/conversation/${conversationId}/read`, {
        messageIds
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Pin/unpin conversation
  togglePin: async (conversationId) => {
    try {
      const response = await api.put(`/chats/conversation/${conversationId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Mute/unmute conversation
  toggleMute: async (conversationId) => {
    try {
      const response = await api.put(`/chats/conversation/${conversationId}/mute`);
      return response.data;
    } catch (error) {
      console.error('Error toggling mute:', error);
      throw error;
    }
  },

  // Archive/unarchive conversation
  toggleArchive: async (conversationId) => {
    try {
      const response = await api.put(`/chats/conversation/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error toggling archive:', error);
      throw error;
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/chats/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/chats/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Get conversation by ID
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Update conversation custom name
  updateCustomName: async (conversationId, customName) => {
    try {
      console.log('📝 Updating custom name:', { conversationId, customName });
      const response = await api.put(`/chats/conversation/${conversationId}/custom-name`, {
        customName
      });
      console.log('📥 Custom name update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating custom name:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create group chat - IMPROVED VERSION
  createGroupChat: async (name, participants) => {
    try {
      if (!name || !name.trim()) {
        throw new Error('Group name is required');
      }
      if (!participants || !Array.isArray(participants) || participants.length < 2) {
        throw new Error('At least 2 participants are required');
      }

      console.log('📤 Creating group:', { name: name.trim(), participants });
      
      const response = await api.post('/chats/group', { 
        name: name.trim(), 
        participants 
      });
      
      console.log('📥 Group created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error.response?.data || error);
      throw error;
    }
  },

  // Add participants to group
  addGroupParticipants: async (groupId, participants) => {
    try {
      const response = await api.post(`/chats/group/${groupId}/add`, { participants });
      return response.data;
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  },

  // Remove participant from group
  removeGroupParticipant: async (groupId, userId) => {
    try {
      const response = await api.delete(`/chats/group/${groupId}/participant/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Update group info
  updateGroupInfo: async (groupId, data) => {
    try {
      const response = await api.put(`/chats/group/${groupId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  // First upload file to Cloudinary, then send as message
  uploadFile: async (conversationId, file, caption = '') => {
    try {
      console.log('📤 Starting file upload:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }

      const fileData = uploadResponse.data.data;
      console.log('✅ Upload successful:', fileData);

      let messageType = 'file';
      if (fileData.resource_type === 'image') messageType = 'image';
      else if (fileData.resource_type === 'video') messageType = 'video';
      else if (fileData.mime_type?.startsWith('audio/')) messageType = 'audio';

      const messageData = {
        conversationId: conversationId,
        content: caption || '',
        type: messageType,
        fileUrl: String(fileData.url || ''),
        fileName: String(fileData.original_filename || file.name || ''),
        fileSize: Number(fileData.bytes || 0),
        filePublicId: String(fileData.public_id || ''),
      };

      if (fileData.thumbnail_url) {
        messageData.thumbnailUrl = String(fileData.thumbnail_url);
      }
      if (fileData.duration) {
        messageData.duration = Number(fileData.duration);
      }

      console.log('📤 Sending message data:', messageData);

      const messageResponse = await api.post('/messages', messageData);

      console.log('✅ Message created:', messageResponse.data);
      return messageResponse.data;
    } catch (error) {
      console.error('❌ Upload error:', error.response?.data || error);
      throw error;
    }
  },

  // Send voice note
  sendVoiceNote: async (conversationId, audioBlob, caption = '') => {
    try {
      console.log('🎤 Starting voice note upload...');
      console.log('Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      let fileExtension = 'webm';
      if (audioBlob.type.includes('mp4')) {
        fileExtension = 'mp4';
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
        fileExtension = 'mp3';
      }
      
      const fileName = `voice-note-${Date.now()}.${fileExtension}`;
      
      const formData = new FormData();
      formData.append('file', audioBlob, fileName);

      const uploadResponse = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!uploadResponse.data.success) {
        console.error('❌ Upload failed:', uploadResponse.data);
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }

      const fileData = uploadResponse.data.data;
      console.log('✅ Voice note uploaded to Cloudinary:', fileData);

      const messageData = {
        conversationId: conversationId,
        content: caption || '',
        type: 'audio',
        fileUrl: String(fileData.url || ''),
        fileName: String(fileData.original_filename || fileName),
        fileSize: Number(fileData.bytes || audioBlob.size),
        filePublicId: String(fileData.public_id || ''),
      };

      if (fileData.duration) {
        messageData.duration = Number(fileData.duration);
      }

      console.log('📤 Sending voice note message:', messageData);

      const messageResponse = await api.post('/messages', messageData);

      console.log('✅ Voice note message created:', messageResponse.data);
      return messageResponse.data;
    } catch (error) {
      console.error('❌ Error sending voice note:', error.response?.data || error);
      throw error;
    }
  },

  // Delete message for me
  deleteMessageForMe: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}/me`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message for me:', error);
      throw error;
    }
  },

  // Delete message for everyone
  deleteMessageForEveryone: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}/everyone`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // ========== NEW METHODS FOR CHAT INFO PAGE ==========

  // Get conversation details (with full info)
  getConversationDetails: async (conversationId) => {
    try {
      console.log('📤 Fetching conversation details for:', conversationId);
      const response = await api.get(`/chats/conversation/${conversationId}/details`);
      console.log('📥 Conversation details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create invite link for conversation
  createInviteLink: async (conversationId) => {
    try {
      console.log('🔗 Creating invite link for:', conversationId);
      const response = await api.post(`/chats/${conversationId}/invite-link`);
      console.log('📥 Invite link response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating invite link:', error.response?.data || error.message);
      throw error;
    }
  },

  // Make user admin in group
  makeAdmin: async (conversationId, userId) => {
    try {
      console.log('👑 Making user admin:', { conversationId, userId });
      const response = await api.post(`/chats/group/${conversationId}/admins`, { userId });
      console.log('📥 Make admin response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error making admin:', error.response?.data || error.message);
      throw error;
    }
  },

  // Remove member from group
  removeMember: async (conversationId, userId) => {
    try {
      console.log('🗑️ Removing member:', { conversationId, userId });
      const response = await api.delete(`/chats/group/${conversationId}/members/${userId}`);
      console.log('📥 Remove member response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing member:', error.response?.data || error.message);
      throw error;
    }
  },

  // Leave group
  leaveGroup: async (conversationId) => {
    try {
      console.log('🚪 Leaving group:', conversationId);
      const response = await api.post(`/chats/group/${conversationId}/leave`);
      console.log('📥 Leave group response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error leaving group:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get media from conversation
  getConversationMedia: async (conversationId, type = 'all', page = 1, limit = 20) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}/media`, {
        params: { type, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  },

  // Get files from conversation
  getConversationFiles: async (conversationId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}/files`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // Get links from conversation
  getConversationLinks: async (conversationId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}/links`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching links:', error);
      throw error;
    }
  },

  // Search messages in conversation
  searchConversationMessages: async (conversationId, query, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/chats/conversation/${conversationId}/search`, {
        params: { q: query, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
};

export default chatService;