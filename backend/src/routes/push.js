const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  subscribe,
  unsubscribe,
  getVapidKey,
  testNotification
} = require('../controllers/pushController');

// Public route
router.get('/vapid-key', getVapidKey);


router.post('/subscribe', authMiddleware, subscribe);
router.post('/unsubscribe', authMiddleware, unsubscribe);
router.post('/test', authMiddleware, testNotification);

module.exports = router;