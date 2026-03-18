const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { uploadSingle, handleUploadErrors } = require('../middleware/upload');
const {
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
} = require('../controllers/userController');

const {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlockStatus
} = require('../controllers/blockController');

// Validation rules
const updateProfileValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 200 })
];

const updateStatusValidation = [
  body('status').isIn(['online', 'offline', 'away', 'busy'])
];

// ✅ Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validate(updateProfileValidation), updateProfile);
router.post('/profile/image', 
  authMiddleware, 
  uploadSingle('image'),
  handleUploadErrors,
  uploadProfileImage
);
router.delete('/profile/image', authMiddleware, deleteProfileImage);

// ✅ User search and listing - UPDATED
router.get('/search', authMiddleware, searchUsers);  // Search users
router.get('/all', authMiddleware, getAllUsers);      // Get all users (for new chat)
router.get('/online', authMiddleware, getOnlineUsers);
router.get('/conversations', authMiddleware, getUserConversations);
router.get('/blocked', authMiddleware, getBlockedUsers);

// ✅ User by ID - must be last to avoid conflicts with other routes
router.get('/:id', authMiddleware, getUserById);

// ✅ Status update
router.put('/status', authMiddleware, validate(updateStatusValidation), updateStatus);

// ✅ Account deletion
router.delete('/account', authMiddleware, deleteAccount);

// Add this route
router.get('/:userId/presence', authMiddleware, getUserPresence);
 
// Block/Unblock routes
router.post('/:userId/block', authMiddleware, blockUser);
router.post('/:userId/unblock', authMiddleware, unblockUser);
router.get('/:userId/block-status', authMiddleware, checkBlockStatus);

// ✅ User by ID - must be last to avoid conflicts with other routes
router.get('/:id', authMiddleware, getUserById);

module.exports = router;