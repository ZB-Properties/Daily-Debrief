import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCheck, FiCheckCircle, FiCornerUpLeft, FiCornerUpRight, 
  FiShare2, FiMoreVertical, FiSmile, FiDownload, FiPlay, FiPause, 
  FiTrash2, FiEdit2, FiX, FiBookmark, FiCopy, FiUserX, FiUserCheck,
  FiShare, FiVolume2
} from 'react-icons/fi';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import ImageLightBox from './ImageLightbox';
import { highlightText } from '../../utils/search';
import toast from 'react-hot-toast';

const MessageBubble = ({ 
  message,
  isMe,
  showAvatar,
  showTimestamp,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
  onReply,
  onForward,
  onEdit,
  onCancelEdit,
  isEditing,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onTogglePin,
  pinned,
  currentUserId,
  searchQuery = ''
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Voice note states
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  
  const { user } = useAuth();

  // Common reactions
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleReaction = (emoji) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
  };

  const handleCopyText = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    }
  };

  const handleReply = () => {
    onReply?.(message);
    setShowOptions(false);
  };

  const handleForward = () => {
    onForward?.(message);
    setShowOptions(false);
  };

  const handleEdit = () => {
    onEdit?.(message);
    setShowOptions(false);
  };

  const handleDeleteForMe = () => {
    onDeleteForMe?.(message.id);
    setShowDeleteOptions(false);
    setShowOptions(false);
  };

  const handleDeleteForEveryone = () => {
    onDeleteForEveryone?.(message.id);
    setShowDeleteOptions(false);
    setShowOptions(false);
  };

  const handlePin = () => {
    onTogglePin?.(message.id);
    setShowOptions(false);
  };

  // Voice note functions
  const togglePlay = () => {
    if (!audioRef.current) {
      // Create new audio element
      audioRef.current = new Audio(message.fileUrl || message.content);
      
      audioRef.current.onloadedmetadata = () => {
        setAudioDuration(audioRef.current.duration);
      };
      
      audioRef.current.ontimeupdate = () => {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setAudioProgress(progress);
        setCurrentTime(audioRef.current.currentTime);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        setCurrentTime(0);
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast.error('Failed to play voice note');
        setIsPlaying(false);
      };
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Play failed:', err);
          toast.error('Could not play audio');
        });
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error('Play failed:', err);
            toast.error('Could not play audio');
          });
      }
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * audioDuration;
    
    audioRef.current.currentTime = newTime;
    setAudioProgress(percent * 100);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get audio duration from message or calculate
  const getDisplayDuration = () => {
    if (isPlaying && audioRef.current) {
      return formatDuration(audioRef.current.currentTime);
    }
    return formatDuration(message.duration || audioDuration);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return format(date, 'hh:mm a');
    } catch {
      return '';
    }
  };

  // Get message status icon
  const getStatusIcon = () => {
    switch(message.status) {
      case 'sending':
        return <span className="text-xs text-gray-400">Sending...</span>;
      case 'sent':
        return <FiCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return (
          <div className="flex -space-x-1">
            <FiCheck className="w-3 h-3 text-gray-400" />
            <FiCheck className="w-3 h-3 text-gray-400" />
          </div>
        );
      case 'read':
        return (
          <div className="flex -space-x-1">
            <FiCheck className="w-3 h-3 text-blue-500" />
            <FiCheck className="w-3 h-3 text-blue-500" />
          </div>
        );
      case 'failed':
        return <span className="text-xs text-red-500">Failed</span>;
      default:
        return null;
    }
  };

  // Function to render replied message
  const renderRepliedMessage = () => {
    if (!message.replyTo) return null;
    
    const repliedContent = message.replyTo.content || 
                          (typeof message.replyTo === 'object' ? message.replyTo.content : 'Message');
    const repliedSender = message.replyTo.sender?.name || 
                         (typeof message.replyTo === 'object' && message.replyTo.sender ? message.replyTo.sender.name : 'User');
    
    return (
      <div className={`mb-1 pl-2 border-l-2 ${isMe ? 'border-blue-300' : 'border-gray-400'} opacity-75`}>
        <p className="text-xs font-medium opacity-90">Replying to {repliedSender}</p>
        <p className="text-xs truncate max-w-[200px]">{repliedContent}</p>
      </div>
    );
  };

  // Function to render text with search highlights
  const renderHighlightedText = (text) => {
    if (!searchQuery || !text) return text;
    
    const segments = highlightText(text, searchQuery);
    
    return (
      <>
        {segments.map((segment, i) => (
          <span
            key={i}
            className={segment.highlighted ? 'bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded' : ''}
          >
            {segment.text}
          </span>
        ))}
      </>
    );
  };

  // Render message content based on type
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-1">
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            rows="2"
            autoFocus
          />
          <div className="flex items-center space-x-1">
            <button
              onClick={onSaveEdit}
              className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Handle different message types
    switch(message.type) {
      case 'image':
        return (
          <>
            <div className="space-y-1 cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <img 
                src={message.fileUrl || message.content} 
                alt="Shared image"
                className="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
                onError={(e) => {
                  console.error('Image failed to load:', message.fileUrl || message.content);
                  e.target.src = 'https://via.placeholder.com/300?text=Image+failed+to+load';
                }}
              />
              {message.caption && (
                <p className="text-xs text-gray-800 dark:text-gray-200">{message.caption}</p>
              )}
            </div>
            
            {/* Image Lightbox */}
            <ImageLightBox
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              imageUrl={message.fileUrl || message.content}
              fileName={message.fileName || 'image.jpg'}
            />
          </>
        );
      
      case 'file':
        // If it's actually an image but marked as file, still show as image
        if (message.fileUrl && (message.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || message.mimeType?.startsWith('image/'))) {
          return (
            <div className="space-y-1">
              <img 
                src={message.fileUrl}
                alt="Shared image"
                className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
              {message.caption && (
                <p className="text-xs text-gray-800 dark:text-gray-200">{message.caption}</p>
              )}
            </div>
          );
        }
        
        // Regular file display
        return (
          <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="p-1 bg-gray-200 dark:bg-gray-600 rounded">
              <FiBookmark className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {message.fileName || 'Document'}
              </p>
              <p className="text-xs text-gray-500">
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'File'}
              </p>
            </div>
            <a
              href={message.fileUrl}
              download={message.fileName}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              <FiDownload className="w-3 h-3" />
            </a>
          </div>
        );
      
      case 'voice':
      case 'audio':
        return (
          <div className="flex items-center space-x-2 p-1 min-w-[200px]">
            <button 
              onClick={togglePlay}
              className="p-1.5 bg-blue-700 dark:bg-blue-500 text-gray-50 dark:text-gray-100 rounded-full hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              {isPlaying ? <FiPause className="w-3 h-3" /> : <FiPlay className="w-3 h-3" />}
            </button>
            <div className="flex-1">
              <div 
                className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute top-0 left-0 h-1.5 bg-blue-600 rounded-full transition-all duration-100"
                  style={{ width: `${audioProgress}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 w-10 text-right">
              {getDisplayDuration()}
            </span>
          </div>
        );
      
      default:
        return (
          <p className="text-sm text-gray-900 dark:text-white break-words">
            {renderHighlightedText(message.content)}
          </p>
        );
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative mb-1`}
    >
      <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - smaller */}
        {showAvatar && !isMe && (
          <div className="flex-shrink-0 mr-1">
            <Avatar
              src={message.sender?.avatar}
              name={message.sender?.name}
              size="xs"
            />
          </div>
        )}

        {/* Message Container */}
        <div className="relative">
          {/* Message Bubble - more compact */}
          <div
            className={`relative px-3 py-1.5 rounded-2xl ${
              isMe
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }`}
          >
            {/* Sender Name (for groups) - smaller */}
            {showAvatar && !isMe && message.sender?.name && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">
                {message.sender?.customName || message.sender?.name}
              </p>
            )}

            {/* REPLIED MESSAGE */}
            {renderRepliedMessage()}

            {/* Message Content */}
            {renderContent()}

            {/* Message Footer - more compact */}
            <div className={`flex items-center justify-end space-x-1 mt-0.5 ${
              isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {/* Edited Indicator */}
              {message.isEdited && (
                <span className="text-xs opacity-70">edited</span>
              )}
              
              {/* Timestamp */}
              <span className="text-xs opacity-70">
                {formatTime(message.createdAt)}
              </span>
              
              {/* Status (for my messages) */}
              {isMe && getStatusIcon()}
            </div>

            {/* Reactions - more compact */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="absolute -bottom-2 left-2 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full shadow-lg px-1.5 py-0.5 border border-gray-200 dark:border-gray-700">
                {message.reactions.slice(0, 3).map((reaction, idx) => (
                  <span key={idx} className="text-xs">{reaction.emoji}</span>
                ))}
                {message.reactions.length > 3 && (
                  <span className="text-xs text-gray-500">+{message.reactions.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Pin Indicator - smaller */}
          {pinned && (
            <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5">
              <FiBookmark className="w-2 h-2 rotate-45" />
            </div>
          )}

          {/* Message Actions - smaller */}
          <div className={`absolute top-0 ${isMe ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-0.5 -translate-y-1/2`}>
            {/* React Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="React"
              >
                <FiSmile className="w-3 h-3 text-blue-900 dark:text-blue-300" />
              </button>
              
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-1 flex space-x-0.5 z-50">
                  {commonReactions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-6 h-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm flex items-center justify-center transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={handleReply}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Reply"
            >
              <FiCornerUpRight className="w-3 h-3 text-blue-900 dark:text-blue-300" />
            </button>

            {/* Forward Button - FIXED */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleForward();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Forward"
            >
              <FiShare2 className="w-3 h-3 text-blue-900 dark:text-blue-300" />
            </button>

            {/* Pin/Unpin Button */}
            {onTogglePin && (
              <button
                onClick={handlePin}
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                  pinned ? 'text-red-600' : ''
                }`}
                title={pinned ? 'Unpin' : 'Pin'}
              >
                <FiBookmark className={`w-3 h-3 text-blue-900 dark:text-blue-300 ${pinned ? 'rotate-45' : ''}`} />
              </button>
            )}

            {/* More Options Button */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <FiMoreVertical className="w-3 h-3 text-blue-900 dark:text-blue-300" />
            </button>
          </div>

          {/* Options Dropdown - smaller */}
          {showOptions && (
            <div className={`absolute top-6 ${isMe ? 'left-0' : 'right-0'} mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50`}>
              <div className="py-0.5">
                {/* Copy */}
                <button
                  onClick={handleCopyText}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
                >
                  <FiCopy className="w-3 h-3 text-gray-900 dark:text-gray-400" />
                  <span>Copy</span>
                </button>

                {/* Edit (only for own messages) */}
                {isMe && (
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
                  >
                    <FiEdit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Forward (again) */}
                <button
                  onClick={handleForward}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
                >
                  <FiShare2 className="w-3 h-3" />
                  <span>Forward</span>
                </button>

                {/* Delete Options */}
                <button
                  onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
                >
                  <FiTrash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>

                {/* Delete Sub-options */}
                {showDeleteOptions && (
                  <div className="pl-6 pr-2 py-0.5 bg-gray-50 dark:bg-gray-700/50">
                    <button
                      onClick={handleDeleteForMe}
                      className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 flex items-center space-x-1 py-0.5"
                    >
                      <FiUserX className="w-2.5 h-2.5" />
                      <span>For me</span>
                    </button>
                    {isMe && (
                      <button
                        onClick={handleDeleteForEveryone}
                        className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 flex items-center space-x-1 py-0.5"
                      >
                        <FiUserCheck className="w-2.5 h-2.5" />
                        <span>For everyone</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;