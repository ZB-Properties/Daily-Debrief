import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiLock, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/globals.css';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const ChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Password changed successfully!');
        
        // Store new tokens if returned
        if (response.data.data?.tokens) {
          localStorage.setItem('token', response.data.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        }
        
        // Reset form
        reset();
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to change password. Please try again.';
      setError(errorMsg);
      
      if (err.response?.status === 401) {
        setError('Current password is incorrect');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-900 dark:to-red-950 min-h-screen overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl mb-4">
            <FiLock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Change Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={handleBackToSettings}
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </button>
        </div>

        {/* Change Password Card */}
        <div className="bg-foreground dark:bg-blue-950 rounded-2xl shadow-xl p-8">
          {isSuccess ? (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full">
                <FiCheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Password Changed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your password has been successfully updated.
                </p>
              </div>
              
              <div className="text-left bg-blue-50 dark:bg-red-400 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  🔒 What's next?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Use your new password next time you login</li>
                  <li>• Make sure to remember your new password</li>
                  <li>• You'll be redirected to settings in 3 seconds</li>
                </ul>
              </div>
              
              <Button
                onClick={() => navigate('/settings')}
                fullWidth
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Settings
              </Button>
            </div>
          ) : (
            /* Form State */
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                Update Your Password
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Current Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                      {...register('currentPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.currentPassword?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Create a new password"
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                      {...register('newPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.newPassword.message}
                    </p>
                  )}
                  
                  {/* Password requirements */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Password must contain:</p>
                    <ul className="text-xs space-y-1">
                      <li className={`flex items-center ${newPassword?.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="mr-2">•</span>
                        At least 6 characters
                      </li>
                      <li className={`flex items-center ${/[A-Z]/.test(newPassword || '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="mr-2">•</span>
                        One uppercase letter
                      </li>
                      <li className={`flex items-center ${/[0-9]/.test(newPassword || '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="mr-2">•</span>
                        One number
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                      {...register('confirmPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
                    <FiAlertCircle className="flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  fullWidth
                  size="large"
                  className="bg-gray-500 text-background"
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>

                {/* Additional Info */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Want to go back?{' '}
                    <button
                      type="button"
                      onClick={handleBackToSettings}
                      className="font-semibold text-blue-900 dark:text-blue-400 hover:underline"
                    >
                      Return to Settings
                    </button>
                  </p>
                </div>
              </form>

              {/* Tips Section */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  🔐 Password Tips
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Use a mix of letters, numbers, and symbols</li>
                  <li>• Avoid using common words or phrases</li>
                  <li>• Don't reuse passwords from other sites</li>
                  <li>• Consider using a password manager</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By changing your password, you agree to our{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;