const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * @desc    Reply to a message
 * @route   POST /api/messages/:messageId/reply
 * @access  Private
 */
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user._id;

    // Get the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: 'Original message not found'
      });
    }

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: originalMessage.conversation,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reply in this conversation'
      });
    }

    // Create reply message
    const reply = await Message.create({
      sender: userId,
      conversation: originalMessage.conversation,
      content,
      type,
      replyTo: messageId
    });

    await reply.populate('sender', 'name profileImage email');
    await reply.populate('replyTo');

    // Update conversation last message
    await Conversation.findByIdAndUpdate(originalMessage.conversation, {
      lastMessage: reply._id,
      lastActivity: new Date()
    });

    // Emit via socket
    const io = req.app.get('io');
    io.to(`conversation-${originalMessage.conversation}`).emit('new-message', reply);

    res.status(201).json({
      success: true,
      data: { message: reply }
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reply to message'
    });
  }
};

/**
 * @desc    Get message thread (original + all replies)
 * @route   GET /api/messages/:messageId/thread
 * @access  Private
 */
const getMessageThread = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Get the original message
    const originalMessage = await Message.findById(messageId)
      .populate('sender', 'name profileImage email')
      .populate('replyTo');

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify user has access
    const conversation = await Conversation.findOne({
      _id: originalMessage.conversation,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this thread'
      });
    }

    // Get all replies (messages that reply to this message or are part of the thread)
    const replies = await Message.find({
      $or: [
        { replyTo: messageId },
        { _id: messageId } // Include the original
      ]
    })
    .populate('sender', 'name profileImage email')
    .populate('replyTo')
    .sort({ createdAt: 1 });

    // Build thread structure
    const thread = {
      original: replies.find(r => r._id.toString() === messageId),
      replies: replies.filter(r => r._id.toString() !== messageId)
    };

    res.json({
      success: true,
      data: { thread }
    });
  } catch (error) {
    console.error('Error getting message thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get message thread'
    });
  }
};

module.exports = {
  replyToMessage,
  getMessageThread
};