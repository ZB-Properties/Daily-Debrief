const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getMessageById,
  reactToMessage,
  markAsRead,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone
} = require('../controllers/messageController');

const {
  addReaction,
  getReactions
} = require('../controllers/reactionController');

const {
  forwardMessage,
  getForwardRecipients
} = require('../controllers/forwardController');


const {
  replyToMessage,
  getMessageThread
} = require('../controllers/threadController');

const {
  pinMessage,
  getPinnedMessage
} = require('../controllers/pinController');

// More flexible validation rules for file messages
const sendMessageValidation = [
  body('conversationId')
    .notEmpty()
    .withMessage('conversationId is required')
    .isMongoId()
    .withMessage('Invalid conversation ID format'),
  
  body('content')
    .optional()
    .trim(),
  
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file'])
    .withMessage('Invalid message type'),
  
  body('fileUrl')
    .optional()
    .isString()
    .withMessage('fileUrl must be a string'),
  
  body('fileName')
    .optional()
    .isString()
    .withMessage('fileName must be a string'),
  
  body('fileSize')
    .optional()
    .isNumeric()
    .withMessage('fileSize must be a number'),
  
  body('filePublicId')
    .optional()
    .isString()
    .withMessage('filePublicId must be a string'),
  
  body('thumbnailUrl')
    .optional()
    .isString()
    .withMessage('thumbnailUrl must be a string'),
  
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('duration must be a number')
];

// Routes
router.post('/', 
  authMiddleware, 
  validate(sendMessageValidation), 
  sendMessage
);

router.get('/conversation/:conversationId/pinned', authMiddleware, getPinnedMessage);

router.get('/conversation/:conversationId', 
  authMiddleware, 
  getMessages
);

router.get('/:messageId', 
  authMiddleware, 
  getMessageById
);

router.put('/:messageId/read', 
  authMiddleware, 
  markAsRead
);

//router.delete('/:messageId', 
  //authMiddleware, 
  //deleteMessage
//);

router.post('/:messageId/react', 
  authMiddleware, 
  reactToMessage
);

// Add this route
router.put('/:id', 
  authMiddleware, 
  editMessage
);

// Delete message for me
router.delete('/:id/me', 
  authMiddleware, 
  deleteMessageForMe
);

// Delete message for everyone
router.delete('/:id/everyone', 
  authMiddleware, 
  deleteMessageForEveryone
);

// Reaction routes
router.post('/:messageId/reactions', authMiddleware, addReaction);
router.get('/:messageId/reactions', authMiddleware, getReactions);

// Forward routes
router.post('/forward', authMiddleware, forwardMessage);
router.get('/forward/recipients', authMiddleware, getForwardRecipients);

// Thread routes
router.post('/:messageId/reply', authMiddleware, replyToMessage);
router.get('/:messageId/thread', authMiddleware, getMessageThread);

// Pin routes
router.post('/:messageId/pin', authMiddleware, pinMessage);


module.exports = router;