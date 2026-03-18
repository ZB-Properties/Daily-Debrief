import React from 'react';
import { 
  FiPhone, 
  FiVideo, 
  FiX,
  FiCalendar,
  FiClock,
  FiUser
} from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';

const CallDetailsModal = ({ call, onClose, onCallAgain, currentUserId }) => {
  if (!call) return null;

  const isOutgoing = call.caller?._id === currentUserId;
  const otherUser = isOutgoing ? call.receiver : call.caller;
  const isMissed = call.status === 'missed' || call.missed;
  const isVideo = call.type === 'video';

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'No duration';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const formatDateTime = (date) => {
    return format(new Date(date), 'MMMM d, yyyy h:mm a');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-600 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call Details</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <Avatar
            src={otherUser?.profileImage || otherUser?.avatar}
            name={otherUser?.name}
            size="xl"
          />
          <h4 className="font-semibold text-gray-900 dark:text-white mt-3">
            {otherUser?.name}
          </h4>
          <p className="text-sm text-gray-500">
            {isOutgoing ? 'Outgoing' : 'Incoming'} {isVideo ? 'video' : 'audio'} call
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <span className={`text-sm font-medium ${
              isMissed
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {isMissed ? 'Missed' : 'Completed'}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Date & Time</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {formatDateTime(call.createdAt)}
            </span>
          </div>
          
          {call.duration > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatDuration(call.duration)}
              </span>
            </div>
          )}

          {call.callQuality && (
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Call Quality</span>
              <span className="text-sm text-green-600">
                {call.callQuality.audioQuality || 'Good'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => {
              onCallAgain(otherUser?._id, call.type);
              onClose();
            }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center justify-center space-x-2"
          >
            {isVideo ? (
              <FiVideo className="w-4 h-4" />
            ) : (
              <FiPhone className="w-4 h-4" />
            )}
            <span>Call Again</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;