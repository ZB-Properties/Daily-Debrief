const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ForwardedMessage = require('../models/ForwardedMessage');
const User = require('../models/User');

/**
 * @desc    Forward message to users/conversations
 * @route   POST /api/messages/forward
 * @access  Private
 */
const forwardMessage = async (req, res) => {
  try {
    const { messageId, recipients, caption } = req.body;
    const userId = req.user._id;

    // Get original message
    const originalMessage = await Message.findById(messageId)
      .populate('sender', 'name profileImage');

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const forwardedResults = [];

    // Forward to each recipient
    for (const recipient of recipients) {
      const { type, id } = recipient; // type: 'user' or 'conversation'

      let conversationId;
      
      if (type === 'user') {
        // Find or create private conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, id] },
          type: 'private'
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, id],
            type: 'private',
            createdBy: userId
          });
        }
        conversationId = conversation._id;
      } else {
        conversationId = id; // Existing group conversation
      }

      // Create forwarded message
      const forwardedMessage = await Message.create({
        sender: userId,
        conversation: conversationId,
        content: caption || originalMessage.content,
        type: originalMessage.type,
        fileUrl: originalMessage.fileUrl,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        fileMimeType: originalMessage.fileMimeType,
        duration: originalMessage.duration,
        thumbnailUrl: originalMessage.thumbnailUrl,
        isForwarded: true,
        originalSender: originalMessage.sender._id,
        originalMessageId: originalMessage._id
      });

      await forwardedMessage.populate('sender', 'name profileImage');

      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: forwardedMessage._id,
        lastActivity: new Date()
      });

      // Record in forwarded messages collection
      await ForwardedMessage.create({
        originalMessage: messageId,
        forwardedBy: userId,
        forwardedTo: [{
          user: type === 'user' ? id : null,
          conversation: conversationId,
          delivered: false
        }],
        caption
      });

      forwardedResults.push({
        conversationId,
        message: forwardedMessage
      });
    }

    // Emit socket events for real-time delivery
    const io = req.app.get('io');
    forwardedResults.forEach(({ conversationId, message }) => {
      io.to(`conversation-${conversationId}`).emit('new-message', message);
    });

    res.json({
      success: true,
      data: {
        forwarded: forwardedResults
      }
    });
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to forward message'
    });
  }
};

/**
 * @desc    Get users and conversations for forwarding
 * @route   GET /api/messages/forward/recipients
 * @access  Private
 */
const getForwardRecipients = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's conversations
    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId }
    })
    .populate('participants', 'name profileImage')
    .sort({ lastActivity: -1 })
    .limit(50);

    // Format recipients list
    const recipients = [];

    // Add individual contacts (from conversations)
    conversations.forEach(conv => {
      if (conv.type === 'private') {
        const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
        if (otherUser) {
          recipients.push({
            type: 'user',
            id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.profileImage,
            lastMessage: conv.lastMessage
          });
        }
      } else {
        recipients.push({
          type: 'conversation',
          id: conv._id,
          name: conv.name || 'Group Chat',
          avatar: conv.avatar,
          participants: conv.participants.length,
          isGroup: true
        });
      }
    });

    res.json({
      success: true,
      data: { recipients }
    });
  } catch (error) {
    console.error('Error getting forward recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recipients'
    });
  }
};

module.exports = {
  forwardMessage,
  getForwardRecipients
};