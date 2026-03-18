import React from 'react';

const Skeleton = ({ className, variant = 'rect', animation = true }) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animationClasses = animation ? 'animate-pulse' : '';
  
  const variants = {
    rect: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4'
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${animationClasses} ${className}`}
    />
  );
};

// Message Skeleton Component
export const MessageSkeleton = ({ isMe = false }) => {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isMe && (
        <Skeleton variant="circle" className="w-8 h-8 mr-2 flex-shrink-0" />
      )}
      <div className={`flex-1 max-w-[70%] ${isMe ? 'ml-auto' : ''}`}>
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-full h-16 rounded-lg" />
        <div className="flex justify-end mt-1">
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
    </div>
  );
};

// Conversation Item Skeleton
export const ConversationSkeleton = () => {
  return (
    <div className="flex items-center px-3 py-2">
      <Skeleton variant="circle" className="w-9 h-9 mr-2 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-12 h-3" />
        </div>
        <Skeleton className="w-32 h-3" />
      </div>
    </div>
  );
};

// Grid Skeleton for Contacts/Favorites
export const GridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="flex-1">
              <Skeleton className="w-32 h-4 mb-2" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;