import React, { useState, useEffect } from 'react';
import { FiPhone, FiVideo, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';


// Sound for incoming call
const ringtone = new Audio('/sounds/ringtone.mp3');
ringtone.loop = true;

const IncomingCallNotification = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleCallOffer = ({ call, offer }) => {
      setIncomingCall(call);
      
      // Play ringtone
      ringtone.play().catch(e => console.log('Audio play failed:', e));
      
      // Show toast notification
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Avatar
                  src={call.caller?.avatar}
                  name={call.caller?.name}
                  size="md"
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Incoming {call.type} call
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {call.caller?.name} is calling...
                </p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleAcceptCall(call)}
                    className={`px-4 py-2 ${
                      call.type === 'video' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg transition-colors flex items-center space-x-2`}
                  >
                    {call.type === 'video' ? (
                      <FiVideo className="w-4 h-4" />
                    ) : (
                      <FiPhone className="w-4 h-4" />
                    )}
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleRejectCall(call)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                stopRingtone();
                setIncomingCall(null);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 30000, // 30 seconds
        position: 'top-right',
      });
    };

    const handleCallEnded = ({ callId }) => {
      if (incomingCall?.id === callId) {
        stopRingtone();
        setIncomingCall(null);
        toast.dismiss();
        toast.error('Call ended');
      }
    };

    socket.on('call-offer', handleCallOffer);
    socket.on('end-call', handleCallEnded);

    return () => {
      socket.off('call-offer', handleCallOffer);
      socket.off('end-call', handleCallEnded);
      stopRingtone();
    };
  }, [socket, isConnected]);

  const stopRingtone = () => {
    ringtone.pause();
    ringtone.currentTime = 0;
  };

  const handleAcceptCall = (call) => {
    stopRingtone();
    setIncomingCall(null);
    toast.dismiss();
    
    // Navigate to call page
    navigate(`/call/${call.caller.id}?type=${call.type}`);
  };

  const handleRejectCall = (call) => {
    stopRingtone();
    setIncomingCall(null);
    toast.dismiss();
    
    // Emit reject event
    if (socket && isConnected) {
      socket.emit('call-rejected', { callId: call.id });
    }
  };

  return null; // This component doesn't render anything, it just handles notifications
};

export default IncomingCallNotification;