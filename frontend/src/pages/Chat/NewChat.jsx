import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiUserPlus, 
  FiArrowLeft, 
  FiX,
  FiUsers,
  FiUser,
  FiLoader,
  FiCheckCircle,
  FiEdit2
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chat';
import toast from 'react-hot-toast';


const NewChat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  // Load all users on mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchAllUsers = async () => {
    setLoadingAll(true);
    try {
      const response = await chatService.getAllUsers();
      if (response.success) {
        // Filter out already selected users and current user
        const filtered = response.data.filter(u => 
          u._id !== user?._id && 
          !selectedUsers.some(selected => selected._id === u._id)
        );
        setAllUsers(filtered);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingAll(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await chatService.searchUsers(searchQuery);
      if (response.success) {
        // Filter out already selected users and current user
        const filtered = response.data.filter(u => 
          u._id !== user?._id && 
          !selectedUsers.some(selected => selected._id === u._id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSearchResults([]);
    
    // Remove from all users list
    setAllUsers(prev => prev.filter(u => u._id !== user._id));
  };

  const handleRemoveUser = (userId) => {
    const removedUser = selectedUsers.find(u => u._id === userId);
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    
    // Add back to all users list
    if (removedUser) {
      setAllUsers(prev => [...prev, removedUser]);
    }
  };

 const handleStartChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setCreating(true);
    try {
      if (!isGroup && selectedUsers.length === 1) {
        // Private chat
        const userId = selectedUsers[0]._id;
        console.log('📤 Creating private chat with:', selectedUsers[0].name);
        
        const response = await chatService.getOrCreatePrivateConversation(userId);
        
        if (response.success) {
          toast.success(`Chat started with ${selectedUsers[0].name}`);
          // Navigate with refresh flag
          navigate('/chats', { state: { refresh: true } });
        }
      } else if (isGroup) {
        // Group chat
        if (selectedUsers.length < 2) {
          toast.error('Please select at least 2 people for a group chat');
          setCreating(false);
          return;
        }

        const finalGroupName = groupName.trim() || 
          `${user?.name?.split(' ')[0]}'s group with ${selectedUsers.map(u => u.name.split(' ')[0]).join(', ')}`;

        console.log('📤 Creating group chat:', { 
          name: finalGroupName, 
          participants: selectedUsers.map(u => u._id) 
        });

        const response = await chatService.createGroupChat(
          finalGroupName, 
          selectedUsers.map(u => u._id)
        );

        if (response.success) {
          toast.success(`Group "${finalGroupName}" created successfully!`);
          // Navigate with refresh flag
          navigate('/chats', { state: { refresh: true } });
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error(error.response?.data?.error || 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  };


  const toggleChatType = () => {
    setIsGroup(!isGroup);
    if (!isGroup) {
      // Switching to group mode
      setGroupName('');
    }
  };

  const displayUsers = searchQuery.trim().length >= 2 ? searchResults : allUsers;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isGroup ? 'New Group' : 'New Chat'}
            </h1>
          </div>
          
          {/* Chat Type Toggle */}
          <button
            onClick={toggleChatType}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isGroup 
                ? 'bg-red-900 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isGroup ? <FiUsers className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isGroup ? 'Group Chat' : '1-on-1 Chat'}
            </span>
          </button>
        </div>
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isGroup ? 'Group Members' : 'Selected'} ({selectedUsers.length})
            </p>
            {isGroup && selectedUsers.length >= 2 && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <FiCheckCircle className="w-3 h-3 mr-1" />
                Ready to create group
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <div
                key={user._id}
                className="flex items-center bg-red-100 dark:bg-red-900/30 rounded-full pl-2 pr-1 py-1 border border-red-200 dark:border-red-800"
              >
                <Avatar src={user.profileImage} name={user.name} size="xs" />
                <span className="text-sm text-gray-900 dark:text-white mx-2">
                  {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => handleRemoveUser(user._id)}
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full transition-colors"
                >
                  <FiX className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Group Name Input */}
          {isGroup && selectedUsers.length >= 2 && (
            <div className="mt-4">
              <div className="relative">
                <FiEdit2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter group name (optional)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {selectedUsers.length} people selected. Groups can have up to 50 members.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900" />
          <input
            type="search"
            placeholder={isGroup ? "Search users to add to group..." : "Search by name or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-900"
            autoFocus
          />
          {loading && (
            <FiLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {loadingAll ? (
          <div className="h-full flex items-center justify-center">
            <FiLoader className="w-8 h-8 text-red-900 animate-spin" />
          </div>
        ) : displayUsers.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayUsers.map(user => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-red-500 dark:hover:text-black cursor-pointer transition-colors group"
              >
                <Avatar
                  src={user.profileImage}
                  name={user.name}
                  size="md"
                  status={onlineUsers.has(user._id) ? 'online' : 'offline'}
                />
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  {user.bio && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{user.bio}</p>
                  )}
                </div>
                <button className="p-2 bg-red-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800">
                  <FiUserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FiUser className="w-8 h-8" />
            </div>
            <p className="text-center">
              {searchQuery 
                ? `No users found matching "${searchQuery}"`
                : "No other users found"}
            </p>
          </div>
        )}
      </div>

      {/* Start Chat Button */}
      {selectedUsers.length > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={handleStartChat}
            disabled={creating || (isGroup && selectedUsers.length < 2)}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
              creating || (isGroup && selectedUsers.length < 2)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-900 hover:bg-red-800 text-white'
            }`}
          >
            {creating ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                {isGroup ? (
                  <span>Create Group with {selectedUsers.length} people</span>
                ) : (
                  <span>Start Chat with {selectedUsers[0]?.name}</span>
                )}
              </>
            )}
          </button>
          
          {isGroup && selectedUsers.length < 2 && (
            <p className="text-xs text-center mt-2 text-red-600 dark:text-red-400">
              Please select at least 2 people to create a group
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NewChat;