import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import presenceService from '../../services/presence';

const UserPresence = ({ userId, showText = false }) => {
  const [presence, setPresence] = useState({
    isOnline: false,
    status: 'offline',
    lastSeen: null
  });
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    if (!userId) return;

    // Check if user is in onlineUsers set from socket
    const isOnline = onlineUsers?.has(userId);
    
    if (isOnline) {
      setPresence({
        isOnline: true,
        status: 'online',
        lastSeen: new Date()
      });
    } else {
      // Fetch last seen from API
      fetchPresence();
    }

    // Listen for real-time status changes
    if (socket) {
      const handleStatusChange = ({ userId: changedUserId, status, lastSeen }) => {
        if (changedUserId === userId) {
          setPresence({
            isOnline: status === 'online',
            status,
            lastSeen
          });
        }
      };

      socket.on('user-status-changed', handleStatusChange);
      
      return () => {
        socket.off('user-status-changed', handleStatusChange);
      };
    }
  }, [userId, onlineUsers, socket]);

  const fetchPresence = async () => {
    try {
      const response = await presenceService.getUserPresence(userId);
      if (response.success) {
        setPresence(response.data);
      }
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  };

  const getStatusColor = () => {
    if (presence.isOnline) return 'bg-green-500';
    if (presence.status === 'away') return 'bg-yellow-500';
    if (presence.status === 'busy') return 'bg-red-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (presence.isOnline) return 'Online';
    if (presence.lastSeen) {
      return `Last seen ${presenceService.formatLastSeen(presence.lastSeen)}`;
    }
    return 'Offline';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {showText && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default UserPresence;