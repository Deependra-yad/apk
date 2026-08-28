export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
  }
};

export const sendBrowserNotification = async (title: string, body: string, icon?: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body,
            icon: icon || '/icon-192x192.png',
            badge: '/icon-192x192.png'
          });
        } else {
          const notif = new Notification(title, {
            body,
            icon: icon || '/icon-192x192.png',
            silent: false
          });
          notif.onclick = () => {
            window.focus();
          };
        }
      } catch (e) {}
    }
  }
};

