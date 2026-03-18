const User = require('../models/User');
const Conversation = require('../models/Conversation');
const asyncHandler = require('../utils/asyncHandler');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const { logger } = require('../utils/logger');
const configureCloudinary = require('../config/cloudinary');

const cloudinary = configureCloudinary();

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */

const updateProfile = asyncHandler(async (req, res) => {
    console.log('\n🔵🔵🔵 UPDATE PROFILE DEBUG START 🔵🔵🔵');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user._id);

  const { name, bio, settings, profileImage, profileImagePublicId } = req.body;
  const updateData = {};

  // Only add fields that are provided
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (settings) updateData.settings = { ...req.user.settings, ...settings };
  
  // ADD THESE LINES - Make sure profileImage is included
  if (profileImage !== undefined) updateData.profileImage = profileImage;
  if (profileImagePublicId !== undefined) updateData.profileImagePublicId = profileImagePublicId;

  console.log('📝 Updating user with data:', updateData);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  console.log('✅ User updated:', user);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * @desc    Upload profile image
 * @route   POST /api/users/profile/image
 * @access  Private
 */
const uploadProfileImage = asyncHandler(async (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload an image'
    });
  }

  const user = await User.findById(req.user._id);

  // Delete old image from Cloudinary if exists
  if (user.profileImagePublicId) {
    try {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    } catch (error) {
      logger.error('Error deleting old profile image:', error);
    }
  }

  // Update user with new image
  user.profileImage = req.file.path;
  user.profileImagePublicId = req.file.filename;
  await user.save();

  logger.info(`Profile image updated for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Profile image updated successfully',
    data: {
      profileImage: user.profileImage,
      profileImageUrl: user.profileImageUrl
    }
  });
});

/**
 * @desc    Delete profile image
 * @route   DELETE /api/users/profile/image
 * @access  Private
 */
const deleteProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Delete image from Cloudinary if exists
  if (user.profileImagePublicId) {
    try {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    } catch (error) {
      logger.error('Error deleting profile image:', error);
    }
  }

  // Clear image data
  user.profileImage = '';
  user.profileImagePublicId = '';
  await user.save();

  logger.info(`Profile image deleted for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Profile image deleted successfully'
  });
});

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query; // Changed from 'query' to 'q' to match frontend
  const currentUserId = req.user._id;

  console.log('🔍 Search request - query:', q);

  if (!q || q.trim().length < 1) {
    return res.json({
      success: true,
      data: [] // Return empty array instead of error for empty queries
    });
  }

  const searchRegex = new RegExp(q, 'i');

  const users = await User.find({
    $and: [
      {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      },
      { _id: { $ne: currentUserId } },
      { isActive: true }
    ]
  })
  .select('name email profileImage bio status lastSeen')
  .limit(20);

  console.log(`✅ Found ${users.length} users matching "${q}"`);

  res.json({
    success: true,
    data: users // Send as array, not wrapped in { users }
  });
});

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/users/all
 * @access  Private
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  console.log('👥 Fetching all users for:', req.user._id);

  const users = await User.find({ 
    _id: { $ne: req.user._id },
    isActive: true 
  })
  .select('name email profileImage bio status lastSeen')
  .skip(skip)
  .limit(limit)
  .sort({ name: 1 });

  const total = await User.countDocuments({ 
    _id: { $ne: req.user._id },
    isActive: true 
  });

  console.log(`✅ Found ${users.length} users total (${total} available)`);

  res.json({
    success: true,
    data: users // Send as array directly
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name email profileImage bio status lastSeen settings');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.USER.NOT_FOUND
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Get online users
 * @route   GET /api/users/online
 * @access  Private
 */
const getOnlineUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
    status: 'online',
    isActive: true
  })
  .select('name profileImage status lastSeen')
  .limit(50);

  res.json({
    success: true,
    data: { users }
  });
});

/**
 * @desc    Update user status
 * @route   PUT /api/users/status
 * @access  Private
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['online', 'offline', 'away', 'busy'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status'
    });
  }

  const updateData = { status };
  
  if (status === 'offline') {
    updateData.lastSeen = new Date();
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  )
  .select('name profileImage status lastSeen');

  res.json({
    success: true,
    message: 'Status updated successfully',
    data: { user }
  });
});

/**
 * @desc    Get user conversations
 * @route   GET /api/users/conversations
 * @access  Private
 */
const getUserConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    deletedBy: { $ne: req.user._id }
  })
  .populate('participants', 'name profileImage status lastSeen')
  .populate({
    path: 'lastMessage',
    select: 'content type sender createdAt read delivered'
  })
  .sort({ lastActivity: -1 });

  // Format conversations
  const formattedConversations = conversations.map(conv => {
    const otherParticipant = conv.participants.find(
      p => !p._id.equals(req.user._id)
    );
    
    const unreadCount = conv.getUnreadCountForUser(req.user._id);

    return {
      _id: conv._id,
      participant: otherParticipant,
      lastMessage: conv.lastMessage,
      unreadCount,
      isMuted: conv.isMutedForUser(req.user._id),
      isPinned: conv.isPinnedForUser(req.user._id),
      isArchived: conv.isArchivedForUser(req.user._id),
      customName: conv.getCustomNameForUser(req.user._id),
      customImage: conv.getCustomImageForUser(req.user._id),
      lastActivity: conv.lastActivity,
      createdAt: conv.createdAt
    };
  });

  res.json({
    success: true,
    data: { conversations: formattedConversations }
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Soft delete user
  await user.softDelete();

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`Account deleted for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});


/**
 * @desc    Get user presence (online/offline/last seen)
 * @route   GET /api/users/:userId/presence
 * @access  Private
 */
const getUserPresence = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('status lastSeen');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is online from socket handler
    const { activeUsers } = require('../sockets/socketHandler');
    const isOnline = activeUsers.has(userId);

    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error('Error getting user presence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user presence'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  searchUsers,
  getUserById,
  getAllUsers,
  getOnlineUsers,
  updateStatus,
  getUserConversations,
  deleteAccount,
  getUserPresence
};