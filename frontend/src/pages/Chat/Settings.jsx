import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBell, FiLock, FiEye, FiMoon, FiGlobe, 
  FiDatabase, FiTrash2, FiDownload, FiShield,
  FiVolume2, FiMessageSquare, FiVideo, FiUser,
  FiSun, FiCheck, FiX, FiUserX, FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import api from '../../services/api';
import blockService from '../../services/block';
import toast from 'react-hot-toast';
import '../../styles/globals.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [unblocking, setUnblocking] = useState(null);
  const [notifications, setNotifications] = useState({
    messages: true,
    calls: true,
    sounds: true,
    preview: false
  });
  const [privacy, setPrivacy] = useState({
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    readReceipts: true
  });
  const [chatSettings, setChatSettings] = useState({
    enterToSend: true,
    emojiStyle: 'native',
    fontSize: 'medium'
  });
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    deviceManagement: true
  });
  
  const { user, logout, updateProfile } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Load user settings from localStorage or API
  useEffect(() => {
    loadUserSettings();
    fetchBlockedUsers();
  }, []);

  const loadUserSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications || notifications);
        setPrivacy(settings.privacy || privacy);
        setChatSettings(settings.chatSettings || chatSettings);
        setSecurity(settings.security || security);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await blockService.getBlockedUsers();
      if (response.success) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const saveSettings = async () => {
    const settings = {
      notifications,
      privacy,
      chatSettings,
      security
    };
    
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      // Save to backend if you have an API endpoint
      // await api.put('/users/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <FiGlobe /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'privacy', label: 'Privacy', icon: <FiEye /> },
    { id: 'chat', label: 'Chat Settings', icon: <FiMessageSquare /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
    { id: 'data', label: 'Data & Storage', icon: <FiDatabase /> },
    { id: 'account', label: 'Account', icon: <FiUser /> }
  ];

  const handleNotificationToggle = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
    toast.success(`${key} notifications ${notifications[key] ? 'disabled' : 'enabled'}`);
  };

  const handlePrivacyChange = (key, value) => {
    setPrivacy(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    toast.success('Privacy setting updated');
  };

  const handleChatSettingChange = (key, value) => {
    setChatSettings(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    toast.success(`${key} updated to ${value}`);
  };

  const handleSecurityToggle = (key) => {
    setSecurity(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
    toast.success(`${key} ${security[key] ? 'disabled' : 'enabled'}`);
  };

  const handleUnblockUser = async (userId) => {
    setUnblocking(userId);
    try {
      const response = await blockService.unblockUser(userId);
      if (response.success) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User unblocked');
      }
    } catch (error) {
      toast.error('Failed to unblock user');
    } finally {
      setUnblocking(null);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          settings: { notifications, privacy, chatSettings, security }
        },
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/account');
      localStorage.clear();
      toast.success('Account deleted successfully');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await api.post('/auth/logout-all');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      toast.success('Logged out from all devices');
      navigate('/login');
    } catch (error) {
      console.error('Logout all devices error:', error);
      toast.error('Failed to logout from all devices');
    }
  };

  const handleClearChatHistory = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      try {
        await api.delete('/chats/history');
        toast.success('Chat history cleared');
      } catch (error) {
        console.error('Clear history error:', error);
        toast.error('Failed to clear chat history');
      }
    }
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  // Blocked Users List Component
  const BlockedUsersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Blocked Users
        </h2>
        <button
          onClick={() => setShowBlockedUsers(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {blockedUsers.length > 0 ? (
        <div className="space-y-3">
          {blockedUsers.map(user => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={user.profileImage}
                  name={user.name}
                  size="md"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnblockUser(user._id)}
                disabled={unblocking === user._id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {unblocking === user._id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Unblock</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <FiUserX className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No blocked users
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            When you block someone, they'll appear here. You can unblock them at any time.
          </p>
        </div>
      )}
    </div>
  );

  // Render main content based on state
  const renderContent = () => {
    if (showBlockedUsers) {
      return <BlockedUsersList />;
    }

    return (
      <div className="p-6 md:p-8">
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                General Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <FiMoon className="inline-block w-5 h-5 mr-2" />
                  Theme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FiSun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className={`font-medium ${
                      theme === 'light' ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      Light
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FiMoon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      Dark
                    </span>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <FiGlobe className="inline-block w-5 h-5 mr-2" />
                  Language
                </h3>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white"
                  onChange={(e) => toast.success(`Language changed to ${e.target.value}`)}
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notification Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Message Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    <FiMessageSquare className="inline-block w-4 h-4 mr-2" />
                    Message Notifications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get notified when you receive new messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.messages}
                    onChange={() => handleNotificationToggle('messages')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Call Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    <FiVideo className="inline-block w-4 h-4 mr-2" />
                    Call Notifications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get notified when you receive calls
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.calls}
                    onChange={() => handleNotificationToggle('calls')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Sound Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    <FiVolume2 className="inline-block w-4 h-4 mr-2" />
                    Sound Notifications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Play sounds for notifications
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sounds}
                    onChange={() => handleNotificationToggle('sounds')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Message Preview */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Message Preview
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Show message content in notifications
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.preview}
                    onChange={() => handleNotificationToggle('preview')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Privacy Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Last Seen */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Last Seen & Online
                </h3>
                <div className="space-y-2">
                  {['everyone', 'my_contacts', 'nobody'].map((option) => (
                    <label key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="lastSeen"
                        value={option}
                        checked={privacy.lastSeen === option}
                        onChange={(e) => handlePrivacyChange('lastSeen', e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {option.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option === 'everyone' && 'Everyone can see when you were last online'}
                          {option === 'my_contacts' && 'Only your contacts can see when you were last online'}
                          {option === 'nobody' && 'Nobody can see when you were last online'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Profile Photo
                </h3>
                <div className="space-y-2">
                  {['everyone', 'my_contacts', 'nobody'].map((option) => (
                    <label key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="profilePhoto"
                        value={option}
                        checked={privacy.profilePhoto === option}
                        onChange={(e) => handlePrivacyChange('profilePhoto', e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {option.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option === 'everyone' && 'Everyone can see your profile photo'}
                          {option === 'my_contacts' && 'Only your contacts can see your profile photo'}
                          {option === 'nobody' && 'Nobody can see your profile photo'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Read Receipts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Read Receipts
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Let others know when you've read their messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.readReceipts}
                    onChange={(e) => handlePrivacyChange('readReceipts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Blocked Users Link */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      <FiUserX className="inline-block w-4 h-4 mr-2" />
                      Blocked Users
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage users you've blocked
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowBlockedUsers(true)}
                    variant="outline"
                  >
                    View Blocked ({blockedUsers.length})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chat Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Enter to Send */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Enter to Send
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Press Enter to send messages (Shift+Enter for new line)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chatSettings.enterToSend}
                    onChange={(e) => handleChatSettingChange('enterToSend', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Font Size
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {['small', 'medium', 'large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleChatSettingChange('fontSize', size)}
                      className={`py-3 rounded-lg border-2 transition-all ${
                        chatSettings.fontSize === size
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {size}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Style */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Emoji Style
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['native', 'apple', 'google', 'twitter'].map((style) => (
                    <button
                      key={style}
                      onClick={() => handleChatSettingChange('emojiStyle', style)}
                      className={`py-3 rounded-lg border-2 transition-all ${
                        chatSettings.emojiStyle === style
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {style}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    <FiShield className="inline-block w-4 h-4 mr-2" />
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={() => handleSecurityToggle('twoFactorAuth')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Login Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Login Alerts
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginAlerts}
                    onChange={() => handleSecurityToggle('loginAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Device Management */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Device Management
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage devices logged into your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.deviceManagement}
                      onChange={() => handleSecurityToggle('deviceManagement')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                <Button
                  onClick={handleLogoutAllDevices}
                  variant="outline"
                  className="w-full"
                >
                  Log Out From All Devices
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Data & Storage
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Storage Usage */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Storage Usage
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Media & Files</span>
                      <span>1.2 GB of 5 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Messages</span>
                      <span>350 MB</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="space-y-4">
                <Button
                  onClick={() => setShowExportModal(true)}
                  variant="outline"
                  icon={<FiDownload />}
                  className="w-full justify-start"
                >
                  Export Chat Data
                </Button>
                
                <Button
                  onClick={handleClearChatHistory}
                  variant="outline"
                  icon={<FiTrash2 />}
                  className="w-full justify-start text-red-600 dark:text-red-400"
                >
                  Clear All Chat History
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Account Settings
              </h2>
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Change Password */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      <FiLock className="inline-block w-4 h-4 mr-2" />
                      Change Password
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Update your account password
                    </p>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    variant="outline"
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
                  Danger Zone
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-400">
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      variant="danger"
                      icon={<FiTrash2 />}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sticky top-6">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* User Profile Summary */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={user?.profileImage}
                    name={user?.name}
                    size="md"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {user?.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Export Data Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Chat Data"
        size="medium"
        showFooter
        footerContent={
          <>
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportData}
              loading={exporting}
              icon={<FiDownload />}
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              📦 What will be exported?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• All your chat messages and conversations</li>
              <li>• Media files (images, videos, documents)</li>
              <li>• Contact list and user information</li>
              <li>• Account settings and preferences</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
              ⚠️ Important Notes
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>• Export process may take several minutes</li>
              <li>• You'll receive a download link via email</li>
              <li>• Exported data is encrypted for security</li>
              <li>• Link expires in 24 hours</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="medium"
        showFooter
        footerContent={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              loading={deleting}
              variant="danger"
              icon={<FiTrash2 />}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <FiTrash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
              🚨 What will be deleted?
            </h4>
            <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
              <li>• All your chat messages and conversations</li>
              <li>• Media files and shared documents</li>
              <li>• Contact information and user profile</li>
              <li>• Account settings and preferences</li>
              <li>• Call history and message history</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="text-red-600 focus:ring-red-500"
                required
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I understand that this action is irreversible and I want to delete my account.
              </span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;