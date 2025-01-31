const CACHE_NAME = 'paint-app-cache-v2';

const urlsToCache = [
  '/index.html',
  '/assets/script.js',
  '/manifest.json',
  '/assets/styles.css',
  '/icons'
];

// Install SW and cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate SW and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) { 
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});

// Cache First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If the resource is found in cache, return it
      if (cachedResponse) {
        console.log('Cache hit:', event.request.url);
        return cachedResponse;
      }
      
      // If not in cache, fetch from network and add to cache
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone())
               .catch(error => console.error("Cache put error:", error));
          console.log('Added to cache:', event.request.url);
          return networkResponse;
        });
      }).catch(() => {
        console.log('Network request failed for:', event.request.url);
      });
    })
  );
});

// Background sync for saving images
self.addEventListener('sync', (event) => {
  if (event.tag === 'save-image') {
    console.log('Syncing image save...');
    event.waitUntil(
      saveImageData().then(() => {
        console.log('Image save synced successfully');
        sendPushNotification();
      })
    );
  }
});

// Simulate saving image data
function saveImageData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 3000); // "network delay"
  });
}

// Push notification
function sendPushNotification() {
  self.registration.showNotification('Image Saved', {
    body: 'Your image has been successfully saved!',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  });
}

// Opens the app's main page when the notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
