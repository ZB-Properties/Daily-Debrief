import api from './api';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Get VAPID public key from server
export const getVapidKey = async () => {
  try {
    const response = await api.get('/push/vapid-key');
    return response.data.data.publicKey;
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return null;
  }
};

// Register service worker with better error handling and waiting for activation
export const registerServiceWorker = async () => {
  try {
    // First, unregister any existing service workers to avoid conflicts
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('Unregistered existing service worker');
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/' // Ensure proper scope
    });
    
    console.log('Service Worker registered successfully:', registration);

    // Wait for the service worker to be ready and active
    await navigator.serviceWorker.ready;
    
    // If the service worker is installing or waiting, wait for it to activate
    if (registration.installing || registration.waiting) {
      console.log('Service Worker is installing/waiting, waiting for activation...');
      
      // Wait for the new service worker to activate
      await new Promise((resolve) => {
        const checkState = () => {
          if (registration.active) {
            resolve();
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });
    }
    
    console.log('Service Worker is now active');
    return registration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    return null;
  }
};

// Get current subscription with better error handling
export const getSubscription = async () => {
  try {
    // First ensure service worker is ready
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
};

// Check if service worker is active
const isServiceWorkerActive = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch {
    return false;
  }
};

// Wait for service worker to be active
const waitForServiceWorker = async (registration, timeout = 10000) => {
  const startTime = Date.now();
  
  while (!registration.active) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for service worker to activate');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return registration;
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
  try {
    // Check if supported
    if (!isPushSupported()) {
      throw new Error('Push notifications not supported');
    }

    // Get VAPID key
    const publicKey = await getVapidKey();
    if (!publicKey) {
      throw new Error('Could not get VAPID key');
    }

    // Register service worker and wait for it to be active
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Could not register service worker');
    }

    // Wait for service worker to be fully active
    await waitForServiceWorker(registration);
    console.log('Service Worker is active, proceeding with subscription');

    // Convert VAPID key to Uint8Array
    const convertedKey = urlBase64ToUint8Array(publicKey);

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Found existing subscription, unsubscribing first...');
      await subscription.unsubscribe();
    }

    // Subscribe with new key
    console.log('Subscribing to push notifications...');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
    
    console.log('Push subscription successful:', subscription);

    // Send subscription to server
    const response = await api.post('/push/subscribe', {
      subscription: subscription.toJSON()
    });

    return response.data;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  try {
    // Ensure service worker is ready
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push');
    }

    const response = await api.post('/push/unsubscribe');
    return response.data;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
};

// Helper function to convert base64 to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const pushService = {
  isSupported: isPushSupported,
  subscribe: subscribeToPush,
  unsubscribe: unsubscribeFromPush,
  getSubscription
};

export default pushService;