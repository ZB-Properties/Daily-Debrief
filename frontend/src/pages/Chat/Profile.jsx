import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiUpload, FiSave, FiUser, FiMail, FiEdit2, FiCamera, FiLogOut, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/globals.css';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  email: z.string().email('Invalid email address')
});

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userStatus, setUserStatus] = useState('online');
  const [isMobile, setIsMobile] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    calls: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: 'everyone',
    profilePhoto: 'everyone'
  });
  
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.status) {
      setUserStatus(user.status);
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      email: user?.email || ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const result = await updateProfile({
        name: data.name,
        bio: data.bio
      });
      
      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      bio: user?.bio || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    console.log('📸 Uploading profile image:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('📥 Upload response:', uploadResponse.data);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }

      const fileData = uploadResponse.data.data;
      
      const result = await updateProfile({ 
        profileImage: fileData.url,
        profileImagePublicId: fileData.public_id 
      });
      
      if (result.success) {
        toast.success('Profile photo updated successfully');
        setShowImageUpload(false);
        setAvatarUpdateKey(prev => prev + 1);
        setAvatarTimestamp(Date.now());
      } else {
        toast.error(result.error || 'Failed to update profile photo');
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const result = await updateProfile({ 
        profileImage: '',
        profileImagePublicId: '' 
      });
      
      if (result.success) {
        toast.success('Profile photo removed');
        setShowImageUpload(false);
        setAvatarUpdateKey(prev => prev + 1);
      } else {
        toast.error(result.error || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUserStatus(newStatus);
    try {
      await api.put('/users/status', { status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handlePrivacyChange = (key, value) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast.success('Privacy setting updated');
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key} notifications ${notificationSettings[key] ? 'disabled' : 'enabled'}`);
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const bioLength = watch('bio')?.length || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-gray-950 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Profile Details</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Manage your profile information and settings
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              icon={<FiUser className="w-4 h-4 text-gray-200" />}
              className="text-gray-800 dark:text-gray-300 bg-red-300 dark:bg-gray-500 hover:bg-gray-300 dark:hover:text-black border-blue-400 dark:border-gray-800 min-h-[44px]"
            >
              Back to Chat
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-rose-50 to-red-400 dark:from-red-400 dark:to-red-600 p-6 sm:p-8 text-center">
            <div className="relative inline-block">
              <Avatar
                key={avatarUpdateKey}
                src={user?.profileImage}
                name={user?.name}
                size="2xl"
                className="dark:border-gray-700 shadow-xl"
              />
              <button
                onClick={() => setShowImageUpload(true)}
                className="absolute bottom-0 right-0 bg-red-900 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Change profile photo"
              >
                <FiCamera className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-4">{user?.name}</h2>
            <p className="text-red-500 dark:text-red-300 text-sm sm:text-base">{user?.email}</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-8 bg-gradient-to-br from-red-400 to-rose-50 dark:from-red-400 dark:to-red-600">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  icon={<FiUser className="text-gray-900 dark:text-gray-600" />}
                  placeholder="Enter your full name"
                  error={errors.name?.message}
                  disabled={!isEditing}
                  {...register('name')}
                />
              </div>

              {/* Email */}
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  icon={<FiMail className="text-gray-900 dark:text-gray-600" />}
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  disabled={true}
                  {...register('email')}
                />
                <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-300 mt-1">
                  Email cannot be changed for security reasons
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Bio
                  <span className="text-gray-500 dark:text-gray-500 ml-2">
                    ({bioLength}/200)
                  </span>
                </label>
                <textarea
                  placeholder="Tell something about yourself..."
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 resize-none min-h-[100px] ${
                    errors.bio
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isEditing}
                  maxLength={200}
                  {...register('bio')}
                />
                {errors.bio?.message && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.bio.message}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This will be displayed on your profile
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                  value={userStatus}
                  onChange={handleStatusChange}
                  disabled={!isEditing}
                >
                  <option value="online">🟢 Online</option>
                  <option value="away">🟡 Away</option>
                  <option value="busy">🔴 Busy</option>
                  <option value="offline">⚫ Offline</option>
                </select>
              </div>

              {/* Theme Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme Preference
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                  value={theme}
                  onChange={handleThemeChange}
                >
                  <option value="light">🌞 Light</option>
                  <option value="dark">🌙 Dark</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    icon={<FiSave className="w-4 h-4" />}
                    className="sm:flex-1 bg-red-400 hover:bg-blue-100 hover:text-black min-h-[44px]"
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="sm:flex-1 border-red-500 hover:text-black min-h-[44px]"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  icon={<FiEdit2 className="w-4 h-4" />}
                  className="sm:flex-1 bg-red-800 hover:bg-red-700 min-h-[44px]"
                >
                  Edit Profile
                </Button>
              )}
              
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowLogoutModal(true)}
                icon={<FiLogOut className="w-4 h-4" />}
                className="sm:flex-1 hover:bg-red-300 hover:text-black min-h-[44px]"
              >
                Logout
              </Button>
            </div>
          </form>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Privacy Settings
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Last Seen</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Who can see your last seen
                  </p>
                </div>
                <select 
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-transparent text-gray-900 dark:text-white min-h-[44px] sm:min-h-[36px]"
                  value={privacySettings.lastSeen}
                  onChange={(e) => handlePrivacyChange('lastSeen', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Profile Photo</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Who can see your profile photo
                  </p>
                </div>
                <select 
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-transparent text-gray-900 dark:text-white min-h-[44px] sm:min-h-[36px]"
                  value={privacySettings.profilePhoto}
                  onChange={(e) => handlePrivacyChange('profilePhoto', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Message Notifications</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Notify when new messages arrive
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificationSettings.messages}
                    onChange={() => handleNotificationToggle('messages')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Call Notifications</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Notify when receiving calls
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificationSettings.calls}
                    onChange={() => handleNotificationToggle('calls')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-4 sm:mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
            Danger Zone
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="danger" 
                size="small"
                onClick={() => setShowDeleteModal(true)}
                icon={<FiTrash2 className="w-4 h-4" />}
                className="min-h-[44px]"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <Modal
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        title="Update Profile Photo"
        size="small"
        className="bg-blue-100"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Avatar
              key={user?.profileImage || 'modal'} 
              src={user?.profileImage}
              name={user?.name}
              size="2xl"
              className="dark:border-gray-700 shadow-xl"
            />
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload a new profile photo
            </p>
          </div>
          
          {uploading ? (
            <LoadingSpinner text="Uploading..." />
          ) : (
            <div className="space-y-4">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-blue-500 transition-colors">
                  <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    Click to upload
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowImageUpload(false)}
                  variant="outline"
                  fullWidth
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRemovePhoto}
                  variant="ghost"
                  fullWidth
                  className="min-h-[44px]"
                >
                  Remove Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="small"
        showFooter
        footerContent={
          <>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout} className="min-h-[44px]">
              Logout
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <FiLogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Are you sure you want to logout?
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You will need to login again to access your account.
          </p>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="medium"
        showFooter
        footerContent={
          <>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="min-h-[44px]">
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              loading={deleting}
              icon={<FiTrash2 className="w-4 h-4" />}
              className="min-h-[44px]"
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

export default Profile;