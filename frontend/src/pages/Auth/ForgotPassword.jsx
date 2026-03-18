import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/globals.css';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const email = watch('email');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setResetEmail(data.email);
    
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success('Password reset link sent to your email!');
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(response.data.error || 'Failed to send reset link');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to send reset link. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/forgot-password', { email: resetEmail });
      
      if (response.data.success) {
        toast.success('Reset link resent successfully!');
      } else {
        setError(response.data.error || 'Failed to resend link');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-900 dark:to-red-950 min-h-screen overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isSubmitted 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to receive a reset link'
            }
          </p>
        </div>

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

        {/* Forgot Password Card */}
        <div className="bg-foreground dark:bg-blue-950 rounded-2xl shadow-xl p-8">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full">
                <FiCheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Check Your Email
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We've sent password reset instructions to:
                </p>
                <p className="font-medium text-gray-900 dark:text-white mt-1">
                  {resetEmail}
                </p>
              </div>
              
              <div className="text-left bg-blue-50 dark:bg-red-400 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  📨 What's next?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Login with your new password</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={handleResend}
                  variant="outline"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Resend Reset Link
                </Button>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Redirecting to login in 5 seconds...</p>
                  <p className="mt-2">
                    <Link
                      to="/login"
                      className="text-red-950 dark:text-blue-400 hover:underline font-medium"
                    >
                      Click here
                    </Link>{' '}
                    to go now
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                Forgot Your Password?
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                Don't worry! Just enter your email address below and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Input */}
                <Input
                  label="Email Address"
                  type="email"
                  icon={<FiMail className="text-gray-700" />}
                  placeholder="Enter your email address"
                  error={errors.email?.message}
                  {...register('email')}
                  disabled={isLoading}
                  autoFocus
                />

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
                  {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </Button>

                {/* Additional Info */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-900 dark:text-blue-400 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </p>
                </div>
              </form>

              {/* Tips Section */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  💡 Need help?
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Contact support if you need further assistance</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By requesting a password reset, you agree to our{' '}
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

export default ForgotPassword;