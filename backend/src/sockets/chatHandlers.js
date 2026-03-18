const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { SOCKET_EVENTS } = require('../config/constants');
const { logger } = require('../utils/logger');

const chatHandlers = (socket, io, activeUsers, userSockets) => {
  const userId = socket.userId.toString();
  
  console.log(`📋 Chat handlers initialized for user ${userId} with socket ${socket.id}`);
  
  // Send message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
    try {
      const { receiverId, content, type = 'text', fileUrl, fileName, fileSize, mimeType, duration, replyTo } = data;
      
      console.log(`📨 SEND_MESSAGE from ${userId} to ${receiverId}: ${content?.substring(0, 50)}`);
      
      // Validate receiver
      if (!receiverId || receiverId === userId) {
        console.log('❌ Invalid receiver');
        return socket.emit('error', { message: 'Invalid receiver' });
      }
      
      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver || !receiver.isActive) {
        console.log('❌ Receiver not found');
        return socket.emit('error', { message: 'Receiver not found' });
      }
      
      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId] }
      });
      
      if (!conversation) {
        console.log('📝 Creating new conversation');
        
        // Create unreadCount Map
        const unreadMap = new Map();
        unreadMap.set(userId, 0);
        unreadMap.set(receiverId, 0);
        
        conversation = new Conversation({
          participants: [userId, receiverId],
          isGroup: false,
          unreadCount: unreadMap,
          mutedBy: [],
          pinnedBy: [],
          archivedBy: [],
          deletedBy: [],
          customName: new Map(),
          customImage: new Map(),
          lastActivity: new Date()
        });
        await conversation.save();
        console.log('✅ New conversation created with ID:', conversation._id);
      }
      
      // Create message
      const messageData = {
        conversation: conversation._id,
        sender: userId,
        receiver: receiverId,
        content: content || '',
        type,
        read: false,
        delivered: false
      };
      
      if (fileUrl) messageData.fileUrl = fileUrl;
      if (fileName) messageData.fileName = fileName;
      if (fileSize) messageData.fileSize = fileSize;
      if (mimeType) messageData.fileMimeType = mimeType;
      if (duration) messageData.duration = duration;
      if (replyTo) messageData.replyTo = replyTo;
      
      const message = new Message(messageData);
      await message.save();
      console.log(`✅ Message created with ID: ${message._id}`);
      
      // Populate sender info
      await message.populate('sender', 'name profileImage email');
      
      // Populate replyTo if it exists
      if (message.replyTo) {
        await message.populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name profileImage' }
        });
      }
      
      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastActivity = new Date();
      
      // Increment unread count for receiver
      const currentCount = conversation.unreadCount?.get(receiverId) || 0;
      conversation.unreadCount.set(receiverId, currentCount + 1);
      await conversation.save();
      
      // Get receiver info for sender's update
      const receiverUser = await User.findById(receiverId).select('name profileImage email status');
      
      // Prepare message object for socket emission
      const messageForSocket = {
        ...message.toObject(),
        conversationId: conversation._id,
        conversation: conversation._id,
        replyTo: message.replyTo ? {
          _id: message.replyTo._id,
          content: message.replyTo.content,
          sender: message.replyTo.sender ? {
            _id: message.replyTo.sender._id,
            name: message.replyTo.sender.name,
            profileImage: message.replyTo.sender.profileImage
          } : null
        } : null
      };
      
      // Create formatted conversation object for receiver
      const formattedForReceiver = {
        _id: conversation._id,
        isGroup: false,
        participant: {
          _id: userId,
          name: socket.user?.name || 'User',
          profileImage: socket.user?.profileImage || ''
        },
        lastMessage: messageForSocket,
        lastActivity: new Date(),
        unreadCount: conversation.unreadCount?.get(receiverId) || 1,
        isMuted: conversation.mutedBy?.some(id => id.toString() === receiverId) || false,
        isPinned: conversation.pinnedBy?.some(id => id.toString() === receiverId) || false,
        isArchived: conversation.archivedBy?.some(id => id.toString() === receiverId) || false
      };
      
      // Create formatted conversation object for sender
      const formattedForSender = {
        _id: conversation._id,
        isGroup: false,
        participant: receiverUser ? {
          _id: receiverId,
          name: receiverUser.name,
          profileImage: receiverUser.profileImage || '',
          status: receiverUser.status || 'offline'
        } : null,
        lastMessage: messageForSocket,
        lastActivity: new Date(),
        unreadCount: 0, // Sender's unread count is 0 for their own message
        isMuted: conversation.mutedBy?.some(id => id.toString() === userId) || false,
        isPinned: conversation.pinnedBy?.some(id => id.toString() === userId) || false,
        isArchived: conversation.archivedBy?.some(id => id.toString() === userId) || false
      };
      
      console.log('🔍 DEBUG - Emitting to sender socket:', socket.id);
      console.log('🔍 DEBUG - Sender conversation object:', JSON.stringify(formattedForSender, null, 2));
      
      // Emit to sender (confirmation)
      socket.emit('message-sent', {
        success: true,
        message: messageForSocket,
        conversationId: conversation._id
      });
      
      // Update sender's own conversation list
      socket.emit('conversation-updated', {
        conversationId: conversation._id,
        conversation: formattedForSender,
        updates: {
          lastMessage: messageForSocket,
          lastActivity: new Date(),
          unreadCount: 0
        }
      });
      console.log('✅ Emitted conversation-updated to sender');
      
      // Emit to receiver if online
      const receiverSocketId = activeUsers?.get(receiverId);
      console.log('🔍 DEBUG - Receiver socket ID:', receiverSocketId);
      
      if (receiverSocketId) {
        console.log(`📨 Delivering message to online user ${receiverId} via socket ${receiverSocketId}`);
        console.log('🔍 DEBUG - Receiver conversation object:', JSON.stringify(formattedForReceiver, null, 2));
        
        // Send the new message
        io.to(receiverSocketId).emit('new-message', messageForSocket);
        console.log('✅ Emitted new-message to receiver');
        
        // Emit conversation-updated to receiver
        io.to(receiverSocketId).emit('conversation-updated', {
          conversationId: conversation._id,
          conversation: formattedForReceiver,
          updates: {
            lastMessage: messageForSocket,
            lastActivity: new Date(),
            unreadCount: conversation.unreadCount?.get(receiverId) || 1
          }
        });
        console.log('✅ Emitted conversation-updated to receiver');
        
        // Update message delivery status
        message.delivered = true;
        message.deliveredAt = new Date();
        await message.save();
        
        // Emit delivery confirmation to sender
        socket.emit('message-delivered', {
          messageId: message._id,
          deliveredAt: message.deliveredAt
        });
        
        console.log(`✅ Message delivered to ${receiverId}`);
      } else {
        console.log(`📨 User ${receiverId} is offline, message saved for later`);
      }
      
      logger.info(`Message sent from ${userId} to ${receiverId}`);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Typing indicator
  socket.on(SOCKET_EVENTS.TYPING, async (data) => {
    try {
      const { receiverId, isTyping } = data;
      
      if (!receiverId || receiverId === userId) {
        return;
      }
      
      const receiverSocketId = activeUsers?.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          userId,
          isTyping
        });
      }
    } catch (error) {
      logger.error('Error handling typing indicator:', error);
    }
  });
  
  // Mark message as read
  socket.on('message-read', async (data) => {
    try {
      const { messageId, conversationId } = data;
      
      console.log(`👁️ Marking message as read:`, { messageId, conversationId, userId });
      
      const message = await Message.findById(messageId);
      
      if (!message || message.receiver.toString() !== userId) {
        console.log('❌ Cannot mark message as read - not the receiver');
        return;
      }
      
      // Mark as read
      message.read = true;
      message.readAt = new Date();
      await message.save();
      
      // Update conversation unread count
      if (conversationId) {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const count = conversation.unreadCount?.get(userId) || 0;
          if (count > 0) {
            conversation.unreadCount.set(userId, 0);
            await conversation.save();
            
            // Get conversation for update
            const conversationForUpdate = {
              _id: conversation._id,
              unreadCount: 0
            };
            
            // Emit updated unread count to sender
            const senderSocketId = activeUsers?.get(message.sender.toString());
            if (senderSocketId) {
              io.to(senderSocketId).emit('conversation-updated', {
                conversationId,
                conversation: conversationForUpdate,
                updates: {
                  unreadCount: 0
                }
              });
            }
            
            // Also emit to the reader themselves
            socket.emit('conversation-updated', {
              conversationId,
              conversation: conversationForUpdate,
              updates: {
                unreadCount: 0
              }
            });
          }
        }
      }
      
      // Notify sender that message was read
      const senderSocketId = activeUsers?.get(message.sender.toString());
      if (senderSocketId) {
        console.log(`📨 Notifying sender that message was read`);
        io.to(senderSocketId).emit('message-read', {
          messageId: message._id,
          conversationId,
          readAt: message.readAt
        });
      }
      
    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  });
  
  // Edit message
  socket.on(SOCKET_EVENTS.EDIT_MESSAGE, async (data) => {
    try {
      const { messageId, content } = data;
      
      console.log(`✏️ Editing message:`, { messageId, userId });
      
      const message = await Message.findOne({ _id: messageId, sender: userId });
      
      if (!message) {
        console.log('❌ Message not found or unauthorized');
        return socket.emit('error', { message: 'Message not found or unauthorized' });
      }
      
      // Check if message is less than 1 hour old
      const messageTime = new Date(message.createdAt).getTime();
      const oneHourAgo = Date.now() - 3600000;
      
      if (messageTime < oneHourAgo) {
        console.log('❌ Message too old to edit');
        return socket.emit('error', { message: 'Cannot edit messages older than 1 hour' });
      }
      
      // Update message
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();
      
      await message.populate('sender', 'name profileImage email');
      
      // Notify receiver if online
      const receiverSocketId = activeUsers?.get(message.receiver.toString());
      if (receiverSocketId) {
        console.log(`📨 Notifying receiver about edited message`);
        io.to(receiverSocketId).emit('message-edited', {
          messageId: message._id,
          conversationId: message.conversation,
          content: message.content,
          editedAt: message.editedAt
        });
      }
      
      // Confirm to sender
      socket.emit('message-edited', {
        messageId: message._id,
        conversationId: message.conversation,
        content: message.content,
        editedAt: message.editedAt
      });
      
    } catch (error) {
      console.error('❌ Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });
  
  // Delete message for me
  socket.on(SOCKET_EVENTS.DELETE_MESSAGE_FOR_ME, async (data) => {
    try {
      const { messageId } = data;
      
      console.log(`🗑️ Deleting message for me:`, { messageId, userId });
      
      // For delete for me, we can either soft delete or just filter on frontend
      // Here we'll just confirm to the user
      
      socket.emit('message-deleted', { messageId });
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });
  
  // Delete message for everyone
  socket.on(SOCKET_EVENTS.DELETE_MESSAGE_FOR_EVERYONE, async (data) => {
    try {
      const { messageId } = data;
      
      console.log(`🗑️ Deleting message for everyone:`, { messageId, userId });
      
      const message = await Message.findOne({ _id: messageId, sender: userId });
      
      if (!message) {
        console.log('❌ Message not found or unauthorized');
        return socket.emit('error', { message: 'Message not found or unauthorized' });
      }
      
      // Check if message is less than 1 hour old
      const messageTime = new Date(message.createdAt).getTime();
      const oneHourAgo = Date.now() - 3600000;
      
      if (messageTime < oneHourAgo) {
        console.log('❌ Message too old to delete for everyone');
        return socket.emit('error', { message: 'Cannot delete messages older than 1 hour for everyone' });
      }
      
      // Instead of deleting, we can mark as deleted
      message.deletedForEveryone = true;
      await message.save();
      
      // Notify receiver if online
      const receiverSocketId = activeUsers?.get(message.receiver.toString());
      if (receiverSocketId) {
        console.log(`📨 Notifying receiver about deleted message`);
        io.to(receiverSocketId).emit('message-deleted-everyone', {
          messageId: message._id,
          conversationId: message.conversation
        });
      }
      
      // Confirm to sender
      socket.emit('message-deleted-everyone', {
        messageId: message._id,
        conversationId: message.conversation
      });
      
    } catch (error) {
      console.error('❌ Error deleting message for everyone:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });
  
  // Get online users
  socket.on('get-online-users', () => {
    const onlineList = Array.from(activeUsers.keys());
    socket.emit('online-users', onlineList);
  });
  
  // Ping/Pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
  
  console.log(`✅ All chat handlers initialized for user ${userId}`);
};

module.exports = chatHandlers;