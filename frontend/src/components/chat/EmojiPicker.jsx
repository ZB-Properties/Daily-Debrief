import React, { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const EmojiPicker = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const { theme } = useTheme();

  const handleEmojiSelect = (emoji) => {
    if (onSelect) {
      onSelect(emoji);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
      
      <div className="h-80">
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          search={search}
          theme={theme}
          previewPosition="none"
          skinTonePosition="none"
          categories={['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']}
        />
      </div>
    </div>
  );
};

export default EmojiPicker;