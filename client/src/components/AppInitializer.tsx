"use client";

import { useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/utils/apiUrl';
import { requestNotificationPermission } from '@/utils/notifications';

// Set up Axios globally BEFORE React renders
const backendUrl = getApiUrl();
axios.defaults.baseURL = backendUrl;

axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api')) {
    config.url = `${backendUrl}${config.url}`;
  }
  return config;
});

import { useAuthStore } from '@/store/authStore';
import { subscribeToPushNotifications } from '@/utils/push';

export default function AppInitializer() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Register Service Worker for PWA Installability
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
          if (token && Notification.permission === 'granted') {
            subscribeToPushNotifications(token);
          }
        }).catch(err => {
          console.error('Service Worker registration failed:', err);
        });
      });
    }

    requestNotificationPermission().then(() => {
      if (token && Notification.permission === 'granted' && navigator.serviceWorker.controller) {
        subscribeToPushNotifications(token);
      }
    });

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

