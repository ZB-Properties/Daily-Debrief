import { useMemo } from 'react';
import { getUserColor, getAvatarGradient } from '../utils/colorGenerator';

// Custom hook to get consistent colors for users
export const useUserColor = (userId) => {
  const userColor = useMemo(() => {
    if (!userId) return { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-700', darkText: 'dark:text-gray-300' };
    return getUserColor(userId);
  }, [userId]);

  const avatarGradient = useMemo(() => {
    if (!userId) return 'from-gray-500 to-gray-600';
    return getAvatarGradient(userId);
  }, [userId]);

  const getMessageBubbleColor = (isOwn, isGroup) => {
    if (isOwn) {
      return 'bg-red-400 text-black rounded-br-none';
    }
    
    if (isGroup) {
      // For group messages, use the user's color
      return `${userColor.bg} ${userColor.text} ${userColor.darkBg} ${userColor.darkText} rounded-bl-none`;
    }
    
    // For non-group messages from others
    return 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-bl-none';
  };

  return {
    userColor,
    avatarGradient,
    getMessageBubbleColor
  };
};

export default useUserColor;