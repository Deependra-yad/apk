export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
  }
};

export const sendBrowserNotification = (title: string, body: string, icon?: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: icon || 'https://api.dicebear.com/7.x/identicon/svg?seed=Liquid',
          silent: false
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {}
    }
  }
};
