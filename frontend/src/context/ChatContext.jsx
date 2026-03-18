import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useSocket }  from './SocketContext';
import chatService from '../services/chat';
import api from '../services/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { socket, isConnected, sendMessage, markMessageAsRead } = useSocket();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId, reset = false) => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await chatService.getMessages(conversationId, currentPage);
      
      if (response.data.success) {
        const newMessages = response.data.data.messages;
        setHasMore(newMessages.length > 0);
        
        if (reset) {
          setMessages(newMessages);
          setPage(2);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Select conversation
  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setPage(1);
    setHasMore(true);
    
    // Load messages for this conversation
    await loadMessages(conversation.id, true);
    
    // Mark all messages as read
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation.id);
    }
  }, [loadMessages]);

  // Send message
  const sendNewMessage = useCallback(async (content, file = null, replyTo = null) => {
    if (!selectedConversation) return;
    
    try {
      const messageData = {
        receiverId: selectedConversation.user.id,
        content,
        replyTo: replyTo?.id
      };
      
      if (file) {
        // Upload file first
        const uploadResponse = await api.post('/upload', file, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadResponse.data.success) {
          messageData.fileUrl = uploadResponse.data.data.url;
          messageData.fileName = file.name;
          messageData.fileSize = file.size;
          messageData.type = getFileType(file);
        }
      }
      
      // Send via socket
      sendMessage(selectedConversation.user.id, messageData.content, messageData.type, file);
      
      // Optimistically update UI
      const tempMessage = {
        id: Date.now().toString(),
        content,
        sender: { id: 'me', name: 'You' },
        receiver: selectedConversation.user,
        type: messageData.type || 'text',
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        createdAt: new Date().toISOString(),
        read: false,
        delivered: false,
        replyTo
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [selectedConversation, sendMessage]);

  // React to message
  const reactToMessage = useCallback(async (messageId, emoji) => {
    try {
      const response = await chatService.reactToMessage(messageId, emoji);
      if (response.data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: response.data.data.message.reactions }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId) => {
    try {
      await chatService.markAsRead(conversationId);
      
      // Update conversation unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Update messages read status
      setMessages(prev => prev.map(msg => 
        msg.sender.id !== 'me' && !msg.read
          ? { ...msg, read: true }
          : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Socket message handler
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { message, conversationId } = data;
      
      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount: conv.unreadCount + 1,
              lastActivity: new Date().toISOString()
            };
          }
          return conv;
        });
        
        // If conversation doesn't exist, add it
        if (!updated.find(conv => conv.id === conversationId)) {
          // Fetch conversation details
          chatService.getConversation(conversationId).then(response => {
            if (response.data.success) {
              updated.unshift(response.data.data.conversation);
            }
          });
        }
        
        return updated;
      });
      
      // Add message to current conversation if selected
      if (selectedConversation?.id === conversationId) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read
        markMessageAsRead(message.id, conversationId);
      }
    };

    const handleMessageRead = (data) => {
      const { messageId, readAt } = data;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId
          ? { ...msg, read: true, readAt }
          : msg
      ));
    };

    const handleMessageDeleted = (data) => {
      const { messageId } = data;
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    const handleMessageReaction = (data) => {
      const { messageId, reactions } = data;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId
          ? { ...msg, reactions }
          : msg
      ));
    };

    socket.on('receive-message', handleNewMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('message-reaction-updated', handleMessageReaction);

    return () => {
      socket.off('receive-message', handleNewMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('message-reaction-updated', handleMessageReaction);
    };
  }, [socket, isConnected, selectedConversation, markMessageAsRead]);

  // Helper function to determine file type
  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const value = {
    conversations,
    selectedConversation,
    messages,
    loading,
    hasMore,
    loadConversations,
    loadMessages,
    selectConversation,
    sendMessage: sendNewMessage,
    reactToMessage,
    deleteMessage,
    markMessagesAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;