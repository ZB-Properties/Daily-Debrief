import React, { useState } from 'react';
import { FiSearch, FiVideo, FiPhone, FiMoreVertical, FiInfo } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import '../../styles/globals.css'



const ChatHeader = ({ user, onCall, onVideoCall }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(lastSeen).toLocaleDateString();
  };

  return (
    <> 
      <div className="bg-rose-200 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={user?.profileImage}
                name={user?.name}
                size="lg"
                status={user?.status}
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.status === 'online' ? 'Online' : `Last seen ${formatLastSeen(user?.lastSeen)}`}
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onCall}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Voice call"
            >
              <FiPhone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={onVideoCall}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Video call"
            >
              <FiVideo className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
              aria-label="More options"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              
              {showOptions && (
                <div className="absolute right-0 top-12 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <FiInfo className="w-4 h-4" />
                      <span>View profile</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Search in conversation
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Mute notifications
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Block user
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Delete chat
                    </button>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profile Details"
        size="medium"
      >
        <div className="space-y-6">
          {/* Profile image */}
          <div className="flex flex-col items-center">
            <Avatar
              src={user?.profileImage}
              name={user?.name}
              size="2xl"
              className="mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Bio
            </h4>
            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {user?.bio || 'No bio provided'}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </h4>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  user?.status === 'online' ? 'bg-green-500' :
                  user?.status === 'away' ? 'bg-yellow-500' :
                  user?.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-gray-900 dark:text-white capitalize">
                  {user?.status || 'offline'}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Last Seen
              </h4>
              <p className="text-gray-900 dark:text-white">
                {formatLastSeen(user?.lastSeen)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onCall}
              className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FiPhone className="w-4 h-4" />
              <span>Voice Call</span>
            </button>
            <button
              onClick={onVideoCall}
              className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FiVideo className="w-4 h-4" />
              <span>Video Call</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ChatHeader;