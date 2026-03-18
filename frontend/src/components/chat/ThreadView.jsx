import React, { useState, useEffect } from 'react';
import { FiX, FiArrowLeft } from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import threadService from '../../services/threads';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ThreadView = ({ messageId, onClose, currentUserId }) => {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThread();
  }, [messageId]);

  const fetchThread = async () => {
    try {
      const response = await threadService.getMessageThread(messageId);
      if (response.success) {
        setThread(response.data.thread);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load message thread');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!thread || !thread.original) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <p>Thread not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-white">Message Thread</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original message */}
        <div className="opacity-75">
          <MessageBubble
            message={thread.original}
            isMe={thread.original.sender?._id === currentUserId}
            showAvatar={true}
            showTimestamp={true}
            currentUserId={currentUserId}
          />
        </div>

        {/* Replies */}
        {thread.replies.length > 0 ? (
          <div className="space-y-4 mt-6">
            <div className="text-xs text-gray-500 text-center">Replies</div>
            {thread.replies.map(reply => (
              <MessageBubble
                key={reply._id}
                message={reply}
                isMe={reply.sender?._id === currentUserId}
                showAvatar={true}
                showTimestamp={true}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No replies yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadView;