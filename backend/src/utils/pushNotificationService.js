const webpush = require('web-push');
const User = require('../models/User');

// Configure web-push with VAPID keys
// Generate keys using: webpush.generateVAPIDKeys()
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const pushNotificationService = {
  // Save subscription for a user
  saveSubscription: async (userId, subscription) => {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { pushSubscription: subscription }
      });
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  },

  // Remove subscription
  removeSubscription: async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });
      return true;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }
  },

  // Send push notification to a user
  sendToUser: async (userId, payload) => {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushSubscription) {
        return false;
      }

      const subscription = user.pushSubscription;
      
      // Send notification
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        await pushNotificationService.removeSubscription(userId);
      }
      return false;
    }
  },

  // Send to multiple users
  sendToMultiple: async (userIds, payload) => {
    const results = await Promise.allSettled(
      userIds.map(userId => pushNotificationService.sendToUser(userId, payload))
    );
    return results.filter(r => r.status === 'fulfilled').length;
  },

  // Send notification for new message
  sendNewMessageNotification: async (receiverId, message, sender) => {
    const payload = {
      title: `New message from ${sender.name}`,
      body: message.content || 'Sent you a message',
      icon: sender.profileImage || '/default-avatar.png',
      badge: '/badge.png',
      data: {
        url: `/chats?conversation=${message.conversation}`,
        messageId: message._id,
        conversationId: message.conversation,
        type: 'new-message'
      },
      actions: [
        { action: 'open', title: 'Open Chat' },
        { action: 'reply', title: 'Reply' }
      ]
    };

    await pushNotificationService.sendToUser(receiverId, payload);
  },

  // Send notification for call
  sendCallNotification: async (receiverId, caller, callType) => {
    const payload = {
      title: `${callType === 'video' ? '📹' : '📞'} Incoming ${callType} call`,
      body: `${caller.name} is calling you`,
      icon: caller.profileImage || '/default-avatar.png',
      badge: '/badge.png',
      data: {
        url: `/call/${caller._id}?type=${callType}`,
        type: 'incoming-call',
        callerId: caller._id,
        callType
      },
      actions: [
        { action: 'answer', title: 'Answer' },
        { action: 'decline', title: 'Decline' }
      ]
    };

    await pushNotificationService.sendToUser(receiverId, payload);
  },

  // Send notification for missed call
  sendMissedCallNotification: async (receiverId, caller) => {
    const payload = {
      title: 'Missed call',
      body: `You missed a call from ${caller.name}`,
      icon: caller.profileImage || '/default-avatar.png',
      badge: '/badge.png',
      data: {
        url: `/calls`,
        type: 'missed-call',
        callerId: caller._id
      }
    };

    await pushNotificationService.sendToUser(receiverId, payload);
  },

  // Send notification for group activity
  sendGroupNotification: async (group, userIds, activity, actor) => {
    const payload = {
      title: group.groupName,
      body: activity,
      icon: group.groupAvatar || '/group-default.png',
      badge: '/badge.png',
      data: {
        url: `/chats?conversation=${group._id}`,
        type: 'group-activity',
        groupId: group._id
      }
    };

    // Don't send to the actor
    const recipients = userIds.filter(id => id.toString() !== actor._id.toString());
    await pushNotificationService.sendToMultiple(recipients, payload);
  }
};

module.exports = pushNotificationService;