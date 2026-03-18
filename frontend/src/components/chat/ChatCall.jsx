import React, { useState, useEffect, useRef } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiVolume2, FiVolumeX } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const ChatCall = ({
  callType = 'audio', // 'audio' or 'video'
  user,
  onEndCall,
  isIncoming = false,
  onAccept,
  onReject
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'connecting');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);

  // Simulate call connection
  useEffect(() => {
    if (!isIncoming && callStatus === 'connecting') {
      const timer = setTimeout(() => {
        setCallStatus('connected');
        startTimer();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isIncoming, callStatus]);

  // Start call timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    setCallStatus('connected');
    startTimer();
    if (onAccept) onAccept();
  };

  const handleReject = () => {
    if (onReject) onReject();
  };

  const handleEndCall = () => {
    if (onEndCall) onEndCall(callDuration);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Toggle microphone here
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // Toggle camera here
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Toggle speaker here
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Remote video/audio view */}
      <div className="flex-1 relative">
        {callType === 'video' && !isVideoOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <Avatar
              src={user?.profileImage}
              name={user?.name}
              size="2xl"
              className="mb-6"
            />
            <h2 className="text-2xl font-semibold text-white mb-2">
              {user?.name}
            </h2>
            <p className="text-gray-300">
              {callStatus === 'ringing' ? 'Ringing...' : 
               callStatus === 'connecting' ? 'Connecting...' : 
               formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Local video preview */}
        {callType === 'video' && callStatus === 'connected' && (
          <div className="absolute bottom-24 right-6 w-40 h-28 rounded-lg overflow-hidden shadow-xl border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="bg-gradient-to-t from-gray-900 to-transparent py-8">
        <div className="container mx-auto px-4">
          {/* Incoming call UI */}
          {isIncoming && callStatus === 'ringing' ? (
            <div className="flex flex-col items-center space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Incoming {callType === 'audio' ? 'Voice' : 'Video'} Call
                </h3>
                <p className="text-gray-300">{user?.name}</p>
              </div>
              
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleReject}
                  className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  aria-label="Reject call"
                >
                  <FiPhone className="w-7 h-7 text-white transform rotate-135" />
                </button>
                
                <button
                  onClick={handleAccept}
                  className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                  aria-label="Accept call"
                >
                  <FiPhone className="w-9 h-9 text-white" />
                </button>
              </div>
            </div>
          ) : (
            /* Active call controls */
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">
                  {user?.name}
                </h3>
                <p className="text-gray-300">
                  {callStatus === 'connecting' ? 'Connecting...' : 
                   callType === 'audio' ? 'Voice call' : 'Video call'}
                  {callStatus === 'connected' && ` • ${formatDuration(callDuration)}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Mute toggle */}
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } transition-colors`}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <FiMicOff className="w-6 h-6 text-white" />
                  ) : (
                    <FiMic className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Video toggle (only for video calls) */}
                {callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full ${
                      isVideoOff
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-800 hover:bg-gray-700'
                    } transition-colors`}
                    aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
                  >
                    {isVideoOff ? (
                      <FiVideoOff className="w-6 h-6 text-white" />
                    ) : (
                      <FiVideo className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}

                {/* Speaker toggle */}
                <button
                  onClick={toggleSpeaker}
                  className={`p-4 rounded-full ${
                    !isSpeakerOn
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } transition-colors`}
                  aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
                >
                  {isSpeakerOn ? (
                    <FiVolume2 className="w-6 h-6 text-white" />
                  ) : (
                    <FiVolumeX className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* End call */}
                <button
                  onClick={handleEndCall}
                  className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                  aria-label="End call"
                >
                  <FiPhone className="w-6 h-6 text-white transform rotate-135" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatCall;