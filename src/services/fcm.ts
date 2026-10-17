import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { playNewRideAlert } from './audio';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface FCMConfigState {
  isSupported: boolean;
  permission: NotificationPermissionState;
  hasServiceWorker: boolean;
  swRegistrationScope?: string;
  hasVapidKey: boolean;
  token: string | null;
  error?: string;
}

export interface ChauffeurNotifSettings {
  soundVolume: 'high' | 'medium' | 'low';
  vibratePattern: 'standard' | 'heavy' | 'continuous';
  repeatAlarm: boolean;
}

const NOTIF_SETTINGS_STORAGE_KEY = 'allo_dabou_chauffeur_notif_settings';

export function getChauffeurNotifSettings(): ChauffeurNotifSettings {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read notif settings:', e);
  }
  return {
    soundVolume: 'high',
    vibratePattern: 'heavy',
    repeatAlarm: true,
  };
}

export function saveChauffeurNotifSettings(settings: ChauffeurNotifSettings): void {
  try {
    localStorage.setItem(NOTIF_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save notif settings:', e);
  }
}

export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Register Service Worker explicitly and obtain/refresh FCM token
 */
export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('[FCM] Service worker registered successfully:', registration.scope);
    }
    // Wait for the service worker to become ready/active
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn('[FCM] Error registering service worker:', error);
    return null;
  }
}

/**
 * Diagnostics function to retrieve complete status of FCM push configuration
 */
export async function getFCMDiagnostics(userId?: string): Promise<FCMConfigState> {
  const perm = getNotificationPermissionStatus();
  let supported = false;
  try {
    supported = await isSupported();
  } catch {
    supported = false;
  }

  let hasSw = false;
  let swScope: string | undefined;
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (reg) {
        hasSw = true;
        swScope = reg.scope;
      }
    } catch {
      hasSw = false;
    }
  }

  const storedToken = userId ? localStorage.getItem(`allo_dabou_fcm_token_${userId}`) : null;

  return {
    isSupported: supported,
    permission: perm,
    hasServiceWorker: hasSw,
    swRegistrationScope: swScope,
    hasVapidKey: Boolean(vapidKey),
    token: storedToken,
  };
}

/**
 * Request notification permissions and register token in Firestore users/{uid}.fcmTokens
 */
export async function requestPushNotificationPermission(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Les notifications ne sont pas supportées sur ce navigateur.' };
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      return { success: false, error: 'Firebase Cloud Messaging n\'est pas pris en charge dans ce contexte.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission refusée dans les paramètres de votre navigateur.' };
    }

    // Ensure service worker is registered
    const swRegistration = await registerFCMServiceWorker();
    const messaging = getMessaging();

    let currentToken: string | null = null;
    try {
      currentToken = await getToken(messaging, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: swRegistration || undefined
      });
    } catch (tokenErr: any) {
      console.warn('[FCM] Token generation notice (VAPID key):', tokenErr);
      return { 
        success: true, 
        error: 'Notifications autorisées dans le navigateur ! Pour recevoir les push distants hors écran, configurez VITE_FIREBASE_VAPID_KEY.' 
      };
    }

    if (currentToken && userId) {
      localStorage.setItem(`allo_dabou_fcm_token_${userId}`, currentToken);
      const userRef = doc(db, 'users', userId);
      try {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken),
          fcmToken: currentToken
        });
        console.log('[FCM] Token registered in Firestore for driver:', userId);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
      return { success: true, token: currentToken };
    }

    return { success: true };
  } catch (error: any) {
    console.warn('[FCM] Error in requestPushNotificationPermission:', error);
    return { success: false, error: error.message || 'Impossible d\'activer les notifications.' };
  }
}

/**
 * Setup foreground listener for incoming FCM messages
 */
export function setupForegroundMessageListener(onNotification: (title: string, body: string, data?: any) => void) {
  if (typeof window === 'undefined') return;

  isSupported().then((supported) => {
    if (!supported) return;
    try {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        console.log('[FCM Foreground] Received message:', payload);
        const title = payload.notification?.title || payload.data?.title || '🚖 Nouvelle course Allô Dabou';
        const body = payload.notification?.body || payload.data?.body || 'Une nouvelle demande de course est disponible à Dabou !';
        
        // Play loud alert tone + vibration
        playNewRideAlert();

        onNotification(title, body, payload.data);
      });
    } catch (e) {
      console.warn('[FCM] Foreground listener init error:', e);
    }
  });
}

/**
 * Trigger an immediate test notification to verify audio, vibration, and display
 */
export async function triggerTestPushNotification(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // Play sound & vibration immediately
  playNewRideAlert();

  if (Notification.permission === 'granted') {
    try {
      const sw = await navigator.serviceWorker?.getRegistration('/firebase-messaging-sw.js');
      if (sw) {
        await sw.showNotification('🚖 Test Allô Dabou Chauffeur', {
          body: 'Votre configuration de notifications push fonctionne parfaitement à Dabou !',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'test-fcm-notification',
          vibrate: [350, 150, 350, 150, 600],
          data: { url: '/' }
        } as any);
        return true;
      } else {
        new Notification('🚖 Test Allô Dabou Chauffeur', {
          body: 'Votre configuration de notifications push fonctionne parfaitement à Dabou !',
          icon: '/pwa-192x192.png'
        });
        return true;
      }
    } catch (e) {
      console.warn('[FCM] Test notification fallback:', e);
      try {
        new Notification('🚖 Test Allô Dabou Chauffeur', {
          body: 'Votre configuration de notifications push fonctionne parfaitement !',
          icon: '/pwa-192x192.png'
        });
        return true;
      } catch {
        return false;
      }
    }
  } else {
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      return triggerTestPushNotification();
    }
    return false;
  }
}

/**
 * Trigger local notification when a new pending ride is received
 */
export async function showNewRideNotification(
  pickupAddress: string, 
  destinationAddress: string, 
  priceFcfa: number,
  rideId?: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = `🚖 Nouvelle course : ${priceFcfa?.toLocaleString('fr-FR')} FCFA`;
  const body = `Départ : ${pickupAddress} ➔ ${destinationAddress}`;

  try {
    const sw = await navigator.serviceWorker?.getRegistration('/firebase-messaging-sw.js');
    if (sw) {
      await sw.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'new-ride-' + (rideId || Date.now()),
        vibrate: [350, 150, 350, 150, 600],
        requireInteraction: true,
        data: { url: '/', rideId }
      } as any);
    } else {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png'
      });
    }
  } catch (e) {
    console.warn('[FCM] Could not show local ride notification:', e);
  }
}
