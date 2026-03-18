import React from 'react';
import { FiLoader } from 'react-icons/fi';
import Avatar from '../common/Avatar';

const TypingIndicator = ({ user, size = 'small' }) => {
  const sizeClasses = {
    small: {
      container: 'space-x-1',
      dots: 'h-2 w-2',
      text: 'text-xs'
    },
    medium: {
      container: 'space-x-1.5',
      dots: 'h-2.5 w-2.5',
      text: 'text-sm'
    },
    large: {
      container: 'space-x-2',
      dots: 'h-3 w-3',
      text: 'text-base'
    }
  };

  const { container, dots, text } = sizeClasses[size];

  return (
    <div className="flex items-center space-x-3">
      {user && (
        <Avatar
          src={user.profileImage}
          name={user.name}
          size="xs"
          className="flex-shrink-0"
        />
      )}
      
      <div className={`flex items-center ${container}`}>
        <div className={`rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce ${dots}`} />
        <div className={`rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce ${dots}`} style={{ animationDelay: '0.2s' }} />
        <div className={`rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce ${dots}`} style={{ animationDelay: '0.4s' }} />
      </div>
      
      <div className={`text-gray-500 dark:text-gray-400 ${text} font-medium`}>
        {user ? `${user.name} is typing...` : 'Typing...'}
      </div>
    </div>
  );
};

export default TypingIndicator;