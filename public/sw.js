// Service Worker for Push Notifications
const CACHE_NAME = 'vip-drive-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Failed to parse push data:', e);
    return;
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/',
      bookingId: data.bookingId,
      type: data.type
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: false,
    vibrate: [200, 100, 200]
  };

  // Add custom icon based on notification type
  if (data.type === 'message') {
    options.icon = '/favicon.ico';
  } else if (data.type === 'ride_status') {
    options.icon = '/favicon.ico';
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle deep linking
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate to the URL
            return client.focus().then(() => {
              return client.navigate ? client.navigate(urlToOpen) : client.postMessage({
                type: 'NAVIGATE',
                url: urlToOpen
              });
            });
          }
        }
        
        // Open new window if app is not open
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// Handle background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Handle any pending notifications when back online
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_NOTIFICATIONS' });
        });
      })
    );
  }
});