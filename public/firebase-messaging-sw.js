/* eslint-disable no-undef */
// Firebase Cloud Messaging Background Service Worker for Chợ PTITers
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Parse config dynamically from registration URL query parameters to avoid hardcoded credentials
const swUrl = new URL(self.location.href);
const apiKey = swUrl.searchParams.get('apiKey');
const projectId = swUrl.searchParams.get('projectId');
const messagingSenderId = swUrl.searchParams.get('messagingSenderId');
const appId = swUrl.searchParams.get('appId');

if (apiKey && projectId && messagingSenderId) {
  firebase.initializeApp({
    apiKey,
    projectId,
    messagingSenderId,
    appId: appId || undefined,
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    // If the message contains a notification payload, FCM SDK displays it automatically.
    // Suppress showNotification here to avoid duplicate notifications.
    if (payload.notification) {
      return;
    }

    const title = payload.data?.title || 'Chợ PTITers';
    const body = payload.data?.body || 'Bạn có thông báo mới trên Chợ PTITers';

    const options = {
      body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: payload.data || {},
      tag: payload.data?.notification_id || payload.data?.conversation_id || 'ptit-notification',
      renotify: true,
    };

    self.registration.showNotification(title, options);
  });
}

// Background push notification click routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetPath = '/notifications';

  if (data.type === 'MESSAGE_CREATED' || data.ref_type === 'CONVERSATION') {
    const convId = data.conversation_id || data.ref_id;
    targetPath = convId ? `/messages/${convId}` : '/messages';
  } else if (data.ref_type === 'ORDER') {
    targetPath = data.ref_id ? `/orders/${data.ref_id}` : '/orders/buying';
  } else if (data.ref_type === 'AUCTION') {
    targetPath = data.ref_id ? `/auctions/${data.ref_id}` : '/';
  } else if (data.ref_type === 'ADMIN_FEEDBACK') {
    targetPath = '/admin/feedback';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open on this origin, focus and navigate it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetPath);
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
