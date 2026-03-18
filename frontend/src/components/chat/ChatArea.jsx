import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSend, FiPaperclip, FiMoreVertical, FiArrowLeft, FiCheck, FiEdit2, FiX, FiCheckCircle,
  FiUsers, FiInfo, FiUserPlus, FiLogOut, FiSmile, FiMic, FiStopCircle, FiImage, FiFile, FiMusic,
  FiPhone, FiVideo, FiUser, FiSearch, FiChevronLeft, FiChevronRight, FiSettings
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import MessageBubble from './MessageBubble';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useTheme } from '../../context/ThemeContext';
import chatService from '../../services/chat';
import messageService from '../../services/message';
import { format, isValid, parseISO } from 'date-fns';
import toast from 'react-hot-toast'; 
import { getUserColor } from '../../utils/colorGenerator';
import GroupInfoModal from './GroupInfoModal';
import EmojiPicker from 'emoji-picker-react';
import ActiveCallModal from '../call/ActiveCallModal';
import PinnedMessage from './PinnedMessage';
import BackgroundPicker from './BackgroundPicker';
import pinService from '../../services/pin';
import backgroundService from '../../services/background';
import ReplyPreview from './ReplyPreview';
import CustomNameModal from './CustomNameModal';
import { MessageSkeleton } from '../common/Skeleton';
import ScrollToBottomButton from './ScrollToBottomButton';
import { searchMessages } from '../../utils/search';
import MessageReactions from './MessageReaction';
import ForwardModal from './ForwardModal';
import ReactionPicker from './ReactionPicker';

const ChatArea = ({ conversation, onBack, onGroupUpdate }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [participants, setParticipants] = useState({});
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userColors, setUserColors] = useState({});
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showCustomNameModal, setShowCustomNameModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [chatBackground, setChatBackground] = useState(() => {
    if (conversation?.background) {
      return conversation.background;
    }
    return { 
      type: 'gradient', 
      value: {
        light: 'from-red-50 to-blue-200',
        dark: 'from-gray-800 to-red-950',
        name: 'Default'
      }
    };
  });
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const editInputRef = useRef(null);
  const optionsDropdownRef = useRef(null);
  
  const processedMessagesRef = useRef(new Set());
  
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { 
    isConnected, 
    sendMessage: sendSocketMessage,
    sendTypingIndicator,
    markAsRead,
    registerMessageHandler,
    registerTypingHandler
  } = useSocket();

  const { 
    initiateCall,
    activeCall,
    incomingCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker
  } = useCall();

  const isGroupChat = conversation?.isGroup || false;

  useEffect(() => {
    if (conversation) {
      setDisplayName(conversation.customName || conversation.participant?.name || 'User');
    }
  }, [conversation]);

  useEffect(() => {
    console.log('💬 Messages array updated. New length:', messages.length);
    if (messages.length > 0) {
      console.log('   Last message:', messages[messages.length - 1]);
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'idle' || callStatus === 'ended') {
      setCallDuration(0);
    }
  }, [callStatus]);

  useEffect(() => {
    if (conversation?.participants) {
      const colors = {};
      conversation.participants.forEach(p => {
        colors[p._id] = getUserColor(p._id);
      });
      if (user?._id) {
        colors[user._id] = getUserColor(user._id);
      }
      setUserColors(colors);
    }
  }, [conversation?.participants, user?._id]);

  const getMessageSenderDetails = (msg) => {
    if (!msg.sender) return null;
    
    if (msg.sender._id || msg.sender.id) {
      return {
        id: msg.sender._id || msg.sender.id,
        name: msg.sender.name || 'Unknown',
        avatar: msg.sender.profileImage || '',
        bio: msg.sender.bio || '',
        customName: msg.sender.customName || null
      };
    }
    
    const senderId = msg.sender.toString();
    const participant = participants[senderId];
    if (participant) {
      return {
        id: participant._id,
        name: participant.name || 'Unknown',
        avatar: participant.profileImage || '',
        bio: participant.bio || '',
        customName: participant.customName || null
      };
    }
    
    return {
      id: senderId,
      name: 'Unknown User',
      avatar: '',
      customName: null
    };
  };

  useEffect(() => {
    if (conversation?._id) {
      fetchMessages(1);
      
      if (conversation.participants) {
        const participantMap = {};
        conversation.participants.forEach(p => {
          participantMap[p._id] = p;
        });
        setParticipants(participantMap);
      }
    }
  }, [conversation?._id]);

  useEffect(() => {
  if (!conversation?._id) {
    console.log('❌ ChatArea: No conversation ID, skipping registration');
    return;
  }

  console.log('🔄 ChatArea: Registering message handler for conversation:', conversation._id);
  console.log('   Handler ID:', `chat-${conversation._id}`);
  console.log('   Current user:', user?._id);
  console.log('   Socket connected:', isConnected);

  const handlerId = `chat-${conversation._id}`;
  
  const unregisterMessages = registerMessageHandler(handlerId, {
    onNewMessage: (message) => {
      console.log('📨📨📨 ChatArea: NEW MESSAGE RECEIVED via handler!');
      console.log('   Message:', message);
      console.log('   Message conversation ID:', message.conversationId || message.conversation);
      console.log('   Current conversation ID:', conversation._id);
      
      const messageConvId = message.conversationId || message.conversation;
      if (messageConvId === conversation._id) {
        console.log('✅✅✅ Message belongs to this conversation, adding to state');
        console.log('   Current messages count:', messages.length);
        
        setMessages(prev => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) {
            console.log('   Message already exists, skipping');
            return prev;
          }
          
          const newMessages = [...prev, message];
          console.log('   New messages count:', newMessages.length);
          return newMessages;
        });
        
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        if (message.senderId !== user?._id && message.sender !== user?._id) {
          console.log('   Marking message as read');
          markAsRead(conversation._id, message._id);
        }
      } else {
        console.log('❌ Message belongs to different conversation:', messageConvId);
      }
    },
    onMessageDelivered: ({ messageId }) => {
      console.log('✅ Message delivered:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status: 'delivered', delivered: true } : msg
      ));
    },
    onMessageRead: ({ messageId }) => {
      console.log('👁️ Message read:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, status: 'read', read: true } : msg
      ));
    },
    onMessageEdited: ({ messageId, content, editedAt }) => {
      console.log('✏️ Message edited:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { 
          ...msg, 
          content, 
          isEdited: true, 
          editedAt 
        } : msg
      ));
    }
  });

  console.log('✅ ChatArea: Message handler registered with ID:', handlerId);

  const unregisterTyping = registerTypingHandler(`typing-${conversation._id}`, {
    onTyping: ({ conversationId, userId, isTyping }) => {
      if (conversationId === conversation._id && userId !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    }
  });

  return () => {
    console.log('🧹 ChatArea: Unregistering socket handlers for conversation:', conversation._id);
    unregisterMessages();
    unregisterTyping();
    processedMessagesRef.current.clear();
  };
}, [conversation?._id, user?._id, markAsRead, registerMessageHandler, registerTypingHandler]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  useEffect(() => {
  if (conversation?._id) {
    fetchPinnedMessage();
  }
}, [conversation?._id]);

const fetchPinnedMessage = async () => {
  try {
    const response = await pinService.getPinnedMessage(conversation._id);
    if (response.success) {
      setPinnedMessage(response.data.pinnedMessage);
    }
  } catch (error) {
    console.error('Error fetching pinned message:', error);
  }
};

const handleTogglePin = async (messageId) => {
  try {
    const response = await pinService.togglePin(messageId);
    if (response.success) {
      if (response.data.pinned) {
        const pinnedMsg = messages.find(m => m._id === messageId);
        setPinnedMessage(pinnedMsg);
      } else {
        setPinnedMessage(null);
      }
      toast.success(response.data.pinned ? 'Message pinned' : 'Message unpinned');
    }
  } catch (error) {
    console.error('Error toggling pin:', error);
    toast.error('Failed to pin message');
  }
};

const handleJumpToPinned = () => {
  if (pinnedMessage) {
    const element = document.getElementById(`message-${pinnedMessage._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
      }, 2000);
    }
  }
};

const handleBackgroundSelect = async (type, value) => {
  try {
    await backgroundService.setBackground(conversation._id, type, value);
    setChatBackground({ type, value });
    setShowBackgroundPicker(false);
    toast.success('Chat background updated');
    
    if (onGroupUpdate) {
      onGroupUpdate();
    }
  } catch (error) {
    console.error('Error updating background:', error);
    toast.error('Failed to update background');
  }
};

const handleResetBackground = async () => {
  try {
    await backgroundService.resetBackground(conversation._id);
    setChatBackground({ 
      type: 'gradient', 
      value: {
        light: 'from-red-50 to-blue-200',
        dark: 'from-gray-800 to-red-950',
        name: 'Default'
      }
    });
    setShowBackgroundPicker(false);
    toast.success('Background reset to default');
  } catch (error) {
    console.error('Error resetting background:', error);
    toast.error('Failed to reset background');
  }
};

const handleSearch = (query) => {
  setSearchQuery(query);
  if (!query.trim()) {
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    return;
  }
  
  const results = searchMessages(messages, query);
  setSearchResults(results);
  setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  
  if (results.length > 0) {
    setTimeout(() => {
      const element = document.getElementById(`message-${results[0]._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
        setTimeout(() => {
          element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
        }, 2000);
      }
    }, 100);
  }
};

const navigateSearch = (direction) => {
  if (searchResults.length === 0) return;
  
  let newIndex;
  if (direction === 'next') {
    newIndex = (currentSearchIndex + 1) % searchResults.length;
  } else {
    newIndex = currentSearchIndex - 1;
    if (newIndex < 0) newIndex = searchResults.length - 1;
  }
  
  setCurrentSearchIndex(newIndex);
  
  const result = searchResults[newIndex];
  const element = document.getElementById(`message-${result._id}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
    setTimeout(() => {
      element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
    }, 2000);
  }
};

const clearSearch = () => {
  setShowSearch(false);
  setSearchQuery('');
  setSearchResults([]);
  setCurrentSearchIndex(-1);
};

  const fetchMessages = async (pageNum) => {
    if (!conversation?._id) return;
    
    try {
      setLoading(true);
      const response = await chatService.getMessages(conversation._id, pageNum);
      
      if (response.success) {
        const newMessages = response.data.messages || [];
        setMessages(prev => pageNum === 1 ? newMessages : [...newMessages, ...prev]);
        setHasMore(response.data.pagination?.hasMore || false);
        setPage(pageNum);
        
        const unreadIds = newMessages
          .filter(m => {
            const msgSenderId = m.sender?._id || m.senderId || m.sender;
            return msgSenderId !== user?._id && !m.read;
          })
          .map(m => m._id);
        
        if (unreadIds.length > 0) {
          unreadIds.forEach(id => markAsRead(conversation._id, id));
        }
        
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected || !conversation?._id) {
      if (!isConnected) {
        toast.error('Not connected to server');
      }
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const senderInfo = {
      _id: user?._id,
      name: user?.name,
      profileImage: user?.profileImage
    };

    const replyData = replyingTo ? replyingTo.id : null;

    const newMessage = {
      _id: tempId,
      content: message,
      sender: senderInfo,
      senderId: user?._id,
      conversation: conversation._id,
      conversationId: conversation._id,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      type: 'text',
      temp: true,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        sender: {
          name: replyingTo.sender?.name
        }
      } : null
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    const repliedMessage = replyingTo; 
    setReplyingTo(null);
    scrollToBottom();

    const sent = sendSocketMessage(conversation._id, message);
    
    if (sent) {
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'sent' } : msg
        ));
      }, 500);
    }

    try {
      
      const response = await chatService.sendMessage(
        conversation._id, 
        message,
        'text',
        replyData 
      );
      
      if (response.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? { 
            ...response.data.message || response.data,
            status: 'sent',
            replyTo: repliedMessage ? {
              id: repliedMessage.id,
              content: repliedMessage.content,
              sender: {
                name: repliedMessage.sender?.name
              }
            } : null
          } : msg
        ));
      }
    } catch (error) {
      console.error('Error saving message:', error);
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      toast.error('Failed to send message');
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const handleEditContentChange = (content) => {
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) {
      setEditingMessage(null);
      return;
    }

    try {
      const response = await messageService.editMessage(editingMessage._id, editContent);
      
      if (response.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === editingMessage._id ? { 
            ...msg, 
            content: editContent,
            isEdited: true,
            editedAt: new Date().toISOString()
          } : msg
        ));
        
        toast.success('Message edited');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error.response?.data?.error || 'Failed to edit message');
    } finally {
      setEditingMessage(null);
      setEditContent('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (conversation?._id && isConnected) {
      sendTypingIndicator(conversation._id, e.target.value.length > 0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage(e);
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowAttachmentMenu(false);
    setUploadProgress(0);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      content: 'Uploading...',
      type: 'text',
      sender: {
        _id: user?._id,
        name: user?.name,
        profileImage: user?.profileImage
      },
      senderId: user?._id,
      conversation: conversation._id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      temp: true
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      console.log('📤 Calling uploadFile service...');
      const response = await chatService.uploadFile(conversation._id, file, message);
      console.log('📥 Upload service response:', response);

      if (response && response.success) {
        console.log('✅ Message created successfully:', response.data);
        
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? response.data : msg
        ));
        
        setMessage('');
        toast.success('File uploaded successfully');
      } else {
        console.error('❌ Upload response missing success flag:', response);
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        toast.error('Upload failed - invalid response');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      const types = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mp4a-latm'
      ];
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('🎤 Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          console.error('❌ No audio data recorded');
          toast.error('No audio recorded');
          setIsRecording(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('✅ Audio recorded:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length
        });
        
        setAudioBlob(audioBlob);
        setIsRecording(false);
        
        await sendVoiceNote(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowAttachmentMenu(false);
      toast.success('Recording started...');
    } catch (error) {
      console.error('❌ Recording error:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceNote = async (audioBlob) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      content: 'Sending voice note...',
      type: 'text',
      sender: {
        _id: user?._id,
        name: user?.name,
        profileImage: user?.profileImage
      },
      senderId: user?._id,
      conversation: conversation._id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      temp: true
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      console.log('🎤 Calling sendVoiceNote service...');
      const response = await chatService.sendVoiceNote(conversation._id, audioBlob, message);
      console.log('📥 Voice note response:', response);

      if (response && response.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? response.data : msg
        ));
        setMessage('');
        setAudioBlob(null);
        toast.success('Voice note sent');
      } else {
        console.error('❌ Voice note response missing success flag:', response);
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        toast.error('Failed to send voice note - invalid response');
      }
    } catch (error) {
      console.error('❌ Voice note error:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      toast.error(error.response?.data?.error || 'Failed to send voice note');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop < 100 && hasMore && !loading) {
        loadMore();
      }
    }
  };

  const getMessageStatusIcon = (status) => {
    switch(status) {
      case 'sending':
        return <FiCheck className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <FiCheck className="w-3 h-3 text-gray-500" />;
      case 'delivered':
        return (
          <div className="flex -space-x-1">
            <FiCheck className="w-3 h-3 text-gray-500" />
            <FiCheck className="w-3 h-3 text-gray-500" />
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

  const isMessageFromCurrentUser = (msg) => {
    const msgSender = msg.sender?._id || msg.senderId || msg.sender;
    const currentUserId = user?._id;
    return msgSender === currentUserId;
  };

  const getTypingText = () => {
    if (typingUsers.size === 0) return null;
    
    const typingNames = Array.from(typingUsers).map(userId => {
      const participant = participants[userId];
      return participant?.name?.split(' ')[0] || 'Someone';
    });
    
    if (typingNames.length === 1) {
      return `${typingNames[0]} is typing...`;
    } else if (typingNames.length === 2) {
      return `${typingNames[0]} and ${typingNames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  const handleReact = async (messageId, emoji) => {
    console.log(`React to message ${messageId} with ${emoji}`);
    try {
      await messageService.reactToMessage(messageId, emoji);
      
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => 
            r.emoji === emoji && (r.user?._id === user?._id || r.user === user?._id)
          );
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.filter(r => 
                !(r.emoji === emoji && (r.user?._id === user?._id || r.user === user?._id))
              )
            };
          } else {
            return {
              ...msg,
              reactions: [...reactions, {
                emoji,
                user: { _id: user?._id, name: user?.name },
                createdAt: new Date().toISOString()
              }]
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleDeleteForMe = async (messageId) => {
    try {
      await chatService.deleteMessageForMe(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    if (!window.confirm('Delete this message for everyone? This cannot be undone.')) return;
    
    try {
      await chatService.deleteMessageForEveryone(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted for everyone');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleReply = (message) => {
    console.log('Reply to message:', message);
    setReplyingTo(message);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleForward = (message) => {
    console.log('Forward message:', message);
    setForwardMessage(message);
  };

  const handleUpdateGroup = async (data) => {
    try {
      setIsUpdating(true);
      const response = await chatService.updateGroupInfo(conversation._id, data);
      if (response.success) {
        toast.success('Group updated successfully');
        setShowGroupInfo(false);
        if (onGroupUpdate) onGroupUpdate();
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.error || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setIsUpdating(true);
      const response = await chatService.deleteConversation(conversation._id);
      if (response.success) {
        toast.success('Group deleted successfully');
        setShowGroupInfo(false);
        if (onBack) onBack();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.error || 'Failed to delete group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddParticipants = async (participantIds) => {
    try {
      setIsUpdating(true);
      const response = await chatService.addGroupParticipants(conversation._id, participantIds);
      if (response.success) {
        toast.success('Participants added successfully');
        setShowGroupInfo(false);
        if (onGroupUpdate) onGroupUpdate();
      }
    } catch (error) {
      console.error('Error adding participants:', error);
      toast.error(error.response?.data?.error || 'Failed to add participants');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      setIsUpdating(true);
      const response = await chatService.removeGroupParticipant(conversation._id, participantId);
      if (response.success) {
        toast.success(participantId === user?._id ? 'You left the group' : 'Participant removed');
        if (participantId === user?._id) {
          if (onBack) onBack();
        } else {
          setShowGroupInfo(false);
          if (onGroupUpdate) onGroupUpdate();
        }
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error(error.response?.data?.error || 'Failed to remove participant');
    } finally {
      setIsUpdating(false);
    }
  }; 

  const handleUpdateCustomName = async (conversationId, customName) => {
    try {
      const response = await chatService.updateCustomName(conversationId, customName);
      if (response.success) {
        setDisplayName(customName || conversation.participant?.name);
        
        if (onGroupUpdate) {
          onGroupUpdate();
        }
      }
      return response;
    } catch (error) {
      console.error('Error updating custom name:', error);
      throw error;
    }
  };

  const getBackgroundStyle = () => {
    if (!chatBackground) return {};
    
    try {
      if (chatBackground.type === 'color') {
        return { backgroundColor: chatBackground.value || '#f3f4f6' };
      } 
      
      else if (chatBackground.type === 'gradient') {
        const cssGradient = backgroundService.tailwindToCssGradient(
          chatBackground.value, 
          isDark
        );
        return { backgroundImage: cssGradient };
      } 
      
      else if (chatBackground.type === 'image') {
        return { 
          backgroundImage: `url(${chatBackground.value || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      }
      
      return {};
    } catch (error) {
      console.error('Error applying background style:', error);
      return { 
        backgroundImage: isDark 
          ? 'linear-gradient(to bottom right, #1f2937, #7f1d1d)'
          : 'linear-gradient(to bottom right, #fee2e2, #bfdbfe)'
      };
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Chats</h3>
        <p className="text-center max-w-md text-gray-600 dark:text-gray-400">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }
 
  return (
    <div className="h-full flex flex-col overflow-hidden overflow-x-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-600/50 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden flex-shrink-0"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
          )}
          
          {isGroupChat ? (
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={conversation.groupAvatar}
                  name={conversation.groupName || 'Group'}
                  size="md"
                  status="group"
                  className="ring-2 ring-white/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white rounded-full p-0.5 ring-2 ring-white/20">
                  <FiUsers className="w-3 h-3" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {conversation.groupName || 'Group Chat'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {conversation.participants?.length} participants
                  {typingUsers.size > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400 truncate">
                      • {getTypingText()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Avatar
                src={conversation.participant?.profileImage}
                name={conversation.participant?.name || 'User'}
                size="md"
                status={conversation.participant?.status}
                className="ring-2 ring-white/20 flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {displayName || conversation.customName || conversation.participant?.name || 'User'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {typingUsers.size > 0 ? (
                    <span className="text-green-600 dark:text-green-400">typing...</span>
                  ) : conversation.participant?.status === 'online' ? (
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 flex-shrink-0"></span>
                      <span className="truncate">Online</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1 flex-shrink-0"></span>
                      <span className="truncate">Offline</span>
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Background Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Change background"
            >
              <FiImage className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-white" />
            </button>
            
            {showBackgroundPicker && (
              <BackgroundPicker
                currentBackground={chatBackground}
                onSelect={handleBackgroundSelect}
                onClose={() => setShowBackgroundPicker(false)}
                onReset={handleResetBackground}
              />
            )}
          </div>

          {!isGroupChat && (
            <>
              <button
                onClick={() => initiateCall(conversation.participant?._id, 'audio')}
                disabled={callStatus !== 'idle'}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Audio Call"
              >
                <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </button>
              <button
                onClick={() => initiateCall(conversation.participant?._id, 'video')}
                disabled={callStatus !== 'idle'}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Video Call"
              >
                <FiVideo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </button>
            </>
          )}
          
          {isGroupChat && (
            <button
              onClick={() => setShowGroupInfo(true)}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Group info"
            >
              <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-white" />
            </button>
          )}
          
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Search in conversation"
          >
            <FiSearch className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-white" />
          </button>
          
          {/* Settings Button */}
        <button
         onClick={() => {
         console.log('Navigating to chat info with ID:', conversation?._id);
         navigate(`/chat-info/${conversation?._id}`);
          }}
         className="p-3 hover:bg-white/10 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
         title="Chat Settings"
         aria-label="Chat settings"
        >
      <FiSettings className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-white" />
       </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search in conversation..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>
            
            {/* Search results count */}
            {searchResults.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {currentSearchIndex + 1} of {searchResults.length}
              </div>
            )}
            
            {/* Navigation buttons */}
            {searchResults.length > 0 && (
              <>
                <button
                  onClick={() => navigateSearch('prev')}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Previous result"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateSearch('next')}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Next result"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Close button */}
            <button
              onClick={clearSearch}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Close search"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search info */}
          {searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              No messages found for "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMessage && (
        <div className="flex-shrink-0">
          <PinnedMessage
            message={pinnedMessage}
            onClose={() => handleTogglePin(pinnedMessage._id)}
            onJumpToMessage={handleJumpToPinned}
          />
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 space-y-4"
        style={getBackgroundStyle()}
      >
        {loading && page === 1 ? (
          <div className="space-y-4 p-4">
            <MessageSkeleton />
            <MessageSkeleton isMe />
            <MessageSkeleton />
            <MessageSkeleton isMe />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMore}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
                >
                  Load more messages
                </button>
              </div>
            )}
            
            {messages.map((msg, index) => {
              const isOwn = isMessageFromCurrentUser(msg);
              const senderDetails = getMessageSenderDetails(msg);
              
              const showAvatar = !isOwn && isGroupChat && (
                index === 0 || 
                getMessageSenderDetails(messages[index - 1])?.id !== senderDetails?.id
              );

              const showTimestamp = index === messages.length - 1 || 
                (index < messages.length - 1 && 
                 new Date(msg.createdAt || msg.timestamp).getTime() + 300000 < 
                 new Date(messages[index + 1].createdAt || messages[index + 1].timestamp).getTime());

              const messageKey = msg.temp 
                ? `temp-${msg._id}-${Date.now()}-${index}-${crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9)}`
                : `${msg._id}-${msg.updatedAt || msg.editedAt || msg.createdAt || Date.now()}-${index}`;

              return (
                <MessageBubble
                  key={messageKey}
                  message={{
                    ...msg,
                    id: msg._id,
                    sender: senderDetails,
                    reactions: msg.reactions || []
                  }}
                  isMe={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  onReact={handleReact}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onReply={handleReply}
                  onForward={handleForward}
                  onEdit={handleEditMessage}
                  onCancelEdit={handleCancelEdit}
                  isEditing={editingMessage?._id === msg._id}
                  editContent={editContent}
                  onEditContentChange={handleEditContentChange}
                  onSaveEdit={handleSaveEdit}
                  onTogglePin={handleTogglePin}
                  pinned={msg.pinned}
                  currentUserId={user?._id}
                  searchQuery={searchQuery}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 flex items-center justify-between flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FiStopCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Uploading... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          replyingTo={replyingTo}
          onCancel={handleCancelReply}
        />
      )}

      {/* Message Input - NOW VISIBLE WITHOUT FOOTER BLOCKING */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2 w-full min-w-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FiPaperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            {showAttachmentMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    <FiImage className="w-4 h-4 mr-3" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    <FiFile className="w-4 h-4 mr-3" />
                    Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startRecording();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    <FiMic className="w-4 h-4 mr-3" />
                    Voice Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.setAttribute('accept', 'audio/*');
                      fileInputRef.current.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    <FiMusic className="w-4 h-4 mr-3" />
                    Audio File
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-0">
            <textarea
              ref={editInputRef}
              value={editingMessage ? editContent : message}
              onChange={editingMessage ? (e) => setEditContent(e.target.value) : handleTyping}
              onKeyPress={handleKeyPress}
              placeholder={replyingTo ? "Reply to message..." : (editingMessage ? "Edit message..." : (isConnected ? "Type a message..." : "Connecting..."))}
              rows="1"
              className="w-full min-w-0 px-4 py-3 bg-white dark:bg-gray-600 border-gray-400 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 focus:border-red-900 resize-none max-h-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              style={{ minHeight: '44px' }}
              disabled={!isConnected}
            />
            
            {!editingMessage && (
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 bottom-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <FiSmile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}

            {showEmojiPicker && !editingMessage && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          {editingMessage ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <FiCheck className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="p-3 bg-blue-600 text-white dark:bg-blue-800/75 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FiSend className="w-5 h-5" />
            </button>
          )}
        </form>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal
          conversation={conversation}
          onClose={() => setShowGroupInfo(false)}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddParticipants={handleAddParticipants}
          onRemoveParticipant={handleRemoveParticipant}
        />
      )}

      {/* Active Call Modal */}
      {activeCall && (callStatus === 'connected' || callStatus === 'connecting') && (
        <ActiveCallModal
          call={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSpeakerOn={isSpeakerOn}
          duration={callDuration}
        />
      )}

      {/* Custom Name Modal */}
      {showCustomNameModal && (
        <CustomNameModal
          isOpen={showCustomNameModal}
          onClose={() => setShowCustomNameModal(false)}
          conversation={conversation}
          currentUser={user}
          onSave={handleUpdateCustomName}
        />
      )}

      {/* Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={(forwarded) => {
            toast.success('Message forwarded successfully');
          }}
        />
      )}

      <ScrollToBottomButton containerRef={messagesContainerRef} />
    </div>
  );
};

export default ChatArea;