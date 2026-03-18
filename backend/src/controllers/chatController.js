const mongoose = require('mongoose')
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ERROR_MESSAGES } = require('../config/constants');
const { logger } = require('../utils/logger');


/**
 * @desc    Get or create private conversation
 * @route   POST /api/chats/conversation
 * @access  Private
 */
const getOrCreateConversation = asyncHandler(async (req, res) => {
  console.log('\n🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
  console.log('🔴 START getOrCreateConversation - FINAL FIXED VERSION');
  console.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴\n');
  
  try {
    // ===== STEP 1: Check req object =====
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // ===== STEP 2: Extract userId =====
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // ===== STEP 3: Validate MongoDB ID =====
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const otherUserId = new mongoose.Types.ObjectId(userId);
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    // ===== STEP 4: Check self-chat =====
    if (otherUserId.equals(currentUserObjectId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create conversation with yourself'
      });
    }

    // ===== STEP 5: Find other user =====
    const otherUser = await User.findById(otherUserId).select('name email profileImage status isActive');
    
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!otherUser.isActive) {
      return res.status(400).json({
        success: false,
        error: 'User account is deactivated'
      });
    }

    // ===== STEP 6: Find existing conversation (with proper validation) =====
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [currentUserObjectId, otherUserId],
        $size: 2  // Ensure exactly 2 participants
      },
      isGroup: false
    });

    // ===== STEP 7: Create conversation if not found =====
    if (!conversation) {
      console.log('📌 Creating new conversation');
      
      // Create unreadCount Map
      const unreadMap = new Map();
      unreadMap.set(currentUserObjectId.toString(), 0);
      unreadMap.set(otherUserId.toString(), 0);

      const newConv = new Conversation({
        participants: [currentUserObjectId, otherUserId],
        isGroup: false,
        createdBy: currentUserObjectId,
        unreadCount: unreadMap,
        mutedBy: [],
        pinnedBy: [],
        archivedBy: [],
        deletedBy: [],
        customName: new Map(),
        customImage: new Map(),
        lastActivity: new Date()
      });

      await newConv.save();
      console.log('✅ Conversation saved with ID:', newConv._id);
      
      conversation = newConv;
    }

    // ===== STEP 8: Populate conversation =====
    await conversation.populate('participants', 'name email profileImage status lastSeen bio');
    await conversation.populate({
      path: 'lastMessage',
      select: 'content type sender createdAt read delivered'
    });

    // ===== STEP 9: Get other participant =====
    const otherParticipant = conversation.participants.find(
      p => p && p._id && !p._id.equals(currentUserObjectId)
    ) || {
      _id: otherUserId,
      name: otherUser.name || 'Unknown User',
      email: otherUser.email || '',
      profileImage: otherUser.profileImage || '',
      status: otherUser.status || 'offline',
      lastSeen: otherUser.lastSeen || new Date(),
      bio: otherUser.bio || ''
    };

    // ===== STEP 10: Calculate unread count =====
    let unreadCount = 0;
    if (conversation.unreadCount && conversation.unreadCount instanceof Map) {
      unreadCount = conversation.unreadCount.get(currentUserObjectId.toString()) || 0;
    }

    // ===== STEP 11: Format response =====
    const formattedConversation = {
      _id: conversation._id,
      participant: otherParticipant,
      lastMessage: conversation.lastMessage || null,
      unreadCount,
      isMuted: conversation.mutedBy ? conversation.mutedBy.some(id => id && id.equals(currentUserObjectId)) : false,
      isPinned: conversation.pinnedBy ? conversation.pinnedBy.some(id => id && id.equals(currentUserObjectId)) : false,
      isArchived: conversation.archivedBy ? conversation.archivedBy.some(id => id && id.equals(currentUserObjectId)) : false,
      lastActivity: conversation.lastActivity || conversation.createdAt || new Date(),
      createdAt: conversation.createdAt || new Date()
    };

    res.json({
      success: true,
      data: { conversation: formattedConversation }
    });

  } catch (error) {
    console.error('❌ Error in getOrCreateConversation:', error);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
});


/**
 * @desc    Get conversation by ID
 * @route   GET /api/chats/conversation/:id
 * @access  Private
 */
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
    deletedBy: { $ne: req.user._id },
    archivedBy: { $ne: userId } 
  })
  .populate('participants', 'name profileImage status lastSeen')
  .populate({
    path: 'lastMessage',
    select: 'content type sender createdAt read delivered'
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  // Reset unread count for current user
  await conversation.resetUnreadCount(req.user._id);

  const unreadCount = conversation.getUnreadCountForUser(req.user._id);
  const otherParticipant = conversation.getOtherParticipant(req.user._id);

  res.json({
    success: true,
    data: {
      conversation: {
        _id: conversation._id,
        participant: otherParticipant,
        lastMessage: conversation.lastMessage,
        unreadCount,
        isMuted: conversation.isMutedForUser(req.user._id),
        isPinned: conversation.isPinnedForUser(req.user._id),
        isArchived: conversation.isArchivedForUser(req.user._id),
        customName: conversation.getCustomNameForUser(req.user._id),
        customImage: conversation.getCustomImageForUser(req.user._id),
        lastActivity: conversation.lastActivity,
        createdAt: conversation.createdAt
      }
    }
  });
});


/**
 * @desc    Get all conversations for user
 * @route   GET /api/chats/conversations
 * @access  Private
 */
const getAllConversations = asyncHandler(async (req, res) => {
  const { archived } = req.query;
  const userId = req.user._id;
  
  console.log('👥 Fetching conversations for user:', userId);

  const query = {
    participants: userId,
    deletedBy: { $ne: userId }
  };

  if (archived === 'true') {
    query.archivedBy = userId;
  } else {
    query.archivedBy = { $ne: userId };
  }

  const conversations = await Conversation.find(query)
    .populate('participants', 'name profileImage status lastSeen bio')
    .populate({
      path: 'lastMessage',
      select: 'content type sender createdAt read delivered'
    })
    .sort({ lastActivity: -1 });

  console.log(`📋 Found ${conversations.length} conversations`);

  // Format conversations - FIXED to handle BOTH private and group chats
  const formattedConversations = conversations.map(conv => {
    // Check if this is a group chat
    const isGroup = conv.isGroup === true;
    
    // For private chats, find the other participant
    let otherParticipant = null;
    if (!isGroup) {
      otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
    }

    const unreadCount = conv.getUnreadCountForUser ? conv.getUnreadCountForUser(userId) : 0;

    // Return different structure based on conversation type
    if (isGroup) {
      // GROUP CHAT FORMAT
      return {
        _id: conv._id,
        isGroup: true,
        groupName: conv.groupName || 'Group Chat',
        groupAvatar: conv.groupAvatar || '',
        participants: conv.participants, // Include all participants
        participant: null, // No single participant for groups
        lastMessage: conv.lastMessage || null,
        unreadCount,
        isMuted: conv.isMutedForUser ? conv.isMutedForUser(userId) : false,
        isPinned: conv.isPinnedForUser ? conv.isPinnedForUser(userId) : false,
        isArchived: conv.isArchivedForUser ? conv.isArchivedForUser(userId) : false,
        customName: conv.getCustomNameForUser ? conv.getCustomNameForUser(userId) : '',
        customImage: conv.getCustomImageForUser ? conv.getCustomImageForUser(userId) : '',
        lastActivity: conv.lastActivity || conv.createdAt,
        createdAt: conv.createdAt
      };
    } else {
      // PRIVATE CHAT FORMAT
      return {
        _id: conv._id,
        isGroup: false,
        participant: otherParticipant,
        lastMessage: conv.lastMessage || null,
        unreadCount,
        isMuted: conv.isMutedForUser ? conv.isMutedForUser(userId) : false,
        isPinned: conv.isPinnedForUser ? conv.isPinnedForUser(userId) : false,
        isArchived: conv.isArchivedForUser ? conv.isArchivedForUser(userId) : false,
        customName: conv.getCustomNameForUser ? conv.getCustomNameForUser(userId) : '',
        customImage: conv.getCustomImageForUser ? conv.getCustomImageForUser(userId) : '',
        lastActivity: conv.lastActivity || conv.createdAt,
        createdAt: conv.createdAt
      };
    }
  });

  console.log(`✅ Formatted ${formattedConversations.length} conversations (including groups)`);

  res.json({
    success: true,
    data: {
      conversations: formattedConversations,
      total: formattedConversations.length
    }
  });
});


/**
 * @desc    Get conversation messages
 * @route   GET /api/chats/conversation/:id/messages
 * @access  Private
 */
const getConversationMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  console.log('📥 Fetching messages for conversation:', id);

  // Verify user is participant in conversation
  const conversation = await Conversation.findOne({
    _id: id,
    participants: req.user._id
  });

  if (!conversation) {
    console.log('❌ Conversation not found');
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  // Get other participant
  const otherParticipant = conversation.getOtherParticipant(req.user._id);

  // Get messages (excluding deleted ones for current user)
  const messages = await Message.find({
    conversation: id, // Use conversation field instead of $or
    deletedFor: { $ne: req.user._id }
  })
  .populate('sender', 'name profileImage')
  .populate('receiver', 'name profileImage')
  // REMOVED: .populate('replyTo') - This field doesn't exist in your schema
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await Message.countDocuments({
    conversation: id,
    deletedFor: { $ne: req.user._id }
  });

  console.log(`✅ Found ${messages.length} messages out of ${total}`);

  // Mark messages as read
  const unreadMessages = messages.filter(msg => 
    msg.sender && 
    msg.sender._id && 
    msg.sender._id.toString() === otherParticipant?.toString() && 
    !msg.read
  );

  if (unreadMessages.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: unreadMessages.map(msg => msg._id) }
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );

    // Reset unread count in conversation
    await conversation.resetUnreadCount(req.user._id);
    console.log(`✅ Marked ${unreadMessages.length} messages as read`);
  }

  // Reverse to get chronological order
  messages.reverse();

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    }
  });
});


/**
 * @desc    Get conversation details (full info)
 * @route   GET /api/chats/conversation/:id/details
 * @access  Private
 */
const getConversationDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  console.log('📊 Fetching conversation details for:', id);

  // Find conversation with all necessary population
  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
    deletedBy: { $ne: userId }
  })
  .populate('participants', 'name email profileImage status lastSeen bio')
  .populate('createdBy', 'name email profileImage')
  .populate('groupAdmin', 'name email profileImage')
  .populate({
    path: 'lastMessage',
    select: 'content type sender createdAt read delivered'
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  // Get message count
  const totalMessages = await Message.countDocuments({
    conversation: id,
    deletedFor: { $ne: userId }
  });

  // Get admins list for groups
  let admins = [];
  let coAdmins = [];
  
  if (conversation.isGroup) {
    if (conversation.groupAdmin) {
      admins.push(conversation.groupAdmin._id);
    }
    if (conversation.coAdmins && conversation.coAdmins.length > 0) {
      coAdmins = conversation.coAdmins;
    }
  }

  // Get media counts
  const mediaCounts = {
    images: await Message.countDocuments({
      conversation: id,
      type: 'image',
      deletedFor: { $ne: userId }
    }),
    videos: await Message.countDocuments({
      conversation: id,
      type: 'video',
      deletedFor: { $ne: userId }
    }),
    files: await Message.countDocuments({
      conversation: id,
      type: 'file',
      deletedFor: { $ne: userId }
    }),
    audio: await Message.countDocuments({
      conversation: id,
      type: 'audio',
      deletedFor: { $ne: userId }
    }),
    links: await Message.countDocuments({
      conversation: id,
      content: { $regex: /https?:\/\// },
      deletedFor: { $ne: userId }
    })
  };

  // Get custom name for this user (for private chats)
  let customName = null;
  if (!conversation.isGroup) {
    customName = conversation.customName?.get(userId.toString()) || null;
  }

  // Get mute/pin/archive status
  const isMuted = conversation.mutedBy?.some(id => id.toString() === userId.toString()) || false;
  const isPinned = conversation.pinnedBy?.some(id => id.toString() === userId.toString()) || false;
  const isArchived = conversation.archivedBy?.some(id => id.toString() === userId.toString()) || false;

  // Prepare response data
  const conversationData = {
    _id: conversation._id,
    isGroup: conversation.isGroup || false,
    groupName: conversation.groupName || null,
    groupAvatar: conversation.groupAvatar || null,
    groupDescription: conversation.groupDescription || null,
    participants: conversation.participants || [],
    createdBy: conversation.createdBy || null,
    groupAdmin: conversation.groupAdmin || null,
    coAdmins: coAdmins,
    admins: admins,
    lastMessage: conversation.lastMessage || null,
    lastActivity: conversation.lastActivity || conversation.createdAt,
    createdAt: conversation.createdAt,
    metadata: {
      totalMessages,
      media: mediaCounts
    },
    userSettings: {
      customName,
      isMuted,
      isPinned,
      isArchived
    }
  };

  // For private chats, get the other participant
  if (!conversation.isGroup) {
    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );
    conversationData.otherParticipant = otherParticipant || null;
  }

  res.json({
    success: true,
    data: {
      conversation: conversationData
    }
  });
});

/**
 * @desc    Get conversation media
 * @route   GET /api/chats/conversation/:id/media
 * @access  Private
 */
const getConversationMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = 'all', page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  const skip = (page - 1) * limit;

  // Build query based on media type
  let typeQuery = {};
  if (type !== 'all') {
    typeQuery.type = type;
  } else {
    typeQuery.type = { $in: ['image', 'video', 'file', 'audio'] };
  }

  const messages = await Message.find({
    conversation: id,
    deletedFor: { $ne: userId },
    ...typeQuery,
    fileUrl: { $exists: true, $ne: null }
  })
  .populate('sender', 'name profileImage')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(parseInt(limit));

  const total = await Message.countDocuments({
    conversation: id,
    deletedFor: { $ne: userId },
    ...typeQuery,
    fileUrl: { $exists: true, $ne: null }
  });

  res.json({
    success: true,
    data: {
      media: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + messages.length < total
      }
    }
  });
});

/**
 * @desc    Get conversation links
 * @route   GET /api/chats/conversation/:id/links
 * @access  Private
 */
const getConversationLinks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  const skip = (page - 1) * limit;

  // Find messages containing URLs
  const messages = await Message.find({
    conversation: id,
    deletedFor: { $ne: userId },
    content: { $regex: /https?:\/\// }
  })
  .populate('sender', 'name profileImage')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(parseInt(limit));

  // Extract URLs from message content
  const links = messages.map(msg => {
    const urls = msg.content.match(/(https?:\/\/[^\s]+)/g) || [];
    return {
      messageId: msg._id,
      sender: msg.sender,
      urls,
      createdAt: msg.createdAt,
      content: msg.content
    };
  });

  const total = await Message.countDocuments({
    conversation: id,
    deletedFor: { $ne: userId },
    content: { $regex: /https?:\/\// }
  });

  res.json({
    success: true,
    data: {
      links,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + links.length < total
      }
    }
  });
});


/**
 * @desc    Mark messages as read
 * @route   POST /api/chats/conversation/:id/read
 * @access  Private
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify user is participant in conversation
  const conversation = await Conversation.findOne({
    _id: id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  const otherParticipant = conversation.getOtherParticipant(req.user._id);

  // Mark all messages from other participant as read
  await Message.updateMany(
    {
      sender: otherParticipant,
      receiver: req.user._id,
      read: false
    },
    { 
      $set: { 
        read: true,
        readAt: new Date()
      }
    }
  );

  // Reset unread count
  await conversation.resetUnreadCount(req.user._id);

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

/**
 * @desc    Delete message
 * @route   DELETE /api/chats/message/:id
 * @access  Private
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }

  // Check if user is sender or receiver
  const isSender = message.sender.equals(req.user._id);
  const isReceiver = message.receiver.equals(req.user._id);

  if (!isSender && !isReceiver) {
    return res.status(403).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NO_PERMISSION
    });
  }

  // Add user to deletedFor array
  if (!message.deletedFor.includes(req.user._id)) {
    message.deletedFor.push(req.user._id);
    await message.save();
  }

  // If both users have deleted the message, delete it completely
  const otherUserId = isSender ? message.receiver : message.sender;
  const otherUserDeleted = message.deletedFor.some(id => 
    id.equals(otherUserId)
  );

  if (otherUserDeleted) {
    // Delete file from Cloudinary if it exists
    if (message.filePublicId) {
      try {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(message.filePublicId);
      } catch (error) {
        logger.error('Error deleting file from Cloudinary:', error);
      }
    }
    
    await Message.findByIdAndDelete(message._id);
  }

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

/**
 * @desc    Pin/unpin conversation
 * @route   PUT /api/chats/conversation/:id/pin
 * @access  Private
 */
const togglePinConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  const isPinned = conversation.isPinnedForUser(req.user._id);

  if (isPinned) {
    // Unpin
    conversation.pinnedBy = conversation.pinnedBy.filter(
      id => !id.equals(req.user._id)
    );
  } else {
    // Pin
    conversation.pinnedBy.push(req.user._id);
  }

  await conversation.save();

  res.json({
    success: true,
    message: isPinned ? 'Conversation unpinned' : 'Conversation pinned',
    data: {
      isPinned: !isPinned
    }
  });
});

/**
 * @desc    Mute/unmute conversation
 * @route   PUT /api/chats/conversation/:id/mute
 * @access  Private
 */
const toggleMuteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  const isMuted = conversation.isMutedForUser(req.user._id);

  if (isMuted) {
    // Unmute
    conversation.mutedBy = conversation.mutedBy.filter(
      id => !id.equals(req.user._id)
    );
  } else {
    // Mute
    conversation.mutedBy.push(req.user._id);
  }

  await conversation.save();

  res.json({
    success: true,
    message: isMuted ? 'Conversation unmuted' : 'Conversation muted',
    data: {
      isMuted: !isMuted
    }
  });
});

/**
 * @desc    Archive/unarchive conversation
 * @route   PUT /api/chats/conversation/:id/archive
 * @access  Private
 */
const toggleArchiveConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  const isArchived = conversation.isArchivedForUser(req.user._id);

  if (isArchived) {
    // Unarchive
    conversation.archivedBy = conversation.archivedBy.filter(
      id => !id.equals(req.user._id)
    );
  } else {
    // Archive
    conversation.archivedBy.push(req.user._id);
  }

  await conversation.save();

  res.json({
    success: true,
    message: isArchived ? 'Conversation unarchived' : 'Conversation archived',
    data: {
      isArchived: !isArchived
    }
  });
});

/**
 * @desc    Delete conversation
 * @route   DELETE /api/chats/conversation/:id
 * @access  Private
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  // Add user to deletedBy array
  if (!conversation.deletedBy.includes(req.user._id)) {
    conversation.deletedBy.push(req.user._id);
    await conversation.save();
  }

  // If both users have deleted the conversation, delete it completely
  const otherParticipant = conversation.getOtherParticipant(req.user._id);
  const otherUserDeleted = conversation.deletedBy.some(id => 
    id.equals(otherParticipant)
  );

  if (otherUserDeleted) {
    await Conversation.findByIdAndDelete(conversation._id);
  }

  res.json({
    success: true,
    message: 'Conversation deleted successfully'
  });
});

/**
 * @desc    Update conversation custom name
 * @route   PUT /api/chats/conversation/:id/custom-name
 * @access  Private
 */
const updateCustomName = asyncHandler(async (req, res) => {
  const { customName } = req.body;
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.CHAT.NOT_FOUND
    });
  }

  if (customName) {
    conversation.customName.set(req.user._id.toString(), customName);
  } else {
    conversation.customName.delete(req.user._id.toString());
  }

  await conversation.save();

  res.json({
    success: true,
    message: customName ? 'Custom name updated' : 'Custom name removed',
    data: {
      customName: conversation.getCustomNameForUser(req.user._id)
    }
  });
});

/**
 * @desc    Create a group chat
 * @route   POST /api/chats/group
 * @access  Private
 */
const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participants } = req.body;
  const creatorId = req.user._id;

  console.log('📝 Creating group chat:', { name, participants });

  // Validation
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Group name is required'
    });
  }

  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'At least 2 participants are required for a group'
    });
  }

  // Add creator to participants if not already included
  let allParticipants = [...new Set([creatorId.toString(), ...participants])];
  allParticipants = allParticipants.map(id => 
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
  );

  // Create group conversation
  const groupConversation = new Conversation({
    participants: allParticipants,
    isGroup: true,
    groupName: name,
    groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
    groupAdmin: creatorId,
    createdBy: creatorId,
    unreadCount: new Map(),
    mutedBy: [],
    pinnedBy: [],
    archivedBy: [],
    deletedBy: [],
    customName: new Map(),
    customImage: new Map(),
    lastActivity: new Date()
  });

  // Initialize unread counts for all participants
  allParticipants.forEach(participantId => {
    groupConversation.unreadCount.set(participantId.toString(), 0);
  });

  await groupConversation.save();
  console.log('✅ Group created with ID:', groupConversation._id);

  // Populate participants
  await groupConversation.populate('participants', 'name email profileImage status lastSeen bio');

  res.status(201).json({
    success: true,
    data: { conversation: groupConversation }
  });
});

/**
 * @desc    Add participants to group
 * @route   POST /api/chats/group/:id/add
 * @access  Private
 */
const addGroupParticipants = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  const groupId = req.params.id;
  const userId = req.user._id;

  console.log('👥 Adding participants to group:', groupId);

  const group = await Conversation.findOne({
    _id: groupId,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if user is admin
  if (!group.groupAdmin || group.groupAdmin.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Only group admin can add participants'
    });
  }

  // Add new participants
  const currentParticipants = group.participants.map(p => p.toString());
  const newParticipants = participants.filter(p => 
    !currentParticipants.includes(p.toString())
  );

  newParticipants.forEach(p => {
    group.participants.push(p);
    group.unreadCount.set(p.toString(), 0);
  });

  await group.save();
  await group.populate('participants', 'name email profileImage status lastSeen bio');

  res.json({
    success: true,
    message: `${newParticipants.length} participants added`,
    data: { conversation: group }
  });
});

/**
 * @desc    Remove participant from group
 * @route   DELETE /api/chats/group/:id/participant/:userId
 * @access  Private
 */
const removeGroupParticipant = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const currentUserId = req.user._id;

  const group = await Conversation.findOne({
    _id: id,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check permissions
  const isAdmin = group.groupAdmin && group.groupAdmin.toString() === currentUserId.toString();
  const isSelf = userId === currentUserId.toString();

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to remove this participant'
    });
  }

  // Remove participant
  group.participants = group.participants.filter(p => 
    p.toString() !== userId
  );

  // If removing admin, assign new admin
  if (group.groupAdmin && group.groupAdmin.toString() === userId && group.participants.length > 0) {
    group.groupAdmin = group.participants[0];
  }

  await group.save();
  await group.populate('participants', 'name email profileImage status lastSeen bio');

  res.json({
    success: true,
    message: 'Participant removed',
    data: { conversation: group }
  });
});

/**
 * @desc    Update group info
 * @route   PUT /api/chats/group/:id
 * @access  Private
 */
const updateGroupInfo = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const groupId = req.params.id;
  const userId = req.user._id;

  const group = await Conversation.findOne({
    _id: groupId,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if user is admin
  if (!group.groupAdmin || group.groupAdmin.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Only group admin can update group info'
    });
  }

  if (name) group.groupName = name;
  if (avatar) group.groupAvatar = avatar;

  await group.save();
  await group.populate('participants', 'name email profileImage status lastSeen bio');

  res.json({
    success: true,
    message: 'Group updated',
    data: { conversation: group }
  });
});


/**
 * @desc    Update group description
 * @route   PUT /api/chats/group/:id/description
 * @access  Private (Admin only)
 */
const updateGroupDescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const userId = req.user._id;

  if (!description || description.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Description must be between 1-500 characters'
    });
  }

  const group = await Conversation.findOne({
    _id: id,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if user is admin
  const isAdmin = group.groupAdmin && group.groupAdmin.toString() === userId.toString();
  const isCreator = group.createdBy && group.createdBy.toString() === userId.toString();

  if (!isAdmin && !isCreator) {
    return res.status(403).json({
      success: false,
      error: 'Only group admin can update description'
    });
  }

  group.groupDescription = description;
  await group.save();

  // Emit socket event
  const io = req.app.get('io');
  io.to(`group-${id}`).emit('group-updated', {
    groupId: id,
    update: {
      type: 'description',
      description,
      updatedBy: userId,
      updatedAt: new Date()
    }
  });

  res.json({
    success: true,
    data: { description: group.groupDescription }
  });
});

/**
 * @desc    Add co-admin
 * @route   POST /api/chats/group/:id/co-admins
 * @access  Private (Creator only)
 */
const addCoAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: newAdminId } = req.body;
  const currentUserId = req.user._id;

  const group = await Conversation.findOne({
    _id: id,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if current user is creator
  const isCreator = group.createdBy && group.createdBy.toString() === currentUserId.toString();
  if (!isCreator) {
    return res.status(403).json({
      success: false,
      error: 'Only the group creator can add co-admins'
    });
  }

  // Check if user is a participant
  const isParticipant = group.participants.some(p => p.toString() === newAdminId);
  if (!isParticipant) {
    return res.status(400).json({
      success: false,
      error: 'User is not a member of this group'
    });
  }

  // Initialize coAdmins array if it doesn't exist
  if (!group.coAdmins) {
    group.coAdmins = [];
  }

  // Check if already a co-admin
  if (group.coAdmins.some(a => a.toString() === newAdminId)) {
    return res.status(400).json({
      success: false,
      error: 'User is already a co-admin'
    });
  }

  group.coAdmins.push(newAdminId);
  await group.save();

  // Emit socket event
  const io = req.app.get('io');
  io.to(`group-${id}`).emit('group-updated', {
    groupId: id,
    update: {
      type: 'co-admin-added',
      adminId: newAdminId,
      addedBy: currentUserId
    }
  });

  res.json({
    success: true,
    data: { coAdmins: group.coAdmins }
  });
});

/**
 * @desc    Remove co-admin
 * @route   DELETE /api/chats/group/:id/co-admins/:adminId
 * @access  Private (Creator only)
 */
const removeCoAdmin = asyncHandler(async (req, res) => {
  const { id, adminId } = req.params;
  const currentUserId = req.user._id;

  const group = await Conversation.findOne({
    _id: id,
    isGroup: true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if current user is creator
  const isCreator = group.createdBy && group.createdBy.toString() === currentUserId.toString();
  if (!isCreator) {
    return res.status(403).json({
      success: false,
      error: 'Only the group creator can remove co-admins'
    });
  }

  if (!group.coAdmins) {
    group.coAdmins = [];
  }

  group.coAdmins = group.coAdmins.filter(a => a.toString() !== adminId);
  await group.save();

  // Emit socket event
  const io = req.app.get('io');
  io.to(`group-${id}`).emit('group-updated', {
    groupId: id,
    update: {
      type: 'co-admin-removed',
      adminId,
      removedBy: currentUserId
    }
  });

  res.json({
    success: true,
    message: 'Co-admin removed successfully'
  });
});

/**
 * @desc    Create invite link
 * @route   POST /api/chats/group/:id/invite-link
 * @access  Private (Admin only)
 */
const createInviteLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expiresIn = 24 } = req.body; // hours
  const userId = req.user._id;

  const group = await Conversation.findOne({
    _id: id,
    isGroup: true,
    participants: userId
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Group not found'
    });
  }

  // Check if user is admin
  const isAdmin = group.groupAdmin && group.groupAdmin.toString() === userId.toString();
  const isCreator = group.createdBy && group.createdBy.toString() === userId.toString();
  const isCoAdmin = group.coAdmins?.some(a => a.toString() === userId.toString());

  if (!isAdmin && !isCreator && !isCoAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Only admins can create invite links'
    });
  }

  // Generate unique code
  const code = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  // Initialize settings if needed
  if (!group.settings) group.settings = {};
  if (!group.settings.inviteLinks) group.settings.inviteLinks = [];

  const inviteLink = {
    code,
    createdBy: userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiresIn * 60 * 60 * 1000),
    uses: 0,
    isActive: true
  };

  group.settings.inviteLinks.push(inviteLink);
  await group.save();

  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:7300'}/join-group/${code}`;

  res.json({
    success: true,
    data: {
      inviteLink: {
        ...inviteLink,
        url: inviteUrl
      }
    }
  });
});

/**
 * @desc    Join group via invite link
 * @route   POST /api/chats/join/:code
 * @access  Private
 */
const joinGroupViaLink = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const userId = req.user._id;

  const group = await Conversation.findOne({
    isGroup: true,
    'settings.inviteLinks.code': code,
    'settings.inviteLinks.isActive': true
  });

  if (!group) {
    return res.status(404).json({
      success: false,
      error: 'Invalid or expired invite link'
    });
  }

  const inviteLink = group.settings.inviteLinks.find(l => l.code === code);

  // Check if expired
  if (inviteLink.expiresAt && new Date() > new Date(inviteLink.expiresAt)) {
    inviteLink.isActive = false;
    await group.save();
    return res.status(400).json({
      success: false,
      error: 'Invite link has expired'
    });
  }

  // Check if already a member
  if (group.participants.some(p => p.toString() === userId)) {
    return res.status(400).json({
      success: false,
      error: 'You are already a member of this group'
    });
  }

  // Add user to participants
  group.participants.push(userId);
  
  // Initialize unread count
  if (!group.unreadCount) {
    group.unreadCount = new Map();
  }
  group.unreadCount.set(userId.toString(), 0);

  inviteLink.uses += 1;
  await group.save();

  // Emit socket event
  const io = req.app.get('io');
  io.to(`group-${group._id}`).emit('member-joined', {
    groupId: group._id,
    userId,
    joinedBy: inviteLink.createdBy
  });

  res.json({
    success: true,
    data: {
      group: {
        _id: group._id,
        groupName: group.groupName,
        groupAvatar: group.groupAvatar
      }
    }
  });
});


module.exports = {
  getOrCreateConversation,
  getConversation,
  getAllConversations,
  getConversationMessages,
  getConversationDetails,
  getConversationMedia,
  getConversationLinks,
  markMessagesAsRead,
  deleteMessage,
  togglePinConversation,
  toggleMuteConversation,
  toggleArchiveConversation,
  deleteConversation,
  updateCustomName,
  createGroupChat,
  addGroupParticipants,
  removeGroupParticipant,
  updateGroupInfo,
  updateGroupDescription,
  addCoAdmin,
  removeCoAdmin,
  createInviteLink,
  joinGroupViaLink
};