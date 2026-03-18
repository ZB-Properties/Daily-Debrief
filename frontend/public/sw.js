const CACHE_NAME = 'chat-app-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  // Claim any clients immediately
  event.waitUntil(
    clients.claim().then(() => {
      console.log('Service Worker now active and claiming clients');
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'New Notification',
        body: event.data.text(),
        data: { url: '/' }
      };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: data.actions || [],
    requireInteraction: true,
    silent: false,
    tag: 'notification-' + Date.now() // Prevent duplicate notifications
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Daily Debrief', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const action = event.action;

  // Handle different actions
  if (action === 'answer') {
    event.waitUntil(
      clients.openWindow(`/call/${event.notification.data.callerId}?type=${event.notification.data.callType}`)
    );
    return;
  } else if (action === 'decline') {
    // Just close the notification
    return;
  } else if (action === 'reply') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
    return;
  }

  // Default action - open the URL
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});