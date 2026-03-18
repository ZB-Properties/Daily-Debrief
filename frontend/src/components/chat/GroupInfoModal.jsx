import React, { useState, useEffect } from 'react';
import { 
  FiX, FiEdit2, FiTrash2, FiUserMinus, FiUserPlus, FiSave,
  FiLink, FiCopy, FiCheck, FiUsers, FiShield, FiInfo,
  FiMessageSquare, FiStar
} from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GroupInfoModal = ({ conversation, onClose, onUpdateGroup, onDeleteGroup, onAddParticipants, onRemoveParticipant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [groupName, setGroupName] = useState(conversation.groupName || '');
  const [groupDescription, setGroupDescription] = useState(conversation.groupDescription || '');
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('members');
  const [coAdmins, setCoAdmins] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const isCreator = conversation.createdBy === user?._id;
  const isAdmin = conversation.groupAdmin === user?._id;
  const isCoAdmin = coAdmins.includes(user?._id);

  useEffect(() => {
    if (conversation.coAdmins) {
      setCoAdmins(conversation.coAdmins);
    }
  }, [conversation]);

  const handleUpdateName = async () => {
    if (!groupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }
    await onUpdateGroup({ name: groupName });
    setIsEditing(false);
  };

  const handleUpdateDescription = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/chats/group/${conversation._id}/description`, {
        description: groupDescription
      });
      if (response.data.success) {
        conversation.groupDescription = groupDescription;
        toast.success('Description updated');
        setIsEditingDesc(false);
      }
    } catch (error) {
      toast.error('Failed to update description');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInviteLink = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/chats/group/${conversation._id}/invite-link`, {
        expiresIn: 24
      });
      if (response.data.success) {
        setInviteLink(response.data.data.inviteLink.url);
      }
    } catch (error) {
      toast.error('Failed to create invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const handleToggleCoAdmin = async (participantId) => {
    if (!isCreator) return;
    
    try {
      if (coAdmins.includes(participantId)) {
        await api.delete(`/chats/group/${conversation._id}/co-admins/${participantId}`);
        setCoAdmins(prev => prev.filter(id => id !== participantId));
        toast.success('Co-admin removed');
      } else {
        await api.post(`/chats/group/${conversation._id}/co-admins`, {
          userId: participantId
        });
        setCoAdmins(prev => [...prev, participantId]);
        toast.success('Co-admin added');
      }
    } catch (error) {
      toast.error('Failed to update co-admin');
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      await onDeleteGroup();
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (participantId === user?._id) {
      if (window.confirm('Are you sure you want to leave this group?')) {
        await onRemoveParticipant(participantId);
      }
    } else {
      if (window.confirm('Remove this participant from the group?')) {
        await onRemoveParticipant(participantId);
      }
    }
  };

  const tabs = [
    { id: 'members', label: 'Members', icon: <FiUsers /> },
    { id: 'admins', label: 'Admins', icon: <FiShield /> },
    { id: 'info', label: 'Info', icon: <FiInfo /> },
    { id: 'invite', label: 'Invite', icon: <FiLink /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-70">
      <div className="bg-blue-100 dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-red-600 dark:border-gray-700 bg-blue-100 dark:bg-gray-800">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate pr-2">
            Group Info
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Group Avatar and Name */}
        <div className="p-4 sm:p-6 flex flex-col items-center border-b border-red-600 dark:border-gray-700">
          <div className="relative mb-4">
            <Avatar
              src={conversation.groupAvatar}
              name={conversation.groupName}
              size="xl"
            />
          </div>
          
          {isEditing ? (
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full max-w-sm">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                placeholder="Group name"
                autoFocus
              />
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleUpdateName}
                  className="flex-1 sm:flex-initial p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiSave className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-initial p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center break-words">
                {conversation.groupName}
              </h3>
              {(isAdmin || isCreator) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <FiEdit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Group Description */}
          <div className="w-full mt-4 px-2">
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900"
                  rows="3"
                  maxLength="500"
                  placeholder="Add a group description..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditingDesc(false);
                      setGroupDescription(conversation.groupDescription || '');
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDescription}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 min-h-[44px]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 break-words">
                  {conversation.groupDescription || 'No description yet'}
                </p>
                {(isAdmin || isCreator) && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  >
                    <FiEdit2 className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            Created {new Date(conversation.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto border-b border-red-600 dark:border-gray-700 px-2">
          <div className="flex min-w-max sm:min-w-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-900 text-red-900 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Participants ({conversation.participants?.length || 0})
                </h4>
                {(isAdmin || isCreator || isCoAdmin) && (
                  <button
                    onClick={() => setShowAddParticipants(!showAddParticipants)}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 min-h-[44px]"
                  >
                    <FiUserPlus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Add Participants Section */}
              {showAddParticipants && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      Search functionality would go here
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                    <button
                      onClick={() => setShowAddParticipants(false)}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onAddParticipants(selectedUsers);
                        setShowAddParticipants(false);
                        setSelectedUsers([]);
                      }}
                      className="px-4 py-2 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 min-h-[44px]"
                    >
                      Add Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Participants List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversation.participants?.map((participant) => {
                  const isAdminUser = participant._id === conversation.groupAdmin;
                  const isCreatorUser = participant._id === conversation.createdBy;
                  const isCoAdminUser = coAdmins.includes(participant._id);
                  const isCurrentUser = participant._id === user?._id;
                  
                  return (
                    <div
                      key={participant._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg gap-2"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar
                          src={participant.profileImage}
                          name={participant.name}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {participant.name}
                            {isCreatorUser && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded whitespace-nowrap">
                                Creator
                              </span>
                            )}
                            {isAdminUser && !isCreatorUser && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded whitespace-nowrap">
                                Admin
                              </span>
                            )}
                            {isCoAdminUser && !isAdminUser && !isCreatorUser && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded whitespace-nowrap">
                                Co-Admin
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded whitespace-nowrap">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {participant.status === 'online' ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 self-end sm:self-auto">
                        {/* Co-admin toggle (only for creator) */}
                        {isCreator && !isCreatorUser && !isAdminUser && (
                          <button
                            onClick={() => handleToggleCoAdmin(participant._id)}
                            className={`p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                              isCoAdminUser 
                                ? 'text-blue-600 hover:bg-blue-100' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={isCoAdminUser ? 'Remove co-admin' : 'Make co-admin'}
                          >
                            <FiShield className="w-4 h-4" />
                          </button>
                        )}

                        {/* Remove/Leave button */}
                        {((isAdmin || isCreator || isCoAdmin) && !isAdminUser && !isCreatorUser) || isCurrentUser ? (
                          <button
                            onClick={() => handleRemoveParticipant(participant._id)}
                            className="p-3 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title={isCurrentUser ? 'Leave group' : 'Remove from group'}
                          >
                            <FiUserMinus className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={conversation.participants?.find(p => p._id === conversation.createdBy)?.profileImage}
                    name="Creator"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.participants?.find(p => p._id === conversation.createdBy)?.name}
                    </p>
                    <p className="text-xs text-purple-600">Creator • Full permissions</p>
                  </div>
                </div>
              </div>

              {conversation.groupAdmin && conversation.groupAdmin !== conversation.createdBy && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={conversation.participants?.find(p => p._id === conversation.groupAdmin)?.profileImage}
                      name="Admin"
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.participants?.find(p => p._id === conversation.groupAdmin)?.name}
                      </p>
                      <p className="text-xs text-red-600">Admin • Can manage group</p>
                    </div>
                  </div>
                </div>
              )}

              {coAdmins.length > 0 && (
                <>
                  <h4 className="font-medium text-gray-900 dark:text-white mt-4">Co-Admins</h4>
                  {coAdmins.map(adminId => {
                    const admin = conversation.participants?.find(p => p._id === adminId);
                    if (!admin) return null;
                    return (
                      <div key={adminId} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Avatar
                              src={admin.profileImage}
                              name={admin.name}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {admin.name}
                              </p>
                              <p className="text-xs text-blue-600">Co-Admin • Limited permissions</p>
                            </div>
                          </div>
                          {isCreator && (
                            <button
                              onClick={() => handleToggleCoAdmin(adminId)}
                              className="p-3 hover:bg-blue-200 rounded-lg text-blue-600 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                            >
                              <FiUserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Group ID</p>
                <p className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white break-all">{conversation._id}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(conversation.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {conversation.metadata?.totalMessages || 0}
                </p>
              </div>
            </div>
          )}

          {/* Invite Tab */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              {(isAdmin || isCreator || isCoAdmin) && (
                <>
                  {!inviteLink ? (
                    <button
                      onClick={handleCreateInviteLink}
                      disabled={loading}
                      className="w-full py-4 bg-red-900 text-white rounded-lg hover:bg-red-800 flex items-center justify-center space-x-2 min-h-[52px]"
                    >
                      <FiLink className="w-4 h-4" />
                      <span>{loading ? 'Creating...' : 'Create Invite Link'}</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                          type="text"
                          value={inviteLink}
                          readOnly
                          className="flex-1 px-3 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                        <button
                          onClick={handleCopyInviteLink}
                          className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 min-w-[48px] min-h-[48px] flex items-center justify-center"
                        >
                          {copied ? <FiCheck className="w-5 h-5 text-green-600" /> : <FiCopy className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Link expires in 24 hours. Anyone with this link can join the group.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        {isCreator && (
          <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-100 dark:bg-gray-800">
            <button
              onClick={handleDeleteGroup}
              className="w-full py-3 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center space-x-2 min-h-[52px]"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Delete Group</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoModal;