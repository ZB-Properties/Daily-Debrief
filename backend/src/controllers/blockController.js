const User = require('../models/User');
const Conversation = require('../models/Conversation');

/**
 * @desc    Block a user
 * @route   POST /api/users/:userId/block
 * @access  Private
 */
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Cannot block yourself
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block yourself'
      });
    }

    // Check if user exists
    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add to blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userId }
    });

    // Archive all conversations with this user
    await Conversation.updateMany(
      {
        participants: { $all: [currentUserId, userId] },
        type: 'private'
      },
      {
        $addToSet: { archivedBy: currentUserId }
      }
    );

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block user'
    });
  }
};

/**
 * @desc    Unblock a user
 * @route   POST /api/users/:userId/unblock
 * @access  Private
 */
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId }
    });

    // Unarchive conversations
    await Conversation.updateMany(
      {
        participants: { $all: [currentUserId, userId] },
        type: 'private'
      },
      {
        $pull: { archivedBy: currentUserId }
      }
    );

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user'
    });
  }
};

/**
 * @desc    Get blocked users list
 * @route   GET /api/users/blocked
 * @access  Private
 */
const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'name email profileImage');

    res.json({
      success: true,
      data: { blockedUsers: user.blockedUsers || [] }
    });
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blocked users'
    });
  }
};

/**
 * @desc    Check if user is blocked
 * @route   GET /api/users/:userId/block-status
 * @access  Private
 */
const checkBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const isBlocked = user.blockedUsers?.includes(userId);

    res.json({
      success: true,
      data: { isBlocked }
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check block status'
    });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlockStatus
};