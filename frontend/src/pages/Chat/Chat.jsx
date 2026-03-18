import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatSidebar from '../../components/layout/ChatSidebar';
import ChatArea from '../../components/chat/ChatArea';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
 
const Chats = () => {
  console.log('💬 Chats page rendering');

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const { isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we need to refresh from navigation state
  useEffect(() => {
    if (location.state?.refresh) {
      refreshSidebar();
      // Clear the state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const handleNewChat = () => {
    navigate('/new-chat');
  };

  // Function to refresh sidebar conversations
  const refreshSidebar = useCallback(() => {
    setSidebarRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="flex h-full w-full overflow-x-hidden">
      {/* Chat Sidebar - No extra spacing */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar 
          onSelectConversation={setSelectedConversation}
          selectedConversation={selectedConversation}
          refreshKey={sidebarRefreshKey}
        />
      </div> 
      
      {/* Chat Area */}
      <div className="hidden md:block md:w-2/3 lg:w-3/4">
        {selectedConversation ? (
          <ChatArea 
            conversation={selectedConversation}
            currentUser={user}
            onGroupUpdate={refreshSidebar}
          />
        ) : (
          // COMPACT WELCOME SCREEN
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
            <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Welcome to Chats</h3>
            <p className="text-center max-w-md text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a conversation or start a new chat
            </p>
            <button
              onClick={handleNewChat}
              className="px-5 py-2 bg-blue-900 text-white dark:bg-gray-600 rounded-lg hover:bg-red-800 hover:text-white transition-colors flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Mobile view */}
      {selectedConversation && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-500">
          <ChatArea 
            conversation={selectedConversation}
            currentUser={user}
            onBack={() => setSelectedConversation(null)}
            onGroupUpdate={refreshSidebar}
          />
        </div>
      )}
    </div>
  );
};

export default Chats;