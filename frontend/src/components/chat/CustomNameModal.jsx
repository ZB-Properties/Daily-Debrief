import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiSmile, FiTrash2, FiSave } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';


const EmojiPickerModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const emojiCategories = [
    {
      name: 'Smileys',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚']
    },
    {
      name: 'Gestures',
      emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '👈', '👉']
    },
    {
      name: 'Hearts',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌']
    },
    {
      name: 'Animals',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐸', '🐙', '🦄', '🐧', '🐦', '🐤', '🐣', '🐥']
    },
    {
      name: 'Food',
      emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦']
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiSmile className="w-5 h-5 mr-2 text-yellow-500" />
            Choose an Emoji
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Emoji Grid - Scrollable */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {emojiCategories.map((category, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-white dark:bg-gray-800 py-1">
                {category.name}
              </h4>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {category.emojis.map((emoji, index) => (
                  <button
                    key={`${idx}-${index}`}
                    onClick={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xl sm:text-2xl flex items-center justify-center transition-all hover:scale-110"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Click any emoji to add it to your custom name
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomNameModal = ({ isOpen, onClose, conversation, currentUser, onSave }) => {
  const [customName, setCustomName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && conversation) {
      // Load existing custom name if any
      const existingName = conversation.customName || '';
      setCustomName(existingName);
      setError('');
    }
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!customName.trim()) {
      setError('Please enter a name or add emojis');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave(conversation._id, customName.trim() || null);
      toast.success(customName.trim() ? 'Custom name saved' : 'Custom name removed');
      onClose();
    } catch (error) {
      console.error('Error saving custom name:', error);
      setError('Failed to save custom name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setCustomName('');
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    setCustomName(prev => prev + emoji);
  };

  const participant = conversation?.participant || {};

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-blue-600" />
              Set Custom Name
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Avatar
                src={participant.profileImage}
                name={participant.name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Original Name</p>
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {participant.name || 'Unknown User'}
                </p>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Name <span className="text-xs text-gray-500">(with emojis)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="My baby Girl 🍼"
                  className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  maxLength={50}
                />
                <div className="absolute right-2 bottom-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(true)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Add emoji"
                  >
                    <FiSmile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Character count and hint */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {customName.length}/50 characters
                </span>
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <FiSmile className="w-3 h-3 mr-1" />
                  Add emojis
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              )}
            </div>

            {/* Preview */}
            {customName && (
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">Preview:</p>
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={participant.profileImage}
                    name={participant.name}
                    size="sm"
                  />
                  <span className="text-base font-medium text-gray-900 dark:text-white break-all">
                    {customName}
                  </span>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                <span className="text-blue-500 mr-2">ℹ️</span>
                This name will only appear in your view. The other person won't see this custom name.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {customName && (
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isLoading || !customName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker Modal - Separate from main modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />
    </>
  );
};

export default CustomNameModal;