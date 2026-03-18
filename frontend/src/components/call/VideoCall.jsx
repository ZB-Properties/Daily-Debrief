import React, { useRef, useEffect } from 'react';

const VideoCall = ({ 
  localStream, 
  remoteStream, 
  isLocalVideoMuted = false,
  isRemoteVideoMuted = false,
  className = ''
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Remote Video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Local Video (picture-in-picture) */}
      {localStream && (
        <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Muted indicator */}
          {isLocalVideoMuted && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xs">Video Off</span>
            </div>
          )}
        </div>
      )}

      {/* Remote video muted indicator */}
      {isRemoteVideoMuted && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <p className="text-white">Remote video is off</p>
        </div>
      )}
    </div>
  );
};

export default VideoCall;