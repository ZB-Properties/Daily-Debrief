import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiCheck, FiUsers, FiUser, FiSend } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import forwardService from '../../services/forward';
import toast from 'react-hot-toast';

const ForwardModal = ({ message, onClose, onForward }) => {
  const [recipients, setRecipients] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const response = await forwardService.getRecipients();
      if (response.success) {
        setRecipients(response.data.recipients);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (recipient) => {
    setSelected(prev => {
      const exists = prev.some(r => r.id === recipient.id);
      if (exists) {
        return prev.filter(r => r.id !== recipient.id);
      } else {
        return [...prev, recipient];
      }
    });
  };

  const handleForward = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }

    try {
      const response = await forwardService.forwardMessage(
        message._id,
        selected.map(s => ({ type: s.type, id: s.id })),
        caption
      );

      if (response.success) {
        toast.success(`Message forwarded to ${selected.length} recipient(s)`);
        onForward(response.data.forwarded);
        onClose();
      }
    } catch (error) {
      toast.error('Failed to forward message');
    }
  };

  const filteredRecipients = recipients.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Forward Message
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {message.content || 'Media message'}
          </p>
        </div>

        {/* Caption input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
          />
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search contacts and groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>
        </div>

        {/* Recipients list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
            </div>
          ) : filteredRecipients.length > 0 ? (
            <div className="space-y-2">
              {filteredRecipients.map(recipient => (
                <button
                  key={recipient.id}
                  onClick={() => toggleSelect(recipient)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    selected.some(r => r.id === recipient.id)
                      ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Avatar
                    src={recipient.avatar}
                    name={recipient.name}
                    size="md"
                  />
                  <div className="ml-3 flex-1 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {recipient.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {recipient.isGroup ? (
                        <span className="flex items-center">
                          <FiUsers className="w-3 h-3 mr-1" />
                          {recipient.participants} participants
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FiUser className="w-3 h-3 mr-1" />
                          Contact
                        </span>
                      )}
                    </p>
                  </div>
                  {selected.some(r => r.id === recipient.id) && (
                    <FiCheck className="w-5 h-5 text-red-600" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No contacts or groups found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selected.length} recipient(s) selected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selected.length === 0}
              className="flex-1 py-3 px-4 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center space-x-2"
            >
              <FiSend className="w-4 h-4" />
              <span>Forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;