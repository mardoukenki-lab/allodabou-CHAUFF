import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export async function requestPushNotificationPermission(userId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications not supported in this browser.');
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser environment.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied or dismissed.');
      return null;
    }

    const messaging = getMessaging();
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    });

    if (currentToken && userId) {
      // Save token to users/{uid}.fcmTokens
      const userRef = doc(db, 'users', userId);
      try {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken),
          fcmToken: currentToken
        });
        console.log('FCM token stored successfully for driver:', userId);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
      return currentToken;
    }
  } catch (error) {
    console.warn('Could not register FCM token:', error);
  }

  return null;
}

export function setupForegroundMessageListener(onNotification: (title: string, body: string) => void) {
  isSupported().then((supported) => {
    if (!supported) return;
    try {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'Allô Dabou Chauffeur';
        const body = payload.notification?.body || 'Nouvelle notification de course';
        onNotification(title, body);
      });
    } catch (e) {
      console.warn('Foreground messaging listener error:', e);
    }
  });
}
