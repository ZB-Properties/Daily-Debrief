import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi'; // Use FiSquare as stop icon

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Stop audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
      <button
        onClick={handlePlayPause}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        {isPlaying ? (
          <FiPause className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        ) : (
          <FiPlay className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        )}
      </button>
      <button
        onClick={handleStop}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        <FiSquare className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default AudioPlayer;
