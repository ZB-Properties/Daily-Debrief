const { SOCKET_EVENTS } = require('../config/constants');
const { socketAuthMiddleware } = require('../middleware/auth');
const chatHandlers = require('./chatHandlers');
const callHandlers = require('./callHandlers');
const User = require('../models/User');

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // userId -> socket object
const heartbeatTimers = new Map(); // userId -> heartbeat timer
let globalIo = null;

const socketHandler = (io) => {
  globalIo = io;
  
  console.log('📡 Socket.IO handler initializing with heartbeat monitoring...');

  io.use((socket, next) => {
    try {
      socketAuthMiddleware(socket, (err) => {
        if (err) {
          console.error('❌ Socket auth failed:', err.message);
          return next(err);
        }
        console.log('✅ Socket authenticated for user:', socket.userId);
        console.log('   Socket ID:', socket.id);
        next();
      });
    } catch (error) {
      console.error('❌ Socket auth middleware error:', error);
      next(new Error('Authentication middleware error'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log('🔌 New connection attempt:', socket.id);
    
    if (!socket.userId) {
      console.error('❌ No userId attached to socket, disconnecting');
      socket.disconnect(true);
      return;
    }

    const userId = socket.userId.toString();
    console.log(`✅ User connected: ${userId} (socket: ${socket.id})`);
    
    // CRITICAL: Join a room with the user's ID for targeted messages
    socket.join(userId);
    console.log(`User ${userId} joined room: ${userId}`);
    
    // Clean up any existing connection for this user
    if (activeUsers.has(userId)) {
      const oldSocketId = activeUsers.get(userId);
      console.log(`🔄 User ${userId} had existing connection ${oldSocketId}, removing...`);
      
      const oldSocket = userSockets.get(userId);
      if (oldSocket && oldSocket.id !== socket.id) {
        oldSocket.leave(userId);
        oldSocket.disconnect(true);
      }
    }
    
    activeUsers.set(userId, socket.id);
    userSockets.set(userId, socket);
    
    // Clear any existing heartbeat timer for this user
    if (heartbeatTimers.has(userId)) {
      clearTimeout(heartbeatTimers.get(userId));
      heartbeatTimers.delete(userId);
    }
    
    // Update user status in database
    User.findByIdAndUpdate(userId, {
      status: 'online',
      socketId: socket.id,
      lastSeen: new Date()
    }).catch(err => console.error('DB update error:', err));
    
    // Broadcast online status to all other users
    socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
      userId,
      status: 'online'
    });
    
    // Send list of online users to the newly connected user
    const onlineUsersList = Array.from(activeUsers.keys());
    console.log(`   Sending online users list (${onlineUsersList.length} users):`, onlineUsersList);
    socket.emit(SOCKET_EVENTS.ONLINE_USERS, onlineUsersList);
    
    socket.emit('welcome', { 
      message: 'Connected to chat server',
      timestamp: new Date().toISOString(),
      userId: userId,
      socketId: socket.id
    });
    
    // ===== HEARTBEAT MECHANISM =====
    socket.on('heartbeat', (data) => {
      console.log(`💓 Heartbeat received from user ${userId}`);
      
      // Update user's last seen
      User.findByIdAndUpdate(userId, { 
        lastSeen: new Date() 
      }).catch(console.error);
      
      // Send acknowledgment
      socket.emit('heartbeat-ack', { 
        timestamp: Date.now(),
        userId 
      });
      
      // Reset heartbeat timer for this user
      if (heartbeatTimers.has(userId)) {
        clearTimeout(heartbeatTimers.get(userId));
      }
      
      // Set a new timer - if no heartbeat for 40 seconds, consider user disconnected
      const timer = setTimeout(() => {
        console.log(`⚠️ Heartbeat timeout for user ${userId}`);
        
        // Check if user still has any active connections
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          s => s.userId && s.userId.toString() === userId
        );
        
        if (!stillConnected) {
          console.log(`🔴 User ${userId} considered offline due to heartbeat timeout`);
          handleUserDisconnect(userId, 'heartbeat timeout');
        }
      }, 40000); // 40 seconds without heartbeat
      
      heartbeatTimers.set(userId, timer);
    });

    // Set up connection monitoring
    socket.conn.on('ping', () => {
      console.log(`📡 Ping sent to ${userId}`);
    });

    socket.conn.on('pong', () => {
      console.log(`📡 Pong received from ${userId}`);
    });
    
    // Initialize handlers
    chatHandlers(socket, io, activeUsers, userSockets);
    callHandlers(socket, io, activeUsers, userSockets);
    
    // ===== IMPROVED DISCONNECT HANDLING =====
    socket.on(SOCKET_EVENTS.DISCONNECT, async (reason) => {
      console.log(`🔴 User disconnected: ${userId}, Reason: ${reason}, Socket ID: ${socket.id}`);
      
      // Leave the user room
      socket.leave(userId);
      console.log(`   User ${userId} left room: ${userId}`);
      
      // Don't immediately mark as offline - wait a bit in case it's a temporary disconnect
      // This prevents status flickering during reconnection
      setTimeout(async () => {
        // Check if this socket is still the current one for this user
        const currentSocketId = activeUsers.get(userId);
        
        // Only process if this is the current socket AND no heartbeat timer exists
        if (currentSocketId === socket.id) {
          // Check if user still has any active connections
          const stillConnected = Array.from(io.sockets.sockets.values()).some(
            s => s.userId && s.userId.toString() === userId
          );
          
          if (!stillConnected) {
            console.log(`✅ Confirming user ${userId} is offline after ${reason}`);
            handleUserDisconnect(userId, reason);
          } else {
            console.log(`🔄 User ${userId} still has active connections, not marking offline`);
          }
        } else {
          console.log(`⚠️ Ignoring disconnect for stale socket ${socket.id} of user ${userId}`);
        }
      }, 3000); // Wait 3 seconds before confirming offline
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${userId}:`, error);
    });
  });
  
  console.log('✅ Socket.IO handler initialized with heartbeat monitoring');
};

// Helper function to handle user disconnect
const handleUserDisconnect = async (userId, reason) => {
  console.log(`🔴 Handling disconnect for user ${userId}, reason: ${reason}`);
  
  // Clear heartbeat timer
  if (heartbeatTimers.has(userId)) {
    clearTimeout(heartbeatTimers.get(userId));
    heartbeatTimers.delete(userId);
  }
  
  // Remove from active users
  activeUsers.delete(userId);
  userSockets.delete(userId);
  
  try {
    await User.findByIdAndUpdate(userId, {
      status: 'offline',
      socketId: null,
      lastSeen: new Date()
    });
    
    if (globalIo) {
      globalIo.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, {
        userId,
        status: 'offline'
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Helper functions
const getUserSocket = (userId) => {
  return userSockets.get(userId.toString());
};

const isUserOnline = (userId) => {
  return activeUsers.has(userId.toString());
};

const getOnlineUsers = () => {
  return Array.from(activeUsers.keys());
};

const emitToUser = (userId, event, data) => {
  const socketId = activeUsers.get(userId.toString());
  if (socketId && globalIo) {
    console.log(`📡 Emitting ${event} to user ${userId} via socket ${socketId}`);
    globalIo.to(socketId).emit(event, data);
    return true;
  } else {
    console.log(`❌ Cannot emit to user ${userId} - not online or no socket ID`);
    return false;
  }
};

const emitToRoom = (room, event, data) => {
  if (globalIo) {
    console.log(`📡 Emitting ${event} to room ${room}`);
    globalIo.to(room).emit(event, data);
    return true;
  }
  return false;
};

module.exports = {
  socketHandler,
  activeUsers,        
  userSockets,
  getUserSocket,
  isUserOnline,
  getOnlineUsers,
  emitToUser,
  emitToRoom
};