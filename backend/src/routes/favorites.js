const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getFavorites,
  getFavoriteContacts,
  toggleFavorite,
  toggleUserFavorite
} = require('../controllers/favoriteController');


// Get favorites
router.get('/', authMiddleware, getFavorites);
router.get('/contacts', authMiddleware, getFavoriteContacts);

// Toggle favorites
router.post('/toggle/:conversationId', authMiddleware, toggleFavorite);
router.post('/user/:userId/toggle', authMiddleware, toggleUserFavorite);

module.exports = router;