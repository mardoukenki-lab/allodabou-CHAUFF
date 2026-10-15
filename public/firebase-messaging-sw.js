// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Note: Config will fallback safely if not loaded directly
const firebaseConfig = {
  apiKey: "AIzaSyC-CeSNZF7iJQduraqnUrYBoj9DsvyvS0A",
  authDomain: "project-89032b5a-6178-4b41-90b.firebaseapp.com",
  projectId: "project-89032b5a-6178-4b41-90b",
  storageBucket: "project-89032b5a-6178-4b41-90b.firebasestorage.app",
  messagingSenderId: "894893240654",
  appId: "1:894893240654:web:baabc7e1954ee052c36e1f"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    const notificationTitle = payload.notification?.title || 'Nouvelle course Allô Dabou';
    const notificationOptions = {
      body: payload.notification?.body || 'Une nouvelle demande de course est disponible à Dabou !',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'allo-dabou-ride',
      vibrate: [200, 100, 200, 100, 400],
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Init notice:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
