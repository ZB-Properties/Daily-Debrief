import React, { useState, useEffect } from 'react';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import SoundManager from '../../utils/sounds';

const SoundToggle = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(SoundManager.enabled);

  const toggleSound = () => {
    const newState = SoundManager.toggle();
    setEnabled(newState);
  };

  return (
    <button
      onClick={toggleSound}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={enabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {enabled ? (
        <FiVolume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <FiVolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
};

export default SoundToggle;