const User = require('../models/User');

const blockCheck = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId || req.body.receiverId;

    if (!targetUserId) return next();

    // Check if current user has blocked the target
    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers?.includes(targetUserId)) {
      return res.status(403).json({
        success: false,
        error: 'You have blocked this user'
      });
    }

    // Check if target has blocked current user
    const targetUser = await User.findById(targetUserId);
    if (targetUser.blockedUsers?.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: 'This user has blocked you'
      });
    }

    next();
  } catch (error) {
    console.error('Error in block check:', error);
    next();
  }
};

module.exports = { blockCheck };