import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notifications';
import SoundManager from '../utils/sounds';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleNotificationClick,
    toggleSound,
    formatTimeAgo,
    getNotificationIcon
  } = useNotifications();

  return {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleNotificationClick,
    toggleSound,
    formatTimeAgo,
    getNotificationIcon
  };
};

// Custom hook for real-time notification updates
export const useRealtimeNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { fetchUnreadCount, addNotification } = useNotifications();
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewNotification = (notification) => {
      console.log('🔔 Real-time notification received:', notification);
      
      // Update unread count
      fetchUnreadCount();
      
      // Store last notification for components that need it
      setLastNotification(notification);
      
      // Play sound
      playNotificationSound(notification.type);
      
      // Show toast
      showNotificationToast(notification);
    };

    const handleNotificationRead = ({ notificationId }) => {
      // Refresh unread count
      fetchUnreadCount();
    };

    socket.on('new-notification', handleNewNotification);
    socket.on('notification-read', handleNotificationRead);

    return () => {
      socket.off('new-notification', handleNewNotification);
      socket.off('notification-read', handleNotificationRead);
    };
  }, [socket, isConnected, user, fetchUnreadCount]);

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
        SoundManager.playBeep('voice');
        break;
      default:
        SoundManager.playBeep('notification');
    }
  };

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
              {notification.sender?.profileImage ? (
                <img
                  src={notification.sender.profileImage}
                  alt={notification.sender.name}
                  className="w-8 h-8 rounded-full object-cover"
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
                {formatTimeAgo(notification.createdAt)}
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

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return {
    lastNotification,
    playNotificationSound,
    showNotificationToast
  };
};

// Custom hook for managing notification preferences
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('notificationPreferences');
    return saved ? JSON.parse(saved) : {
      sound: true,
      desktop: true,
      email: false,
      message: true,
      call: true,
      group: true,
      mention: true
    };
  });

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: value };
      localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  const toggleSound = useCallback(() => {
    updatePreference('sound', !preferences.sound);
    SoundManager.enabled = !preferences.sound;
  }, [preferences.sound, updatePreference]);

  const shouldNotify = useCallback((type) => {
    switch(type) {
      case 'message':
        return preferences.message;
      case 'call':
      case 'video-call':
        return preferences.call;
      case 'mention':
        return preferences.mention;
      case 'group':
        return preferences.group;
      default:
        return true;
    }
  }, [preferences]);

  return {
    preferences,
    updatePreference,
    toggleSound,
    shouldNotify
  };
};

// Custom hook for paginated notifications
export const usePaginatedNotifications = (initialPage = 1, limit = 20) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications(pageNum, limit);
      if (response.success) {
        const newNotifications = response.data.notifications;
        setNotifications(prev => pageNum === 1 ? newNotifications : [...prev, ...newNotifications]);
        setHasMore(response.data.pagination.hasMore);
        setTotal(response.data.pagination.total);
        return newNotifications;
      }
    } catch (error) {
      console.error('Error fetching notifications page:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      return fetchPage(nextPage);
    }
  }, [loading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(1);
    return fetchPage(1);
  }, [fetchPage]);

  const markAsReadAndUpdate = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const deleteAndUpdate = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  return {
    notifications,
    loading,
    hasMore,
    page,
    total,
    loadMore,
    refresh,
    markAsReadAndUpdate,
    deleteAndUpdate
  };
};

export default useNotifications;