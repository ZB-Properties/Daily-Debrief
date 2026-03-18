import React, { useEffect, useRef } from 'react';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import '../../styles/globals.css'


const ChatMessages = ({ 
  messages, 
  currentUser, 
  selectedUser, 
  isTyping,
  onReactToMessage,
  onDeleteMessage,
  onReplyToMessage,
  onForwardMessage 
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      dateLabel: format(new Date(date), 'MMMM d, yyyy'),
      messages
    }));
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load more messages when scrolling to top
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      // Load more messages
      console.log('Load more messages');
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-6"
    >
      {groupedMessages.map((group) => (
        <div key={group.date} className="space-y-4">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
              {group.dateLabel}
            </div>
          </div>
          
          {/* Messages */}
          {group.messages.map((message, index) => {
            const isMe = message.sender?.id === currentUser?.id;
            const showAvatar = index === 0 || 
              group.messages[index - 1]?.sender?.id !== message.sender?.id;
            
            const showTimestamp = index === group.messages.length - 1 || 
              new Date(message.createdAt).getTime() - 
              new Date(group.messages[index + 1]?.createdAt).getTime() > 300000; // 5 minutes
            
            return (
              <div
                key={message.id || index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <MessageBubble
                  message={message}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  onReact={onReactToMessage}
                  onDelete={onDeleteMessage}
                  onReply={onReplyToMessage}
                  onForward={onForwardMessage}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <TypingIndicator user={selectedUser} />
        </div>
      )}

      {/* New message indicator */}
      {messages.length > 0 && (
        <div className="sticky bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isTyping && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Start a conversation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Send your first message to {selectedUser?.name}. This is the beginning of your direct message history.
          </p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;