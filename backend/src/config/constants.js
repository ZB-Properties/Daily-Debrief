// /config/constants.js - This should be constants, not errorhandler code
module.exports = {
  ERROR_MESSAGES: {
    AUTH: {
      UNAUTHORIZED: 'Not authorized, please login',
      INVALID_CREDENTIALS: 'Invalid email or password',
      TOKEN_INVALID: 'Invalid token',
      TOKEN_EXPIRED: 'Token expired',
      NO_TOKEN: 'No token provided',
      ACCESS_DENIED: 'Access denied',
      REGISTER_FAILED: 'Registration failed',
      LOGIN_FAILED: 'Login failed'
    },
    USER: {
      NOT_FOUND: 'User not found',
      EXISTS: 'User already exists',
      UPDATE_FAILED: 'Failed to update user',
      DELETE_FAILED: 'Failed to delete user',
      INACTIVE: 'User account is inactive'
    },
    FILE: {
      UPLOAD_FAILED: 'File upload failed',
      INVALID_TYPE: 'Invalid file type',
      TOO_LARGE: 'File too large',
      NOT_FOUND: 'File not found'
    },
    VALIDATION: {
      REQUIRED: 'This field is required',
      INVALID_EMAIL: 'Invalid email format',
      PASSWORD_LENGTH: 'Password must be at least 6 characters',
      PASSWORD_MISMATCH: 'Passwords do not match'
    }
  },
  
  SUCCESS_MESSAGES: {
    AUTH: {
      REGISTER: 'Registration successful',
      LOGIN: 'Login successful',
      LOGOUT: 'Logout successful',
      REFRESH: 'Token refreshed successfully'
    },
    USER: {
      UPDATED: 'User updated successfully',
      DELETED: 'User deleted successfully',
      PROFILE_UPDATED: 'Profile updated successfully'
    },
    FILE: {
      UPLOADED: 'File uploaded successfully',
      DELETED: 'File deleted successfully'
    }
  },
  
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },
  
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

 // Socket event names - MUST match backend constants
 SOCKET_EVENTS: {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Messages
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  MESSAGE_DELETED_EVERYONE: 'message-deleted-everyone',
  
  // Typing
  TYPING: 'typing',
  USER_TYPING: 'user-typing',
  
  // Calls
  INITIATE_CALL: 'initiate-call',
  CALL_OFFER: 'call-offer',
  CALL_ANSWER: 'call-answer',
  CALL_ICE_CANDIDATE: 'ice-candidate',
  END_CALL: 'end-call',
  CALL_REJECTED: 'call-rejected',
  CALL_MISSED: 'call-missed',
  INCOMING_CALL: 'incoming-call',
  CALL_ENDED: 'call-ended',
  
  // Online users
  ONLINE_USERS: 'online-users',
  USER_STATUS_CHANGED: 'user-status-changed',
  GET_ONLINE_USERS: 'get-online-users',
  
  // Conversations
  CONVERSATION_UPDATED: 'conversation-updated',
  
  // Notifications
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  ALL_NOTIFICATIONS_READ: 'all-notifications-read',
  
  // Ping/Pong
  PING: 'ping',
  PONG: 'pong'
},
  
  SOCKET_ROOMS: {
    USER: 'user_',
    CHAT: 'chat_',
    GROUP: 'group_'
  },
  
  SOCKET_ERRORS: {
    AUTH_FAILED: 'Authentication failed',
    INVALID_DATA: 'Invalid data',
    CHAT_NOT_FOUND: 'Chat not found',
    NOT_A_MEMBER: 'Not a member of this chat',
    MESSAGE_NOT_SENT: 'Message could not be sent'
  }

};