const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const {
  getOrCreateConversation,
  getConversation,
  getAllConversations,
  getConversationMessages,
  getConversationDetails,
  getConversationMedia,
  getConversationLinks,
  markMessagesAsRead,
  deleteMessage,
  togglePinConversation,
  toggleMuteConversation,
  toggleArchiveConversation,
  deleteConversation,
  updateCustomName,
  createGroupChat,
  addGroupParticipants,
  removeGroupParticipant,
  updateGroupInfo,
  updateGroupDescription,
  addCoAdmin,
  removeCoAdmin,
  createInviteLink,
  joinGroupViaLink
} = require('../controllers/chatController');

const {
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  deleteArchivedConversation
} = require('../controllers/archiveController');

const {
  setBackground,
  getBackground,
  resetBackground
} = require('../controllers/backgroundController');

// Validation rules

const getOrCreateConversationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .custom(value => {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    })
];

const updateCustomNameValidation = [
  body('customName').optional().trim().isLength({ max: 50 })
];

// Routes 
router.post('/conversation', 
  authMiddleware, 
  validate(getOrCreateConversationValidation), 
  getOrCreateConversation
);
router.get('/conversation/:id', authMiddleware, getConversation);
router.get('/conversations', authMiddleware, getAllConversations);
router.get('/conversation/:id/messages', authMiddleware, getConversationMessages);
router.get('/conversation/:id/details', authMiddleware, getConversationDetails);
router.get('/conversation/:id/media', authMiddleware, getConversationMedia);
router.get('/conversation/:id/links', authMiddleware, getConversationLinks);
router.post('/conversation/:id/read', authMiddleware, markMessagesAsRead);
router.delete('/message/:id', authMiddleware, deleteMessage);
router.put('/conversation/:id/pin', authMiddleware, togglePinConversation);
router.put('/conversation/:id/mute', authMiddleware, toggleMuteConversation);
router.put('/conversation/:id/archive', authMiddleware, toggleArchiveConversation);
router.delete('/conversation/:id', authMiddleware, deleteConversation);
router.put('/conversation/:id/custom-name', 
  authMiddleware, 
  validate(updateCustomNameValidation), 
  updateCustomName
);


// Add this temporary test endpoint
router.post('/test-conversation', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;
    
    const conversation = await Conversation.findOne({
      participants: { 
        $all: [currentUserId, userId],
        $size: 2
      },
      isGroup: false
    });
    
    res.json({
      success: true,
      data: {
        exists: !!conversation,
        conversationId: conversation?._id,
        participants: conversation?.participants
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add these routes
router.post('/group', 
  authMiddleware, 
  createGroupChat
);

router.post('/group/:id/add', 
  authMiddleware, 
  addGroupParticipants
);

router.delete('/group/:id/participant/:userId', 
  authMiddleware, 
  removeGroupParticipant
);

router.put('/group/:id', 
  authMiddleware, 
  updateGroupInfo
);

// Add these new routes after your existing group routes
router.put('/group/:id/description', 
  authMiddleware, 
  updateGroupDescription
);

router.post('/group/:id/co-admins', 
  authMiddleware, 
  addCoAdmin
);

router.delete('/group/:id/co-admins/:adminId', 
  authMiddleware, 
  removeCoAdmin
);

router.post('/group/:id/invite-link', 
  authMiddleware, 
  createInviteLink
);

router.post('/join/:code', 
  authMiddleware, 
  joinGroupViaLink
);

// ===== ARCHIVE ROUTES =====
router.put('/:conversationId/archive', authMiddleware, archiveConversation);
router.put('/:conversationId/unarchive', authMiddleware, unarchiveConversation);
router.delete('/:conversationId/archive', authMiddleware, deleteArchivedConversation);
router.get('/archived', authMiddleware, getArchivedConversations);

// Background routes
router.get('/:conversationId/background', authMiddleware, getBackground);
router.put('/:conversationId/background', authMiddleware, setBackground);
router.delete('/:conversationId/background', authMiddleware, resetBackground);

module.exports = router;