import React, { useState, useEffect } from 'react';
import { 
  FiPhone, FiVideo, FiMic, FiMicOff, FiVideoOff, 
  FiVolume2, FiVolumeX, FiX, FiMaximize2, FiMinimize2 
} from 'react-icons/fi';

const ActiveCallModal = ({ 
  call, 
  localStream, 
  remoteStream, 
  onEndCall, 
  onToggleMute, 
  onToggleVideo,
  onToggleSpeaker,
  isMuted,
  isVideoOff,
  isSpeakerOn,
  duration
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const isVideo = call?.type === 'video';

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Remote Video (main) */}
      {isVideo && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-400 to-blue-800 flex items-center justify-center mx-auto mb-4">
              <FiPhone className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {call?.receiver?.name || 'Call in progress'}
            </h2>
            <p className="text-gray-400">{formatDuration(duration)}</p>
          </div>
        </div>
      )}

      {/* Local Video (picture-in-picture) */}
      {isVideo && localStream && (
        <div className="absolute bottom-24 right-4 w-48 h-64 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center justify-center space-x-6">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? (
              <FiMicOff className="w-6 h-6 text-white" />
            ) : (
              <FiMic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video On/Off (only for video calls) */}
          {isVideo && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? (
                <FiVideoOff className="w-6 h-6 text-white" />
              ) : (
                <FiVideo className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* Speaker On/Off */}
          <button
            onClick={onToggleSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeakerOn 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isSpeakerOn ? (
              <FiVolume2 className="w-6 h-6 text-white" />
            ) : (
              <FiVolumeX className="w-6 h-6 text-white" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all"
          >
            <FiPhone className="w-6 h-6 text-white transform rotate-135" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-6 h-6 text-white" />
            ) : (
              <FiMaximize2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Call Duration */}
        <p className="text-center text-white mt-4 text-sm">
          {formatDuration(duration)}
        </p>
      </div>
    </div>
  );
};

export default ActiveCallModal;