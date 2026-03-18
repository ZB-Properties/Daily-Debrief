import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArchive, FiSearch, FiRotateCcw, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import { format } from 'date-fns';
import archiveService from '../../services/archive';
import toast from 'react-hot-toast';

const Archived = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedChats, setArchivedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedChats();
  }, []);

  const fetchArchivedChats = async () => {
    try {
      const response = await archiveService.getArchivedConversations();
      if (response.success) {
        setArchivedChats(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching archived chats:', error);
      toast.error('Failed to load archived chats');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (conversationId, e) => {
    e.stopPropagation();
    setUpdatingId(conversationId);
    try {
      const response = await archiveService.unarchiveConversation(conversationId);
      if (response.success) {
        setArchivedChats(prev => prev.filter(chat => chat._id !== conversationId));
        toast.success('Chat unarchived');
      }
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      toast.error('Failed to unarchive chat');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (conversationId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this chat? This action cannot be undone.')) return;
    
    setUpdatingId(conversationId);
    try {
      const response = await archiveService.deleteArchivedConversation(conversationId);
      if (response.success) {
        setArchivedChats(prev => prev.filter(chat => chat._id !== conversationId));
        toast.success('Chat deleted permanently');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChatClick = (chat) => {
    // Navigate to the chat
    navigate(`/chats?conversation=${chat._id}`);
  };

  const filteredChats = archivedChats.filter(chat => {
    if (chat.isGroup) {
      return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return chat.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <FiArchive className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Archived Chats</h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {archivedChats.length} archived
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chats you archive are hidden from your main chat list
        </p>
        
        {/* Search */}
        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search archived chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Archived Chats List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            const isUpdating = updatingId === chat._id;
            const displayName = chat.isGroup ? chat.groupName : chat.participant?.name;
            const displayAvatar = chat.isGroup ? chat.groupAvatar : chat.participant?.profileImage;
            
            return (
              <div
                key={chat._id}
                onClick={() => handleChatClick(chat)}
                className={`flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  isUpdating ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Avatar
                  src={displayAvatar}
                  name={displayName || 'Unknown'}
                  size="md"
                />
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {displayName || 'Unknown'}
                      {chat.isGroup && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({chat.participants?.length})
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {format(new Date(chat.lastActivity || chat.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                    {chat.lastMessage?.content || 'No messages'}
                  </p>
                  {!chat.isGroup && chat.participant?.bio && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {chat.participant.bio}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={(e) => handleUnarchive(chat._id, e)}
                    disabled={isUpdating}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Unarchive chat"
                  >
                    <FiRotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(chat._id, e)}
                    disabled={isUpdating}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete permanently"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
            <FiArchive className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No archived chats</h3>
            <p className="text-center max-w-md">
              {searchQuery 
                ? `No archived chats matching "${searchQuery}"`
                : "Chats you archive will appear here. Archive chats from the menu in your chat list."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archived;