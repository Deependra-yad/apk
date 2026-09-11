"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Sparkles, Video, QrCode, Download, 
  ArrowRight, Smartphone, Monitor, Globe, CheckCircle2, 
  MessageSquare, CircleDashed, Users, Bot, Zap, Star,
  Shield, Key, RefreshCw, ChevronDown, Check, EyeOff,
  Flame, Heart, Send, Terminal, Play, Cpu, Layers
} from 'lucide-react';
import Link from 'next/link';
import LiquidLogo from '@/components/LiquidLogo';
import { downloadFile } from '@/utils/apiUrl';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Parallax transform layers
  const yHeroText = useTransform(smoothProgress, [0, 0.25], [0, -60]);
  const yMockup = useTransform(smoothProgress, [0, 0.3], [0, -100]);
  const rotateMockup = useTransform(smoothProgress, [0, 0.3], [-4, 2]);
  const scaleMockup = useTransform(smoothProgress, [0, 0.25], [1, 1.05]);

  const yFloatingOrb1 = useTransform(smoothProgress, [0, 1], [0, -400]);
  const yFloatingOrb2 = useTransform(smoothProgress, [0, 1], [0, -250]);
  const yKanji1 = useTransform(smoothProgress, [0, 1], [0, -500]);
  const yKanji2 = useTransform(smoothProgress, [0, 1], [0, -350]);

  // Interactive AI simulator state
  const [activePrompt, setActivePrompt] = useState<number>(0);
  const aiPrompts = [
    {
      prompt: "Can anyone read my private Liquid messages?",
      answer: "🌸 Absolute Zero. All messages are encrypted directly in your browser using Curve25519 & AES-256-GCM before transmission. Even our servers only see unreadable ciphertext."
    },
    {
      prompt: "How does the desktop QR login work?",
      answer: "⚡ Just like WhatsApp Web! Open web.liquidchat.online on your desktop, scan the dynamic QR code with your phone camera in Settings -> Linked Devices, and your session unlocks instantly."
    },
    {
      prompt: "Why are video calls mirrored by default?",
      answer: "🎥 Natural optics! In LiquidChat, your front camera feed is mirrored on both sides so you look natural and relaxed, eliminating awkward inverted camera angles."
    }
  ];

  // Interactive FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: "Do I need a phone number or email to use LiquidChat?",
      a: "No! LiquidChat generates a unique, anonymous 10-digit Liquid ID (e.g. LQ-2130-8255). You can start chatting instantly with anyone using their Liquid ID without exposing your phone number or email."
    },
    {
      q: "How does the desktop site login with QR code work?",
      a: "Visit web.liquidchat.online on your PC or Mac. A secure 90-second encrypted QR code will appear. Open LiquidChat on your phone, go to Settings -> Linked Devices -> 'Link a Device', and scan the screen. Your desktop will immediately authorize and sync your end-to-end encrypted session."
    },
    {
      q: "How do I verify the 60-digit cryptographic safety fingerprint?",
      a: "Open any chat, click 'Safety Number / Encryption Info' in the top header. You can scan your peer's QR code using your camera or read the 60 digits out loud to mathematically verify that no man-in-the-middle exists."
    },
    {
      q: "Can I manage and revoke my linked desktop sessions?",
      a: "Yes! In your mobile app's 'Linked Devices' menu, you can see all computers currently logged in (browser, OS, IP address, and active status), and disconnect any device with a single tap."
    },
    {
      q: "Is the Android APK really mod-proof and anti-tamper protected?",
      a: "Yes. The LiquidChat APK has remote WebView inspection disabled, strict network security domain pinning, cryptographic signature verification, and local IndexedDB zero-knowledge keystores."
    }
  ];

  const webUrl = typeof window !== 'undefined' && window.location.hostname.includes('liquidchat.online') 
    ? 'https://web.liquidchat.online' 
    : '/web';

  return (
    <div className="min-h-screen w-full bg-[#07050e] text-[#fbfaff] relative overflow-x-hidden font-sans selection:bg-[#ff7597] selection:text-black">
      
      {/* Top Scroll Reading Progress Bar */}
      <motion.div 
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff4b82] via-[#a855f7] to-[#00f2fe] origin-left z-50 shadow-[0_0_15px_rgba(255,75,130,0.8)]"
      />

      {/* Floating Animated Japanese Neo-Tokyo Glyphs (Parallax Background) - Hidden on mobile to prevent scroll lag */}
      <motion.div style={{ y: yKanji1 }} className="hidden md:block absolute top-40 -left-12 text-8xl font-black text-white/[0.02] select-none pointer-events-none rotate-90 z-0">
        完全秘密暗号化
      </motion.div>
      <motion.div style={{ y: yKanji2 }} className="hidden md:block absolute top-[1200px] -right-12 text-9xl font-black text-white/[0.02] select-none pointer-events-none -rotate-90 z-0">
        液体通信装置
      </motion.div>
      <motion.div style={{ y: yFloatingOrb1 }} className="absolute top-[200px] left-[15%] w-[350px] sm:w-[650px] h-[350px] sm:h-[650px] bg-gradient-to-tr from-[#ff4b82]/15 to-[#a855f7]/15 rounded-full blur-[120px] sm:blur-[170px] pointer-events-none -z-10" />
      <motion.div style={{ y: yFloatingOrb2 }} className="absolute top-[1100px] right-[5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-br from-[#00f2fe]/12 to-[#a855f7]/12 rounded-full blur-[120px] sm:blur-[180px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 w-full z-40 backdrop-blur-2xl bg-[#07050e]/75 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LiquidLogo size={44} glow={true} />
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                LiquidChat <span className="text-[#ff7597] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/30">🌸 PRO v3.0</span>
              </span>
              <p className="text-[10px] text-foreground/50 tracking-wider uppercase font-mono hidden sm:block">
                Zero-Knowledge • Japanese Cyber-Glass • E2EE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2"
            >
              Features
            </a>
            <a
              href="#security"
              className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2"
            >
              Security
            </a>
            <a
              href="#comparison"
              className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2"
            >
              Compare
            </a>
            <a
              href="/auth"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:text-white transition-colors"
            >
              Sign In
            </a>

            <a
              href={webUrl}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white text-xs font-bold shadow-[0_0_25px_rgba(255,75,130,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Liquid Web</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH 3D PERSPECTIVE PARALLAX */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-28 flex flex-col items-center text-center z-10">
        
        {/* Glow pill badge */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18112e]/90 border border-[#ff7597]/30 shadow-[0_0_30px_rgba(255,117,151,0.2)] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-foreground/90">
            🌸 次世代 暗号化 メッセンジャー • Next-Gen Fluid Encrypted Messenger
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          style={{ y: yHeroText }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6"
        >
          Privacy, Reimagined in <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] via-[#f43f5e] to-[#a855f7] drop-shadow-[0_0_40px_rgba(255,117,151,0.4)]">
            Liquid Cyber Glass.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          style={{ y: yHeroText }}
          className="text-base sm:text-xl text-foreground/70 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Military-grade Curve25519 & AES-256 end-to-end encryption wrapped in an award-winning Japanese Kawaii cyber-glass aesthetic. Mirrored HD video calls, instant WhatsApp Web-style QR sync, and intelligent AI assistance — with zero phone number required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          style={{ y: yHeroText }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14"
        >
          <a
            href={webUrl}
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-[0_0_40px_rgba(255,75,130,0.5)] hover:shadow-[0_0_50px_rgba(255,75,130,0.8)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Monitor size={20} />
            <span>Open Liquid Web (web.liquidchat.online)</span>
            <ArrowRight size={16} />
          </a>

          <button
            onClick={() => downloadFile('/LiquidChat.apk', 'LiquidChat.apk')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#17122b]/90 hover:bg-[#231a44] text-foreground font-bold text-sm border border-[#a855f7]/30 shadow-lg hover:border-[#ff7597]/50 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Download size={20} className="text-[#00f2fe]" />
            <span>Download Android APK (v3.0 PRO)</span>
          </button>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full mx-auto pt-4 pb-12 border-y border-white/5 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] to-[#a855f7]">100%</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono">Zero Knowledge</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#00f2fe]">0 Phone</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono">Number Required</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#10b981]">60-Digit</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono">Safety Verification</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#ff7597]">0 Logs</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono">Data Retention</p>
          </div>
        </div>

        {/* INTERACTIVE 3D MOCKUP STAGE */}
        <motion.div 
          style={{ y: yMockup, rotateX: rotateMockup, scale: scaleMockup }}
          className="w-full max-w-5xl mt-12 relative [perspective:1200px]"
        >
          {/* Outer Cyber Glass Glow Frame */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#1b1238]/90 via-[#120c24]/95 to-[#0a0715] p-3 sm:p-5 border border-white/10 shadow-[0_0_100px_rgba(168,85,247,0.25)] backdrop-blur-3xl overflow-hidden">
            
            {/* Top Mockup Titlebar */}
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="px-4 py-1 rounded-full bg-black/40 border border-white/5 text-[11px] font-mono text-foreground/60 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-400" />
                <span>https://web.liquidchat.online</span>
              </div>
              <div className="text-xs text-foreground/40 font-mono">E2EE ACTIVE</div>
            </div>

            {/* Split Mockup Content: Left Sidebar, Center Chat, Right Safety Hub */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[420px] rounded-2xl overflow-hidden bg-black/50 border border-white/5 text-left p-4">
              
              {/* Left Column: Stories & Contact List (4 cols) */}
              <div className="hidden md:flex md:col-span-4 flex-col border-r border-white/5 pr-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-wide">Chats</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ff4b82]/20 text-[#ff4b82] text-[10px] font-mono">PRO</span>
                </div>

                {/* Simulated Stories Bar */}
                <div className="flex items-center gap-2 py-1 overflow-hidden">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#ff4b82] to-[#00f2fe] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#18112e] flex items-center justify-center text-xs font-bold text-white">
                      You
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#a855f7] to-[#ff4b82] shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aria" className="w-full h-full rounded-full bg-liquid-base" alt="Aria" />
                  </div>
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#00f2fe] to-[#10b981] shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full rounded-full bg-liquid-base" alt="Felix" />
                  </div>
                </div>

                {/* Simulated Contact Rows */}
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff4b82]/20 to-[#a855f7]/20 border border-[#ff4b82]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" className="w-8 h-8 rounded-full bg-liquid-base" alt="Luna" />
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Luna 🌸</h4>
                        <p className="text-[10px] text-foreground/60 truncate">Sent encrypted key...</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-[#00f2fe]">E2EE</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-2.5">
                      <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Matrix" className="w-8 h-8 rounded-full bg-liquid-base" alt="AI" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Liquid AI Companion</h4>
                        <p className="text-[10px] text-foreground/60">Ready to assist</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Live Animated Conversation (8 cols) */}
              <div className="col-span-12 md:col-span-8 flex flex-col justify-between pl-0 md:pl-2">
                {/* Conversation Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#ff4b82] to-[#a855f7]">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" className="w-full h-full rounded-full" alt="Luna" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Luna</span>
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      </h4>
                      <p className="text-[10px] text-foreground/50 font-mono">ID: LQ-9842-1102 • 100% E2EE Verified</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                      <ShieldCheck size={12} />
                      <span>Fingerprint Verified</span>
                    </div>
                  </div>
                </div>

                {/* Animated Chat Bubbles */}
                <div className="space-y-3 py-4 flex-1 overflow-hidden flex flex-col justify-end">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="self-start max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-[#1e163b] border border-white/10 text-xs text-foreground/90 shadow-md"
                  >
                    Hey! Did you see the new QR code login for desktop? It works just like WhatsApp Web! ⚡
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="self-end max-w-[80%] p-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#ff4b82] to-[#a855f7] text-white text-xs shadow-[0_0_20px_rgba(255,75,130,0.4)]"
                  >
                    Yes! I scanned the QR code from my phone camera in 1 second and my desktop was instantly logged in. Plus our video call was mirrored by default! 🌸
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 }}
                    className="self-center px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5"
                  >
                    <Lock size={10} />
                    <span>Curve25519 Elliptic Key Exchange Confirmed • No Server Logs</span>
                  </motion.div>
                </div>

                {/* Mockup Input Bar */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-xs text-foreground/50 flex items-center justify-between border border-white/5">
                    <span>Type an encrypted message...</span>
                    <Sparkles size={14} className="text-[#ff7597]" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#ff4b82] flex items-center justify-center text-white shadow-md">
                    <Send size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 1: WHATSAPP-STYLE DESKTOP QR CODE LOGIN */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-bold">
              <QrCode size={14} />
              <span>DESKTOP QR LOGIN ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Login to Desktop Just Like <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-[#a855f7] to-[#ff7597]">
                WhatsApp Web.
              </span>
            </h2>

            <p className="text-base text-foreground/70 leading-relaxed font-normal">
              No passwords to remember. Open <strong className="text-white">web.liquidchat.online</strong> on your browser. A 90-second encrypted QR code appears. Point your phone’s camera via <span className="text-[#ff7597] font-semibold">Settings → Linked Devices</span>, and your desktop unlocks in real time.
            </p>

            <ul className="space-y-3 text-xs text-foreground/80 font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Real-time WebSocket token exchange with zero password transmission</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>See all active desktop sessions with browser, OS, and IP address</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Remotely log out of individual or all desktop devices from your phone</span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={webUrl}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#a855f7] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                <span>Try Desktop QR Login</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Interactive QR Simulation Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#191136] to-[#0f0a21] border border-[#a855f7]/30 shadow-[0_0_80px_rgba(168,85,247,0.2)] flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2fe]/20 text-[#00f2fe] flex items-center justify-center mb-4">
                <QrCode size={26} />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">Scan from Liquid App</h3>
              <p className="text-xs text-foreground/60 mb-6">Open Settings → Linked Devices → Link a Device</p>

              {/* Glowing QR Box with Laser Scan Animation */}
              <div className="relative p-4 rounded-2xl bg-white shadow-2xl overflow-hidden">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=liquidchat-desktop-auth-demo" 
                  alt="QR Login Demo" 
                  className="w-44 h-44"
                />
                {/* Laser scan line */}
                <motion.div 
                  animate={{ y: [0, 160, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff4b82] to-transparent shadow-[0_0_15px_#ff4b82]"
                />
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#00f2fe]">
                <RefreshCw size={12} className="animate-spin" />
                <span>Session Active • 90s Refresh</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: 60-DIGIT E2EE VERIFICATION & SOVEREIGN CRYPTO */}
      <section id="security" className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-14">
          
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-mono font-bold">
              <ShieldCheck size={14} />
              <span>CRYPTOGRAPHIC PROOF OF SAFETY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Verify Security Codes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] via-[#00f2fe] to-[#ff7597]">
                Fingerprint by Fingerprint.
              </span>
            </h2>

            <p className="text-base text-foreground/70 leading-relaxed font-normal">
              Just like WhatsApp and Signal, LiquidChat generates a verifiable 60-digit safety fingerprint for every 1-on-1 contact. You can compare the number or scan each other’s code using the camera viewfinder to be 100% sure your chat has never been intercepted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[#10b981] mb-2"><Key size={20} /></div>
                <h4 className="text-sm font-bold text-white mb-1">Curve25519 & AES-GCM</h4>
                <p className="text-xs text-foreground/60 leading-relaxed">High-performance asymmetric cryptography calculated directly on your CPU.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[#00f2fe] mb-2"><EyeOff size={20} /></div>
                <h4 className="text-sm font-bold text-white mb-1">Zero Plaintext on Disk</h4>
                <p className="text-xs text-foreground/60 leading-relaxed">No chat database stored on server disks. Messages vanish as soon as delivered.</p>
              </div>
            </div>
          </div>

          {/* Safety Code Visual Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#141d26] to-[#0d131a] border border-[#10b981]/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#10b981]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Safety Number</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[10px] font-mono font-bold">VERIFIED</span>
              </div>

              <p className="text-xs text-foreground/60">
                Compare these 60 numbers with your contact or tap below to scan their QR code with your camera:
              </p>

              {/* 60 Digit Block Display */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs text-[#00f2fe] tracking-wider leading-relaxed select-all">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <span>92841 00294</span>
                  <span>78192 48921</span>
                  <span>19382 74829</span>
                  <span>88421 94029</span>
                  <span>48201 84920</span>
                  <span>77481 02948</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>Peer Public Key Cryptographically Verified</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: MIRRORED WEBRTC CALLING & INTERACTIVE AI */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff4b82]/10 border border-[#ff4b82]/30 text-[#ff4b82] text-xs font-mono font-bold">
            <Sparkles size={14} />
            <span>INTERACTIVE COMPANION & MEDIA</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Built for Natural Calling & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] via-[#a855f7] to-[#00f2fe]">
              Instant AI Intelligence.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-foreground/70">
            Never look awkward with inverted camera feeds. Communicate freely with built-in mirrored video calls and query the integrated Liquid AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Mirrored Calls Showcase */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1a1236] to-[#0f0924] border border-[#a855f7]/30 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#ff4b82]/20 text-[#ff4b82] flex items-center justify-center mb-5">
                <Video size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Mirrored HD WebRTC Calling</h3>
              <p className="text-xs text-foreground/70 leading-relaxed mb-6">
                Standard video calls flip your face and make you feel awkward. LiquidChat defaults to mirrored video on both caller and receiver screens, rendering crystal-clear natural reflections.
              </p>
            </div>

            {/* Simulated Mirrored Call Window */}
            <div className="rounded-2xl bg-black/60 border border-white/10 p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-foreground/60 pb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  04:12 • Mirrored HD 60fps
                </span>
                <span className="font-mono text-[#00f2fe]">P2P Encrypted</span>
              </div>

              <div className="grid grid-cols-2 gap-3 h-32">
                <div className="rounded-xl bg-[#231745] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aria" className="w-12 h-12 rounded-full mb-1" alt="You" />
                  <span className="text-[10px] font-semibold text-white">You (Mirrored)</span>
                </div>
                <div className="rounded-xl bg-[#1b1236] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" className="w-12 h-12 rounded-full mb-1" alt="Luna" />
                  <span className="text-[10px] font-semibold text-white">Luna (Mirrored)</span>
                </div>
              </div>

              {/* Audio Equalizer Simulation */}
              <div className="flex items-center justify-center gap-1 pt-1">
                {[40, 70, 30, 90, 60, 85, 45, 95, 55, 75, 40].map((h, i) => (
                  <motion.span 
                    key={i}
                    animate={{ height: [10, h * 0.25, 10] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                    className="w-1 bg-gradient-to-t from-[#ff4b82] to-[#00f2fe] rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Interactive AI Assistant Simulator */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#131b2e] to-[#0a101f] border border-[#00f2fe]/30 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#00f2fe]/20 text-[#00f2fe] flex items-center justify-center mb-5">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Liquid AI Companion</h3>
              <p className="text-xs text-foreground/70 leading-relaxed mb-6">
                Interactive real-time intelligence inside your chat. Test an instant query below to see how Liquid AI answers without saving your personal context:
              </p>

              {/* Interactive prompt tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {aiPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePrompt(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activePrompt === idx
                        ? 'bg-[#00f2fe] text-black font-bold shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-foreground/70'
                    }`}
                  >
                    Query #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Dialog Mockup */}
            <div className="rounded-2xl bg-black/60 border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-foreground/80 font-semibold">
                <span className="text-[#00f2fe]">Q:</span>
                <span>"{aiPrompts[activePrompt].prompt}"</span>
              </div>
              <div className="p-3 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 text-xs text-foreground/90 leading-relaxed">
                {aiPrompts[activePrompt].answer}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: COMPARISON MATRIX (LIQUIDCHAT VS OTHERS) */}
      <section id="comparison" className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white">How LiquidChat Compares</h2>
          <p className="text-sm sm:text-base text-foreground/70">
            See why privacy enthusiasts and cyber aesthetics lovers choose LiquidChat over legacy platforms.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-foreground/50 font-mono uppercase tracking-wider">
                <th className="py-4 px-4">Feature</th>
                <th className="py-4 px-4 text-[#ff7597] font-bold">LiquidChat 🌸</th>
                <th className="py-4 px-4">WhatsApp</th>
                <th className="py-4 px-4">Telegram</th>
                <th className="py-4 px-4">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">No Phone Number Required</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ (Liquid ID)</td>
                <td className="py-4 px-4 text-rose-400">✗ (Required)</td>
                <td className="py-4 px-4 text-rose-400">✗ (Required)</td>
                <td className="py-4 px-4 text-rose-400">✗ (Required)</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">WhatsApp-Style QR Desktop Login</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ (100% Realtime)</td>
                <td className="py-4 px-4 text-emerald-400">✓ Yes</td>
                <td className="py-4 px-4 text-foreground/60">Partial</td>
                <td className="py-4 px-4 text-foreground/60">Desktop Only</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">Mirrored HD Calls by Default</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ Both Parties</td>
                <td className="py-4 px-4 text-rose-400">✗ Inverted</td>
                <td className="py-4 px-4 text-rose-400">✗ Inverted</td>
                <td className="py-4 px-4 text-rose-400">✗ Inverted</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">60-Digit Camera QR Code Scanner</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ Realtime Match</td>
                <td className="py-4 px-4 text-emerald-400">✓ Yes</td>
                <td className="py-4 px-4 text-rose-400">✗ No</td>
                <td className="py-4 px-4 text-emerald-400">✓ Yes</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">Award-Winning Kawaii Cyber Glass UI</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ Tokyo Aesthetic</td>
                <td className="py-4 px-4 text-rose-400">✗ Standard</td>
                <td className="py-4 px-4 text-rose-400">✗ Standard</td>
                <td className="py-4 px-4 text-rose-400">✗ Minimalist</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 text-white font-bold">Built-in AI Assistant</td>
                <td className="py-4 px-4 text-emerald-400 font-bold">✓ Integrated</td>
                <td className="py-4 px-4 text-foreground/60">Meta AI (Tracked)</td>
                <td className="py-4 px-4 text-rose-400">✗ Bot API only</td>
                <td className="py-4 px-4 text-rose-400">✗ None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: INTERACTIVE FAQ ACCORDION */}
      <section className="py-24 max-w-4xl mx-auto px-6 border-t border-white/5 relative z-10 text-left">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-foreground/60">Everything you need to know about LiquidChat and web client routing.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-[#ff7597] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ff7597]' : 'text-foreground/40'}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 text-xs text-foreground/70 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-20 max-w-7xl mx-auto px-6 relative z-20">
        <div className="rounded-[3rem] bg-gradient-to-r from-[#21123b] via-[#1a0f30] to-[#261042] border border-[#ff7597]/40 p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,117,151,0.25)]">
          <div className="absolute -top-20 left-1/3 w-80 h-40 bg-[#ff7597]/25 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Claim Your Liquid ID Today.
          </h2>
          <p className="text-sm sm:text-lg text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            No phone number. No tracking. Step into the future of confidential, aesthetically breathtaking communication.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={webUrl}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-[0_0_30px_rgba(255,75,130,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Monitor size={18} />
              <span>Launch Liquid Web</span>
              <ArrowRight size={16} />
            </a>

            <button
              onClick={() => downloadFile('/LiquidChat.apk', 'LiquidChat.apk')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Download size={18} className="text-[#00f2fe]" />
              <span>Download Android APK (v3.0 PRO)</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-foreground/50 z-20 relative">
        <div className="flex items-center gap-2.5">
          <LiquidLogo size={24} glow={false} />
          <span>🌸 LiquidChat PRO v3.0 • Tokyo Cyber-Glass</span>
          <span>•</span>
          <span>© 2026 LiquidChat.online</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <a href={webUrl} className="hover:text-white transition-colors">Liquid Web</a>
          <a href="/LiquidChat.apk" download className="hover:text-white transition-colors">Android APK</a>
          <Link href="/auth" className="hover:text-white transition-colors">Sign In</Link>
          <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>

    </div>
  );
}
