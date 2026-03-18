const reactionHandlers = (socket, io, activeUsers, userSockets) => {
  const userId = socket.userId.toString();

  socket.on('message-reaction', async (data) => {
    try {
      const { messageId, emoji, conversationId } = data;

      // Broadcast to all users in the conversation
      io.to(`conversation-${conversationId}`).emit('message-reaction', {
        messageId,
        conversationId,
        userId,
        emoji
      });
    } catch (error) {
      console.error('Error in reaction handler:', error);
    }
  });
};

module.exports = reactionHandlers;