import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FiPhone, 
  FiVideo, 
  FiMic, 
  FiMicOff, 
  FiVideoOff,
  FiPhoneOff,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';


const Call = () => {
  const [searchParams] = useSearchParams();
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [callType, setCallType] = useState(searchParams.get('type') || 'audio');
  const [callStatus, setCallStatus] = useState('initiating');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUser, setRemoteUser] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationInterval = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // For demo purposes - mock remote user
  useEffect(() => {
    setRemoteUser({
      id: userId,
      name: userId === '101' ? 'Alison Powell' : 
            userId === '102' ? 'John Smith' : 
            userId === '103' ? 'Sarah Johnson' : 'User',
      avatar: ''
    });
  }, [userId]);

  // Simulate call connection for demo
  useEffect(() => {
    if (!userId) return;

    // Simulate call connection after 2 seconds
    const timer = setTimeout(() => {
      setCallStatus('connected');
      startCallTimer();
      toast.success('Call connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, [userId]);

  // Get local media
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media:', error);
        toast.error('Could not access camera/microphone');
      }
    };

    getMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [callType]);

  const startCallTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEndCall = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    navigate(-1);
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (for video calls) */}
        {callType === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : callType === 'video' ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Avatar
                src={remoteUser?.avatar}
                name={remoteUser?.name}
                size="xl"
                className="mx-auto mb-4 w-32 h-32"
              />
              <h2 className="text-2xl font-bold text-white mb-2">{remoteUser?.name}</h2>
              <p className="text-gray-400">
                {callStatus === 'connected' ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
        ) : (
          /* Audio Call UI */
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Avatar
                src={remoteUser?.avatar}
                name={remoteUser?.name}
                size="xl"
                className="mx-auto mb-4 w-32 h-32"
              />
              <h2 className="text-3xl font-bold text-white mb-2">{remoteUser?.name}</h2>
              <p className="text-xl text-gray-400 mb-4">
                {callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        {callType === 'video' && localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-48 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call Status */}
        <div className="absolute top-4 left-4">
          <div className="bg-black bg-opacity-50 rounded-lg px-3 py-1 text-white text-sm">
            {callStatus === 'connected' ? (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                {callType === 'audio' ? formatDuration(callDuration) : 'Connected'}
              </span>
            ) : (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></span>
                Connecting...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="bg-gray-900 py-6 px-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? (
              <FiMicOff className="w-6 h-6 text-white" />
            ) : (
              <FiMic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video Toggle (for video calls) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                !isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoEnabled ? (
                <FiVideo className="w-6 h-6 text-white" />
              ) : (
                <FiVideoOff className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            <FiPhoneOff className="w-6 h-6 text-white" />
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={toggleSpeaker}
            className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          >
            {isSpeakerOn ? (
              <FiVolume2 className="w-6 h-6 text-white" />
            ) : (
              <FiVolumeX className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-6 h-6 text-white" />
            ) : (
              <FiMaximize2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Call;