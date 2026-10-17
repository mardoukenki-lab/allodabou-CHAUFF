// Firebase Cloud Messaging Service Worker for Allô Dabou Chauffeur
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
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

  // Listen to background push notifications
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background push message: ', payload);

    const data = payload.data || {};
    const notification = payload.notification || {};

    const title = notification.title || data.title || '🚖 Nouvelle course Allô Dabou !';
    const pickup = data.pickupAddress || '';
    const destination = data.destinationAddress || '';
    const price = data.priceFcfa ? `${Number(data.priceFcfa).toLocaleString('fr-FR')} FCFA` : '';

    let body = notification.body || data.body;
    if (!body && pickup) {
      body = `${pickup} ➔ ${destination} (${price})`;
    } else if (!body) {
      body = 'Une nouvelle demande de course est disponible à Dabou ! Ouvrez vite l\'application.';
    }

    const notificationOptions = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'allo-dabou-ride-' + (data.rideId || Date.now()),
      renotify: true,
      requireInteraction: true,
      vibrate: [350, 150, 350, 150, 600],
      data: {
        url: '/',
        rideId: data.rideId || null,
        timestamp: Date.now()
      },
      actions: [
        { action: 'open_app', title: 'Ouvrir la course' }
      ]
    };

    self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Init notice:', e);
}

// When driver clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
