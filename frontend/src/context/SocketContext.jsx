import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import SoundManager from '../utils/sounds';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  
  const messageHandlers = useRef(new Map());
  const typingHandlers = useRef(new Map());
  const callHandlers = useRef(new Map());
  const conversationHandlers = useRef(new Map());
  const notificationHandlers = useRef(new Map());

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      cleanupSocket();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    connectSocket(token);

    return () => {
      cleanupSocket();
    };
  }, [user?._id]);

  const connectSocket = (token) => {
    if (socketRef.current) cleanupSocket();

    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
    
    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    socketRef.current = socket;
    window.__socket = socket; // Make socket globally available for debugging

    // Log all events for debugging
    socket.onAny((event, ...args) => {
      console.log(`📡 SOCKET EVENT RECEIVED: ${event}`, args);
    });

    // Specific event listeners for debugging
    socket.on('conversation-updated', (data) => {
      console.log('🎯 conversation-updated event caught at SocketContext level:', data);
    });

    socket.on('new-message', (data) => {
      console.log('🎯 new-message event caught at SocketContext level:', data);
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected with ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔴 WebSocket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('online-users', (users) => {
      console.log('👥 Online users updated:', users);
      setOnlineUsers(new Set(users));
    });

    socket.on('user-status-changed', ({ userId, status }) => {
      console.log('👤 User status changed:', userId, status);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    });

    socket.on('user-typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
      
      typingHandlers.current.forEach(handler => {
        if (handler.onTyping) handler.onTyping(data);
      });
    });

    socket.on('new-message', (message) => {
      console.log('📨 New message received:', message);
      
      if (message.senderId !== user?._id) {
        SoundManager.playMessage();
      }
      
      messageHandlers.current.forEach(handler => {
        if (handler.onNewMessage) handler.onNewMessage(message);
      });

      const conversationUpdate = {
        conversationId: message.conversationId || message.conversation,
        updates: { lastMessage: message, lastActivity: message.timestamp || new Date().toISOString() }
      };
      
      conversationHandlers.current.forEach(handler => {
        if (handler.onConversationUpdated) handler.onConversationUpdated(conversationUpdate);
      });
    });

    socket.on('message-delivered', (data) => {
      messageHandlers.current.forEach(handler => {
        if (handler.onMessageDelivered) handler.onMessageDelivered(data);
      });
    });

    socket.on('message-read', (data) => {
      messageHandlers.current.forEach(handler => {
        if (handler.onMessageRead) handler.onMessageRead(data);
      });
    });

    socket.on('message-edited', (data) => {
      messageHandlers.current.forEach(handler => {
        if (handler.onMessageEdited) handler.onMessageEdited(data);
      });
    });

    socket.on('conversation-updated', (data) => {
      console.log('🔄 SocketContext forwarding conversation-updated:', data);
      conversationHandlers.current.forEach(handler => {
        if (handler.onConversationUpdated) handler.onConversationUpdated(data);
      });
    });

    socket.on('new-notification', (notification) => {
      if (notification.senderId !== user?._id) {
        switch(notification.type) {
          case 'call': case 'video-call': SoundManager.playCall(); break;
          case 'message': SoundManager.playMessage(); break;
          case 'voice-note': SoundManager.playVoiceNote(); break;
          default: SoundManager.playBeep('notification');
        }
      }
      
      notificationHandlers.current.forEach(handler => {
        if (handler.onNewNotification) handler.onNewNotification(notification);
      });
    });

    socket.on('incoming-call', (callData) => {
      SoundManager.playCall();
      callHandlers.current.forEach(handler => {
        if (handler.onIncomingCall) handler.onIncomingCall(callData);
      });
    });

    socket.on('call-ended', (callData) => {
      SoundManager.playCallEnd();
      callHandlers.current.forEach(handler => {
        if (handler.onCallEnded) handler.onCallEnded(callData);
      });
    });
  };

  const cleanupSocket = () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
    
    messageHandlers.current.clear();
    typingHandlers.current.clear();
    callHandlers.current.clear();
    conversationHandlers.current.clear();
    notificationHandlers.current.clear();
  };

  // Registration methods
  const registerMessageHandler = (id, handlers) => {
    messageHandlers.current.set(id, handlers);
    return () => messageHandlers.current.delete(id);
  };

  const registerTypingHandler = (id, handlers) => {
    typingHandlers.current.set(id, handlers);
    return () => typingHandlers.current.delete(id);
  };

  const registerCallHandler = (id, handlers) => {
    callHandlers.current.set(id, handlers);
    return () => callHandlers.current.delete(id);
  };

  const registerConversationHandler = (id, handlers) => {
    console.log(`📝 Registering conversation handler: ${id}`);
    conversationHandlers.current.set(id, handlers);
    return () => {
      console.log(`🗑️ Unregistering conversation handler: ${id}`);
      conversationHandlers.current.delete(id);
    };
  };

  const registerNotificationHandler = (id, handlers) => {
    notificationHandlers.current.set(id, handlers);
    return () => notificationHandlers.current.delete(id);
  };

  // Emit methods
  const sendMessage = (conversationId, content) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('send-message', { conversationId, content });
    return true;
  };

  const sendTypingIndicator = (conversationId, isTyping) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('typing', { conversationId, isTyping });
    return true;
  };

  const markAsRead = (conversationId, messageId) => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('mark-read', { conversationId, messageId });
    return true;
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    registerMessageHandler,
    registerTypingHandler,
    registerCallHandler,
    registerConversationHandler,
    registerNotificationHandler
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;