self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle fetches natively
});

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const isCall = data.type === 'call' || data.tag === 'incoming-call';
      
      const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: data.tag || (isCall ? 'incoming-call' : 'liquid-notification'),
        renotify: true,
        requireInteraction: isCall,
        vibrate: isCall ? [300, 150, 300, 150, 300, 150, 600] : [200, 100, 200],
        actions: isCall ? [
          { action: 'accept', title: '📞 Pick Up' },
          { action: 'decline', title: '❌ Hang Up' }
        ] : (data.actions || []),
        data: { 
          url: data.url || '/',
          type: data.type || 'message',
          callerId: data.callerId,
          isVideo: data.isVideo
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('Push error', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const urlToOpen = notifData.url || '/';

  if (event.action === 'decline') {
    // Notify clients that call was declined
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'DECLINE_INCOMING_CALL', callerId: notifData.callerId });
        });
      })
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if (event.action === 'accept') {
            client.postMessage({ type: 'ACCEPT_INCOMING_CALL', callerId: notifData.callerId, isVideo: notifData.isVideo });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
