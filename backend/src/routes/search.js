const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  searchMessages,
  globalSearch
} = require('../controllers/searchController');


// Search messages
router.get('/messages', authMiddleware, searchMessages);

// Global search
router.get('/global', authMiddleware, globalSearch);

module.exports = router;