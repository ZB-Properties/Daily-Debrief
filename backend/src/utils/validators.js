const { body, param, query } = require('express-validator');
const User = require('../models/User');

/**
 * Common validation rules for authentication
 */
const authValidators = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new Error('Email already in use');
        }
      }),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 50 })
      .withMessage('Name cannot exceed 50 characters')
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ],
  
  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
  ],
  
  resetPassword: [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ]
};

/**
 * Common validation rules for users
 */
const userValidators = {
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Bio cannot exceed 200 characters')
  ],
  
  updateStatus: [
    body('status')
      .isIn(['online', 'offline', 'away', 'busy'])
      .withMessage('Invalid status')
  ]
};

/**
 * Common validation rules for chats
 */
const chatValidators = {
  getOrCreateConversation: [
    body('userId')
      .isMongoId()
      .withMessage('Invalid user ID')
      .custom(async (userId, { req }) => {
        if (userId === req.user._id.toString()) {
          throw new Error('Cannot create conversation with yourself');
        }
        
        const user = await User.findById(userId);
        if (!user || !user.isActive) {
          throw new Error('User not found');
        }
        
        return true;
      })
  ],
  
  sendMessage: [
    body('receiverId')
      .isMongoId()
      .withMessage('Invalid receiver ID')
      .custom(async (receiverId, { req }) => {
        if (receiverId === req.user._id.toString()) {
          throw new Error('Cannot send message to yourself');
        }
        
        const user = await User.findById(receiverId);
        if (!user || !user.isActive) {
          throw new Error('Receiver not found');
        }
        
        return true;
      }),
    body('content')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'audio', 'video', 'file', 'system'])
      .withMessage('Invalid message type'),
    body('fileUrl')
      .optional()
      .isURL()
      .withMessage('Invalid file URL'),
    body('fileName')
      .optional()
      .trim(),
    body('fileSize')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Invalid file size'),
    body('mimeType')
      .optional()
      .trim(),
    body('duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Invalid duration'),
    body('replyTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid reply message ID')
  ]
};

/**
 * Common validation rules for calls
 */
const callValidators = {
  initiateCall: [
    body('receiverId')
      .isMongoId()
      .withMessage('Invalid receiver ID')
      .custom(async (receiverId, { req }) => {
        if (receiverId === req.user._id.toString()) {
          throw new Error('Cannot call yourself');
        }
        
        const user = await User.findById(receiverId);
        if (!user || !user.isActive) {
          throw new Error('Receiver not found');
        }
        
        return true;
      }),
    body('type')
      .isIn(['audio', 'video'])
      .withMessage('Invalid call type'),
    body('sdpOffer')
      .optional()
      .isString()
  ],
  
  answerCall: [
    body('sdpAnswer')
      .optional()
      .isString()
  ]
};

/**
 * Common validation rules for pagination
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Common validation rules for search
 */
const searchValidators = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

module.exports = {
  ...authValidators,
  ...userValidators,
  ...chatValidators,
  ...callValidators,
  paginationValidators,
  searchValidators
};