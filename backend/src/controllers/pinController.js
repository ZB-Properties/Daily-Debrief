const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * @desc    Pin a message
 * @route   POST /api/messages/:messageId/pin
 * @access  Private
 */
const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate('sender', 'name profileImage');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pin messages in this conversation'
      });
    }

    // If message is already pinned, unpin it
    if (message.pinned) {
      message.pinned = false;
      message.pinnedBy = null;
      message.pinnedAt = null;
    } else {
      // Unpin any previously pinned messages in this conversation
      await Message.updateMany(
        { conversation: message.conversation, pinned: true },
        { pinned: false, pinnedBy: null, pinnedAt: null }
      );

      // Pin this message
      message.pinned = true;
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
    }

    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`conversation-${message.conversation}`).emit('message-pinned', {
      messageId: message._id,
      conversationId: message.conversation,
      pinned: message.pinned,
      pinnedBy: userId,
      pinnedAt: message.pinnedAt
    });

    res.json({
      success: true,
      data: {
        pinned: message.pinned,
        message
      }
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pin message'
    });
  }
};

/**
 * @desc    Get pinned message in conversation
 * @route   GET /api/chats/:conversationId/pinned
 * @access  Private
 */
const getPinnedMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check if user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const pinnedMessage = await Message.findOne({
      conversation: conversationId,
      pinned: true
    })
    .populate('sender', 'name profileImage')
    .populate('pinnedBy', 'name');

    res.json({
      success: true,
      data: { pinnedMessage }
    });
  } catch (error) {
    console.error('Error getting pinned message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pinned message'
    });
  }
};

module.exports = {
  pinMessage,
  getPinnedMessage
};