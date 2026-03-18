const pushNotificationService = require('../utils/pushNotificationService');

/**
 * @desc    Subscribe to push notifications
 * @route   POST /api/push/subscribe
 * @access  Private
 */
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id;

    const success = await pushNotificationService.saveSubscription(userId, subscription);

    if (success) {
      res.json({
        success: true,
        message: 'Subscribed to push notifications'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to subscribe'
      });
    }
  } catch (error) {
    console.error('Error in subscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe'
    });
  }
};

/**
 * @desc    Unsubscribe from push notifications
 * @route   POST /api/push/unsubscribe
 * @access  Private
 */
const unsubscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    await pushNotificationService.removeSubscription(userId);

    res.json({
      success: true,
      message: 'Unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
};

/**
 * @desc    Get VAPID public key
 * @route   GET /api/push/vapid-key
 * @access  Public
 */
const getVapidKey = (req, res) => {
  res.json({
    success: true,
    data: {
      publicKey: process.env.VAPID_PUBLIC_KEY
    }
  });
};

/**
 * @desc    Test push notification (for development)
 * @route   POST /api/push/test
 * @access  Private
 */
const testNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, body } = req.body;

    const payload = {
      title: title || 'Test Notification',
      body: body || 'This is a test push notification',
      data: {
        url: '/',
        type: 'test'
      }
    };

    await pushNotificationService.sendToUser(userId, payload);

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getVapidKey,
  testNotification
};