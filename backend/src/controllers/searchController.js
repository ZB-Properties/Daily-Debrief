const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * @desc    Search messages in a specific conversation
 * @route   GET /api/messages/search
 * @access  Private
 */
const searchMessages = async (req, res) => {
  try {
    const { q, conversationId, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = {
      content: { $regex: q, $options: 'i' },
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: userId }
    };

    // If conversationId is provided, search only in that conversation
    if (conversationId) {
      // Verify user has access to this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        deletedBy: { $ne: userId }
      });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to search in this conversation'
        });
      }

      query.conversation = conversationId;
    } else {
      // Search in all user's conversations
      const conversations = await Conversation.find({
        participants: userId,
        deletedBy: { $ne: userId }
      }).select('_id');

      query.conversation = { $in: conversations.map(c => c._id) };
    }

    // Execute search
    const messages = await Message.find(query)
      .populate('sender', 'name profileImage email')
      .populate('conversation', 'isGroup groupName participants')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    // Group results by conversation for better organization
    const groupedResults = {};
    messages.forEach(msg => {
      const convId = msg.conversation._id.toString();
      if (!groupedResults[convId]) {
        groupedResults[convId] = {
          conversation: msg.conversation,
          messages: []
        };
      }
      groupedResults[convId].messages.push(msg);
    });

    res.json({
      success: true,
      data: {
        results: Object.values(groupedResults),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages'
    });
  }
};

/**
 * @desc    Global search across users and messages
 * @route   GET /api/search/global
 * @access  Private
 */
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Search for users
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email profileImage status')
    .limit(10);

    // Search for conversations
    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId },
      $or: [
        { groupName: { $regex: q, $options: 'i' } },
        { 'participantsInfo.name': { $regex: q, $options: 'i' } }
      ]
    })
    .populate('participants', 'name profileImage')
    .limit(10);

    // Search for messages (limited to recent 50)
    const messages = await Message.find({
      content: { $regex: q, $options: 'i' },
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name profileImage')
    .populate('conversation', 'isGroup groupName')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      data: {
        users,
        conversations,
        messages
      }
    });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform global search'
    });
  }
};

module.exports = {
  searchMessages,
  globalSearch
};