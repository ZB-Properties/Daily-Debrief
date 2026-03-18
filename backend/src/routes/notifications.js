const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth'); // Changed from protect to authMiddleware
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} = require('../controllers/notificationController');


// Get all notifications
router.get('/', authMiddleware, getNotifications);

// Get unread count
router.get('/unread-count', authMiddleware, getUnreadCount);

// Mark all as read
router.put('/read-all', authMiddleware, markAllAsRead);

// Mark single as read
router.put('/:id/read', authMiddleware, markAsRead);

// Delete single notification
router.delete('/:id', authMiddleware, deleteNotification);

// Delete all notifications
router.delete('/all', authMiddleware, deleteAllNotifications);

module.exports = router;