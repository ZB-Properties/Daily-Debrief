import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import callService from '../services/calls';
import toast from 'react-hot-toast';
import Peer from 'simple-peer';

console.log('📞 CallContext module loaded');

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const pendingIceCandidates = useRef([]);
  const incomingCallRef = useRef(null);
  const connectionCheckInterval = useRef(null);
  const pendingOfferRef = useRef(null);

  console.log('📞 CallProvider rendering, socket exists:', !!socket, 'isConnected:', isConnected);

// Debug effect to monitor incomingCall changes
useEffect(() => {
  console.log('🔍 incomingCall CHANGED:', incomingCall);
}, [incomingCall]);

useEffect(() => {
  console.log('🔍 callStatus CHANGED:', callStatus);
}, [callStatus]);

  // Duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Monitor connection status
  useEffect(() => {
    if (callStatus === 'connecting' || callStatus === 'ringing') {
      connectionCheckInterval.current = setInterval(() => {
        checkConnectionStatus();
      }, 1000);
    } else {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
        connectionCheckInterval.current = null;
      }
    }

    
    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
        connectionCheckInterval.current = null;
      }
    };
  }, [callStatus]);

  const checkConnectionStatus = useCallback(() => {
    if (!peerRef.current) return;
    
    const iceState = peerRef.current.iceConnectionState;
    const connectionState = peerRef.current._pc?.connectionState;
    
    if ((iceState === 'connected' || iceState === 'completed' || connectionState === 'connected') 
        && callStatus !== 'connected') {
      console.log('✅ Connection detected via ICE state! Forcing connected status');
      setCallStatus('connected');
      toast.dismiss('calling');
      toast.success('Call connected');
    }
  }, [callStatus]);

  // Get user media
  const getUserMedia = useCallback(async (constraints = { audio: true, video: false }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
      return null;
    }
  }, []);

  const createPeer = useCallback((initiator, stream, callerId, receiverId, callId) => {
    console.log('📞 CREATE PEER CALLED at:', new Date().toISOString());
    console.log('   Initiator:', initiator);
    console.log('   Call ID:', callId);
    console.log('   Pending offer exists?', !!pendingOfferRef.current);
    
    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.ekiga.net' },
          { urls: 'stun:stun.ideasip.com' },
          { urls: 'stun:stun.schlund.de' },
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
        sdpSemantics: 'unified-plan'
      }
    });

    // If this is the receiver (initiator: false) and we have a stored offer, signal it
    if (!initiator && pendingOfferRef.current) {
      console.log('📞 Signaling stored offer to receiver peer');
      try {
        peer.signal(pendingOfferRef.current);
        console.log('✅ Offer signaled successfully');
        pendingOfferRef.current = null; // Clear after use
      } catch (err) {
        console.error('❌ Error signaling offer:', err);
      }
    }

    peer.on('signal', (data) => {
      console.log('📡 Peer signal type:', data.type);
      console.log('📡 Signal data:', data);
      
      if (data.type === 'offer') {
        console.log('📞 Sending offer to receiver after delay');
        setTimeout(() => {
          socket.emit('initiate-call', {
            receiverId,
            type: activeCall?.type || 'audio',
            sdpOffer: data
          });
        }, 500);
      } 
      else if (data.type === 'answer') {
        console.log('📞 Sending answer to caller IMMEDIATELY');
        console.log('📞 Answer SDP length:', data.sdp?.length);
        
        // Send answer immediately without delay
        socket.emit('call-answer', {
          callId,
          sdpAnswer: data
        });
      } 
      else if (data.type === 'candidate') {
        console.log('❄️ Sending ICE candidate to peer');
        const targetId = initiator ? receiverId : callerId;
        socket.emit('ice-candidate', {
          callId: activeCall?._id || callId,
          candidate: data,
          targetUserId: targetId
        });
      }
    });

    // Also monitor the RTCPeerConnection directly
    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        console.log('🔌 RTCPeerConnection ICE state:', peer._pc.iceConnectionState);
      };
      
      peer._pc.onsignalingstatechange = () => {
        console.log('🔌 RTCPeerConnection signaling state:', peer._pc.signalingState);
      };
    }

    peer.on('stream', (remoteStream) => {
      console.log('📹📹📹 STREAM EVENT FIRED!', {
        timestamp: new Date().toISOString(),
        streamId: remoteStream.id,
        active: remoteStream.active,
        audioTracks: remoteStream.getAudioTracks().length,
        videoTracks: remoteStream.getVideoTracks().length
      });
      
      remoteStream.getTracks().forEach((track, i) => {
        console.log(`   Track ${i}:`, {
          kind: track.kind,
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });
      
      setRemoteStream(remoteStream);
      setCallStatus('connected');
      toast.dismiss('calling');
      toast.success('Call connected');
    });

    peer.on('track', (track, stream) => {
      console.log('📹 TRACK EVENT:', {
        trackKind: track.kind,
        trackId: track.id,
        streamId: stream.id
      });
    });

    peer.on('connect', () => {
      console.log('✅ PEER CONNECT EVENT:', new Date().toISOString());
      setCallStatus('connected');
      toast.dismiss('calling');
      toast.success('Call connected');
    });

    peer.on('iceConnectionStateChange', () => {
      console.log('❄️ ICE state:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') {
        console.log('✅ ICE connected!');
        setCallStatus('connected');
        toast.dismiss('calling');
        toast.success('Call connected');
      }
    });

    peer.on('iceGatheringStateChange', () => {
      console.log('❄️ ICE gathering:', peer.iceGatheringState);
    });

    peer.on('error', (err) => {
      console.error('❌ PEER ERROR:', err);
      toast.error('Call connection error');
      endCall();
    });

    peer.on('close', () => {
      console.log('📞 PEER CLOSED');
      endCall();
    });

    if (peer._pc) {
      peer._pc.ontrack = (event) => {
        console.log('📹 NATIVE TRACK EVENT:', {
          track: event.track.kind,
          streams: event.streams.length
        });
      };
    }
    
    peerRef.current = peer;
    window.__peer = peer;
    
    // Process queued ICE candidates (these are candidates, not the offer)
    if (pendingIceCandidates.current.length > 0) {
      console.log(`📦 Processing ${pendingIceCandidates.current.length} queued ICE candidates`);
      pendingIceCandidates.current.forEach((candidate, index) => {
        console.log(`   Processing candidate ${index + 1}:`, candidate.type);
        try {
          peer.signal(candidate);
        } catch (err) {
          console.error('❌ Error signaling queued candidate:', err);
        }
      });
      pendingIceCandidates.current = [];
    }

    return peer;
  }, [socket, activeCall]);

  // Initiate call
  const initiateCall = useCallback(async (receiverId, type = 'audio') => {
    console.log('📞 Initiating call:', { receiverId, type });
    
    try {
      if (!receiverId) {
        toast.error('No receiver selected');
        return;
      }

      setCallStatus('ringing');
      
      const stream = await getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      
      if (!stream) {
        setCallStatus('idle');
        return;
      }

      const response = await callService.initiateCall(receiverId, type);
      console.log('📥 Call service response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate call');
      }
      
      const call = response.data.call;
      console.log('✅ Call created:', call._id);
      
      setActiveCall(call);
      
      console.log('📞 Creating peer connection for initiate...');
      createPeer(true, stream, user._id, receiverId, call._id);

      toast.loading(`Calling...`, { id: 'calling' });

      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'ringing') {
          toast.error('No answer');
          endCall();
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error initiating call:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate call');
      setCallStatus('idle');
    }
  }, [getUserMedia, createPeer, user, callStatus]);

  const answerCall = useCallback(async (type = 'audio') => {
    console.log('📞 ANSWER CALL CALLED at:', new Date().toISOString());
    
    const callToAnswer = incomingCall || incomingCallRef.current;
    console.log('📞 Call to answer:', callToAnswer?._id);
    
    if (!callToAnswer) {
      console.error('❌ No incoming call to answer!');
      return;
    }

    try {
      setCallStatus('connecting');
      
      const stream = await getUserMedia({ audio: true, video: type === 'video' });
      if (!stream) return;
      
      await callService.answerCall(callToAnswer._id, null);
      setActiveCall(callToAnswer);
      
      console.log('📞 Creating peer for answer with callId:', callToAnswer._id);
      console.log('📞 Caller ID:', callToAnswer.caller._id);
      
      createPeer(false, stream, callToAnswer.caller._id, user._id, callToAnswer._id);
      
      // After creating peer, check if we have a stored offer to signal
      setTimeout(() => {
        console.log('⏰ Checking peer after creation:', {
          exists: !!peerRef.current,
          signalingState: peerRef.current?.signalingState,
          remoteDescription: peerRef.current?._pc?.remoteDescription?.type
        });
        
        // If peer has no remote description, the offer wasn't set
        if (peerRef.current && !peerRef.current._pc?.remoteDescription) {
          console.log('⚠️ Peer has no remote description - offer missing!');
          // The offer should have been set automatically by simple-peer
          // If not, we need to check if the offer was passed correctly
        }
      }, 1000);
      
      setIncomingCall(null);
      incomingCallRef.current = null;
      toast.dismiss('incoming-call');
      toast.loading('Connecting...', { id: 'calling' });

    } catch (error) {
      console.error('❌ Error answering call:', error);
      setCallStatus('idle');
    }
  }, [incomingCall, getUserMedia, createPeer, user]);

  const rejectCall = useCallback(async () => {
    const callToReject = incomingCall || incomingCallRef.current;
    if (!callToReject) return;

    try {
      await callService.rejectCall(callToReject._id);
      socket.emit('call-rejected', { callId: callToReject._id });
      setIncomingCall(null);
      incomingCallRef.current = null;
      toast.dismiss('incoming-call');
      toast.success('Call rejected');

    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [incomingCall, socket]);

  const endCall = useCallback(async () => {
    try {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
        connectionCheckInterval.current = null;
      }

      if (activeCall) {
        await callService.endCall(activeCall._id);
        socket.emit('end-call', { callId: activeCall._id });
      }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      pendingIceCandidates.current = [];

      setActiveCall(null);
      setIncomingCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setCallStatus('ended');
      setCallDuration(0);
      
      toast.dismiss('calling');
      toast.dismiss('incoming-call');
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [activeCall, socket]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    if (!activeCall || activeCall.type !== 'video') return;
    setIsVideoOff(!isVideoOff);
  }, [activeCall, isVideoOff]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(!isSpeakerOn);
  }, [isSpeakerOn]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('📞 Setting up call socket listeners');

    // Handle incoming call offer - NO TOAST HERE, just set state
    socket.on('call-offer', ({ call, offer }) => {
      console.log('🔥🔥🔥 CALL OFFER RECEIVED!', { call, offer });
      console.log('📞 Offer type:', offer?.type);
      console.log('📞 Offer has sdp?', !!offer?.sdp);
      
      // Store the offer
      pendingOfferRef.current = offer;
      console.log('📦 Offer stored for later use');
      
      // Set the incoming call state - this will trigger the modal in ChatArea
      setIncomingCall(call);
      console.log('✅ setIncomingCall executed');

      incomingCallRef.current = call;
      setCallStatus('ringing');
      console.log('✅ setCallStatus(ringing) executed');

      // Auto-reject after 30 seconds if not answered
      callTimeoutRef.current = setTimeout(() => {
        if (incomingCall) {
          callService.missedCall(call._id).catch(console.error);
          setIncomingCall(null);
          incomingCallRef.current = null;
          toast.error('Missed call from ' + call.caller?.name);
        }
      }, 30000);
    });

    socket.on('call-answer', ({ callId, answer }) => {
      console.log('📞 Call answer received in frontend:', { callId });
      console.log('📞 Answer type:', answer?.type);
      console.log('📞 Answer has sdp?', !!answer?.sdp);
      console.log('📞 Peer exists?', !!peerRef.current);
      
      if (peerRef.current) {
        console.log('✅ Signaling answer to peer');
        try {
          peerRef.current.signal(answer);
          console.log('✅ Answer signaled successfully');
          
          // Check peer state after signaling
          setTimeout(() => {
            console.log('Peer after answer:', {
              signalingState: peerRef.current?.signalingState,
              iceState: peerRef.current?.iceConnectionState,
              remoteDescription: peerRef.current?._pc?.remoteDescription?.type
            });
          }, 1000);
        } catch (err) {
          console.error('❌ Error signaling answer:', err);
        }
      } else {
        console.log('❌ No peer connection to signal answer - QUEUING');
        pendingIceCandidates.current.push(answer);
      }
    });

    socket.on('ice-candidate', ({ callId, candidate }) => {
      console.log('❄️ ICE candidate received from peer at:', new Date().toISOString());
      console.log('   Candidate type:', candidate?.type);
      
      // Only queue if it's actually a candidate
      if (candidate?.type === 'candidate') {
        if (peerRef.current) {
          console.log('✅ Adding ICE candidate to peer connection');
          try {
            peerRef.current.signal(candidate);
          } catch (err) {
            console.error('❌ Error signaling ICE candidate:', err);
          }
        } else {
          console.log('📦 Queueing ICE candidate - peer not ready yet');
          pendingIceCandidates.current.push(candidate);
        }
      } else {
        console.log('⚠️ Received non-candidate in ice-candidate handler:', candidate?.type);
      }
    });

    socket.on('call-rejected', ({ callId }) => {
      console.log('📞 Call rejected:', callId);
      toast.dismiss('calling');
      toast.error('Call rejected');
      endCall();
    });

    socket.on('end-call', ({ callId, duration }) => {
      console.log('📞 Call ended:', callId);
      toast.success(`Call ended`);
      endCall();
    });

    return () => {
      socket.off('call-offer');
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('end-call');
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [socket, isConnected, answerCall, rejectCall, endCall, incomingCall]);

  const value = {
    activeCall,
    incomingCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    callDuration,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker
  };

  window.__CALL_CONTEXT = value;

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};