import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMessageSquare,
  FiUsers,
  FiVideo,
  FiStar,
  FiArchive,
  FiSettings,
  FiBell,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useCall } from '../../context/CallContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ThemeToggle from '../../components/common/ThemeToggle';
import SoundToggle from '../../components/common/SoundToggle';
import NotificationBadge from '../notifications/NotificationBadge';
import IncomingCallModal from '../call/IncomingCallModal';
 
const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [badgeCounts, setBadgeCounts] = useState({
    chats: 0,
    contacts: 0,
    calls: 0,
    favorites: 0,
    archived: 0
  });

  const { user, logout } = useAuth();
  const socketContext = useSocket() || {};
  const { onlineUsers = new Set(), isConnected = false } = socketContext;
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchUnreadCount } = useNotifications();

  // Get call context for incoming calls
  const { incomingCall, answerCall, rejectCall } = useCall();

  // Calculate badge counts based on notification types
  useEffect(() => {
    if (notifications.length > 0) {
      const counts = {
        chats: 0,
        contacts: 0,
        calls: 0,
        favorites: 0,
        archived: 0
      };

      notifications.forEach(notification => {
        if (!notification.read) {
          switch(notification.type) {
            case 'message':
            case 'voice-note':
            case 'mention':
              counts.chats++;
              break;
            case 'call':
            case 'video-call':
              counts.calls++;
              break;
            case 'contact':
              counts.contacts++;
              break;
            case 'group':
              counts.favorites++;
              break;
            default:
              break;
          }
        }
      });

      setBadgeCounts(counts);
    }
  }, [notifications]);

  // Update counts when new notifications arrive
  useEffect(() => {
    const handleNewNotif = (notification) => {
      fetchUnreadCount();
    };

    if (window.__socket) {
      window.__socket.on('new-notification', handleNewNotif);
      window.__socket.on('notification-read', handleNewNotif);
      window.__socket.on('all-notifications-read', handleNewNotif);
    }

    return () => {
      if (window.__socket) {
        window.__socket.off('new-notification', handleNewNotif);
        window.__socket.off('notification-read', handleNewNotif);
        window.__socket.off('all-notifications-read', handleNewNotif);
      }
    };
  }, [fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update active tab based on location
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'chats';
    setActiveTab(path);
    if (isMobile) setSidebarOpen(false);
    setDropdownOpen(false);
  }, [location, isMobile]);

  // UPDATED: Added 'profile' to navItems
  const navItems = [
    { id: 'chats', label: 'Chats', icon: <FiMessageSquare />, count: badgeCounts.chats, path: '/chats' },
    { id: 'contacts', label: 'Contacts', icon: <FiUsers />, count: badgeCounts.contacts, path: '/contacts' },
    { id: 'calls', label: 'Calls', icon: <FiVideo />, count: badgeCounts.calls, path: '/calls' },
    { id: 'favorites', label: 'Favorites', icon: <FiStar />, count: badgeCounts.favorites, path: '/favorites' },
    { id: 'archived', label: 'Archived', icon: <FiArchive />, count: badgeCounts.archived, path: '/archived' },
    { id: 'profile', label: 'Profile', icon: <FiUser />, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: <FiSettings />, path: '/settings' }
  ];

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen text="Loading user..." />;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-gray-950 flex overflow-hidden">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`
            : `relative flex transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`
          }
          h-full bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-gray-950 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl
        `}
      >
        {/* Collapse toggle button - desktop only */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md"
          >
            {sidebarCollapsed ? (
              <FiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        {/* Logo */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-red-500 to-blue-600">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <FiMessageSquare className="w-5 h-5 text-red-600" />
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-white">Daily Debrief</h1>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-600 dark:border-gray-700">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <Avatar
              src={user?.profileImage}
              name={user?.name || 'User'}
              size={sidebarCollapsed ? 'sm' : 'md'}
              status={isConnected ? 'online' : 'offline'}
            />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-500 dark:bg-blue-900/20 text-black dark:text-blue-300 font-medium shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-700'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-3'}`}>
                    <span className={`text-xl ${
                      activeTab === item.id ? 'text-red-400 dark:text-red-600' : 'text-gray-600 dark:text-blue-400'
                    }`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.count > 0 && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      activeTab === item.id
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200'
                        : 'bg-blue-200 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500'
                    }`}>
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-600 dark:border-gray-700 space-y-3">
          {sidebarCollapsed ? (
            <ThemeToggle variant="icon" className="w-full flex justify-center" />
          ) : (
            <ThemeToggle variant="full" className="w-full" />
          )}

          <button
            onClick={() => {
              navigate('/new-chat');
              if (isMobile) setSidebarOpen(false);
            }}
            className="w-full bg-gradient-to-r from-red-500 to-blue-800 text-white font-semibold py-3 rounded-lg hover:from-red-600 hover:to-blue-900 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {!sidebarCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </aside>

      {/* Main content - FIXED for iOS scrolling */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="border-b bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-950 dark:to-gray-800 border-gray-600 dark:border-gray-300 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden flex-shrink-0"
              >
                <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize truncate">
                  {activeTab || 'Chats'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {onlineUsers?.size || 0} contacts online
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <SoundToggle />
              <ThemeToggle variant="icon" />

              <button
                onClick={() => navigate('/search')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <FiSearch className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <NotificationBadge />

              {/* Profile Dropdown */}
              <div className="relative z-50" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar
                    src={user?.profileImage}
                    name={user?.name || 'User'}
                    size="sm"
                    status={isConnected ? 'online' : 'offline'}
                  />
                  <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[100]">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Settings
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - FIXED: This is the scrollable area */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Outlet />
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-500 text-white text-sm font-medium px-4 py-2 text-center flex-shrink-0">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Connecting to server...</span>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation - UPDATED to include Profile tab (5 items) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-[100] h-16">
          <div className="flex items-center justify-around h-full px-2">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setActiveTab(item.id);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative ${
                  activeTab === item.id
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
                {item.count > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Global Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAnswer={answerCall}
          onReject={rejectCall}
          onIgnore={() => {
            rejectCall();
          }}
        />
      )}
    </div>
  );
};

export default MainLayout;