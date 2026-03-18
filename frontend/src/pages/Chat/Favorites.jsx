import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiSearch, FiMessageSquare, FiPhone, FiUserPlus, FiLoader } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import favoritesService from '../../services/favorite';
import chatService from '../../services/chat';
import toast from 'react-hot-toast';


const Favorites = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesService.getFavoriteContacts();
      if (response.success) {
        setFavorites(response.data);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const response = await chatService.getOrCreatePrivateConversation(userId);
      if (response.success) {
        navigate('/chats', { state: { selectedConversation: response.data.conversation } });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleCall = (userId, type = 'audio') => {
    navigate(`/call/${userId}?type=${type}`);
  };

  const handleToggleFavorite = async (userId) => {
    setTogglingId(userId);
    try {
      const response = await favoritesService.toggleUserFavorite(userId);
      if (response.success) {
        if (response.data.isFavorite) {
          // Add to favorites - need to fetch user details
          const userResponse = await chatService.getUserById?.(userId) || 
            { data: { data: { name: 'User', email: '', profileImage: '' } } };
          
          const newFavorite = {
            _id: userId,
            name: 'Loading...',
            email: '',
            profileImage: '',
            bio: '',
            lastChat: 'Just added to favorites'
          };
          
          // Try to get actual user data
          try {
            const usersResponse = await chatService.getAllUsers();
            if (usersResponse.success) {
              const userData = usersResponse.data.find(u => u._id === userId);
              if (userData) {
                newFavorite.name = userData.name;
                newFavorite.email = userData.email;
                newFavorite.profileImage = userData.profileImage;
                newFavorite.bio = userData.bio;
              }
            }
          } catch (e) {
            console.error('Error fetching user details:', e);
          }
          
          setFavorites(prev => [...prev, newFavorite]);
          toast.success('Added to favorites');
        } else {
          // Remove from favorites
          setFavorites(prev => prev.filter(f => f._id !== userId));
          toast.success('Removed from favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredFavorites = favorites.filter(fav => 
    fav.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FiLoader className="w-12 h-12 animate-spin text-red-900" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiStar className="w-6 h-6 text-yellow-500 fill-current" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h2>
          </div>
          <button 
            onClick={() => navigate('/contacts')}
            className="p-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            title="Add to favorites"
          >
            <FiUserPlus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Favorites Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map(favorite => (
              <div
                key={favorite._id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative group"
                onClick={() => handleStartChat(favorite._id)}
              >
                {/* Favorite indicator */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(favorite._id);
                  }}
                  disabled={togglingId === favorite._id}
                  className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  title="Remove from favorites"
                >
                  {togglingId === favorite._id ? (
                    <FiLoader className="w-4 h-4 animate-spin text-yellow-500" />
                  ) : (
                    <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </button>

                <div className="flex items-center space-x-4">
                  <Avatar
                    src={favorite.profileImage}
                    name={favorite.name}
                    size="lg"
                    status={onlineUsers.has(favorite._id) ? 'online' : 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {favorite.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {favorite.bio || 'No bio'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                      "{favorite.lastChat || 'No messages yet'}"
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(favorite._id);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Send message"
                  >
                    <FiMessageSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCall(favorite._id, 'audio');
                    }}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Call"
                  >
                    <FiPhone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <FiStar className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-center max-w-md">
              {searchQuery 
                ? `No favorites matching "${searchQuery}"`
                : "Add contacts to your favorites for quick access"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/contacts')}
                className="mt-6 px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
              >
                Browse Contacts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;