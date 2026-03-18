import React from 'react';
import { FiX } from 'react-icons/fi';

const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '💯', '✅'];

const ReactionPicker = ({ onSelect, onClose, position = 'bottom' }) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reactions</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <FiX className="w-3 h-3 text-gray-500" />
        </button>
      </div>
      <div className="flex space-x-1">
        {commonReactions.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-lg flex items-center justify-center transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionPicker;