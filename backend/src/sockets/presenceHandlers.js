const User = require('../models/User');

const presenceHandlers = (socket, io, activeUsers, userSockets) => {
  const userId = socket.userId.toString();

  // Handle user presence check
  socket.on('get-user-presence', async ({ targetUserId }) => {
    try {
      const isOnline = activeUsers.has(targetUserId);
      const user = await User.findById(targetUserId).select('lastSeen status');

      socket.emit('user-presence', {
        userId: targetUserId,
        isOnline,
        lastSeen: user?.lastSeen,
        status: user?.status
      });
    } catch (error) {
      console.error('Error getting user presence:', error);
    }
  });

  // Update user status
  socket.on('update-status', async ({ status }) => {
    try {
      await User.findByIdAndUpdate(userId, { 
        status,
        lastSeen: new Date()
      });

      // Broadcast status change to all users who have this user in their contacts
      socket.broadcast.emit('user-status-changed', {
        userId,
        status,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  });
};

module.exports = presenceHandlers;