import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JoinGroup = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    const joinGroup = async () => {
      try {
        const response = await api.post(`/chats/join/${code}`);
        if (response.data.success) {
          setGroup(response.data.data.group);
          toast.success('Successfully joined group!');
          setTimeout(() => {
            navigate(`/chats/${response.data.data.group._id}`);
          }, 2000);
        }
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to join group');
        toast.error(error.response?.data?.error || 'Failed to join group');
      } finally {
        setLoading(false);
      }
    };

    joinGroup();
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 to-red-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-8">
        {loading ? (
          <div className="text-center">
            <FiLoader className="w-12 h-12 animate-spin mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Joining Group...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we add you to the group
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiX className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Join
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Successfully Joined!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You are now a member of
            </p>
            <p className="font-bold text-red-900 dark:text-red-400 text-lg mb-6">
              {group?.groupName}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to chat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;