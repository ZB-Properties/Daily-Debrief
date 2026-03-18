import React, { useEffect, useRef } from 'react';
import { FiPhone, FiVideo, FiX, FiPhoneOff } from 'react-icons/fi';
import Avatar from '../common/Avatar';

const IncomingCallModal = ({ call, onAnswer, onReject, onIgnore }) => {
  const isVideo = call?.type === 'video';
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    
    // Try to load ringtone, fallback to Web Audio API if file doesn't exist
    const playRingtone = async () => {
      try {
        // Try to load the ringtone file
        audioRef.current.src = '/sounds/ringtone.mp3';
        audioRef.current.loop = true;
        await audioRef.current.play();
      } catch (error) {
        console.log('Ringtone file not found, using Web Audio fallback');
        // Fallback to Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        
        // Store for cleanup
        audioRef.current = { context: audioContext, oscillator: oscillator };
      }
    };

    playRingtone();

    return () => {
      if (audioRef.current) {
        if (audioRef.current.pause) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } else if (audioRef.current.oscillator) {
          audioRef.current.oscillator.stop();
          audioRef.current.context.close();
        }
      }
    };
  }, []);

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up">
        {/* Caller Info */}
        <div className="p-8 text-center">
          <div className="relative inline-block">
            <Avatar
              src={call.caller?.profileImage}
              name={call.caller?.name}
              size="xl"
              className="w-24 h-24 mx-auto"
            />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
              isVideo ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {isVideo ? (
                <FiVideo className="w-4 h-4 text-white" />
              ) : (
                <FiPhone className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {call.caller?.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Incoming {isVideo ? 'video' : 'audio'} call...
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700">
          {/* Decline Button */}
          <button
            onClick={onReject}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
              <FiPhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Decline</span>
          </button>

          {/* Answer Button */}
          <button
            onClick={() => onAnswer(call.type)}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className={`w-14 h-14 rounded-full ${
              isVideo ? 'bg-blue-600' : 'bg-green-600'
            } flex items-center justify-center group-hover:opacity-90 transition-opacity animate-pulse`}>
              {isVideo ? (
                <FiVideo className="w-6 h-6 text-white" />
              ) : (
                <FiPhone className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Answer</span>
          </button>

          {/* Ignore Button */}
          <button
            onClick={onIgnore}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-gray-500 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
              <FiX className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Ignore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;