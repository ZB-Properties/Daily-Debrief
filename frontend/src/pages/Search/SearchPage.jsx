import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import SearchBar from '../../components/search/SearchBar';
import SearchResults from '../../components/search/SearchResults';
import searchService from '../../services/search';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({
    users: [],
    conversations: [],
    messages: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], conversations: [], messages: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await searchService.globalSearch(searchQuery);
      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}`, { replace: true });
      performSearch(newQuery);
    } else {
      navigate('/search', { replace: true });
      setResults({ users: [], conversations: [], messages: [] });
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: results.users.length + results.conversations.length + results.messages.length },
    { id: 'users', label: 'Users', count: results.users.length },
    { id: 'conversations', label: 'Conversations', count: results.conversations.length },
    { id: 'messages', label: 'Messages', count: results.messages.length }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
        </div>

        <SearchBar
          onSearch={handleSearch}
          placeholder="Search messages, people, or conversations..."
          autoFocus
        />
      </div>

      {/* Tabs */}
      {query && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
          </div>
        ) : query ? (
          <>
            {activeTab === 'all' && (
              <div className="space-y-8">
                {results.users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">People</h3>
                    <SearchResults results={results.users} type="users" />
                  </div>
                )}
                {results.conversations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Conversations</h3>
                    <SearchResults results={results.conversations} type="conversations" />
                  </div>
                )}
                {results.messages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Messages</h3>
                    <SearchResults results={results.messages} type="messages" />
                  </div>
                )}
                {results.users.length === 0 && results.conversations.length === 0 && results.messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <SearchResults results={results.users} type="users" />
            )}

            {activeTab === 'conversations' && (
              <SearchResults results={results.conversations} type="conversations" />
            )}

            {activeTab === 'messages' && (
              <SearchResults results={results.messages} type="messages" />
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Search Messages</h3>
            <p className="text-sm">Enter a search term to find messages, people, or conversations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;