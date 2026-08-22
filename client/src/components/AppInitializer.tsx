"use client";

import { useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/utils/apiUrl';
import { requestNotificationPermission } from '@/utils/notifications';

export default function AppInitializer() {
  useEffect(() => {
    const backendUrl = getApiUrl();
    axios.defaults.baseURL = backendUrl;

    // Intercept relative requests to ensure baseURL is respected
    axios.interceptors.request.use((config) => {
      if (config.url && config.url.startsWith('/api')) {
        config.url = `${backendUrl}${config.url}`;
      }
      return config;
    });

    requestNotificationPermission();
  }, []);

  return null;
}

