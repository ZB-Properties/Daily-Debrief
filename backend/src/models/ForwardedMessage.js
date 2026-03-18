const mongoose = require('mongoose');

const forwardedMessageSchema = new mongoose.Schema({
  originalMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  forwardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forwardedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  caption: String,
  forwardedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ForwardedMessage', forwardedMessageSchema);