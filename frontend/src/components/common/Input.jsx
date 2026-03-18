import React, { forwardRef } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  success,
  disabled = false,
  required = false,
  icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-4 py-3 bg-gray-50 dark:bg-gray-300 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200';
  
  const stateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400'
    : success
    ? 'border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400'
    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-red-400';
    
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900'
    : '';

  const inputClasses = `
    ${baseClasses}
    ${stateClasses}
    ${disabledClasses}
    ${icon ? 'pl-10' : ''}
    ${className}
  `.trim();

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-900">{icon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;