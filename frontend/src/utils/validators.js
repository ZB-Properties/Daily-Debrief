import * as z from 'zod';

// Common validation schemas
export const authSchemas = {
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional()
  }),

  register: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address')
  }),

  resetPassword: z.object({
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

export const userSchemas = {
  updateProfile: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    bio: z.string()
      .max(200, 'Bio cannot exceed 200 characters')
      .optional(),
    status: z.enum(['online', 'offline', 'away', 'busy']).optional()
  }),

  updatePassword: z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string()
      .min(6, 'New password must be at least 6 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

export const chatSchemas = {
  message: z.object({
    content: z.string()
      .max(5000, 'Message cannot exceed 5000 characters')
      .optional(),
    type: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text'),
    file: z.any().optional(),
    replyTo: z.string().optional()
  }),

  search: z.object({
    query: z.string().min(2, 'Search query must be at least 2 characters')
  })
};

// Custom validators
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return {
    isValid: minLength && hasUpperCase && hasNumber,
    errors: {
      minLength: !minLength ? 'At least 6 characters' : null,
      hasUpperCase: !hasUpperCase ? 'At least one uppercase letter' : null,
      hasNumber: !hasNumber ? 'At least one number' : null
    }
  };
};

export const validateFile = (file, maxSize = 10 * 1024 * 1024, allowedTypes = []) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)} limit`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push('File type not supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function for file size formatting
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Form validation helper
export const validateForm = (schema, data) => {
  try {
    schema.parse(data);
    return { isValid: true, errors: null };
  } catch (error) {
    const errors = {};
    error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return { isValid: false, errors };
  }
};

// Async validator for checking unique email
export const checkUniqueEmail = async (email) => {
  // This would typically make an API call
  // For now, simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate checking if email exists
      const existingEmails = ['test@example.com', 'existing@email.com'];
      const isUnique = !existingEmails.includes(email);
      resolve(isUnique);
    }, 500);
  });
};

// Phone number validator
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleaned);
};

// URL validator
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date validator
export const validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Number range validator
export const validateNumberRange = (num, min, max) => {
  const number = parseFloat(num);
  return !isNaN(number) && number >= min && number <= max;
};

// Required field validator
export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Array validator
export const validateArray = (array, minLength = 0, maxLength = null) => {
  if (!Array.isArray(array)) return false;
  if (array.length < minLength) return false;
  if (maxLength !== null && array.length > maxLength) return false;
  return true;
};

// Object validator
export const validateObject = (obj, requiredKeys = []) => {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of requiredKeys) {
    if (!(key in obj)) return false;
  }
  return true;
};

// Custom error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: 'Password must be at least 6 characters with uppercase and number',
  CONFIRM_PASSWORD: 'Passwords do not match',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Cannot exceed ${max} characters`,
  INVALID_TYPE: 'Invalid type',
  INVALID_FORMAT: 'Invalid format'
};

export default {
  authSchemas,
  userSchemas,
  chatSchemas,
  validateEmail,
  validatePassword,
  validateFile,
  validateForm,
  checkUniqueEmail,
  validatePhoneNumber,
  validateUrl,
  validateDate,
  validateNumberRange,
  validateRequired,
  validateArray,
  validateObject,
  ERROR_MESSAGES
};