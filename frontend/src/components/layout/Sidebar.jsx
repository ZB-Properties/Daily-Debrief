import React, { useState } from 'react';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiVideo, 
  FiStar, 
  FiArchive, 
  FiSettings,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import Avatar from '../common/Avatar';
import '../../styles/globals.css'



const Sidebar = ({ isOpen = true, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { icon: <FiMessageSquare />, label: 'Chats', count: 12, active: true },
    { icon: <FiUsers />, label: 'Contacts', count: 3 },
    { icon: <FiVideo />, label: 'Calls', count: 5 },
    { icon: <FiStar />, label: 'Favorites', count: 2 },
    { icon: <FiArchive />, label: 'Archived', count: 8 },
    { icon: <FiSettings />, label: 'Settings' },
  ];

  if (!isOpen) return null;

  return (
    <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 z-10"
      >
        {collapsed ? (
          <FiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <FiChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* User profile */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col' : 'space-x-3'}`}>
          <Avatar
            src="https://ui-avatars.com/api/?name=Richard+Sanford&background=random"
            name="Richard Sanford"
            size={collapsed ? "sm" : "md"}
            status="online"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                Richard Sanford
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Online
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
                {!collapsed && item.count && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Create new chat button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;