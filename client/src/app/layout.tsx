import type { Metadata } from 'next';
import './globals.css';
import AppInitializer from '@/components/AppInitializer';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Liquid Chat',
  description: 'A modern, dynamic liquid drop UI chat application',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Liquid Chat',
  }
};

export const viewport = {
  themeColor: '#121212',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppInitializer />
        <PWAInstallPrompt />
        {/* SVG Filter for Gooey / Liquid Drop Effects */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix 
                in="blur" 
                mode="matrix" 
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
                result="gooey" 
              />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
