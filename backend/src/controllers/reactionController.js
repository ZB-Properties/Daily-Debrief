const Message = require('../models/Message');
const { io } = require('socket.io')

/**
 * @desc    Add reaction to message
 * @route   POST /api/messages/:messageId/reactions
 * @access  Private
 */
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction if already exists
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        user: userId
      });
    }

    await message.save();
    await message.populate('reactions.user', 'name profileImage');

    // Emit real-time update via socket
    const io = req.app.get('io');
    io.to(`conversation-${message.conversation}`).emit('message-reaction', {
      messageId: message._id,
      conversationId: message.conversation,
      reactions: message.reactions
    });

    res.json({
      success: true,
      data: {
        reactions: message.reactions
      }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    });
  }
};

/**
 * @desc    Get reactions for message
 * @route   GET /api/messages/:messageId/reactions
 * @access  Private
 */
const getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate('reactions.user', 'name profileImage');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: {
        reactions: message.reactions
      }
    });
  } catch (error) {
    console.error('Error getting reactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reactions'
    });
  }
};

module.exports = {
  addReaction,
  getReactions
};