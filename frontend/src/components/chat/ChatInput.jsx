import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSmile, FiPaperclip, FiMic, FiX } from 'react-icons/fi';
import EmojiPicker from './EmojiPicker';
import FileUpload from '../common/FileUpload';
import Button from '../common/Button';
import { useSocket } from '../../context/SocketContext';
import '../../styles/globals.css'

const ChatInput = ({
  onSendMessage,
  selectedUser,
  replyingTo,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const { sendTypingIndicator } = useSocket();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Typing indicator
  useEffect(() => {
    if (selectedUser && message.trim()) {
      sendTypingIndicator(selectedUser.id, true);
      const timeout = setTimeout(() => {
        sendTypingIndicator(selectedUser.id, false);
      }, 3000);
      
      return () => {
        clearTimeout(timeout);
        sendTypingIndicator(selectedUser.id, false);
      };
    }
  }, [message, selectedUser, sendTypingIndicator]);

  const handleSendMessage = () => {
    if (message.trim() || selectedFile) {
      onSendMessage(message.trim(), selectedFile);
      setMessage('');
      setSelectedFile(null);
      setShowEmojiPicker(false);
      setShowFileUpload(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (file) => {
    setSelectedFile(file);
    setShowFileUpload(false);
  };

  const handleStartRecording = () => {
    setRecording(true);
    setRecordingTime(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Start audio recording (simulated)
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Initialize audio recording
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          // Handle audio blob
          console.log('Audio recorded:', audioBlob);
        };
        
        mediaRecorder.start();
        
        // Store for later use
        window.currentRecorder = { mediaRecorder, stream };
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        setRecording(false);
      });
  };

  const handleStopRecording = () => {
    setRecording(false);
    clearInterval(recordingIntervalRef.current);
    
    if (window.currentRecorder) {
      window.currentRecorder.mediaRecorder.stop();
      window.currentRecorder.stream.getTracks().forEach(track => track.stop());
      delete window.currentRecorder;
    }
    
    // Send audio message (simulated)
    setTimeout(() => {
      onSendMessage('', { type: 'audio', duration: recordingTime });
    }, 500);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-blue-400 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Replying to {replyingTo.sender?.name}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                {replyingTo.content || 'Media'}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
            >
              <FiX className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
            >
              <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">
                  Recording...
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formatRecordingTime(recordingTime)}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopRecording}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-3">
        {/* Action buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiSmile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiPaperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={recording ? handleStopRecording : handleStartRecording}
            className={`p-2.5 rounded-full transition-colors ${
              recording
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FiMic className="w-5 h-5" />
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none max-h-32"
            rows="1"
          />
          
          {/* Send button */}
          {(message.trim() || selectedFile) && (
            <button
              onClick={handleSendMessage}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <FiSend className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-10">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      {/* File upload modal */}
      {showFileUpload && (
        <div className="absolute bottom-20 left-16 z-10 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Send files
            </h3>
            <button
              onClick={() => setShowFileUpload(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <FileUpload
            onUpload={handleFileUpload}
            multiple={false}
            maxSize={10 * 1024 * 1024}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInput;