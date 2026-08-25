"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Force show the prompt UI after 2 seconds as a fallback
    const fallbackTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions tailored by device OS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert("🍎 iOS / iPhone Installation:\n\n1. Tap the Share button at the bottom of your screen (the square with an arrow pointing up).\n2. Scroll down and tap 'Add to Home Screen'.");
      } else if (isAndroid) {
        alert("🤖 Android Installation:\n\n1. Tap the 3-dots menu (⋮) at the top right of your browser.\n2. Tap 'Install app' or 'Add to Home screen'.");
      } else {
        alert("💻 Desktop Installation:\n\nLook for the install icon (monitor with a downward arrow) in the right side of your URL bar, or check your browser menu to 'Install App'.");
      }
    }
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-sm bg-liquid-base border border-liquid-accent/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,210,255,0.2)] flex flex-col gap-3"
        >
          <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-2 right-2 p-1.5 text-foreground/50 hover:text-foreground rounded-full hover:bg-foreground/10"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-liquid-accent to-purple-500 rounded-xl flex items-center justify-center shrink-0">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Install Liquid Chat</h4>
              <p className="text-xs text-foreground/70 leading-tight mt-0.5">
                Install as a native app for a faster, full-screen experience and instant access.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => setShowPrompt(false)}
              className="flex-1 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs font-semibold text-foreground transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={handleInstall}
              className="flex-1 py-2 rounded-xl bg-liquid-accent hover:bg-liquid-accent/90 text-xs font-bold text-liquid-dark transition-colors"
            >
              Install App
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

