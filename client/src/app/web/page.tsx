"use client";

import { useEffect } from 'react';
import Home from '../page';
import DesktopOnlyGate from '@/components/DesktopOnlyGate';

export default function WebClientPage() {
  // If user lands on liquidchat.online/web, redirect to web.liquidchat.online
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'liquidchat.online' || host === 'www.liquidchat.online') {
        window.location.replace(`https://web.liquidchat.online${window.location.search}`);
      }
    }
  }, []);

  return (
    <DesktopOnlyGate>
      <Home forceChat={true} />
    </DesktopOnlyGate>
  );
}
