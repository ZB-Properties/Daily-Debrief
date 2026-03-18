import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const ConnectionStatus = () => {
  const { isConnected, reconnecting } = useSocket();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (reconnecting) {
      setMessage('Reconnecting to chat server...');
      setShow(true);
    } else if (!isConnected) {
      setMessage('Disconnected. Trying to reconnect...');
      setShow(true);
    } else {
      // When connected, hide after 2 seconds
      if (show) {
        setTimeout(() => setShow(false), 2000);
      }
    }
  }, [isConnected, reconnecting]);

  if (!show) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 px-4 text-sm font-medium transition-all duration-300 ${
      isConnected 
        ? 'bg-green-500 text-white' 
        : reconnecting 
          ? 'bg-yellow-500 text-white' 
          : 'bg-red-500 text-white'
    }`}>
      {isConnected ? (
        <>
          <FiWifi className="w-4 h-4 mr-2" />
          <span>Connected</span>
        </>
      ) : reconnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          <span>{message}</span>
        </>
      ) : (
        <>
          <FiWifiOff className="w-4 h-4 mr-2" />
          <span>{message}</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;