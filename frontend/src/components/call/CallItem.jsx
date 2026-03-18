import React, { useState } from 'react';
import { 
  FiPhone, 
  FiVideo, 
  FiPhoneMissed, 
  FiPhoneIncoming, 
  FiPhoneOutgoing, 
  FiClock,
  FiMoreVertical,
  FiInfo
} from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { formatDistance } from 'date-fns';

const CallItem = ({ call, onCallAgain, onViewDetails, currentUserId }) => {
  const [showOptions, setShowOptions] = useState(false);

  // Determine the other participant
  const isOutgoing = call.caller?._id === currentUserId;
  const otherUser = isOutgoing ? call.receiver : call.caller;
  
  const isMissed = call.status === 'missed' || call.missed;
  const isVideo = call.type === 'video';

  const getCallIcon = () => {
    if (isMissed) {
      return <FiPhoneMissed className="w-4 h-4 text-red-500" />;
    }
    if (isOutgoing) {
      return <FiPhoneOutgoing className="w-4 h-4 text-blue-500" />;
    }
    return <FiPhoneIncoming className="w-4 h-4 text-green-500" />;
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group relative">
      <Avatar
        src={otherUser?.profileImage || otherUser?.avatar}
        name={otherUser?.name || 'Unknown'}
        size="md"
      />
      
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {otherUser?.name || 'Unknown'}
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 flex items-center">
              <FiClock className="w-3 h-3 mr-1" />
              {formatDistance(new Date(call.createdAt), new Date(), { addSuffix: true })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiMoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center">
            {getCallIcon()}
            <span className={`text-sm ml-2 ${
              isMissed ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isOutgoing ? 'Outgoing' : 'Incoming'} {isVideo ? 'video' : 'audio'} call
            </span>
            {call.duration > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                • {formatDuration(call.duration)}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCallAgain(otherUser?._id, call.type);
              }}
              className="p-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
              title={`Call ${otherUser?.name} again`}
            >
              {isVideo ? (
                <FiVideo className="w-4 h-4" />
              ) : (
                <FiPhone className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(call);
              }}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="View details"
            >
              <FiInfo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Options dropdown */}
      {showOptions && (
        <div className="absolute right-6 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(call);
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              View details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCallAgain(otherUser?._id, call.type);
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Call again
            </button>
            {isVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCallAgain(otherUser?._id, 'audio');
                  setShowOptions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Audio call instead
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallItem;