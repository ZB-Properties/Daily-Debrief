import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLock, FiArrowLeft, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';


const TwoFactorLogin = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.length < (isBackupCode ? 12 : 6)) {
      setError(`Please enter a valid ${isBackupCode ? 'backup code' : '6-digit code'}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/2fa/verify-login', {
        userId,
        code
      });

      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data.tokens;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        toast.success('Login successful');
        navigate('/chats');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-900 dark:to-red-950 min-h-screen flex items-center justify-center p-4">
        <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please login first to access 2FA verification.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-red-500 to-blue-800 text-white font-semibold rounded-lg hover:from-red-600 hover:to-blue-900 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* 2FA Card */}
        <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl mb-4">
              <FiLock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isBackupCode 
                ? 'Enter one of your backup codes' 
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {isBackupCode ? 'Backup Code' : 'Verification Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                placeholder={isBackupCode ? 'XXXX-XXXX-XXXX' : '000000'}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                maxLength={isBackupCode ? 12 : 6}
                autoFocus
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
                <FiAlertCircle className="flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Toggle backup code */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCode(!isBackupCode);
                  setCode('');
                  setError('');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || code.length < (isBackupCode ? 12 : 6)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-blue-800 text-white font-semibold rounded-lg hover:from-red-600 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>

            {/* Help text */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Lost access to your authenticator app?</p>
              <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact support
              </Link>
            </div>
          </form>

          {/* Security note */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start">
              <FiCheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              Two-factor authentication adds an extra layer of security to your account. 
              Never share your verification codes with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorLogin;