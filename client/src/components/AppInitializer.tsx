"use client";

import { useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/utils/apiUrl';
import { requestNotificationPermission } from '@/utils/notifications';

// Set up Axios globally BEFORE React renders
const backendUrl = getApiUrl();
axios.defaults.baseURL = backendUrl;

import { useAuthStore } from '@/store/authStore';
import { subscribeToPushNotifications } from '@/utils/push';

export default function AppInitializer() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Register Service Worker for PWA Installability
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
          if (token && Notification.permission === 'granted') {
            subscribeToPushNotifications(token);
          }
        }).catch(err => {
          console.error('Service Worker registration failed:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    requestNotificationPermission().then(() => {
      if (token && Notification.permission === 'granted' && navigator.serviceWorker.controller) {
        subscribeToPushNotifications(token);
      }
    });

    // Native Android FCM Subscription
    if (token && typeof window !== 'undefined' && (window as any).Android) {
      const syncFCMToken = () => {
        try {
          const fcmToken = (window as any).Android.getFCMToken();
          if (fcmToken) {
            axios.post('/api/push/fcm-subscribe', { token: fcmToken }, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(err => console.warn('FCM sync error', err));
          }
        } catch (e) {}
      };
      
      // Sync immediately and then every 5 seconds
      syncFCMToken();
      const interval = setInterval(syncFCMToken, 5000);

      const handleFcmMessage = (event: MessageEvent) => {
        if (event.data?.type === 'FCM_TOKEN' && event.data?.token) {
          axios.post('/api/push/fcm-subscribe', { token: event.data.token }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      };
      window.addEventListener('message', handleFcmMessage);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('message', handleFcmMessage);
      };
    }

    // Privacy Locks
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [token]);

  return null;
}

