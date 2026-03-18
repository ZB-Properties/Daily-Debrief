import React, { useState } from 'react';
import { 
  FiMessageSquare, 
  FiVideo, 
  FiPhone, 
  FiUserPlus,
  FiStar,
  FiCheck,
  FiX,
  FiUsers,
  FiBell,
  FiMoreVertical
} from 'react-icons/fi';
import { formatDistance } from 'date-fns';
import Avatar from '../common/Avatar';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClick,
  showActions = true 
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id || notification._id);
    }
    setShowOptions(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id || notification._id);
    }
    setShowOptions(false);
  };

  const getNotificationIcon = (type, className = "w-5 h-5") => {
    switch(type) {
      case 'message': 
        return <FiMessageSquare className={`${className} text-blue-500`} />;
      case 'call': 
        return <FiPhone className={`${className} text-red-500`} />;
      case 'video-call': 
        return <FiVideo className={`${className} text-purple-500`} />;
      case 'voice-note':
        return <FiPhone className={`${className} text-green-500`} />;
      case 'mention': 
        return <FiStar className={`${className} text-yellow-500`} />;
      case 'contact': 
        return <FiUserPlus className={`${className} text-green-500`} />;
      case 'group': 
        return <FiUsers className={`${className} text-indigo-500`} />;
      default: 
        return <FiBell className={`${className} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'message': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'call': return 'bg-red-100 dark:bg-red-900/20';
      case 'video-call': return 'bg-purple-100 dark:bg-purple-900/20';
      case 'voice-note': return 'bg-green-100 dark:bg-green-900/20';
      case 'mention': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'contact': return 'bg-green-100 dark:bg-green-900/20';
      case 'group': return 'bg-indigo-100 dark:bg-indigo-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group ${
        !notification.read ? 'bg-red-50/30 dark:bg-red-900/5' : ''
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Icon/Avatar */}
        <div className="flex-shrink-0">
          {notification.sender?.avatar || notification.user?.avatar ? (
            <Avatar
              src={notification.sender?.avatar || notification.user?.avatar}
              name={notification.sender?.name || notification.user?.name}
              size="md"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center`}>
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${
              !notification.read 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {notification.title}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatTime(notification.time || notification.createdAt)}
              </p>
              {showActions && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(!showOptions);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiMoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  {/* Options Dropdown */}
                  {showOptions && (
                    <div className="absolute right-0 top-6 z-10 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="py-1">
                        {!notification.read && (
                          <button
                            onClick={handleMarkAsRead}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <FiCheck className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <FiX className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p className={`text-sm mt-1 ${
            !notification.read 
              ? 'text-gray-800 dark:text-gray-200' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {notification.content}
          </p>

          {/* Show sender name for group notifications */}
          {notification.sender?.name && notification.type === 'group' && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              From: {notification.sender.name}
            </p>
          )}
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-900 rounded-r-full" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;