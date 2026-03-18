import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiUsers, FiUser } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';

const SearchResults = ({ results, type, onItemClick }) => {
  const navigate = useNavigate();

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found
      </div>
    );
  }

  const handleClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      if (type === 'users') {
        navigate(`/chat/${item._id}`);
      } else if (type === 'conversations') {
        navigate(`/chats?conversation=${item._id}`);
      } else if (type === 'messages') {
        navigate(`/chats?conversation=${item.conversation._id}&message=${item._id}`);
      }
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'users':
        return <FiUser className="w-4 h-4" />;
      case 'conversations':
        return <FiUsers className="w-4 h-4" />;
      case 'messages':
        return <FiMessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {results.map((item) => (
        <button
          key={item._id}
          onClick={() => handleClick(item)}
          className="w-full flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
        >
          {type === 'users' && (
            <>
              <Avatar
                src={item.profileImage}
                name={item.name}
                size="md"
              />
              <div className="ml-3 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {item.email}
                </p>
              </div>
            </>
          )}

          {type === 'conversations' && (
            <>
              {item.isGroup ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {item.groupName?.charAt(0) || 'G'}
                </div>
              ) : (
                <Avatar
                  src={item.participants?.find(p => p._id !== currentUserId)?.profileImage}
                  name={item.participants?.find(p => p._id !== currentUserId)?.name}
                  size="md"
                />
              )}
              <div className="ml-3 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {item.isGroup ? item.groupName : item.participants?.find(p => p._id !== currentUserId)?.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {item.isGroup ? `${item.participants?.length} participants` : 'Private chat'}
                </p>
              </div>
            </>
          )}

          {type === 'messages' && (
            <>
              <Avatar
                src={item.sender?.profileImage}
                name={item.sender?.name}
                size="md"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {item.sender?.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {item.content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  in {item.conversation?.isGroup ? item.conversation.groupName : 'Chat'}
                </p>
              </div>
            </>
          )}
        </button>
      ))}
    </div>
  );
};

export default SearchResults;