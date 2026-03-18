const { createNotification } = require('../controllers/notificationController');

const notificationHandlers = (socket, io, activeUsers, userSockets) => {
  const userId = socket.userId.toString();

  // Helper to send notification to user
  const sendNotification = async (recipientId, notificationData) => {
    try {
      // Save to database
      const notification = await createNotification({
        recipient: recipientId,
        ...notificationData
      });

      if (!notification) return;

      // Send real-time if user is online
      const recipientSocket = userSockets.get(recipientId.toString());
      if (recipientSocket) {
        recipientSocket.emit('new-notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Make sendNotification available to other handlers
  socket.sendNotification = sendNotification;

  // Handle notification read events
  socket.on('mark-notification-read', async ({ notificationId }) => {
    try {
      // Broadcast to other devices that notification was read
      socket.broadcast.emit('notification-read', { notificationId });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  });

  socket.on('mark-all-notifications-read', async () => {
    try {
      // Broadcast to other devices that all were read
      socket.broadcast.emit('all-notifications-read', { userId });
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  });
};

module.exports = {
  notificationHandlers,
  // Export for use in other handlers
  createNotification
};