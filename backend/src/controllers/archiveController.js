const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * @desc    Get archived conversations
 * @route   GET /api/chats/archived
 * @access  Private
 */
const getArchivedConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: userId,
      deletedBy: { $ne: userId }
    })
    .populate('participants', 'name profileImage email status lastSeen bio')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    // Format response
    const formattedConversations = conversations.map(conv => {
      const convObj = conv.toObject();
      
      // For private chats, get the other participant
      if (!conv.isGroup) {
        const otherParticipant = conv.participants.find(p => p._id.toString() !== userId.toString());
        convObj.participant = otherParticipant;
        
        // Remove participants array for cleaner response
        delete convObj.participants;
      }

      return convObj;
    });

    res.json({
      success: true,
      data: { conversations: formattedConversations }
    });
  } catch (error) {
    console.error('Error getting archived conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get archived conversations'
    });
  }
};

/**
 * @desc    Archive a conversation
 * @route   PUT /api/chats/:conversationId/archive
 * @access  Private
 */
const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to archive this conversation'
      });
    }

    // Add user to archivedBy if not already there
    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
      
      // Remove from pinned if it was pinned
      if (conversation.pinnedBy && conversation.pinnedBy.includes(userId)) {
        conversation.pinnedBy = conversation.pinnedBy.filter(id => id.toString() !== userId.toString());
      }
      
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive conversation'
    });
  }
};

/**
 * @desc    Unarchive a conversation
 * @route   PUT /api/chats/:conversationId/unarchive
 * @access  Private
 */
const unarchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Remove user from archivedBy
    conversation.archivedBy = conversation.archivedBy.filter(id => id.toString() !== userId.toString());
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation unarchived successfully'
    });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unarchive conversation'
    });
  }
};

/**
 * @desc    Delete archived conversation permanently
 * @route   DELETE /api/chats/:conversationId/archive
 * @access  Private
 */
const deleteArchivedConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Add user to deletedBy
    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      
      // Also remove from archivedBy
      if (conversation.archivedBy.includes(userId)) {
        conversation.archivedBy = conversation.archivedBy.filter(id => id.toString() !== userId.toString());
      }
      
      await conversation.save();
    }

    // Check if all participants have deleted the conversation
    const allParticipants = conversation.participants || [];
    const allDeleted = allParticipants.every(participantId => 
      conversation.deletedBy.includes(participantId.toString())
    );

    // If all participants have deleted, permanently remove the conversation
    if (allDeleted && conversation.deletedBy.length === allParticipants.length) {
      await Conversation.findByIdAndDelete(conversationId);
      // Also delete all messages in this conversation
      await Message.deleteMany({ conversation: conversationId });
    }

    res.json({
      success: true,
      message: 'Conversation deleted permanently'
    });
  } catch (error) {
    console.error('Error deleting archived conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
};

/**
 * @desc    Auto-archive old conversations (cron job)
 * @access  Internal
 */
const autoArchiveOldConversations = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find conversations with no activity for 30 days
    const oldConversations = await Conversation.find({
      lastActivity: { $lt: thirtyDaysAgo },
      isGroup: false // Only auto-archive private chats, not groups
    });

    for (const conversation of oldConversations) {
      // Archive for all participants
      for (const participantId of conversation.participants) {
        if (!conversation.archivedBy.includes(participantId.toString())) {
          conversation.archivedBy.push(participantId);
        }
      }
      await conversation.save();
    }

    console.log(`Auto-archived ${oldConversations.length} old conversations`);
  } catch (error) {
    console.error('Error auto-archiving conversations:', error);
  }
};

module.exports = {
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  deleteArchivedConversation,
  autoArchiveOldConversations
};