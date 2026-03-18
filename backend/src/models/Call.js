const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in_progress', 'ended', 'missed', 'rejected'],
    default: 'initiated'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  sdpOffer: {
    type: String
  },
  sdpAnswer: {
    type: String
  },
  iceCandidates: [{
    candidate: {
      type: mongoose.Schema.Types.Mixed  // ← Changed from String to Mixed
    },
    sdpMLineIndex: Number,
    sdpMid: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  callQuality: {
    audioQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    videoQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    packetLoss: Number,
    jitter: Number,
    latency: Number
  },
  recordingUrl: {
    type: String
  },
  recordingPublicId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
callSchema.index({ caller: 1, receiver: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ createdAt: -1 });

// Calculate duration before save
callSchema.pre('save', function() {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
});

// Virtual for call status
callSchema.virtual('isActive').get(function() {
  return this.status === 'in_progress' || this.status === 'ringing';
});

// Start call
callSchema.methods.startCall = async function() {
  this.status = 'in_progress';
  this.startTime = new Date();
  await this.save();
};

// End call
callSchema.methods.endCall = async function() {
  this.status = 'ended';
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  await this.save();
};

// Mark as missed
callSchema.methods.markAsMissed = async function() {
  this.status = 'missed';
  this.endTime = new Date();
  await this.save();
};

// Mark as rejected
callSchema.methods.markAsRejected = async function() {
  this.status = 'rejected';
  this.endTime = new Date();
  await this.save();
};

// Add ICE candidate - FIXED to handle objects
callSchema.methods.addIceCandidate = async function(candidate) {
  this.iceCandidates.push(candidate);
  await this.save();
};

module.exports = mongoose.model('Call', callSchema);