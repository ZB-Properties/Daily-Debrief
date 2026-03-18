import api from './api';


const callService = {
  // Initiate a call
  initiateCall: async (receiverId, type = 'audio', sdpOffer = null) => {
    try {
      console.log('📤 API Call: POST /calls/initiate', { receiverId, type });
      
      const response = await api.post('/calls/initiate', {
        receiverId,
        type,
        sdpOffer: sdpOffer || '' // Send empty string if null
      });
      
      console.log('📥 API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error in initiateCall:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.response?.data?.error || error.message);

       // Log the validation errors if they exist
    if (error.response?.data?.errors) {
      console.error('   Validation Errors:', error.response.data.errors);
    }
      throw error;
    }
  },

  // Answer a call
  answerCall: async (callId, sdpAnswer) => {
    try {
      console.log('📤 API Call: PUT /calls/' + callId + '/answer');
      const response = await api.put(`/calls/${callId}/answer`, {
        sdpAnswer
      });
      return response.data;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  },

  // End a call
  endCall: async (callId) => {
    try {
      console.log('📤 API Call: PUT /calls/' + callId + '/end');
      const response = await api.put(`/calls/${callId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  },

  // Reject a call
  rejectCall: async (callId) => {
    try {
      console.log('📤 API Call: PUT /calls/' + callId + '/reject');
      const response = await api.put(`/calls/${callId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  },

  // Get call by ID
  getCallById: async (callId) => {
    try {
      const response = await api.get(`/calls/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call:', error);
      throw error;
    }
  },

  // Get call history
  getCallHistory: async (page = 1, limit = 50) => {
    try {
      const response = await api.get('/calls/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  }
};

export default callService;