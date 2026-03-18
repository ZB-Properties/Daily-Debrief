import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/globals.css';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const Register = () => {
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { register: registerUser, error: authError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    if (!agreed) {
      setError('root', {
        type: 'manual',
        message: 'Please agree to the terms of use & privacy policy'
      });
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      if (response.data.success) {
        setRegisteredEmail(data.email);
        setRegistrationSuccess(true);
        toast.success('Registration successful! Please check your email to verify your account.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError('root', {
        type: 'manual',
        message: errorMsg
      });
    }
  };

  if (registrationSuccess) {
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

          {/* Success Card */}
          <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full">
                <FiMail className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Check Your Inbox
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-900 dark:text-white mt-2">
                  {registeredEmail}
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  📨 Next Steps:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>1. Open the email we just sent you</li>
                  <li>2. Click the verification link in the email</li>
                  <li>3. Return here and login to start chatting</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-blue-800 hover:from-red-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-800 dark:to-red-950 min-h-screen overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-blue-800 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join Daily-Debrief</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Create your account to start chatting</p>
        </div>

        {/* Register Card */}
        <div className="bg-foreground dark:bg-red-400 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                  {...register('name')}
                />
              </div>
              {errors.name?.message && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                  {...register('email')}
                />
              </div>
              {errors.email?.message && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
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
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
              
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Password must contain:</p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center ${watch('password')?.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="mr-2">•</span>
                    At least 6 characters
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(watch('password') || '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="mr-2">•</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${/[0-9]/.test(watch('password') || '') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="mr-2">•</span>
                    One number
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-700 dark:focus:ring-red-800 outline-none transition text-gray-900 dark:text-slate-900"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms agreement */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-100">
                I agree to the{' '}
                <a href="#" className="text-red-600 dark:text-red-900 hover:underline">
                  Terms of Use
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-600 dark:text-red-900 hover:underline">
                  Privacy Policy
                </a>
              </label>
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
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Already have account */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-200">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-red-400 dark:text-red-800 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;