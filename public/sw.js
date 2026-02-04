// Service Worker for Web Push Notifications
const CACHE_NAME = 'hyperpoker-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 🔔 Push event received!', {
    hasData: !!event.data,
    dataType: event.data ? (event.data.type || 'unknown') : 'no data',
    timestamp: new Date().toISOString()
  });
  
  let notificationData = {
    title: 'HyperPoker',
    body: '您有新的通知',
    icon: '/icon-192x192.png', // You may need to add this icon
    badge: '/icon-192x192.png',
    tag: 'hyperpoker-notification',
    requireInteraction: false,
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] 📦 Parsed push data:', data);
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        data: data.data || {}
      };
    } catch (e) {
      console.warn('[Service Worker] ⚠️ Failed to parse JSON, trying text:', e);
      // If not JSON, try text
      try {
        const text = event.data.text();
        if (text) {
          notificationData.body = text;
          console.log('[Service Worker] 📝 Using text data:', text);
        }
      } catch (textError) {
        console.error('[Service Worker] ❌ Failed to parse push data:', textError);
      }
    }
  } else {
    console.warn('[Service Worker] ⚠️ Push event has no data');
  }

  console.log('[Service Worker] 📤 Showing notification:', notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }).then(() => {
      console.log('[Service Worker] ✅ Notification shown successfully');
    }).catch((error) => {
      console.error('[Service Worker] ❌ Failed to show notification:', error);
    })
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

