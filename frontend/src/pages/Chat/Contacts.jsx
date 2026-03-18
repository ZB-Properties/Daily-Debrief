import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUserPlus, FiMoreVertical, FiMessageSquare } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chat';
import toast from 'react-hot-toast';
   

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // Get all users except current user
      const response = await chatService.getAllUsers();
      if (response.success) {
        setContacts(response.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (userId, userName) => {
    navigate(`/new-chat?userId=${userId}`);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h2>
          <button 
            onClick={() => navigate('/new-chat')}
            className="p-2 bg-gray-800 dark:bg-gray-400 text-white rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors"
            title="Add new contact"
          >
            <FiUserPlus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2">
            All Contacts ({filteredContacts.length})
          </p>
        </div>
        
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div
              key={contact._id}
              className="flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              onClick={() => handleStartChat(contact._id, contact.name)}
            >
              <Avatar
                src={contact.profileImage}
                name={contact.name}
                size="md"
                status={onlineUsers.has(contact._id) ? 'online' : 'offline'}
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {contact.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    onlineUsers.has(contact._id)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {onlineUsers.has(contact._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                {contact.bio && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{contact.bio}</p>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartChat(contact._id, contact.name);
                }}
                className="p-2 bg-red-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800"
                title="Start chat"
              >
                <FiMessageSquare className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
            <FiUserPlus className="w-12 h-12 mb-4" />
            <p className="text-center">No contacts found</p>
            {searchQuery && (
              <p className="text-sm text-center mt-2">No results matching "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;