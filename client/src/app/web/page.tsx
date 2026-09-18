"use client";

import { useEffect } from 'react';
import Home from '../page';
import DesktopOnlyGate from '@/components/DesktopOnlyGate';

export default function WebClientPage() {


  return (
    <DesktopOnlyGate>
      <Home forceChat={true} />
    </DesktopOnlyGate>
  );
}
