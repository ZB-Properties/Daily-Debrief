export const APP_NAME = 'Chatapp';
export const APP_VERSION = '1.0.0';

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system'
};

// User status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
};

// Call types
export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
};

// Call status
export const CALL_STATUS = {
  INITIATED: 'initiated',
  RINGING: 'ringing',
  IN_PROGRESS: 'in_progress',
  ENDED: 'ended',
  MISSED: 'missed',
  REJECTED: 'rejected'
};

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  
  // Messaging
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  MESSAGE_SENT: 'message-sent',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  
  // Typing
  TYPING: 'typing',
  USER_TYPING: 'user-typing',
  
  // Reactions
  MESSAGE_REACTION: 'message-reaction',
  MESSAGE_REACTION_UPDATED: 'message-reaction-updated',
  
  // Deletion
  DELETE_MESSAGE: 'delete-message',
  MESSAGE_DELETED: 'message-deleted',
  
  // Calls
  INITIATE_CALL: 'initiate-call',
  CALL_OFFER: 'call-offer',
  CALL_ANSWER: 'call-answer',
  CALL_ICE_CANDIDATE: 'ice-candidate',
  END_CALL: 'end-call',
  CALL_REJECTED: 'call-rejected',
  CALL_MISSED: 'call-missed',
  
  // Status
  USER_STATUS_CHANGED: 'user-status-changed',
  ONLINE_USERS: 'online-users',
  
  // Notifications
  NOTIFICATION: 'notification',
  
  // Errors
  ERROR: 'error'
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ME: '/api/auth/me',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  USER_PROFILE_IMAGE: '/api/users/profile/image',
  SEARCH_USERS: '/api/users/search',
  ONLINE_USERS: '/api/users/online',
  
  // Chats
  CONVERSATIONS: '/api/chats/conversations',
  CONVERSATION: '/api/chats/conversation',
  CONVERSATION_MESSAGES: '/api/chats/conversation/:id/messages',
  MARK_AS_READ: '/api/chats/conversation/:id/read',
  
  // Messages
  MESSAGES: '/api/messages',
  MESSAGE_REACTION: '/api/messages/:id/react',
  MESSAGE_FORWARD: '/api/messages/:id/forward',
  
  // Upload
  UPLOAD: '/api/upload',
  UPLOAD_MULTIPLE: '/api/upload/multiple',
  UPLOAD_LIMITS: '/api/upload/limits',
  
  // Calls
  CALLS: '/api/calls',
  CALL_HISTORY: '/api/calls/history'
};

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Notification types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  CALL: 'call',
  SYSTEM: 'system'
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  SERVER: 'Server error. Please try again later.',
  AUTH: 'Authentication failed. Please login again.',
  VALIDATION: 'Please check your input.',
  FILE_TOO_LARGE: 'File size exceeds limit.',
  FILE_TYPE: 'File type not supported.',
  NOT_FOUND: 'Resource not found.',
  FORBIDDEN: 'Access forbidden.',
  UNKNOWN: 'An unknown error occurred.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful!',
  LOGOUT: 'Logout successful!',
  PROFILE_UPDATE: 'Profile updated successfully!',
  MESSAGE_SENT: 'Message sent!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings'
};

// Pagination defaults
export const PAGINATION = {
  PAGE: 1,
  LIMIT: 50,
  LIMIT_SMALL: 20,
  LIMIT_LARGE: 100
};

// Emoji categories
export const EMOJI_CATEGORIES = [
  'frequent',
  'people',
  'nature',
  'foods',
  'activity',
  'places',
  'objects',
  'symbols',
  'flags'
];

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

// Default user settings
export const DEFAULT_SETTINGS = {
  theme: 'system',
  notifications: {
    messages: true,
    calls: true,
    sounds: true,
    preview: true
  },
  privacy: {
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    readReceipts: true
  },
  chat: {
    enterToSend: true,
    emojiStyle: 'native',
    fontSize: 'medium'
  }
};