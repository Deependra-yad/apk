"use client";

import { useEffect, useState, ReactNode } from 'react';
import { 
  Monitor, Smartphone, Download, ArrowRight, 
  ExternalLink, ShieldCheck, Lock, Sparkles, AlertCircle 
} from 'lucide-react';
import LiquidLogo from '@/components/LiquidLogo';

interface DesktopOnlyGateProps {
  children: ReactNode;
}

export default function DesktopOnlyGate({ children }: DesktopOnlyGateProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. If running inside the official Liquid Chat native Android app WebView, never block
    if ((window as any).Android) {
      setIsMobile(false);
      return;
    }

    // 2. Check session bypass
    if (sessionStorage.getItem('liquid_desktop_bypass') === '1') {
      setBypassed(true);
      setIsMobile(false);
      return;
    }

    // 3. WhatsApp Web style detection: Mobile user-agent or touch viewport
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touchScreenSmall = window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024;

    setIsMobile(mobileUA || touchScreenSmall);
  }, []);

  const handleBypass = () => {
    sessionStorage.setItem('liquid_desktop_bypass', '1');
    setBypassed(true);
    setIsMobile(false);
  };

  const handleOpenApp = () => {
    window.location.href = 'liquidchat://open';
    setTimeout(() => {
      window.location.href = '/LiquidChat.apk';
    }, 1500);
  };

  // SSR / Loading state
  if (isMobile === null) {
    return <div className="min-h-screen bg-[#06060c]" />;
  }

  // If on Desktop or Bypassed or Native App: render children
  if (!isMobile || bypassed) {
    return <>{children}</>;
  }

  // Mobile Browser: Render WhatsApp Web style Desktop Restriction Screen
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans select-none">
      {/* Cinematic Ambient Glow */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px]">
            <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
              <LiquidLogo size={20} />
            </div>
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white">LIQUID CHAT</span>
            <span className="block text-[9px] font-mono text-cyan-400">DESKTOP EXCLUSIVE</span>
          </div>
        </div>

        <a 
          href="https://liquidchat.online"
          className="text-xs text-white/60 hover:text-white flex items-center gap-1"
        >
          <span>Homepage</span>
          <ExternalLink size={12} />
        </a>
      </header>

      {/* Center Hero Notice Card */}
      <main className="w-full max-w-md my-auto z-10 py-4">
        <div className="p-7 sm:p-8 rounded-3xl bg-[#090d18]/90 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-center space-y-5">
          {/* Animated Monitor / Phone Icon Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              <Monitor size={36} className="text-cyan-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-black border border-purple-500/40 flex items-center justify-center">
              <Smartphone size={16} className="text-purple-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold tracking-widest uppercase">
              <span>WHATSAPP-STYLE DESKTOP RESTRICTION</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Liquid Chat for Desktop
            </h1>
            <p className="text-xs text-[#9ca3af] leading-relaxed font-light">
              To use Liquid Chat on your mobile device, please open or download the official Android application.
            </p>
          </div>

          {/* Explanation Info */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-left text-xs space-y-2 font-light text-white/80">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] font-semibold">
              <Lock size={13} />
              <span>Native Silicon Hardware Encryption</span>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Mobile communication requires native Android OS access for Curve25519 key ratchets in RAM, hardware PIN locks, and peer-to-peer WebRTC video calling.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleOpenApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs tracking-wider transition-all shadow-[0_0_25px_rgba(56,189,248,0.35)] flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              <span>OPEN IN LIQUID CHAT APP</span>
              <ArrowRight size={14} />
            </button>

            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="w-full py-3 px-4 rounded-2xl bg-white text-black hover:bg-cyan-50 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Download size={15} />
              <span>DOWNLOAD APK v2.0.1 (6.3 MB)</span>
            </a>

            <button
              onClick={handleBypass}
              className="w-full py-2.5 text-[11px] text-white/40 hover:text-white transition-colors"
            >
              Request Desktop Version / Proceed Anyway
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-3 text-[11px] text-white/40 font-mono">
        web.liquidchat.online • Desktop Client Engine
      </footer>
    </div>
  );
}

