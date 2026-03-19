import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      console.log('🔐 Verifying email with token:', token);
      
      // This endpoint should be public, no auth header needed
      const response = await api.get(`/auth/verify-email/${token}`);
      
      console.log('✅ Verification response:', response.data);
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        toast.success('Email verified successfully');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      
      // Handle 401/403 errors specifically
      if (error.response?.status === 401 || error.response?.status === 403) {
        setStatus('error');
        setMessage('Authentication error. Please login and try again.');
      } else {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Invalid or expired verification link');
      }
    }
  };

  const handleResendVerification = async () => {
    // Get email from localStorage or prompt user
    const email = prompt('Please enter your email address to resend verification:');
    if (!email) return;
    
    try {
      await api.post('/auth/send-verification', { email });
      toast.success('Verification email resent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend verification email');
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-900 dark:to-red-950 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl mb-4">
              <FiMail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Verification
            </h1>
          </div>

          {status === 'verifying' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <FiLoader className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Verifying your email...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we verify your email address
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Success!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Redirecting to login in 3 seconds...
                </p>
              </div>

              <Link
                to="/login"
                className="inline-block w-full px-6 py-3 bg-gradient-to-r from-red-500 to-blue-800 text-white font-semibold rounded-lg hover:from-red-600 hover:to-blue-900 transition-all"
              >
                Go to Login Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <FiXCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {message}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Resend Verification Email
                </button>
                
                <Link
                  to="/login"
                  className="block w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Back to Login
                </Link>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need help?{' '}
                  <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;