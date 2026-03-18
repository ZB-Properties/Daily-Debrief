import React from 'react';
import { ClipLoader, ScaleLoader, PulseLoader } from 'react-spinners';

const LoadingSpinner = ({
  type = 'clip',
  size = 40,
  color = '#3b82f6',
  className = '',
  text,
  fullScreen = false
}) => {
  const Spinner = {
    clip: ClipLoader,
    scale: ScaleLoader,
    pulse: PulseLoader
  }[type];
  
  const Component = Spinner || ClipLoader;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
        <Component size={size} color={color} />
        {text && (
          <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Component size={size} color={color} />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;