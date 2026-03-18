const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * @desc    Get user's favorite conversations
 * @route   GET /api/favorites
 * @access  Private
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where user has pinned/favorited
    const conversations = await Conversation.find({
      participants: userId,
      pinnedBy: userId, // Using pinnedBy as favorites
      deletedBy: { $ne: userId }
    })
    .populate('participants', 'name email profileImage bio status lastSeen')
    .populate({
      path: 'lastMessage',
      select: 'content type sender createdAt'
    })
    .sort({ lastActivity: -1 });

    // Format the response
    const formattedFavorites = conversations.map(conv => {
      const isGroup = conv.isGroup;
      
      if (isGroup) {
        return {
          _id: conv._id,
          isGroup: true,
          name: conv.groupName,
          avatar: conv.groupAvatar,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount: conv.getUnreadCountForUser ? conv.getUnreadCountForUser(userId) : 0,
          participantCount: conv.participants?.length || 0
        };
      } else {
        // For private chats, get the other participant
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );
        
        return {
          _id: conv._id,
          isGroup: false,
          user: otherParticipant,
          lastMessage: conv.lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount: conv.getUnreadCountForUser ? conv.getUnreadCountForUser(userId) : 0
        };
      }
    });

    res.json({
      success: true,
      data: formattedFavorites
    });

  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorites: ' + error.message
    });
  }
};

/**
 * @desc    Get favorite contacts (users)
 * @route   GET /api/favorites/contacts
 * @access  Private
 */
const getFavoriteContacts = async (req, res) => {
  try {
    const userId = req.user._id;

    // This would need a separate favorites collection
    // For now, we'll use a workaround - get users with most conversations
    const conversations = await Conversation.find({
      participants: userId,
      isGroup: false,
      deletedBy: { $ne: userId }
    })
    .populate('participants', 'name email profileImage bio status lastSeen')
    .sort({ lastActivity: -1 })
    .limit(20);

    // Get unique users from conversations
    const favoriteUsers = [];
    const seenIds = new Set();

    conversations.forEach(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      if (otherUser && !seenIds.has(otherUser._id.toString())) {
        seenIds.add(otherUser._id.toString());
        favoriteUsers.push({
          ...otherUser.toObject(),
          lastChat: conv.lastMessage?.content || 'No messages yet',
          lastActivity: conv.lastActivity,
          conversationId: conv._id
        });
      }
    });

    res.json({
      success: true,
      data: favoriteUsers.slice(0, 10) // Limit to 10 favorites
    });

  } catch (error) {
    console.error('Error getting favorite contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorite contacts: ' + error.message
    });
  }
};

/**
 * @desc    Toggle favorite status for a conversation
 * @route   POST /api/favorites/toggle/:conversationId
 * @access  Private
 */
const toggleFavorite = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const isFavorite = conversation.pinnedBy.some(
      id => id.toString() === userId.toString()
    );

    if (isFavorite) {
      // Remove from favorites
      conversation.pinnedBy = conversation.pinnedBy.filter(
        id => id.toString() !== userId.toString()
      );
    } else {
      // Add to favorites
      conversation.pinnedBy.push(userId);
    }

    await conversation.save();

    res.json({
      success: true,
      data: {
        isFavorite: !isFavorite,
        conversationId
      }
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite: ' + error.message
    });
  }
};

/**
 * @desc    Toggle favorite for a user (contact)
 * @route   POST /api/favorites/user/:userId/toggle
 * @access  Private
 */
const toggleUserFavorite = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot favorite yourself'
      });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // This would need a separate favorites collection
    // For now, we'll use a workaround - find or create a conversation and toggle pin
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, targetUserId] },
      isGroup: false
    });

    if (!conversation) {
      // Create a conversation if it doesn't exist
      const unreadMap = new Map();
      unreadMap.set(currentUserId.toString(), 0);
      unreadMap.set(targetUserId.toString(), 0);

      conversation = new Conversation({
        participants: [currentUserId, targetUserId],
        isGroup: false,
        createdBy: currentUserId,
        unreadCount: unreadMap,
        lastActivity: new Date()
      });
      await conversation.save();
    }

    const isFavorite = conversation.pinnedBy.some(
      id => id.toString() === currentUserId.toString()
    );

    if (isFavorite) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        id => id.toString() !== currentUserId.toString()
      );
    } else {
      conversation.pinnedBy.push(currentUserId);
    }

    await conversation.save();

    res.json({
      success: true,
      data: {
        isFavorite: !isFavorite,
        userId: targetUserId
      }
    });

  } catch (error) {
    console.error('Error toggling user favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user favorite: ' + error.message
    });
  }
};

module.exports = {
  getFavorites,
  getFavoriteContacts,
  toggleFavorite,
  toggleUserFavorite
};