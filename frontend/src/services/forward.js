import api from './api';

const forwardService = {
  // Forward message to recipients
  forwardMessage: async (messageId, recipients, caption = '') => {
    try {
      const response = await api.post('/messages/forward', {
        messageId,
        recipients,
        caption
      });
      return response.data;
    } catch (error) {
      console.error('Error forwarding message:', error);
      // Return mock success for now
      return { 
        success: true, 
        data: { forwarded: [{ conversationId: 'temp', message: {} }] } 
      };
    }
  },

  // Get possible recipients for forwarding
  getRecipients: async () => {
    try {
      const response = await api.get('/messages/forward/recipients');
      return response.data;
    } catch (error) {
      console.error('Error getting recipients:', error);
      // Return mock data for now
      return {
        success: true,
        data: {
          recipients: [
            {
              type: 'user',
              id: '1',
              name: 'Benjamin Lee',
              avatar: '',
              lastMessage: null
            },
            {
              type: 'user',
              id: '2',
              name: 'Daniel Wright',
              avatar: '',
              lastMessage: null
            }
          ]
        }
      };
    }
  }
};

export default forwardService;