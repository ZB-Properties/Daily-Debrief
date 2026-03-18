import React, { useState, useEffect } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import pushService from '../../services/push';
import toast from 'react-hot-toast';

const PushNotificationToggle = ({ className = '' }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, []);

  const checkSupport = () => {
    setIsSupported(pushService.isSupported());
  };

  const checkSubscription = async () => {
    try {
      const subscription = await pushService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    setLoading(true);
    try {
      if (isSubscribed) {
        await pushService.unsubscribe();
        setIsSubscribed(false);
        toast.success('Push notifications disabled');
      } else {
        await pushService.subscribe();
        setIsSubscribed(true);
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to toggle push notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isSubscribed
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      } ${className}`}
    >
      {isSubscribed ? (
        <>
          <FiBell className="w-4 h-4" />
          <span>Push Notifications On</span>
        </>
      ) : (
        <>
          <FiBellOff className="w-4 h-4" />
          <span>Push Notifications Off</span>
        </>
      )}
    </button>
  );
};

export default PushNotificationToggle;