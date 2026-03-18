const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline' 
  },
  bio: { type: String, default: "Hey there! I'm using Daily-Debrief" },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    notifications: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  refreshToken: { type: String, select: false },

  // Add these fields inside the userSchema
isEmailVerified: {
  type: Boolean,
  default: false
},
emailVerificationToken: String,
emailVerificationExpire: Date,
twoFactorEnabled: {
  type: Boolean,
  default: false
},
twoFactorSecret: String,
twoFactorBackupCodes: [{
  code: String,
  used: {
    type: Boolean,
    default: false
  }
}]

}, { timestamps: true });

// NO PRE-SAVE HOOK - We'll hash passwords manually in the controller

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('❌ Error comparing password:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);