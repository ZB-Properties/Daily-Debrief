import React, { useState } from 'react';
import { FiSmile } from 'react-icons/fi';
import ReactionPicker from './ReactionPicker';

const MessageReactions = ({ reactions = [], onReact, currentUserId, isMe }) => {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const key = reaction.emoji;
    if (!acc[key]) {
      acc[key] = {
        emoji: key,
        count: 0,
        users: []
      };
    }
    acc[key].count++;
    acc[key].users.push(reaction.user?._id || reaction.user);
    return acc;
  }, {});

  const reactionList = Object.values(groupedReactions);

  const handleReactionClick = (emoji) => {
    onReact(emoji);
    setShowPicker(false);
  };

  const hasUserReacted = (emoji) => {
    return reactions.some(r => 
      r.emoji === emoji && 
      (r.user?._id === currentUserId || r.user === currentUserId)
    );
  };

  if (reactionList.length === 0 && !showPicker) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPicker(true)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Add reaction"
        >
          <FiSmile className="w-3 h-3 text-gray-500" />
        </button>
        
        {showPicker && (
          <ReactionPicker
            onSelect={handleReactionClick}
            onClose={() => setShowPicker(false)}
            position={isMe ? 'top' : 'bottom'}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 mt-1">
      {reactionList.map(({ emoji, count, users }) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs border ${
            hasUserReacted(emoji)
              ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-gray-600 dark:text-gray-400">{count}</span>}
        </button>
      ))}
      
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Add reaction"
        >
          <FiSmile className="w-3 h-3 text-gray-500" />
        </button>
        
        {showPicker && (
          <ReactionPicker
            onSelect={handleReactionClick}
            onClose={() => setShowPicker(false)}
            position={isMe ? 'top' : 'bottom'}
          />
        )}
      </div>
    </div>
  );
};

export default MessageReactions;