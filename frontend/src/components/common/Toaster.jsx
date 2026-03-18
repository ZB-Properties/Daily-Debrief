import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const Toast = () => {
  const { isDark } = useTheme();

  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#1f2937',
          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            background: isDark ? '#064e3b' : '#d1fae5',
            color: isDark ? '#d1fae5' : '#065f46',
            border: isDark ? '1px solid #065f46' : '1px solid #a7f3d0',
          }
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            background: isDark ? '#7f1d1d' : '#fee2e2',
            color: isDark ? '#fee2e2' : '#b91c1c',
            border: isDark ? '1px solid #b91c1c' : '1px solid #fecaca',
          }
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff',
          },
          style: {
            background: isDark ? '#1e3a8a' : '#dbeafe',
            color: isDark ? '#dbeafe' : '#1e40af',
            border: isDark ? '1px solid #1e40af' : '1px solid #bfdbfe',
          }
        }
      }}
    />
  );
};

export default Toast;