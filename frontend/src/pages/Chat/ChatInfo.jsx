import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUsers,
  FiInfo,
  FiEdit2,
  FiSave,
  FiX,
  FiUserPlus,
  FiUserMinus,
  FiShield,
  FiTrash2,
  FiLink,
  FiCopy,
  FiCheck,
  FiStar,
  FiMessageSquare,
  FiBell,
  FiBellOff,
  FiImage,
  FiFile,
  FiMusic,
  FiVideo,
  FiDownload,
  FiUser
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chat';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ChatInfo = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [pinChat, setPinChat] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fileItems, setFileItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  
  const [customName, setCustomName] = useState('');
  const [isEditingCustomName, setIsEditingCustomName] = useState(false);
  const [tempCustomName, setTempCustomName] = useState('');

  useEffect(() => {
    console.log('ChatInfo mounted with conversationId:', conversationId);
    if (conversationId) {
      fetchConversationDetails();
    } else {
      console.error('No conversationId provided');
      setLoading(false);
    }
  }, [conversationId]);

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching details for conversation:', conversationId);
      
      const response = await chatService.getConversationDetails(conversationId);
      console.log('Conversation details response:', response);
      
      if (response.success) {
        const convData = response.data.conversation;
        setConversation(convData);
        
        // Set group info if it's a group
        if (convData.isGroup) {
          setEditName(convData.groupName || '');
          setEditDescription(convData.groupDescription || '');
        }
        
        // Set participants/members
        setMembers(convData.participants || []);
        setAdmins(convData.admins || []);
        
        // Set custom name for private chats
        if (!convData.isGroup && convData.userSettings?.customName) {
          setCustomName(convData.userSettings.customName);
          setTempCustomName(convData.userSettings.customName);
        }
        
        // Set mute/pin status
        setMuteNotifications(convData.userSettings?.isMuted || false);
        setPinChat(convData.userSettings?.isPinned || false);
      } else {
        toast.error('Failed to load conversation details');
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      toast.error(error.response?.data?.error || 'Failed to load chat info');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const response = await chatService.updateGroupInfo(conversationId, {
        name: editName,
        description: editDescription
      });
      if (response.success) {
        setConversation(prev => ({
          ...prev,
          groupName: editName,
          groupDescription: editDescription
        }));
        setIsEditing(false);
        toast.success('Group info updated');
      }
    } catch (error) {
      toast.error('Failed to update group info');
    }
  };

  const handleUpdateCustomName = async () => {
    try {
      const response = await chatService.updateCustomName(conversationId, tempCustomName);
      if (response.success) {
        setCustomName(tempCustomName);
        setIsEditingCustomName(false);
        toast.success('Custom name updated');
        
        setConversation(prev => ({
          ...prev,
          userSettings: {
            ...prev.userSettings,
            customName: tempCustomName
          }
        }));
      }
    } catch (error) {
      toast.error('Failed to update custom name');
    }
  };

  const fetchMedia = async (pageNum = 1) => {
  if (!conversationId) return;
  
  try {
    setMediaLoading(true);
    const response = await chatService.getConversationMedia(conversationId, 'image', pageNum, 20);
    
    if (response.success) {
      const newMedia = response.data.media || [];
      setMediaItems(prev => pageNum === 1 ? newMedia : [...prev, ...newMedia]);
      setHasMoreMedia(response.data.pagination?.hasMore || false);
      setMediaPage(pageNum);
    }
  } catch (error) {
    console.error('Error fetching media:', error);
    toast.error('Failed to load media');
  } finally {
    setMediaLoading(false);
  }
};

// Call fetchMedia when conversation loads and media tab is active
useEffect(() => {
  if (conversation && activeTab === 'media') {
    fetchMedia(1);
  }
}, [conversation, activeTab]);

// Load more media when scrolling
const loadMoreMedia = () => {
  if (hasMoreMedia && !mediaLoading) {
    fetchMedia(mediaPage + 1);
  }
};

// Handle media click to open lightbox
const handleMediaClick = (media) => {
  setSelectedMedia(media);
  setLightboxOpen(true);
};

  const handleToggleMute = async () => {
    try {
      const response = await chatService.toggleMute(conversationId);
      if (response.success) {
        setMuteNotifications(!muteNotifications);
        toast.success(muteNotifications ? 'Notifications enabled' : 'Notifications muted');
      }
    } catch (error) {
      toast.error('Failed to toggle mute');
    }
  };

  const handleTogglePin = async () => {
    try {
      const response = await chatService.togglePin(conversationId);
      if (response.success) {
        setPinChat(!pinChat);
        toast.success(pinChat ? 'Chat unpinned' : 'Chat pinned');
      }
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleCreateInviteLink = async () => {
    try {
      const response = await chatService.createInviteLink(conversationId);
      if (response.success) {
        setInviteLink(response.data.inviteLink.url);
      }
    } catch (error) {
      toast.error('Failed to create invite link');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the chat?')) return;
    
    try {
      const response = await chatService.removeMember(conversationId, memberId);
      if (response.success) {
        setMembers(prev => prev.filter(m => m._id !== memberId));
        toast.success('Member removed');
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleMakeAdmin = async (memberId) => {
    try {
      const response = await chatService.makeAdmin(conversationId, memberId);
      if (response.success) {
        setAdmins(prev => [...prev, memberId]);
        toast.success('Member made admin');
      }
    } catch (error) {
      toast.error('Failed to make admin');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    
    try {
      const response = await chatService.leaveGroup(conversationId);
      if (response.success) {
        toast.success('Left group');
        navigate('/chats');
      }
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Delete this chat? This action cannot be undone.')) return;
    
    try {
      const response = await chatService.deleteConversation(conversationId);
      if (response.success) {
        toast.success('Chat deleted');
        navigate('/chats');
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isGroupChat = conversation?.isGroup || false;
  const isCreator = conversation?.createdBy?._id === user?._id;
  const isAdmin = conversation?.groupAdmin?._id === user?._id || 
                  conversation?.admins?.includes(user?._id);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Loading chat info..." />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chat not found</h2>
        <button
          onClick={() => navigate('/chats')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-b border-gray-600/50 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Info</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            {members.length} contacts online
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-6 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-4">
          <Avatar
            src={isGroupChat ? conversation.groupAvatar : conversation.otherParticipant?.profileImage}
            name={isGroupChat ? conversation.groupName : (customName || conversation.otherParticipant?.name)}
            size="2xl"
            className="ring-4 ring-white/20"
          />
          {isGroupChat && (isCreator || isAdmin) && (
            <button
              onClick={() => {/* Handle avatar change */}}
              className="absolute bottom-0 right-0 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Custom Name Section - For private chats */}
        {!isGroupChat && (
          <div className="w-full max-w-md mb-4">
            {isEditingCustomName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={tempCustomName}
                  onChange={(e) => setTempCustomName(e.target.value)}
                  placeholder="Enter custom name"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateCustomName}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <FiSave className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCustomName(false);
                      setTempCustomName(customName);
                    }}
                    className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center space-x-2"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                  {customName || conversation.otherParticipant?.name}
                </h2>
                <button
                  onClick={() => setIsEditingCustomName(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Set custom name"
                >
                  <FiEdit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            {customName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                Original name: {conversation.otherParticipant?.name}
              </p>
            )}
          </div>
        )}

        {/* Group Name Editing */}
        {isGroupChat && isEditing ? (
          <div className="w-full max-w-md space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Group description"
              rows="3"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleUpdateGroup}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <FiSave className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center space-x-2"
              >
                <FiX className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          isGroupChat && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                {conversation.groupName}
              </h2>
              {conversation.groupDescription && (
                <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
                  {conversation.groupDescription}
                </p>
              )}
              {(isCreator || isAdmin) && isGroupChat && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit Group Info</span>
                </button>
              )}
            </>
          )
        )}
      </div>    

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'about', label: 'About', icon: <FiInfo /> },
          { id: 'media', label: 'Media', icon: <FiImage /> },
          { id: 'files', label: 'Files', icon: <FiFile /> },
          { id: 'links', label: 'Links', icon: <FiLink /> },
          { id: 'members', label: 'Members', icon: <FiUsers /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4">
        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Chat Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiInfo className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>

              {!isGroupChat && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FiMessageSquare className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Messages</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {conversation.metadata?.totalMessages || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FiUsers className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Mutual contacts</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {conversation.metadata?.mutualContacts || 0}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {muteNotifications ? <FiBellOff className="w-5 h-5 text-gray-400" /> : <FiBell className="w-5 h-5 text-gray-400" />}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-xs text-gray-500">
                      {muteNotifications ? 'Muted' : 'Enabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleMute}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    muteNotifications ? 'bg-gray-300' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      muteNotifications ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Pin Chat */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiStar className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Pin Chat</h3>
                    <p className="text-xs text-gray-500">
                      {pinChat ? 'Pinned to top' : 'Pin this chat'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePin}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pinChat ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pinChat ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Invite Link (for groups) */}
            {isGroupChat && (isCreator || isAdmin) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Invite Link</h3>
                {inviteLink ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCopyInviteLink}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {copied ? <FiCheck className="w-5 h-5 text-green-600" /> : <FiCopy className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateInviteLink}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <FiLink className="w-4 h-4" />
                    <span>Create Invite Link</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

       {/* Media Tab */}
        {activeTab === 'media' && (
        <div className="space-y-4">
        {mediaItems.length > 0 ? (
        <>
        <div className="grid grid-cols-3 gap-2">
          {mediaItems.map((media, index) => (
            <div
              key={media._id || index}
              onClick={() => handleMediaClick(media)}
              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
            >
              <img
                src={media.fileUrl || media.content}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=Error';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs">
                  {new Date(media.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Load more button */}
        {hasMoreMedia && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMoreMedia}
              disabled={mediaLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {mediaLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12">
        <FiImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No media yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Images shared in this chat will appear here
        </p>
      </div>
    )}
  </div>
)}

{/* Lightbox Modal */}
{lightboxOpen && selectedMedia && (
  <div
    className="fixed inset-0 z-[1000] bg-black bg-opacity-90 flex items-center justify-center p-4"
    onClick={() => setLightboxOpen(false)}
  >
    <button
      onClick={() => setLightboxOpen(false)}
      className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
    >
      <FiX className="w-6 h-6 text-white" />
    </button>
    <img
      src={selectedMedia.fileUrl || selectedMedia.content}
      alt="Enlarged media"
      className="max-w-full max-h-full object-contain"
      onClick={(e) => e.stopPropagation()}
    />
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
      {new Date(selectedMedia.createdAt).toLocaleString()}
    </div>
  </div>
)}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiFile className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Document {i}.pdf</p>
                    <p className="text-xs text-gray-500">2.5 MB • Mar {i}, 2026</p>
                  </div>
                </div>
                <FiDownload className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            ))}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <a href="#" className="text-sm text-blue-600 hover:underline">https://example.com/link/{i}</a>
                <p className="text-xs text-gray-500 mt-1">Shared Mar {i}, 2026</p>
              </div>
            ))}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Add Member Button */}
            {(isCreator || isAdmin) && isGroupChat && (
              <button
                onClick={() => {/* Handle add member */}}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <FiUserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={member.profileImage}
                      name={member.name}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                        {member._id === conversation.createdBy && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            Creator
                          </span>
                        )}
                        {admins.includes(member._id) && member._id !== conversation.createdBy && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Member Actions */}
                  {isGroupChat && (isCreator || isAdmin) && member._id !== user?._id && (
                    <div className="flex items-center space-x-2">
                      {isCreator && !admins.includes(member._id) && member._id !== conversation.createdBy && (
                        <button
                          onClick={() => handleMakeAdmin(member._id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Make admin"
                        >
                          <FiShield className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                        title="Remove member"
                      >
                        <FiUserMinus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Leave Group / Delete Chat */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {isGroupChat ? (
                <>
                  {isCreator ? (
                    <button
                      onClick={handleDeleteChat}
                      className="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center space-x-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete Group</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleLeaveGroup}
                      className="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center space-x-2"
                    >
                      <FiUserMinus className="w-4 h-4" />
                      <span>Leave Group</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleDeleteChat}
                  className="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInfo;