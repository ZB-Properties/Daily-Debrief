import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBell, 
  FiMessageSquare, 
  FiVideo, 
  FiPhone, 
  FiUserPlus,
  FiStar,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiClock,
  FiVolume2,
  FiVolumeX,
  FiUsers,
  FiTrash2,
  FiLoader,
  FiFilter
} from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../../components/common/Avatar';
import { formatDistance } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import SoundManager from '../../utils/sounds';
import PushNotificationToggle from '../../components/notifications/PushNotificationToggle'; 

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('notificationSound') !== 'false'
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, registerNotificationHandler } = useSocket();
  const { unreadCount, fetchUnreadCount } = useNotifications();
  
  const observerRef = useRef();
  const loadingRef = useRef();
  const filterMenuRef = useRef();

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync soundEnabled with SoundManager
  useEffect(() => {
    if (soundEnabled !== SoundManager.enabled) {
      SoundManager.enabled = soundEnabled;
    }
  }, [soundEnabled]);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications(1, true);
  }, []);

  // Register notification handler with socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log('🔔 Registering notification handler in Notifications page');

    const unregister = registerNotificationHandler('notifications-page', {
      onNewNotification: (notification) => {
        console.log('📨 New notification received via handler:', notification);
        
        // Add to state at the top
        setNotifications(prev => [notification, ...prev]);
        
        // Play sound based on notification type
        if (soundEnabled) {
          playNotificationSound(notification.type);
        }
        
        // Show toast
        showNotificationToast(notification);
        
        // Update unread count in context
        fetchUnreadCount();
      },
      
      onNotificationRead: ({ notificationId }) => {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
      },
      
      onAllNotificationsRead: () => {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
      }
    });

    return () => {
      unregister();
    };
  }, [socket, isConnected, user, soundEnabled, fetchUnreadCount]);

  // Play notification sound based on type
  const playNotificationSound = (type) => {
    switch(type) {
      case 'call':
      case 'video-call':
        SoundManager.playCall();
        break;
      case 'message':
        SoundManager.playMessage();
        break;
      case 'voice-note':
        SoundManager.playVoiceNote();
        break;
      default:
        SoundManager.playBeep('notification');
    }
  };

  // Show toast notification
  const showNotificationToast = (notification) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
        onClick={() => {
          toast.dismiss(t.id);
          handleNotificationClick(notification);
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {notification.sender?.profileImage || notification.user?.avatar ? (
                <Avatar
                  src={notification.sender?.profileImage || notification.user?.avatar}
                  name={notification.sender?.name || notification.user?.name}
                  size="sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center">
                  {getNotificationIcon(notification.type, 'text-white')}
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.content}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {formatDistance(new Date(notification.createdAt || notification.time), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });
  };

  // Fetch notifications with pagination
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await api.get('/notifications', {
        params: { page: pageNum, limit: 20 }
      });
      
      if (response.data.success) {
        const newNotifications = response.data.data.notifications;
        const pagination = response.data.data.pagination;
        
        setNotifications(prev => 
          reset ? newNotifications : [...prev, ...newNotifications]
        );
        
        setHasMore(pagination.pages > pageNum);
        setPage(pageNum);
      } else {
        setNotifications([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      
      if (socket && isConnected) {
        socket.emit('mark-notification-read', { notificationId: id });
      }
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      fetchUnreadCount();
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      if (socket && isConnected) {
        socket.emit('mark-all-notifications-read');
      }
      
      fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      fetchUnreadCount();
      toast.success('All notifications marked as read (local only)');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      setNotifications(prev => prev.filter(n => n._id !== id));
      fetchUnreadCount();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(prev => prev.filter(n => n._id !== id));
      fetchUnreadCount();
      toast.success('Notification deleted (local only)');
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    
    if (!window.confirm('Delete all notifications?')) return;
    
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      fetchUnreadCount();
      toast.success('All notifications deleted');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      setNotifications([]);
      fetchUnreadCount();
      toast.success('All notifications deleted (local only)');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Toggle sound
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('notificationSound', newState.toString());
    SoundManager.enabled = newState;
    toast.success(`Sound ${newState ? 'enabled' : 'disabled'}`);
    
    if (newState) {
      SoundManager.initAudio();
    }
  };

  // Load more on scroll
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, options);

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasMore, loadingMore, page]);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const displayUnreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type, className = "w-5 h-5") => {
    switch(type) {
      case 'message': return <FiMessageSquare className={`${className} text-blue-500`} />;
      case 'call': return <FiPhone className={`${className} text-red-500`} />;
      case 'video-call': return <FiVideo className={`${className} text-purple-500`} />;
      case 'voice-note': return <FiPhone className={`${className} text-green-500`} />;
      case 'mention': return <FiStar className={`${className} text-yellow-500`} />;
      case 'contact': return <FiUserPlus className={`${className} text-green-500`} />;
      case 'group': return <FiUsers className={`${className} text-indigo-500`} />;
      default: return <FiBell className={`${className} text-gray-500`} />;
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-red-800 dark:to-gray-950">
      {/* Header - FIXED RESPONSIVE */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-950 dark:text-gray-400" />
            </button>
            <div className="relative flex-shrink-0">
              <FiBell className="w-6 h-6 text-slate-900 dark:text-gray-300" />
              {displayUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Notifications
            </h1>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? (
                <FiVolume2 className="w-5 h-5 text-gray-800 dark:text-gray-400" />
              ) : (
                <FiVolumeX className="w-5 h-5 text-gray-800 dark:text-gray-400" />
              )}
            </button>

            {/* Filter Menu for Mobile */}
            <div className="relative sm:hidden" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiFilter className="w-5 h-5 text-gray-800 dark:text-gray-400" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilter('all');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm ${
                        filter === 'all'
                          ? 'bg-blue-900 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilter('unread');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm ${
                        filter === 'unread'
                          ? 'bg-blue-900 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Unread ({displayUnreadCount})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Filter Tabs */}
            <div className="hidden sm:flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                  filter === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                  filter === 'unread'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Unread ({displayUnreadCount})
              </button>
            </div>

            {displayUnreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="hidden sm:block px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-300 hover:text-slate-900 transition-colors min-h-[44px]"
              >
                Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="p-3 text-sm border border-blue-300 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-300 dark:hover:bg-red-900/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Delete all"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Mark All Read Button */}
        {displayUnreadCount > 0 && (
          <div className="mt-2 sm:hidden">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full px-4 py-3 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-300 hover:text-slate-900 transition-colors"
            >
              Mark all read ({displayUnreadCount})
            </button>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-2 flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <FiClock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Reconnecting to notification service...</span>
          </div>
        )}
      </div>

      {/* Push Notifications Section */}
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <FiBell className="w-4 h-4" />
            <span>Push Notifications</span>
          </h4>
          <PushNotificationToggle className="w-full justify-center min-h-[44px]" />
          <p className="text-xs text-gray-500 mt-2">
            Receive notifications even when the app is closed
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative px-3 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group ${
                    !notification.read ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0">
                      {notification.sender?.profileImage ? (
                        <Avatar
                          src={notification.sender.profileImage}
                          name={notification.sender.name}
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
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                          {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                      
                      <p className={`text-sm mt-1 break-words ${
                        !notification.read 
                          ? 'text-gray-800 dark:text-gray-200' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notification.content}
                      </p>

                      {/* Sender name for context */}
                      {notification.sender?.name && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          From: {notification.sender.name}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="px-4 py-2 text-xs bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-1 min-h-[44px]"
                          >
                            <FiCheck className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                          className="px-4 py-2 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1 min-h-[44px]"
                        >
                          <FiX className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-900 rounded-r-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading more indicator */}
            {hasMore && (
              <div ref={loadingRef} className="flex justify-center py-4">
                {loadingMore ? (
                  <FiLoader className="w-6 h-6 animate-spin text-red-900" />
                ) : (
                  <div className="h-10" />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FiBell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
              No notifications
            </h3>
            <p className="text-center max-w-sm">
              {filter === 'unread' 
                ? "You don't have any unread notifications"
                : "You're all caught up! Check back later for new notifications"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;