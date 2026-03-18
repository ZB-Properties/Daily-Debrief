import React from 'react';
import { FiX } from 'react-icons/fi';
import Avatar from '../common/Avatar';

const ReplyPreview = ({ replyingTo, onCancel }) => {
  if (!replyingTo) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-1 h-8 bg-red-500 rounded-full"></div>
        <Avatar
          src={replyingTo.sender?.profileImage}
          name={replyingTo.sender?.name}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Replying to {replyingTo.sender?.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {replyingTo.content || 'Media message'}
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
      >
        <FiX className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

export default ReplyPreview;