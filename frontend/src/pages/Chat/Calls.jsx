import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPhone, 
  FiVideo, 
  FiSearch,
  FiArrowLeft, 
  FiClock,
  FiCalendar,
  FiMoreVertical,
  FiX
} from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import callService from '../../services/calls';
import CallItem from '../../components/call/CallItem';
import CallDetailsModal from '../../components/call/CallDetailModal';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const Calls = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  // Fetch call history on mount
  useEffect(() => {
    fetchCallHistory();
  }, []);

  // Listen for new calls via socket
  useEffect(() => {
    if (!window.__socket) return;

    const handleNewCall = (call) => {
      // Add new call to the list
      setCalls(prev => [call, ...prev]);
      
      // Show toast for missed calls or incoming calls
      if (call.receiver?._id === user?._id && call.status === 'missed') {
        toast.error(`Missed ${call.type} call from ${call.caller?.name}`);
      }
    };

    const handleCallUpdated = ({ callId, updates }) => {
      setCalls(prev => prev.map(call => 
        call._id === callId ? { ...call, ...updates } : call
      ));
    };

    window.__socket.on('new-call', handleNewCall);
    window.__socket.on('call-updated', handleCallUpdated);

    return () => {
      window.__socket?.off('new-call', handleNewCall);
      window.__socket?.off('call-updated', handleCallUpdated);
    };
  }, [user]);

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const response = await callService.getCallHistory();
      if (response.success) {
        setCalls(response.data.calls);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const handleCallAgain = (userId, type) => {
    if (!userId) {
      toast.error('User not found');
      return;
    }
    navigate(`/call/${userId}?type=${type}`);
  };

  const filteredCalls = calls.filter(call => {
    const otherUser = call.caller?._id === user?._id ? call.receiver : call.caller;
    const userName = otherUser?.name || '';
    
    if (searchQuery && !userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (filter === 'missed' && call.status !== 'missed') return false;
    if (filter === 'incoming' && call.caller?._id === user?._id) return false;
    if (filter === 'outgoing' && call.caller?._id !== user?._id) return false;
    
    return true;
  });

  const groupCallsByDate = () => {
    const groups = {};
    
    filteredCalls.forEach(call => {
      const date = new Date(call.createdAt);
      let groupKey;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(call);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    );
  }

  const groupedCalls = groupCallsByDate();
 
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-800 dark:text-gray-400" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calls</h2>
          </div>
          <button 
            onClick={fetchCallHistory}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Refresh"
          >
            <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-2">
          {['all', 'missed', 'incoming', 'outgoing'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === filterType
                  ? 'bg-red-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedCalls).length > 0 ? (
          Object.entries(groupedCalls).map(([date, dateCalls]) => (
            <div key={date}>
              <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {date}
                  </p>
                </div>
              </div>
              
              {dateCalls.map(call => (
                <CallItem
                  key={call._id}
                  call={call}
                  onCallAgain={handleCallAgain}
                  onViewDetails={setSelectedCall}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FiPhone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No calls found</h3>
            <p className="text-center max-w-sm">
              {searchQuery 
                ? `No calls matching "${searchQuery}"`
                : "You haven't made or received any calls yet"}
            </p>
          </div>
        )}
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onCallAgain={handleCallAgain}
          currentUserId={user?._id}
        />
      )}
    </div>
  );
};

export default Calls;