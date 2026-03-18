import React from 'react';
import { FiX, FiBookmark, FiChevronRight } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';

const PinnedMessage = ({ message, onClose, onJumpToMessage }) => {
  if (!message) return null;

  return (
    <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <FiBookmark className="w-4 h-4 text-red-600 rotate-45" />
        <Avatar
          src={message.sender?.profileImage}
          name={message.sender?.name}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {message.sender?.name}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.createdAt), 'hh:mm a')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {message.content || '📎 Media message'}
          </p>
        </div>
        <button
          onClick={onJumpToMessage}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          title="Jump to message"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
        title="Unpin message"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PinnedMessage;