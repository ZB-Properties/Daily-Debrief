import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = ({ variant = 'default', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center text-slate-900 dark:text-gray-200 hover:bg-red-400 hover:dark:bg-gray-500
        space-x-2 px-3 py-2 rounded-lg transition-colors ${className}`}
    >
      {isDark ? (
        <>
          <FiSun className="w-4 h-4" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <FiMoon className="w-4 h-4" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;