import { io } from 'socket.io-client';


const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to socket server
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('🔌 Connecting to socket at:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('🔌 Socket disconnected');
    }
  }

  // Emit event
  emit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
      return false;
    }

    console.log(`📤 Emitting ${event}:`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Listen to event
  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    console.log(`👂 Listening for event: ${event}`);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from listeners map
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
    
    console.log(`👂 Stopped listening for event: ${event}`);
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.off(event, callback);
      });
    });
    
    this.listeners.clear();
    console.log('🧹 Removed all listeners');
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Send message
  sendMessage(receiverId, content, type = 'text', file = null) {
    return this.emit('send-message', {
      receiverId,
      content,
      type,
      file,
      timestamp: new Date().toISOString()
    });
  }

  // Typing indicator
  sendTypingIndicator(receiverId, isTyping) {
    return this.emit('typing', { receiverId, isTyping });
  }

  // Mark message as read
  markMessageAsRead(messageId, conversationId) {
    return this.emit('message-read', { messageId, conversationId });
  }

  // React to message
  reactToMessage(messageId, emoji) {
    return this.emit('message-reaction', { messageId, emoji });
  }

  // Delete message
  deleteMessage(messageId) {
    return this.emit('delete-message', { messageId });
  }

  // ===== CALL METHODS WITH CORRECT EVENT NAMES =====
  
  // Initiate call - matches backend SOCKET_EVENTS.INITIATE_CALL
  initiateCall(receiverId, type = 'audio', sdpOffer) {
    return this.emit('initiate-call', { 
      receiverId, 
      type,
      sdpOffer 
    });
  }

  // Answer call - matches backend SOCKET_EVENTS.CALL_ANSWER
  answerCall(callId, sdpAnswer) {
    return this.emit('call-answer', { callId, sdpAnswer });
  }

  // End call - matches backend SOCKET_EVENTS.END_CALL
  endCall(callId) {
    return this.emit('end-call', { callId });
  }

  // Reject call - matches backend SOCKET_EVENTS.CALL_REJECTED
  rejectCall(callId) {
    return this.emit('call-rejected', { callId });
  }

  // Send ICE candidate - matches backend SOCKET_EVENTS.CALL_ICE_CANDIDATE
  sendIceCandidate(callId, candidate, targetUserId) {
    return this.emit('ice-candidate', { callId, candidate, targetUserId });
  }

  // Join room
  joinRoom(roomId) {
    return this.emit('join-room', { roomId });
  }

  // Leave room
  leaveRoom(roomId) {
    return this.emit('leave-room', { roomId });
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;