import { getToken, deleteToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { apiClient } from '@/services/apiClient';
import { getMessagingInstance, firebaseConfig } from '@/lib/firebase';

const FCM_TOKEN_STORAGE_KEY = 'ptit_fcm_token';
const BANNER_DISMISSED_KEY = 'ptit_push_banner_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the current browser environment supports Web Push and Service Workers.
 */
export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current system notification permission state.
 */
export function getPushPermissionState(): PushPermissionStatus {
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

/**
 * Check if the user has already subscribed to Web Push on this device.
 */
export function isPushSubscribed(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(FCM_TOKEN_STORAGE_KEY));
}

/**
 * Check if the invitation banner is temporarily dismissed by user ("Để sau").
 */
export function isPushBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const until = Number(localStorage.getItem(BANNER_DISMISSED_KEY) || 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

/**
 * Temporarily dismiss invitation banner for a specified duration (default: 7 days).
 */
export function dismissPushBanner(durationMs: number = SEVEN_DAYS_MS): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now() + durationMs));
    window.dispatchEvent(new CustomEvent('ptit_push_status_changed'));
  } catch {
    // ignore
  }
}

/**
 * Register Service Worker with dynamic Firebase configuration query parameters.
 */
export async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;

  try {
    const params = new URLSearchParams();
    if (firebaseConfig.apiKey) params.set('apiKey', firebaseConfig.apiKey);
    if (firebaseConfig.projectId) params.set('projectId', firebaseConfig.projectId);
    if (firebaseConfig.messagingSenderId) params.set('messagingSenderId', firebaseConfig.messagingSenderId);
    if (firebaseConfig.appId) params.set('appId', firebaseConfig.appId);

    const swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('Failed to register Firebase messaging service worker:', err);
    return null;
  }
}

/**
 * Request notification permission upon user interaction and subscribe device to FCM.
 * Strictly requires user action — NEVER call automatically on page load.
 */
export async function requestPushPermissionAndSubscribe(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (!isWebPushSupported()) {
    return { success: false, error: 'Trình duyệt không hỗ trợ thông báo đẩy.' };
  }

  try {
    // 1. Prompt native browser permission dialog upon explicit user click
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Quyền thông báo chưa được cấp.' };
    }

    // 2. Initialize Firebase Messaging and Service Worker
    const messaging = await getMessagingInstance();
    if (!messaging) {
      return { success: false, error: 'Không thể khởi tạo Firebase Messaging.' };
    }

    const swRegistration = await registerFirebaseServiceWorker();
    if (!swRegistration) {
      return { success: false, error: 'Không thể đăng ký service worker.' };
    }

    // 3. Obtain FCM device registration token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY;
    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return { success: false, error: 'Không thể lấy token đăng ký thiết bị.' };
    }

    // 4. Register token with backend (authenticated with current user session)
    const subscribeRes = await apiClient.post('/api/v1/notifications/push/subscribe', {
      fcm_token: token,
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 250) : null,
    });

    if (subscribeRes.status !== 200 && subscribeRes.status !== 201) {
      throw new Error(`Đăng ký thông báo thất bại (HTTP ${subscribeRes.status}).`);
    }

    // 5. Persist token locally & notify listeners ONLY after confirmed backend subscription
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    window.dispatchEvent(new CustomEvent('ptit_push_status_changed', { detail: { token, subscribed: true } }));

    return { success: true, token };
  } catch (err: unknown) {
    console.error('Error subscribing to Web Push:', err);
    const errorObj = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
    const detail = errorObj?.response?.data?.detail;
    return {
      success: false,
      error: detail || errorObj?.message || 'Đăng ký thông báo thất bại.',
    };
  }
}

/**
 * Unsubscribe device from FCM and notify backend.
 */
export async function unsubscribePushNotification(): Promise<boolean> {
  const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  try {
    if (token) {
      // Unsubscribe on backend - must call authoritative /api/v1 endpoint
      await apiClient.post('/api/v1/notifications/push/unsubscribe', { fcm_token: token });
    }

    const messaging = await getMessagingInstance();
    if (messaging) {
      await deleteToken(messaging).catch((err) => {
        console.warn('Firebase deleteToken warning:', err);
      });
    }

    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('ptit_push_status_changed', { detail: { subscribed: false } }));
    return true;
  } catch (err: unknown) {
    console.warn('Error unsubscribing push notification:', err);
    const errorObj = err as { response?: { status?: number } };
    const status = errorObj?.response?.status;
    // Nếu token đã không còn trên backend (404) hoặc hết phiên (401), vẫn dọn sạch local state
    if (status === 404 || status === 401) {
      localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('ptit_push_status_changed', { detail: { subscribed: false } }));
      return true;
    }
    // Đối với các lỗi mạng hoặc server 5xx khác, giữ lại token để người dùng có thể thử lại
    return false;
  }
}

/**
 * Setup foreground message handler.
 * Avoids duplicate toasts/sounds when WebSocket is connected.
 */
export async function setupForegroundPushListener(
  onForegroundMessage?: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    if (onForegroundMessage) {
      onForegroundMessage(payload);
    }
  });
}
