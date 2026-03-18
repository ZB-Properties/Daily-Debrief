const Call = require('../models/Call');
const User = require('../models/User');

/**
 * @desc    Initiate a call
 * @route   POST /api/calls/initiate
 * @access  Private
 */
const initiateCall = async (req, res) => {
  try {
    console.log('📞 Initiate call request received');
    console.log('   User:', req.user?._id);
    console.log('   Body:', req.body);
    
    const { receiverId, type = 'audio' } = req.body;

    // Basic validation
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID is required'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }

    // Create call record
    const call = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      type,
      status: 'initiated'
    });

    await call.populate('caller', 'name profileImage');
    await call.populate('receiver', 'name profileImage');

    console.log('✅ Call created:', call._id);

    res.status(201).json({
      success: true,
      data: { call }
    });

  } catch (error) {
    console.error('❌ Error in initiateCall:', error);
    console.error('   Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call'
    });
  }
};

// Answer call
const answerCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    if (!call.receiver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to answer this call'
      });
    }

    call.status = 'in_progress';
    call.startTime = new Date();
    await call.save();

    await call.populate('caller', 'name profileImage');
    await call.populate('receiver', 'name profileImage');

    res.json({
      success: true,
      data: { call }
    });
  } catch (error) {
    console.error('Error answering call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// End call
const endCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    const isParticipant = call.caller.equals(req.user._id) || call.receiver.equals(req.user._id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    call.status = 'ended';
    call.endTime = new Date();
    if (call.startTime) {
      call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    }
    await call.save();

    res.json({
      success: true,
      data: { call }
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reject call
const rejectCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    if (!call.receiver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    call.status = 'rejected';
    call.endTime = new Date();
    await call.save();

    res.json({
      success: true,
      data: { call }
    });
  } catch (error) {
    console.error('Error rejecting call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Missed call
const missedCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    call.status = 'missed';
    call.endTime = new Date();
    await call.save();

    res.json({
      success: true,
      data: { call }
    });
  } catch (error) {
    console.error('Error marking call as missed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get call by ID
const getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('caller', 'name profileImage')
      .populate('receiver', 'name profileImage');
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      data: { call }
    });
  } catch (error) {
    console.error('Error getting call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get call history
const getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [
        { caller: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .populate('caller', 'name profileImage')
    .populate('receiver', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      data: { calls }
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add ICE candidate (minimal implementation)
const addIceCandidate = async (req, res) => {
  res.json({ success: true, message: 'ICE candidate received' });
};

// Update call quality (minimal implementation)
const updateCallQuality = async (req, res) => {
  res.json({ success: true, message: 'Quality updated' });
};

module.exports = {
  initiateCall,
  answerCall,
  endCall,
  rejectCall,
  missedCall,
  addIceCandidate,
  getCallById,
  getCallHistory,
  updateCallQuality
};