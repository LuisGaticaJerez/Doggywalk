self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'DoggyWalk',
      body: event.data.text(),
      icon: '/icon-192.png',
    };
  }

  const { title, body, icon, data } = notificationData;

  const options = {
    body: body || 'You have a new notification',
    icon: icon || '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ],
    requireInteraction: false,
    tag: data?.tag || 'default',
  };

  event.waitUntil(
    self.registration.showNotification(title || 'DoggyWalk', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
