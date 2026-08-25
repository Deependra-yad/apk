"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show the prompt after a short delay so it doesn't immediately interrupt the user
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
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

