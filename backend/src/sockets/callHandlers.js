const Call = require('../models/Call');
const User = require('../models/User');
const { SOCKET_EVENTS } = require('../config/constants');
const { logger } = require('../utils/logger');


const callHandlers = (socket, io, activeUsers, userSockets) => {
  const userId = socket.userId.toString();
  
// Initiate call
socket.on(SOCKET_EVENTS.INITIATE_CALL, async (data) => {
  try {
    const { receiverId, type, sdpOffer } = data;
    
    console.log('📞 INITIATE_CALL received:', { receiverId, type, userId });
    console.log('🔍 Active users map:', activeUsers ? Array.from(activeUsers.entries()) : 'activeUsers is undefined');
    
    // Validate receiver
    if (!receiverId || receiverId === userId) {
      console.log('❌ Invalid receiver');
      return socket.emit('call-error', { message: 'Invalid receiver' });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      console.log('❌ Receiver not found');
      return socket.emit('call-error', { message: 'Receiver not found' });
    }
    
    // Create call record
    console.log('📝 Creating call record...');
    
    let sdpString = '';
    if (typeof sdpOffer === 'object' && sdpOffer !== null) {
      sdpString = sdpOffer.sdp || JSON.stringify(sdpOffer);
    } else if (typeof sdpOffer === 'string') {
      sdpString = sdpOffer;
    }
    
    const call = await Call.create({
      caller: userId,
      receiver: receiverId,
      type,
      status: 'initiated',
      sdpOffer: sdpString
    });
    
    await call.populate('caller', 'name profileImage');
    await call.populate('receiver', 'name profileImage');
    
    console.log('✅ Call created:', call._id);
    
    // Emit to receiver
    const receiverSocketId = activeUsers?.get(receiverId.toString());
    console.log('Receiver socket ID:', receiverSocketId);
    
    if (receiverSocketId) {
      console.log('📨 Emitting call-offer to receiver with socket ID:', receiverSocketId);
      
      // Get the receiver's socket to verify it exists
      const receiverSocket = userSockets?.get(receiverId.toString());
      console.log('Receiver socket exists?', !!receiverSocket);
      
      // Emit the event
      io.to(receiverSocketId).emit('call-offer', {
        call,
        offer: sdpOffer
      });
      
      console.log('✅ call-offer emitted successfully');
    } else {
      console.log('⚠️ Receiver is offline - no socket ID found');
    }
    
    logger.info(`Call initiated: ${call._id} from ${userId} to ${receiverId}`);
    
  } catch (error) {
    console.error('❌ Error initiating call:', error);
    console.error('Stack:', error.stack);
    socket.emit('call-error', { message: 'Failed to initiate call: ' + error.message });
  }
});
  

// Answer call
socket.on(SOCKET_EVENTS.CALL_ANSWER, async (data) => {
  try {
    const { callId, sdpAnswer } = data;
    
    console.log('📞 CALL_ANSWER received on server:', { callId, userId });
    console.log('📞 Answer type:', typeof sdpAnswer);
    console.log('📞 Answer keys:', Object.keys(sdpAnswer || {}));
    console.log('📞 Answer sdp present?', !!sdpAnswer?.sdp);
    
    const call = await Call.findById(callId);
    
    if (!call || call.receiver.toString() !== userId) {
      console.log('❌ Invalid call or not authorized');
      return socket.emit('call-error', { message: 'Invalid call' });
    }
    
    // Update call
    call.status = 'in_progress';
    call.sdpAnswer = sdpAnswer.sdp || JSON.stringify(sdpAnswer);
    call.startTime = new Date();
    await call.save();
    
    // Emit answer to caller
    const callerSocketId = activeUsers?.get(call.caller.toString());
    if (callerSocketId) {
      console.log('📨 Emitting call-answer to caller, caller socket:', callerSocketId);
      io.to(callerSocketId).emit('call-answer', {
        callId: call._id,
        answer: sdpAnswer
      });
    } else {
      console.log('❌ Caller not online');
    }
    
    logger.info(`Call answered: ${call._id}`);
    
  } catch (error) {
    console.error('❌ Error answering call:', error);
    socket.emit('call-error', { message: 'Failed to answer call' });
  }
});
  
 // ICE candidate exchange
socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async (data) => {
  try {
    const { callId, candidate, targetUserId } = data;
    
    console.log('❄️ ICE candidate received on server:', { callId, targetUserId });
    
    const call = await Call.findById(callId);
    
    if (!call) {
      console.log('❌ Call not found for ICE candidate');
      return;
    }
    
    // Check if user is participant in the call
    const isParticipant = call.caller.toString() === userId || 
                         call.receiver.toString() === userId;
    
    if (!isParticipant) {
      console.log('❌ User not participant in call');
      return;
    }
    
    // Send ICE candidate to the other participant
    const targetSocketId = activeUsers?.get(targetUserId);
    if (targetSocketId) {
      console.log('📨 Forwarding ICE candidate to target');
      io.to(targetSocketId).emit('ice-candidate', {
        callId,
        candidate
      });
    }
    
    // Store ICE candidate in database - FIXED: Store the whole candidate object
    if (call.addIceCandidate) {
      await call.addIceCandidate(candidate);
      console.log('✅ ICE candidate stored in database');
    }
    
  } catch (error) {
    console.error('❌ Error handling ICE candidate:', error);
  }
});
  
  // End call
  socket.on(SOCKET_EVENTS.END_CALL, async (data) => {
    try {
      const { callId } = data;
      
      const call = await Call.findById(callId);
      
      if (!call) {
        return;
      }
      
      // Check if user is participant
      const isParticipant = call.caller.toString() === userId || 
                           call.receiver.toString() === userId;
      
      if (!isParticipant) {
        return;
      }
      
      // End the call
      if (call.endCall) {
        await call.endCall();
      } else {
        call.status = 'ended';
        call.endTime = new Date();
        if (call.startTime) {
          call.duration = Math.floor((call.endTime - call.startTime) / 1000);
        }
        await call.save();
      }
      
      // Notify other participant
      const otherUserId = call.caller.toString() === userId ? 
                         call.receiver.toString() : 
                         call.caller.toString();
      
      const otherSocketId = activeUsers?.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('end-call', {
          callId: call._id,
          duration: call.duration
        });
      }
      
      logger.info(`Call ended: ${call._id}, duration: ${call.duration} seconds`);
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  });
  
  // Reject call
  socket.on(SOCKET_EVENTS.CALL_REJECTED, async (data) => {
    try {
      const { callId } = data;
      
      const call = await Call.findById(callId);
      
      if (!call || call.receiver.toString() !== userId) {
        return;
      }
      
      // Mark as rejected
      if (call.markAsRejected) {
        await call.markAsRejected();
      } else {
        call.status = 'rejected';
        call.endTime = new Date();
        await call.save();
      }
      
      // Notify caller
      const callerSocketId = activeUsers?.get(call.caller.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected', {
          callId: call._id
        });
      }
      
      logger.info(`Call rejected: ${call._id}`);
      
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  });
  
  // Missed call
  socket.on(SOCKET_EVENTS.CALL_MISSED, async (data) => {
    try {
      const { callId } = data;
      
      const call = await Call.findById(callId);
      
      if (!call || call.receiver.toString() !== userId) {
        return;
      }
      
      // Mark as missed
      if (call.markAsMissed) {
        await call.markAsMissed();
      } else {
        call.status = 'missed';
        call.endTime = new Date();
        await call.save();
      }
      
      // Notify caller about missed call
      const callerSocketId = activeUsers?.get(call.caller.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('end-call', {
          callId: call._id,
          duration: 0
        });
      }
      
      logger.info(`Call missed: ${call._id}`);
      
    } catch (error) {
      console.error('Error marking call as missed:', error);
    }
  });
};

module.exports = callHandlers;