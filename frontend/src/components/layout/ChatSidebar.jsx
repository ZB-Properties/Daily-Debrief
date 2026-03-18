import React, { useState, useEffect } from 'react';
import { FiSearch, FiVideo, FiPhone, FiMoreVertical, FiStar, FiBell, FiBellOff, FiArchive, FiTrash2, FiCheckCircle, FiUsers, FiUserX } from 'react-icons/fi';
import { format } from 'date-fns';
import Avatar from '../common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chat';
import blockService from '../../services/block';
import archiveService from '../../services/archive';
import conversationService from '../../services/conversation';
import BlockUserModal from '../user/BlockUserModal';
import { ConversationSkeleton } from '../common/Skeleton';
import '../../styles/globals.css';
import toast from 'react-hot-toast'; 


const ChatSidebar = ({ onSelectConversation, selectedConversation, refreshKey }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  
  const { socket, onlineUsers, registerConversationHandler } = useSocket();
  const { user } = useAuth();

  // Fetch conversations when component mounts and when refreshKey changes
  useEffect(() => {
    fetchConversations();
    fetchBlockedUsers();
  }, [refreshKey]);

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    try {
      const response = await blockService.getBlockedUsers();
      if (response.success) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  // Monitor socket connection
  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket status in ChatSidebar:', socket.connected ? 'connected' : 'disconnected');
      console.log('🔌 Socket ID in ChatSidebar:', socket.id);
      
      socket.on('connect', () => {
        console.log('🟢 Socket connected in ChatSidebar with ID:', socket.id);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected in ChatSidebar:', reason);
      });
    }
  }, [socket]);

  // Register conversation handler for real-time updates - WITH DEBUG LOGGING
  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket available in ChatSidebar');
      return;
    }

    console.log('✅ Registering conversation handler in ChatSidebar');
    console.log('🔌 Current socket ID:', socket.id);
    console.log('👤 Current user:', user?._id);

    const unregister = registerConversationHandler('sidebar', {
      onConversationUpdated: (data) => {
        console.log('🔄🎯 ChatSidebar - RECEIVED conversation updated:', data);
        console.log('   Data type:', typeof data);
        console.log('   Has conversation property:', !!data.conversation);
        console.log('   Has updates property:', !!data.updates);
        console.log('   Conversation ID:', data.conversationId);
        
        if (data.conversation) {
          console.log('   Conversation object:', data.conversation);
        }
        
        setConversations(prev => {
          console.log('   Current conversations count:', prev.length);
          
          if (!Array.isArray(prev)) {
            console.log('   Prev is not an array, initializing');
            return [];
          }
          
          // Check if conversation exists in current list
          const convIndex = prev.findIndex(c => c && c._id === data.conversationId);
          console.log('   Conversation exists at index:', convIndex);
          
          if (convIndex >= 0) {
            // Update existing conversation
            let updated = [...prev];
            const existingConv = updated[convIndex];
            
            // If we received a full conversation object, use it
            if (data.conversation) {
              console.log('📦 Using full conversation object for update');
              updated[convIndex] = data.conversation;
            } 
            // Otherwise update with the updates object
            else if (data.updates) {
              console.log('📦 Using updates object for update');
              let unreadCount = existingConv.unreadCount || 0;
              
              // Update unread count based on sender
              if (data.updates.lastMessage && data.updates.lastMessage.senderId !== user?._id) {
                unreadCount = (existingConv.unreadCount || 0) + 1;
              } else if (data.updates.unreadCount !== undefined) {
                unreadCount = data.updates.unreadCount;
              }
              
              updated[convIndex] = {
                ...existingConv,
                lastMessage: data.updates.lastMessage || existingConv.lastMessage,
                lastActivity: data.updates.lastActivity || data.updates.lastMessage?.timestamp || existingConv.lastActivity,
                unreadCount: unreadCount
              };
            }
            
            // Sort by lastActivity
            const sorted = updated.sort((a, b) => 
              new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
            );
            console.log('   Updated and sorted conversations count:', sorted.length);
            return sorted;
          } else {
            // This is a new conversation
            console.log('🆕 New conversation detected');
            
            // If we received a full conversation object, use it directly
            if (data.conversation) {
              console.log('✅ Adding new conversation from socket:', data.conversation);
              // Check if it already exists (avoid duplicates)
              if (prev.some(c => c && c._id === data.conversation._id)) {
                console.log('   Conversation already exists, skipping');
                return prev;
              }
              const newList = [data.conversation, ...prev].sort((a, b) => 
                new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
              );
              console.log('   New conversations count:', newList.length);
              return newList;
            } 
            // Otherwise fetch it
            else {
              console.log('🆕 Fetching new conversation details for ID:', data.conversationId);
              conversationService.getConversation(data.conversationId)
                .then(response => {
                  console.log('   Fetch response:', response);
                  if (response.success && response.data?.conversation) {
                    const newConv = response.data.conversation;
                    setConversations(current => {
                      console.log('   Current before adding:', current.length);
                      // Check if it was added while fetching
                      if (current.some(c => c && c._id === newConv._id)) {
                        console.log('   Conversation was added while fetching, skipping');
                        return current;
                      }
                      const updated = [newConv, ...current].sort((a, b) => 
                        new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
                      );
                      console.log('   Added new conversation from fetch, new count:', updated.length);
                      return updated;
                    });
                  } else {
                    console.log('   Failed to fetch conversation:', response);
                  }
                })
                .catch(err => console.error('Error fetching new conversation:', err));
              
              return prev; // Return unchanged while fetching
            }
          }
        });
      }
    });

    return () => {
      console.log('🧹 Unregistering conversation handler');
      unregister();
    };
  }, [socket, user]);

  // Also listen for new-message events directly as a fallback
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('📨 ChatSidebar - direct new message:', message);
      
      setConversations(prev => {
        if (!Array.isArray(prev)) return [];
        
        const convIndex = prev.findIndex(c => c._id === message.conversationId);
        
        if (convIndex >= 0) {
          const updated = [...prev];
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: message,
            lastActivity: message.timestamp || new Date().toISOString(),
            unreadCount: message.senderId !== user?._id 
              ? (updated[convIndex].unreadCount || 0) + 1 
              : updated[convIndex].unreadCount
          };
          
          return updated.sort((a, b) => 
            new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0)
          );
        }
        
        return prev;
      });
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      console.log('📥 Conversations response:', response);
      
      if (response.success) {
        const conversationsArray = response.data?.conversations || [];
        console.log('📋 Conversations array:', conversationsArray);
        setConversations(conversationsArray);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (conversationId, e) => {
    e.stopPropagation();
    setUpdatingId(conversationId);
    try {
      const response = await chatService.markMessagesAsRead(conversationId, []);
      if (response.success) {
        setConversations(prev =>
          prev.map(conv =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleMute = async (conversationId, isMuted, e) => {
    e.stopPropagation();
    setUpdatingId(conversationId);
    try {
      const response = await chatService.toggleMute(conversationId);
      if (response.success) {
        setConversations(prev =>
          prev.map(conv =>
            conv._id === conversationId ? { ...conv, isMuted: !isMuted } : conv
          )
        );
        toast.success(isMuted ? 'Unmuted' : 'Muted');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error('Failed to update mute status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePin = async (conversationId, isPinned, e) => {
    e.stopPropagation();
    setUpdatingId(conversationId);
    try {
      const response = await chatService.togglePin(conversationId);
      if (response.success) {
        setConversations(prev =>
          prev.map(conv =>
            conv._id === conversationId ? { ...conv, isPinned: !isPinned } : conv
          ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        );
        toast.success(isPinned ? 'Unpinned' : 'Pinned');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = async (conversationId, e) => {
    e.stopPropagation();
    setUpdatingId(conversationId);
    try {
      const response = await archiveService.archiveConversation(conversationId);
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        if (selectedConversation?._id === conversationId) {
          onSelectConversation(null);
        }
        toast.success('Chat archived');
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive chat');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteChat = async (conversationId, isGroup, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this ${isGroup ? 'group' : 'chat'}?`)) return;
    
    setUpdatingId(conversationId);
    try {
      const response = await chatService.deleteConversation(conversationId);
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        if (selectedConversation?._id === conversationId) {
          onSelectConversation(null);
        }
        toast.success(`${isGroup ? 'Group' : 'Chat'} deleted`);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlockUser = (userId, userName) => {
    setSelectedUserForBlock({ _id: userId, name: userName });
    setShowBlockModal(true);
  };

  const handleUnblockUser = async (userId, e) => {
    e.stopPropagation();
    try {
      const response = await blockService.unblockUser(userId);
      if (response.success) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User unblocked');
        fetchConversations();
      }
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const isUserBlocked = (userId) => {
    return blockedUsers.some(u => u._id === userId);
  };

  // Safely filter conversations - FIXED to include groups
  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conv => {
        // For groups - handle group filtering
        if (conv.isGroup) {
          // Check search query against group name
          if (searchQuery && !conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          
          // Online filter doesn't apply to groups
          if (filter === 'online') {
            return false;
          }
          
          // Unread filter applies to groups
          if (filter === 'unread' && (!conv.unreadCount || conv.unreadCount === 0)) {
            return false;
          }
          
          return true;
        }
        
        // For private chats
        let displayName = '';
        const participant = conv.participant || {};
        displayName = participant.name || '';
        
        if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        if (filter === 'online' && conv.participant?._id && !onlineUsers.has(conv.participant._id)) {
          return false;
        }
        
        if (filter === 'unread' && (!conv.unreadCount || conv.unreadCount === 0)) {
          return false;
        }
        
        return true;
      })
    : [];

  const pinnedChats = filteredConversations.filter(conv => conv.isPinned);
  const regularChats = filteredConversations.filter(conv => !conv.isPinned);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return format(date, 'HH:mm');
    if (diffMinutes < 10080) return format(date, 'EEE');
    return format(date, 'dd/MM/yy');
  };

 if (loading) {
  return (
    <div className="h-full overflow-y-auto py-2">
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
    </div>
  );
}

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    ); 
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-r border-gray-200 dark:border-gray-700">
      {/* Search and filters - COMPACT */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-200 outline-none text-gray-900 dark:text-white placeholder-gray-800 dark:placeholder-gray-400 text-sm"
          />
        </div>
        
        <div className="flex space-x-1">
          {['all', 'unread', 'online'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors ${
                filter === filterType
                  ? 'bg-blue-900 text-white dark:bg-gray-600 dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations list - COMPACT */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
            <p className="text-sm text-center">No conversations</p>
            <button 
              onClick={() => window.location.href = '/new-chat'}
              className="mt-3 px-3 py-1.5 bg-blue-900 text-white text-sm rounded-lg hover:text-black"
            >
              New Chat
            </button>
          </div>
        ) : (
          <div className="py-1">
            {/* Pinned conversations */}
            {pinnedChats.length > 0 && (
              <>
                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Pinned
                  </p>
                </div>
                {pinnedChats.map(conv => (
                  <ConversationItem
                    key={conv._id}
                    conversation={conv}
                    currentUser={user}
                    isSelected={selectedConversation?._id === conv._id}
                    onClick={() => onSelectConversation(conv)}
                    formatTime={formatTime}
                    onlineUsers={onlineUsers}
                    updatingId={updatingId}
                    onMarkAsRead={handleMarkAsRead}
                    onToggleMute={handleToggleMute}
                    onTogglePin={handleTogglePin}
                    onArchive={handleArchive}
                    onDeleteChat={handleDeleteChat}
                    onBlockUser={handleBlockUser}
                    onUnblockUser={handleUnblockUser}
                    isBlocked={!conv.isGroup && conv.participant?._id ? isUserBlocked(conv.participant._id) : false}
                  />
                ))}
              </>
            )}

            {/* All conversations */}
            {regularChats.length > 0 && (
              <>
                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    All
                  </p>
                </div>
                {regularChats.map(conv => (
                  <ConversationItem
                    key={conv._id}
                    conversation={conv}
                    currentUser={user}
                    isSelected={selectedConversation?._id === conv._id}
                    onClick={() => onSelectConversation(conv)}
                    formatTime={formatTime}
                    onlineUsers={onlineUsers}
                    updatingId={updatingId}
                    onMarkAsRead={handleMarkAsRead}
                    onToggleMute={handleToggleMute}
                    onTogglePin={handleTogglePin}
                    onArchive={handleArchive}
                    onDeleteChat={handleDeleteChat}
                    onBlockUser={handleBlockUser}
                    onUnblockUser={handleUnblockUser}
                    isBlocked={!conv.isGroup && conv.participant?._id ? isUserBlocked(conv.participant._id) : false}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Block User Modal */}
      {showBlockModal && selectedUserForBlock && (
        <BlockUserModal
          user={selectedUserForBlock}
          onClose={() => {
            setShowBlockModal(false);
            setSelectedUserForBlock(null);
          }}
          onBlocked={() => {
            fetchBlockedUsers();
            fetchConversations();
            toast.success('User blocked successfully');
          }}
        />
      )}
    </div>
  );
};

const ConversationItem = ({ 
  conversation, 
  currentUser, 
  isSelected, 
  onClick, 
  formatTime, 
  onlineUsers,
  updatingId,
  onMarkAsRead,
  onToggleMute,
  onTogglePin,
  onArchive,
  onDeleteChat,
  onBlockUser,
  onUnblockUser,
  isBlocked
}) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const isGroup = conversation?.isGroup === true;
  
  let displayName = '';
  let displayAvatar = '';
  let participantId = null;
  let participantCount = 0;
  let displayInitials = '';
  
  if (isGroup) {
    displayName = conversation.groupName || 'Group Chat';
    displayAvatar = conversation.groupAvatar || '';
    participantCount = conversation.participants?.length || 0;
    displayInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  } else {
    const participant = conversation.participant || {};
    displayName = conversation.customName || participant.name || 'Unknown';
    displayAvatar = participant.profileImage || '';
    participantId = participant._id;
    displayInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  const isOnline = !isGroup && participantId && onlineUsers.has(participantId);
  
  const isTyping = conversation.typingUsers?.some(id => id !== currentUser?._id);
  const isUpdating = updatingId === conversation._id;

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center px-3 py-2 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-foreground dark:bg-red-900/20 border-l-2 border-red-900'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      } ${isUpdating ? 'opacity-50 pointer-events-none' : ''} ${isBlocked ? 'opacity-50' : ''}`}
    >
      {/* Avatar with status - slightly smaller */}
      <div className="relative mr-2">
        {displayAvatar ? (
          <img 
            src={displayAvatar} 
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
            isGroup 
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600' 
              : 'bg-gradient-to-r from-blue-500 to-green-500'
          }`}>
            {displayInitials || '?'}
          </div>
        )}
        
        {isGroup ? (
          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-0.5">
            <FiUsers className="w-2.5 h-2.5" />
          </div>
        ) : (
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        )}
        
        {/* Blocked indicator */}
        {isBlocked && !isGroup && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5">
            <FiUserX className="w-2 h-2" />
          </div>
        )}
      </div>

      {/* Conversation info - more compact */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-sm font-semibold truncate flex items-center ${
            conversation.unreadCount > 0
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {displayName}
            {isBlocked && !isGroup && (
              <span className="ml-1 text-xs text-red-600 dark:text-red-400">(Blocked)</span>
            )}
            {isGroup && participantCount > 0 && (
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">
                ({participantCount})
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-1">
            {conversation.isPinned && <FiStar className="w-3 h-3 text-yellow-500 fill-current" />}
            {conversation.isMuted && <FiBellOff className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatTime(conversation.lastMessage?.timestamp || conversation.lastActivity)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              disabled={isUpdating}
            >
              <FiMoreVertical className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate ${
            isTyping
              ? 'text-green-600 dark:text-green-400 font-medium'
              : conversation.unreadCount > 0
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-500'
          }`}>
            {isTyping ? (
              <span className="flex items-center">
                <span className="animate-pulse">typing</span>
                <span className="flex space-x-1 ml-1">
                  <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </span>
            ) : isBlocked && !isGroup ? (
              <span className="text-red-600 dark:text-red-400">Blocked</span>
            ) : (
              <>
                {conversation.lastMessage?.senderId === currentUser?._id && 'You: '}
                {conversation.lastMessage?.content || 'No messages yet'}
                {conversation.lastMessage?.isEdited && ' (edited)'}
              </>
            )}
          </p>
          
          {!isTyping && conversation.unreadCount > 0 && (
            <span className="ml-1 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
        
        {/* Show member list preview for groups - more compact */}
        {isGroup && conversation.participants && conversation.participants.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {conversation.participants.slice(0, 2).map(p => p.name).join(', ')}
            {conversation.participants.length > 2 && '...'}
          </p>
        )}
        
        {/* Show bio only for private chats - more compact */}
        {!isGroup && conversation.participant?.bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {conversation.participant.bio}
          </p>
        )}
      </div>

      {/* Options dropdown - adjust position */}
      {showOptions && (
        <div className="absolute right-3 top-10 z-10 w-48 bg-gray-300 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            {conversation.unreadCount > 0 && (
              <button
                onClick={(e) => {
                  onMarkAsRead(conversation._id, e);
                  setShowOptions(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
              >
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>Mark as read</span>
              </button>
            )}
            
            <button
              onClick={(e) => {
                onToggleMute(conversation._id, conversation.isMuted, e);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
            >
              {conversation.isMuted ? (
                <>
                  <FiBell className="w-3.5 h-3.5" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <FiBellOff className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                onTogglePin(conversation._id, conversation.isPinned, e);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
            >
              <FiStar className={`w-3.5 h-3.5 ${conversation.isPinned ? 'text-yellow-500 fill-current' : ''}`} />
              <span>{conversation.isPinned ? 'Unpin' : 'Pin'}</span>
            </button>
            
            {/* Archive button */}
            <button
              onClick={(e) => {
                onArchive(conversation._id, e);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
            >
              <FiArchive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
            
            {/* Block/Unblock option for private chats only */}
            {!isGroup && (
              <>
                {isBlocked ? (
                  <button
                    onClick={(e) => {
                      onUnblockUser(participantId, e);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
                  >
                    <FiUserX className="w-3.5 h-3.5" />
                    <span>Unblock</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      onBlockUser(participantId, displayName);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
                  >
                    <FiUserX className="w-3.5 h-3.5" />
                    <span>Block</span>
                  </button>
                )}
              </>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            
            <button
              onClick={(e) => {
                onDeleteChat(conversation._id, isGroup, e);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-red-800 flex items-center space-x-2"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;