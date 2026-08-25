import axios from 'axios';

// Base64 to Uint8Array converter
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(token: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported by the browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Fetch public VAPID key from backend
      const res = await axios.get('/api/push/vapidPublicKey', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const publicVapidKey = res.data.publicKey;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Send subscription to backend
    await axios.post('/api/push/subscribe', subscription, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Push subscription successful');
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
  }
}
