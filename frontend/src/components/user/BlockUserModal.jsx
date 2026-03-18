import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import blockService from '../../services/block';
import toast from 'react-hot-toast';

const BlockUserModal = ({ user, onClose, onBlocked }) => {
  const handleBlock = async () => {
    try {
      const response = await blockService.blockUser(user._id);
      if (response.success) {
        toast.success(`${user.name} has been blocked`);
        onBlocked?.();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Block User
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <Avatar
            src={user.profileImage}
            name={user.name}
            size="xl"
          />
          <h4 className="font-semibold text-gray-900 dark:text-white mt-3">
            {user.name}
          </h4>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Are you sure you want to block this user?
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                They will not be able to send you messages or call you. 
                You will not see their messages or status updates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBlock}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Block User
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;