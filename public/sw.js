// VIP Chauffeur Service Worker
// Minimal implementation for PWA compliance and push notifications

const CACHE_NAME = 'vip-chauffeur-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('VIP Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('VIP Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('VIP Service Worker: Cache failed', error);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.log('VIP Service Worker: Fetch failed', error);
        // Return a basic offline page or the cached index
        return caches.match('/');
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('VIP Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('VIP Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('VIP Service Worker: Push event received');
  
  let notificationData = {
    title: 'VIP Chauffeur',
    body: 'VIP ride update',
    icon: '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png',
    badge: '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png',
    tag: 'vip-notification',
    requireInteraction: true
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        data: data
      };
    } catch (e) {
      console.log('VIP Service Worker: Could not parse push data as JSON');
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    vibrate: [100, 50, 100],
    data: {
      ...notificationData.data,
      dateOfArrival: Date.now(),
      url: '/passenger/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('VIP Service Worker: Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/passenger/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/passenger/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('VIP Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});