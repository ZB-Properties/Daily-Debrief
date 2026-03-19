import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/globals.css';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

const Login = () => {
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    watch
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const email = watch('email');

  useEffect(() => {
    reset();
  }, []);

useEffect(() => {
  console.log('🔧 Environment check:');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
  console.log('MODE:', import.meta.env.MODE);
}, []);

 const onSubmit = async (data) => {
  try {
    console.log('🔐 Login attempt for:', data.email);
    
    // IMPORTANT: This must be a POST request to the correct endpoint
    const response = await api.post('/auth/login', {
      email: data.email,
      password: data.password
    });

    console.log('✅ Login response:', response.data);

    if (response.data.requires2FA) {
      navigate('/2fa-login', { state: { userId: response.data.userId } });
      return;
    }
    
    if (response.data.requiresVerification) {
      setVerificationRequired(true);
      setVerificationEmail(data.email);
      return;
    }

    // Handle successful login
    if (response.data.success) {
      const { user, tokens } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Update auth context if you have one
      // await login(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/chats');
    }

  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.error || 'Login failed. Please try again.';
    toast.error(errorMsg);
    
    if (error.response?.status === 401) {
      setError('root', {
        type: 'manual',
        message: 'Invalid email or password'
      });
    } else {
      setError('root', {
        type: 'manual',
        message: errorMsg
      });
    }
  }
};

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/send-verification', { email: verificationEmail });
      setResendSuccess(true);
      toast.success('Verification email sent!');
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 min-h-screen">
        <div className="max-w-md mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-blue-800 rounded-2xl mb-4">
              <FiMail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Your Email</h1>
          </div>

          {/* Verification Card */}
          <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <FiAlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Email Not Verified
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please verify your email address before logging in.
                </p>
                <p className="font-medium text-gray-900 dark:text-white mt-2">
                  {verificationEmail}
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  📨 What's next?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the verification link in the email</li>
                  <li>• Return here and login again</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-blue-800 hover:from-red-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {resendLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : resendSuccess ? (
                    <>
                      <FiCheckCircle className="w-5 h-5" />
                      <span>Email Sent!</span>
                    </>
                  ) : (
                    <span>Resend Verification Email</span>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setVerificationRequired(false);
                    reset();
                  }}
                  className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-blue-800 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily-Debrief</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time Chat Application</p>
        </div>

        {/* Login Card */}
        <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-950 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-red-400 outline-none transition text-gray-900 dark:text-black"
                  {...register('email')}
                />
              </div>
              {errors.email?.message && (
                <p className="text-sm text-red-600 dark:text-red-800 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-950">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-700 dark:text-red-950 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-red-400 outline-none transition text-gray-900 dark:text-black"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me & Terms */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-600">
                  Remember me
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-600">
                  Agree to terms
                </label>
              </div>
            </div>

            {/* Error message */}
            {(errors.root?.message || authError) && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
                <FiAlertCircle className="flex-shrink-0" />
                <span className="text-sm">{errors.root?.message || authError}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !agreed}
              className="w-full bg-gradient-to-r from-red-500 to-blue-800 hover:from-red-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Logging in...' : 'Login now'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-red-800 text-gray-500 dark:text-gray-100">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-900">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-900">Facebook</span>
              </button>
            </div>

            {/* Sign up link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-800">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-red-600 dark:text-red-900 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By logging in, you agree to our{' '}
            <a href="#" className="text-red-600 dark:text-red-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-red-600 dark:text-red-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;