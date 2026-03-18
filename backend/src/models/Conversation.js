const mongoose = require('mongoose');


const conversationSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  isGroup: { 
    type: Boolean, 
    default: false 
  },
  groupName: { 
    type: String, 
    default: '' 
  },
  groupAvatar: { 
    type: String, 
    default: '' 
  },
  groupAdmin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  // Initialize these as empty arrays/maps by default
  unreadCount: { 
    type: Map, 
    of: Number, 
    default: {} 
  },
  mutedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: [] 
  }],
  pinnedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: [] 
  }],
  archivedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: [] 
  }],
  deletedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: [] 
  }],
  customName: { 
    type: Map, 
    of: String, 
    default: {} 
  },
  customImage: { 
    type: Map, 
    of: String, 
    default: {} 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

// Replace your existing background field with this:
background: {
  bgType: {
    type: String,
    enum: ['color', 'gradient', 'image'],
    default: 'color'
  },
  bgValue: {
    type: mongoose.Schema.Types.Mixed,
    default: '#f3f4f6'
  },
  customBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}

}, { 
  timestamps: true 
});

// Add these fields to your existing conversationSchema (around line where you have the background field)
conversationSchema.add({
  groupDescription: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },
  
  // For multiple admins (optional - keeps backward compatibility)
  coAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Group settings
  settings: {
    type: {
      joinRequests: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
      }],
      inviteLinks: [{
        code: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        uses: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
      }],
      announcements: [{
        message: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
      }]
    },
    default: () => ({})
  }
});

// Ensure unique private conversations between two users
// conversationSchema.index({ participants: 1 }, { 
 // unique: true, 
//  partialFilterExpression: { isGroup: false },
// name: "unique_private_conversation_filtered"  
// });

// Methods with safe defaults
conversationSchema.methods.isMutedForUser = function(userId) {
  const userIdStr = userId.toString();
  // Safely check if mutedBy exists and is an array
  if (!this.mutedBy || !Array.isArray(this.mutedBy)) {
    return false;
  }
  return this.mutedBy.some(id => id && id.toString() === userIdStr);
};

conversationSchema.methods.isPinnedForUser = function(userId) {
  const userIdStr = userId.toString();
  if (!this.pinnedBy || !Array.isArray(this.pinnedBy)) {
    return false;
  }
  return this.pinnedBy.some(id => id && id.toString() === userIdStr);
};

conversationSchema.methods.isArchivedForUser = function(userId) {
  const userIdStr = userId.toString();
  if (!this.archivedBy || !Array.isArray(this.archivedBy)) {
    return false;
  }
  return this.archivedBy.some(id => id && id.toString() === userIdStr);
};

conversationSchema.methods.getUnreadCountForUser = function(userId) {
  const userIdStr = userId.toString();
  if (!this.unreadCount || !(this.unreadCount instanceof Map)) {
    return 0;
  }
  return this.unreadCount.get(userIdStr) || 0;
};

conversationSchema.methods.resetUnreadCount = async function(userId) {
  const userIdStr = userId.toString();
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }
  this.unreadCount.set(userIdStr, 0);
  await this.save();
};

conversationSchema.methods.getOtherParticipant = function(userId) {
  const userIdStr = userId.toString();
  return this.participants.find(
    p => p && p._id && p._id.toString() !== userIdStr
  );
};

conversationSchema.methods.getCustomNameForUser = function(userId) {
  const userIdStr = userId.toString();
  if (!this.customName || !(this.customName instanceof Map)) {
    return '';
  }
  return this.customName.get(userIdStr) || '';
};

conversationSchema.methods.getCustomImageForUser = function(userId) {
  const userIdStr = userId.toString();
  if (!this.customImage || !(this.customImage instanceof Map)) {
    return '';
  }
  return this.customImage.get(userIdStr) || '';
};

module.exports = mongoose.model('Conversation', conversationSchema);