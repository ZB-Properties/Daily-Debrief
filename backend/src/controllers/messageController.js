const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { logger } = require('../utils/logger');

const sendMessage = asyncHandler(async (req, res) => {
  console.log('\n🔵🔵🔵 SEND MESSAGE DEBUG START 🔵🔵🔵');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user._id);
  
  try {
    const { 
      conversationId, 
      content, 
      type = 'text',
      fileUrl,
      fileName,
      fileSize,
      filePublicId,
      thumbnailUrl,
      duration,
      replyTo
    } = req.body;
    
    const senderId = req.user._id;

    // Log each field for debugging
    console.log('📦 Received fields:', {
      conversationId,
      content: content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : '(empty)',
      type,
      fileUrl: fileUrl ? fileUrl.substring(0, 50) + '...' : '(none)',
      fileName,
      fileSize,
      filePublicId,
      thumbnailUrl: thumbnailUrl ? 'yes' : 'no',
      duration,
      replyTo: replyTo || 'none'
    });

    // Validation
    if (!conversationId) {
      console.log('❌ No conversationId provided');
      return res.status(400).json({
        success: false,
        error: 'conversationId is required'
      });
    }

    // Check MongoDB ID format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log('❌ Invalid conversationId format:', conversationId);
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID format'
      });
    }

    // For text messages, content is required
    if (type === 'text' && !content) {
      console.log('❌ No content provided for text message');
      return res.status(400).json({
        success: false,
        error: 'content is required for text messages'
      });
    }

    // For file messages, fileUrl is required
    if (type !== 'text' && !fileUrl) {
      console.log('❌ No fileUrl provided for file message');
      return res.status(400).json({
        success: false,
        error: 'fileUrl is required for file messages'
      });
    }

    console.log('🔍 Looking for conversation:', conversationId);
    
    // Find conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.log('❌ Conversation not found');
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    console.log('✅ Conversation found. Participants:', conversation.participants);

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === senderId.toString()
    );

    if (!isParticipant) {
      console.log('❌ User not participant in conversation');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send message in this conversation'
      });
    }

    // Get receiver (for private chats)
    let receiverId = null;
    if (!conversation.isGroup) {
      receiverId = conversation.participants.find(
        p => p.toString() !== senderId.toString()
      );
      console.log('📨 Private chat receiver:', receiverId);
    } else {
      console.log('👥 Group chat with', conversation.participants.length, 'participants');
    }

    console.log('📝 Creating message object...');
    
    // Create message
    const messageData = {
      conversation: conversationId,
      sender: senderId,
      content: content || '',
      type,
      read: false,
      delivered: false
    };

    // Add receiver for private chats
    if (receiverId) {
      messageData.receiver = receiverId;
    }

    // Add replyTo if provided
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Add file fields if present
    if (fileUrl) messageData.fileUrl = fileUrl;
    if (fileName) messageData.fileName = fileName;
    if (fileSize) messageData.fileSize = fileSize;
    if (filePublicId) messageData.filePublicId = filePublicId;
    if (thumbnailUrl) messageData.thumbnailUrl = thumbnailUrl;
    if (duration) messageData.duration = duration;

    console.log('📊 Final message data:', JSON.stringify(messageData, null, 2));

    const message = new Message(messageData);
    
    // Validate the message before saving
    try {
      await message.validate();
      console.log('✅ Message validation passed');
    } catch (validationError) {
      console.error('❌ Message validation failed:', validationError.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error: ' + Object.values(validationError.errors).map(e => e.message).join(', ')
      });
    }

    await message.save();
    console.log('✅ Message saved with ID:', message._id);

    // Populate sender info
    await message.populate('sender', 'name profileImage email');

    // Populate replyTo if it exists
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name profileImage' }
      });
    }

    if (receiverId) {
      await message.populate('receiver', 'name profileImage email');
    }

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();

    // Update unread counts
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        const currentCount = conversation.unreadCount?.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await conversation.save();
    console.log('✅ Conversation updated');

    // Get the io instance from req.app
    const io = req.app.get('io');

    // Get sender info
    const sender = await User.findById(senderId).select('name profileImage email status');

    // Format message for socket with reply info
    const messageForSocket = {
      ...message.toObject(),
      conversationId: conversation._id,
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
        _id: senderId,
        name: sender.name,
        profileImage: sender.profileImage || '',
        status: sender.status || 'online'
      },
      lastMessage: messageForSocket,
      lastActivity: new Date(),
      unreadCount: receiverId ? (conversation.unreadCount?.get(receiverId.toString()) || 1) : 0,
      isMuted: conversation.mutedBy?.some(id => id.toString() === receiverId?.toString()) || false,
      isPinned: conversation.pinnedBy?.some(id => id.toString() === receiverId?.toString()) || false,
      isArchived: conversation.archivedBy?.some(id => id.toString() === receiverId?.toString()) || false
    };

    // Get receiver info for sender's update
    let receiver = null;
    if (receiverId) {
      receiver = await User.findById(receiverId).select('name profileImage email status');
    }

    // Create formatted conversation object for sender
    const formattedForSender = {
      _id: conversation._id,
      isGroup: false,
      participant: receiver ? {
        _id: receiverId,
        name: receiver.name,
        profileImage: receiver.profileImage || '',
        status: receiver.status || 'offline'
      } : null,
      lastMessage: messageForSocket,
      lastActivity: new Date(),
      unreadCount: 0, // Sender's unread count is 0 for their own message
      isMuted: conversation.mutedBy?.some(id => id.toString() === senderId.toString()) || false,
      isPinned: conversation.pinnedBy?.some(id => id.toString() === senderId.toString()) || false,
      isArchived: conversation.archivedBy?.some(id => id.toString() === senderId.toString()) || false
    };

    // Emit to all participants
    conversation.participants.forEach(participantId => {
      const participantIdStr = participantId.toString();
      
      if (participantIdStr !== senderId.toString()) {
        // Emit to receiver
        console.log(`📡 Emitting conversation-updated to ${participantIdStr}`);
        
        const formattedConv = participantIdStr === receiverId?.toString() 
          ? formattedForReceiver 
          : {
              _id: conversation._id,
              isGroup: conversation.isGroup || false,
              groupName: conversation.groupName,
              groupAvatar: conversation.groupAvatar,
              participants: conversation.participants,
              lastMessage: messageForSocket,
              lastActivity: new Date(),
              unreadCount: conversation.unreadCount?.get(participantIdStr) || 1,
              isMuted: conversation.mutedBy?.some(id => id.toString() === participantIdStr) || false,
              isPinned: conversation.pinnedBy?.some(id => id.toString() === participantIdStr) || false,
              isArchived: conversation.archivedBy?.some(id => id.toString() === participantIdStr) || false
            };

        io.to(participantIdStr).emit('conversation-updated', {
          conversationId: conversation._id,
          conversation: formattedConv,
          updates: {
            lastMessage: messageForSocket,
            lastActivity: new Date(),
            unreadCount: conversation.unreadCount?.get(participantIdStr) || 1
          }
        });

        // Also emit new-message event with reply info
        io.to(participantIdStr).emit('new-message', messageForSocket);
      }
    });

    // Emit to sender (update their own sidebar)
    io.to(senderId.toString()).emit('conversation-updated', {
      conversationId: conversation._id,
      conversation: formattedForSender,
      updates: {
        lastMessage: messageForSocket,
        lastActivity: new Date(),
        unreadCount: 0
      }
    });

    console.log('✅ Socket events emitted');
    console.log('🔵🔵🔵 SEND MESSAGE DEBUG END 🔵🔵🔵\n');

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('\n🔴🔴🔴 ERROR IN SEND MESSAGE 🔴🔴🔴');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific Mongoose errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate key error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send message: ' + error.message
    });
  }
});

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/messages/conversation/:conversationId
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  console.log('📥 Fetching messages for conversation:', req.params.conversationId);
  
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      console.log('❌ Conversation not found or user not participant');
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get messages with replyTo populated
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name profileImage email')
      .populate('receiver', 'name profileImage email')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name profileImage' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversation: conversationId });

    console.log(`✅ Found ${messages.length} messages`);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages: ' + error.message
    });
  }
});

/**
 * @desc    React to a message
 * @route   POST /api/messages/:messageId/react
 * @access  Private
 */
const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const { messageId } = req.params;
  const userId = req.user._id;

  console.log('🔵 Reacting to message:', { messageId, emoji, userId });

  if (!emoji) {
    return res.status(400).json({
      success: false,
      error: 'Emoji is required'
    });
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is participant in conversation
  const conversation = await Conversation.findById(message.conversation);
  
  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );

  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to react to this message'
    });
  }

  // Initialize reactions array if it doesn't exist
  if (!message.reactions) {
    message.reactions = [];
  }

  // Check if user already reacted with this emoji
  const existingReactionIndex = message.reactions.findIndex(r => 
    r.emoji === emoji && r.user.toString() === userId.toString()
  );

  if (existingReactionIndex !== -1) {
    // Remove reaction if already exists
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add new reaction
    message.reactions.push({
      emoji,
      user: userId,
      createdAt: new Date()
    });
  }

  await message.save();

  // Populate user info for reactions
  await message.populate('reactions.user', 'name profileImage');

  console.log('✅ Reaction updated:', message.reactions);

  // Get io instance for real-time updates
  const io = req.app.get('io');
  
  // Emit to conversation
  io.to(message.conversation.toString()).emit('message-reacted', {
    messageId: message._id,
    conversationId: message.conversation,
    reactions: message.reactions
  });

  res.json({
    success: true,
    data: { reactions: message.reactions }
  });
});

/**
 * @desc    Forward a message
 * @route   POST /api/messages/:id/forward
 * @access  Private
 */
const forwardMessage = asyncHandler(async (req, res) => {
  const { receiverIds } = req.body; // Array of receiver IDs
  
  if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide at least one receiver'
    });
  }

  const originalMessage = await Message.findById(req.params.id);
  
  if (!originalMessage) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  const forwardedMessages = [];

  // Forward to each receiver
  for (const receiverId of receiverIds) {
    const receiver = await User.findById(receiverId);
    
    if (!receiver || receiverId === req.user._id.toString()) {
      continue; // Skip invalid receivers and self
    }

    // Create forwarded message
    const forwardedMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: originalMessage.content,
      type: originalMessage.type,
      fileUrl: originalMessage.fileUrl,
      fileName: originalMessage.fileName,
      fileSize: originalMessage.fileSize,
      fileMimeType: originalMessage.fileMimeType,
      thumbnailUrl: originalMessage.thumbnailUrl,
      duration: originalMessage.duration,
      forwarded: true
    });

    // Update conversation for each receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        lastMessage: forwardedMessage._id
      });
    } else {
      conversation.lastMessage = forwardedMessage._id;
      conversation.lastActivity = new Date();
    }

    // Increment unread count
    const currentCount = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentCount + 1);
    await conversation.save();

    forwardedMessages.push(forwardedMessage);
  }

  logger.info(`Message ${req.params.id} forwarded to ${forwardedMessages.length} users`);

  res.json({
    success: true,
    message: `Message forwarded to ${forwardedMessages.length} user(s)`,
    data: { messages: forwardedMessages }
  });
});

/**
 * @desc    Mark message as delivered
 * @route   PUT /api/messages/:id/delivered
 * @access  Private
 */
const markAsDelivered = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is the receiver
  if (!message.receiver.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to mark this message as delivered'
    });
  }

  await message.markAsDelivered();

  res.json({
    success: true,
    message: 'Message marked as delivered'
  });
});

/**
 * @desc    Mark message as read
 * @route   PUT /api/messages/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is the receiver
  if (!message.receiver.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to mark this message as read'
    });
  }

  await message.markAsRead();

  // Update conversation unread count
  const conversation = await Conversation.findOne({
    participants: { $all: [message.sender, message.receiver] }
  });

  if (conversation) {
    const count = conversation.unreadCount.get(message.receiver.toString()) || 0;
    if (count > 0) {
      conversation.unreadCount.set(message.receiver.toString(), count - 1);
      await conversation.save();
    }
  }

  res.json({
    success: true,
    message: 'Message marked as read'
  });
});

/**
 * @desc    Get message by ID
 * @route   GET /api/messages/:id
 * @access  Private
 */
const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('sender', 'name profileImage')
    .populate('receiver', 'name profileImage')
    .populate('replyTo')
    .populate('reactions.userId', 'name profileImage');

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is participant
  const isParticipant = message.sender.equals(req.user._id) || 
                       message.receiver.equals(req.user._id);

  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to view this message'
    });
  }

  res.json({
    success: true,
    data: { message }
  });
});

/**
 * @desc    Edit a message
 * @route   PUT /api/messages/:id
 * @access  Private
 */
const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const messageId = req.params.id;
  const userId = req.user._id;

  console.log('✏️ Editing message:', messageId);

  // Validation
  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Content is required'
    });
  }

  // Find message
  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is the sender
  if (message.sender.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      error: 'You can only edit your own messages'
    });
  }

  // Check if message is too old to edit (optional - 1 hour limit)
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const oneHour = 60 * 60 * 1000;
  
  if (messageAge > oneHour) {
    return res.status(400).json({
      success: false,
      error: 'Messages can only be edited within 1 hour of sending'
    });
  }

  // Edit message
  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  // Populate sender info
  await message.populate('sender', 'name profileImage email');
  await message.populate('receiver', 'name profileImage email');

  console.log('✅ Message edited successfully');

  res.json({
    success: true,
    message: 'Message edited successfully',
    data: { message }
  });
});

/**
 * @desc    Delete message for me (soft delete)
 * @route   DELETE /api/messages/:id/me
 * @access  Private
 */
const deleteMessageForMe = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;

  console.log('🗑️ Deleting message for me:', messageId);

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is participant
  const isParticipant = message.sender.equals(userId) || 
                       (message.receiver && message.receiver.equals(userId));

  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this message'
    });
  }

  // Add user to deletedFor array if not already there
  if (!message.deletedFor.includes(userId)) {
    message.deletedFor.push(userId);
    await message.save();
  }

  // Get io instance
  const io = req.app.get('io');
  
  // Notify other participant about the deletion
  const otherUserId = message.sender.equals(userId) ? message.receiver : message.sender;
  if (otherUserId) {
    io.to(otherUserId.toString()).emit('message-deleted', {
      messageId: message._id,
      conversationId: message.conversation,
      deletedBy: userId
    });
  }

  res.json({
    success: true,
    message: 'Message deleted for you'
  });
});

/**
 * @desc    Delete message for everyone (hard delete)
 * @route   DELETE /api/messages/:id/everyone
 * @access  Private
 */
const deleteMessageForEveryone = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;

  console.log('🗑️ Deleting message for everyone:', messageId);

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Only sender can delete for everyone
  if (!message.sender.equals(userId)) {
    return res.status(403).json({
      success: false,
      error: 'Only the sender can delete message for everyone'
    });
  }

  // Check if message is too old (optional - 1 hour limit)
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const oneHour = 60 * 60 * 1000;
  
  if (messageAge > oneHour) {
    return res.status(400).json({
      success: false,
      error: 'Messages can only be deleted for everyone within 1 hour of sending'
    });
  }

  // Store conversationId before deletion
  const conversationId = message.conversation;

  // Delete file from Cloudinary if exists
  if (message.filePublicId) {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(message.filePublicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }
  }

  // Hard delete the message
  await Message.findByIdAndDelete(messageId);

  // Get io instance
  const io = req.app.get('io');
  
  // Notify all participants about the deletion
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('message-deleted-everyone', {
        messageId,
        conversationId
      });
    });
  }

  res.json({
    success: true,
    message: 'Message deleted for everyone'
  });
});
    
module.exports = {
  sendMessage,
  getMessages,
  reactToMessage,
  forwardMessage,
  markAsDelivered,
  markAsRead,
  getMessageById, 
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone
};