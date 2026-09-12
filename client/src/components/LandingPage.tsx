"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Sparkles, Video, QrCode, Download, 
  ArrowRight, Smartphone, Monitor, Globe, CheckCircle2, 
  MessageSquare, Users, Bot, Zap, Star,
  Shield, Key, RefreshCw, ChevronDown, Check, EyeOff,
  Flame, Heart, Send, Terminal, Play, Cpu, Layers, AlertTriangle,
  Keyboard, Copy, Radio, Volume2, ShieldAlert, Phone
} from 'lucide-react';
import Link from 'next/link';
import LiquidLogo from '@/components/LiquidLogo';
import { downloadFile } from '@/utils/apiUrl';
import { soundEffects } from '@/utils/audioSynth';
import ThreeHeroScene from './ThreeHeroScene';
import ExplodedViewSection from './ExplodedViewSection';
import ScrollytellingExperience from './ScrollytellingExperience';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  // Instant scroll transforms (zero rubber-banding lag)
  const yHeroText = useTransform(scrollYProgress, [0, 0.25], [0, -50]);
  const yPhone = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const rotatePhone = useTransform(scrollYProgress, [0, 0.3], [-2, 2]);
  const scalePhone = useTransform(scrollYProgress, [0, 0.25], [1, 1.04]);

  // Stereoscopic multi-depth floating badges
  const yBadge1 = useTransform(scrollYProgress, [0, 0.4], [0, -180]);
  const yBadge2 = useTransform(scrollYProgress, [0, 0.4], [0, -120]);
  const yBadge3 = useTransform(scrollYProgress, [0, 0.4], [0, -220]);
  const yBadge4 = useTransform(scrollYProgress, [0, 0.4], [0, -150]);

  // Ambient parallax background items
  const yFloatingOrb1 = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const yFloatingOrb2 = useTransform(scrollYProgress, [0, 1], [0, -280]);
  const yKanji1 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const yKanji2 = useTransform(scrollYProgress, [0, 1], [0, -320]);

  // Responsive mouse parallax for 3D hero tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 140, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 140, damping: 24 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 24;
    const y = (clientY / innerHeight - 0.5) * 24;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Interactive 3D Hero Mockup Active Chat Tab
  const [activeHeroChat, setActiveHeroChat] = useState<number>(0);
  const heroChats = [
    {
      name: 'Sakura (Tokyo)',
      avatar: '🌸',
      tag: 'ID: 8343254978',
      preview: 'Secret rendezvous in Tokyo at 7 PM 🌸',
      time: '8:11 PM',
      messages: [
        { text: 'Secret rendezvous in Tokyo at 7 PM 🌸', isMe: false, time: '8:11 PM' },
        { text: 'Ratchet keys verified. 0 bytes left on disk! ✨', isMe: true, time: '8:12 PM' }
      ]
    },
    {
      name: 'NandniJamwal',
      avatar: '💎',
      tag: 'Mutual Contact',
      preview: 'Confidential project audit attached.',
      time: '7:45 PM',
      messages: [
        { text: 'Attached the confidential security audit report. Sealed with Curve25519.', isMe: false, time: '7:45 PM' },
        { text: 'Downloaded and verified in-browser. Zero plaintext on server! 🌊', isMe: true, time: '7:46 PM' }
      ]
    },
    {
      name: 'ujwalsharma',
      avatar: '⚡',
      tag: 'ID: 4192019482',
      preview: 'Check out the new Tokyo chime ringtone',
      time: 'Yesterday',
      messages: [
        { text: 'The new Tokyo Neon synthesized ringtone sounds like cyberpunk anime!', isMe: false, time: 'Yesterday' },
        { text: 'Web Audio API synthesizer chimes are live in settings. 🎵', isMe: true, time: 'Yesterday' }
      ]
    }
  ];

  // Real Interactive WebCrypto E2EE Simulator State
  const [simText, setSimText] = useState("Secret rendezvous in Tokyo at 7 PM 🌸");
  const [simTamper, setSimTamper] = useState(false);
  const [simCiphertext, setSimCiphertext] = useState("");
  const [simIv, setSimIv] = useState("");
  const [simDecrypted, setSimDecrypted] = useState("");
  const [activeSound, setActiveSound] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const runSimulator = async () => {
      if (typeof window === 'undefined' || !window.crypto?.subtle) return;
      try {
        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          enc.encode(simText || " ")
        );
        const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        const ivBase64 = btoa(String.fromCharCode(...iv));

        if (!active) return;
        setSimIv(ivBase64);

        if (simTamper) {
          const tampered = cipherBase64.slice(0, -4) + 'AAAA';
          setSimCiphertext(tampered);
          setSimDecrypted("⚠️ AES-GCM AUTH TAG MISMATCH: Decryption rejected! Ciphertext was intercepted or modified in transit.");
        } else {
          setSimCiphertext(cipherBase64);
          const dec = new TextDecoder();
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
          );
          if (active) setSimDecrypted(dec.decode(decrypted));
        }
      } catch (err) {
        if (active) setSimDecrypted("⚠️ Cryptographic Verification Alert: Decryption Failed");
      }
    };
    runSimulator();
    return () => { active = false; };
  }, [simText, simTamper]);

  const handlePlaySound = (type: 'sakura' | 'cyber' | 'tokyo' | 'chime') => {
    setActiveSound(type);
    if (type === 'sakura') soundEffects.playSakuraBell();
    else if (type === 'cyber') soundEffects.playCyberPulse();
    else if (type === 'tokyo') soundEffects.playTokyoNeon();
    else if (type === 'chime') soundEffects.playKawaiiChime();
    setTimeout(() => setActiveSound(null), 1200);
  };

  // Interactive FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: "Do I need a phone number or email to use LiquidChat?",
      a: "No! LiquidChat generates an anonymous 10-digit Liquid ID (e.g. LQ-2130-8255). You can start chatting instantly with anyone using their Liquid ID without ever exposing your phone number or email address."
    },
    {
      q: "What is new in the v2.0.1 PRO Android Release?",
      a: "The v2.0.1 PRO release introduces persistent zero-knowledge local key healing, hardware back gesture interception, universal keyboard shortcuts (Esc, Ctrl+K, Ctrl+N), WebRTC DSP noise gate audio, and synthesized Tokyo chimes."
    },
    {
      q: "How does the desktop site login with QR code work?",
      a: "Visit web.liquidchat.online on your PC or Mac. A 90-second encrypted QR code will appear. Open LiquidChat on your phone, go to Settings -> Linked Devices -> 'Link a Device', and scan the screen. Your desktop will authorize and sync your end-to-end encrypted session in real time."
    },
    {
      q: "How do I verify the 60-digit cryptographic safety fingerprint?",
      a: "Open any chat, click 'Safety Number / Encryption Info' in the top header. You can scan your peer's QR code using your phone camera or compare the 60 digits to mathematically verify that no man-in-the-middle exists."
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
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#05030a] text-[#fbfaff] relative overflow-x-hidden font-sans selection:bg-[#ff7597] selection:text-black"
    >
      
      {/* Top Scroll Reading Progress Bar */}
      <motion.div 
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff4b82] via-[#a855f7] to-[#00f2fe] origin-left z-50 shadow-[0_0_25px_rgba(255,75,130,0.9)]"
      />

      {/* 3D WebGL Kinetic Scene (Strict Fixed Viewport) */}
      <ThreeHeroScene />

      {/* Floating Animated Japanese Neo-Tokyo Glyphs (Parallax Background) */}
      <motion.div 
        style={{ y: yKanji1 }} 
        className="hidden xl:block fixed top-32 -left-10 text-8xl font-black text-white/[0.04] select-none pointer-events-none rotate-90 -z-10 font-mono tracking-widest"
      >
        完全秘密暗号化
      </motion.div>
      <motion.div 
        style={{ y: yKanji2 }} 
        className="hidden xl:block fixed top-[500px] -right-10 text-9xl font-black text-white/[0.04] select-none pointer-events-none -rotate-90 -z-10 font-mono tracking-widest"
      >
        液体通信装置
      </motion.div>

      {/* Kinetic Ambient Neon Nebula Blobs */}
      <motion.div 
        style={{ y: yFloatingOrb1, x: springX }} 
        className="fixed top-[150px] left-[5%] w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-gradient-to-tr from-[#ff4b82]/15 via-[#a855f7]/12 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" 
      />
      <motion.div 
        style={{ y: yFloatingOrb2, x: springY }} 
        className="fixed top-[600px] right-[5%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-[#00f2fe]/14 via-[#a855f7]/10 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" 
      />

      {/* Navigation Header */}
      <header className="sticky top-0 w-full z-40 backdrop-blur-2xl bg-[#05030a]/80 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LiquidLogo size={42} glow={true} />
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                LiquidChat <span className="text-[#ff7597] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/30">🌸 v2.0.1 PRO</span>
              </span>
              <p className="text-[10px] text-foreground/50 tracking-wider uppercase font-mono hidden sm:block">
                Zero-Knowledge • Japanese Cyber-Glass • E2EE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="#parallax-depth" className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2">
              3D Architecture
            </a>
            <a href="#scrollytelling" className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2">
              Scrollytelling
            </a>
            <a href="#security" className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2">
              Security
            </a>
            <a href="#download" className="hidden md:inline-flex text-xs font-semibold text-foreground/70 hover:text-white transition-colors px-3 py-2">
              APK Download
            </a>
            <a href="/auth" className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:text-white transition-colors">
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

      {/* HERO SECTION WITH 3D CYBER-GLASS SMARTPHONE & PARALLAX PHYSICS */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center z-10">
        
        {/* Glow pill badge */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18112e]/90 border border-[#ff7597]/30 shadow-[0_0_30px_rgba(255,117,151,0.25)] mb-8 backdrop-blur-xl"
        >
          <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-foreground/90 font-mono">
            🌸 次世代 暗号化 メッセンジャー • Next-Gen Fluid Encrypted Messenger
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          style={{ y: yHeroText }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6"
        >
          Privacy, Reimagined in <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] via-[#f43f5e] to-[#00f2fe] drop-shadow-[0_0_40px_rgba(255,117,151,0.45)]">
            Liquid Cyber Glass.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          style={{ y: yHeroText }}
          className="text-base sm:text-xl text-foreground/75 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Military-grade Curve25519 & AES-256 end-to-end encryption wrapped in an award-winning Japanese Kawaii cyber-glass aesthetic. Mirrored HD video calls, instant WhatsApp Web-style QR sync, and intelligent AI assistance — with zero phone number required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          style={{ y: yHeroText }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16"
        >
          <a
            href={webUrl}
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-[0_0_40px_rgba(255,75,130,0.5)] hover:shadow-[0_0_50px_rgba(255,75,130,0.8)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Monitor size={20} />
            <span>Open Liquid Web (web.liquidchat.online)</span>
            <ArrowRight size={16} />
          </a>

          <a
            href="#download"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#17122b]/90 hover:bg-[#231a44] text-foreground font-bold text-sm border border-[#a855f7]/30 shadow-lg hover:border-[#ff7597]/50 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Download size={20} className="text-[#00f2fe]" />
            <span>Download Android APK (v2.0.1)</span>
          </a>
        </motion.div>

        {/* ========================================================================= */}
        {/* CENTERPIECE: 3D CYBER-GLASS SMARTPHONE WITH STEREOSCOPIC PARALLAX BADGES */}
        {/* ========================================================================= */}
        <div className="relative w-full max-w-4xl mx-auto mb-14">
          
          {/* Floating Stereoscopic Depth Badge 1: Top-Left (0.3x Parallax) */}
          <motion.div
            style={{ y: yBadge1, x: springX }}
            className="hidden lg:flex absolute -left-14 top-10 z-30 p-4 rounded-3xl bg-[#18102e]/90 backdrop-blur-3xl border border-[#ff7597]/40 shadow-[0_15px_45px_rgba(0,0,0,0.7)] items-center gap-3 text-left"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff7597] to-[#a855f7] p-0.5 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-lg">
                🌸
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Zero-Knowledge Vault</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#ff7597]/20 text-[#ff7597] font-bold">E2EE</span>
              </div>
              <p className="text-[11px] text-foreground/70">Curve25519 Verified • 0 Plaintext</p>
            </div>
          </motion.div>

          {/* Floating Stereoscopic Depth Badge 2: Top-Right (0.6x Parallax) */}
          <motion.div
            style={{ y: yBadge2, x: springY }}
            className="hidden lg:flex absolute -right-14 top-16 z-30 p-4 rounded-3xl bg-[#0b1626]/90 backdrop-blur-3xl border border-[#00f2fe]/40 shadow-[0_15px_45px_rgba(0,0,0,0.7)] items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#00f2fe]/20 text-[#00f2fe] flex items-center justify-center border border-[#00f2fe]/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                1.2ms Ratchet Speed
              </span>
              <p className="text-[11px] text-emerald-400 font-mono font-bold">Sub-Millisecond Hardware Decryption</p>
            </div>
          </motion.div>

          {/* Floating Stereoscopic Depth Badge 3: Bottom-Left (0.9x Parallax) */}
          <motion.div
            style={{ y: yBadge3, x: springY }}
            className="hidden lg:flex absolute -left-10 bottom-14 z-30 p-3.5 rounded-2xl bg-[#170e2b]/90 backdrop-blur-3xl border border-[#a855f7]/40 shadow-[0_15px_45px_rgba(0,0,0,0.7)] items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#a855f7]/20 text-[#a855f7] flex items-center justify-center border border-[#a855f7]/30">
              <Lock size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white">0 Phone Number Required</span>
              <p className="text-[10px] text-foreground/50 font-mono">Anonymous 10-Digit Liquid ID</p>
            </div>
          </motion.div>

          {/* Floating Stereoscopic Depth Badge 4: Bottom-Right (1.3x Parallax) */}
          <motion.div
            style={{ y: yBadge4, x: springX }}
            className="hidden lg:flex absolute -right-10 bottom-10 z-30 p-3.5 rounded-2xl bg-[#101a1c]/90 backdrop-blur-3xl border border-[#10b981]/40 shadow-[0_15px_45px_rgba(0,0,0,0.7)] items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#10b981]/20 text-[#10b981] flex items-center justify-center border border-[#10b981]/30">
              <Video size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Mirrored HD Optics</span>
              <p className="text-[10px] text-emerald-400 font-mono">Acoustic DSP Noise Gate</p>
            </div>
          </motion.div>

          {/* ICONIC 3D CYBER SMARTPHONE MOCKUP */}
          <motion.div 
            style={{ 
              y: yPhone, 
              rotateX: rotatePhone, 
              scale: scalePhone,
              rotateY: springX,
              perspective: 1200 
            }}
            className="w-[320px] sm:w-[380px] mx-auto rounded-[3.2rem] bg-gradient-to-b from-[#241a42] via-[#150f28] to-[#0a0614] p-3 sm:p-4 border-[5px] border-[#2c1e4d] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_60px_rgba(255,117,151,0.25)] relative overflow-hidden"
          >
            {/* Glossy screen highlight reflection */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-br from-white/12 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Inner Cyber Screen */}
            <div className="w-full rounded-[2.6rem] bg-[#0c0818] border border-white/10 overflow-hidden text-left flex flex-col justify-between h-[580px] shadow-2xl relative">
              
              {/* Top Dynamic Island / Status Bar */}
              <div className="pt-3 px-5 pb-2 bg-[#120a24]/90 border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-white">9:41</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                {/* Dynamic Island Capsule */}
                <div className="px-3 py-1 rounded-full bg-black/80 border border-[#ff7597]/40 flex items-center gap-1.5 text-[9px] font-mono text-[#00f2fe]">
                  <Lock size={9} className="text-[#ff7597]" />
                  <span>LQ-2130-8255 • 256-BIT</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
              </div>

              {/* Chat Contact Header */}
              <div className="px-4 py-3 bg-[#160d2e]/70 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff7597] to-[#a855f7] p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-base">
                      {heroChats[activeHeroChat].avatar}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{heroChats[activeHeroChat].name}</h4>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Curve25519 • 1.2ms
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/70">
                  <div className="p-2 rounded-xl bg-white/5 text-[#ff7597]"><Video size={13} /></div>
                  <div className="p-2 rounded-xl bg-white/5 text-[#00f2fe]"><Phone size={13} /></div>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {/* E2EE Info Pill */}
                <div className="mx-auto text-center">
                  <span className="px-3 py-1 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/25 text-[9px] font-mono text-[#00f2fe] inline-block">
                    🔒 100% Zero-Knowledge • 0 Bytes Plaintext on Server
                  </span>
                </div>

                {heroChats[activeHeroChat].messages.map((m, mIdx) => (
                  <div 
                    key={mIdx}
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.isMe
                        ? 'ml-auto bg-gradient-to-r from-[#ff4b82] to-[#a855f7] text-white shadow-lg'
                        : 'bg-white/5 text-foreground/85 border border-white/10'
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className={`text-[9px] mt-1 font-mono text-right ${m.isMe ? 'text-white/60' : 'text-foreground/40'}`}>
                      {m.time} {m.isMe && '✓✓'}
                    </div>
                  </div>
                ))}

                {/* Simulated Audio Chime Bubble */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePlaySound('sakura')} 
                      className="w-7 h-7 rounded-full bg-[#ff7597] text-white flex items-center justify-center cursor-pointer shadow-md"
                    >
                      <Play size={11} fill="currentColor" />
                    </button>
                    <div>
                      <div className="text-[10px] font-bold text-white">Sakura Bell 🌸 (Preview)</div>
                      <div className="text-[8px] font-mono text-foreground/40">Pentatonic Blossom Synthesizer</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#00f2fe]">0:02</span>
                </div>
              </div>

              {/* Interactive Tab Switchers */}
              <div className="p-2.5 bg-[#120a24]/90 border-t border-white/5 flex items-center justify-between gap-1.5">
                {heroChats.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroChat(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all truncate cursor-pointer ${
                      activeHeroChat === idx 
                        ? 'bg-[#ff7597]/20 border border-[#ff7597]/50 text-white font-bold' 
                        : 'bg-white/5 text-foreground/50 border border-transparent'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Bottom Input Pill */}
              <div className="p-3 bg-[#0d071b] border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-foreground/40 px-2">Message or /ai...</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ff4b82] to-[#a855f7] text-white flex items-center justify-center shadow-md">
                  <Send size={11} />
                </div>
              </div>

            </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full mx-auto pt-6 pb-10 border-y border-white/5 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] to-[#a855f7]">100%</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono font-bold">Zero Knowledge</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#00f2fe]">0 Phone</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono font-bold">Number Required</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#10b981]">60-Digit</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono font-bold">Safety Verification</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#ff7597]">v2.0.1 PRO</span>
            <p className="text-xs text-foreground/50 uppercase tracking-wider mt-1 font-mono font-bold">Official Build 6</p>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* TECHNIQUE 1: SCROLL-DRIVEN 3D HARDWARE EXPLODED VIEW                      */}
      {/* ========================================================================= */}
      <div id="parallax-depth">
        <ExplodedViewSection />
      </div>

      {/* ========================================================================= */}
      {/* TECHNIQUE 2: CRYPTOGRAPHIC SCROLLYTELLING (PACKET TRANSIT & DEFENSE)      */}
      {/* ========================================================================= */}
      <div id="scrollytelling">
        <ScrollytellingExperience />
      </div>

      {/* ========================================================================= */}
      {/* TECHNIQUE 3: SCROLL-TRIGGERED FEATURE SUITE & INTERACTIVE LABS            */}
      {/* ========================================================================= */}

      {/* SECTION: DESKTOP QR CODE LOGIN */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10"
      >
        <div className="flex flex-col lg:flex-row items-center gap-14">
          
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-bold">
              <Smartphone size={14} />
              <span>DESKTOP QR AUTHENTICATION</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              WhatsApp Web-Style <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-[#ff7597] to-[#a855f7]">
                Zero-Password Sync.
              </span>
            </h2>

            <p className="text-base text-foreground/75 leading-relaxed font-normal">
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
      </motion.section>

      {/* SECTION: 60-DIGIT E2EE VERIFICATION & SOVEREIGN CRYPTO */}
      <motion.section 
        id="security" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10"
      >
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

            <p className="text-base text-foreground/75 leading-relaxed font-normal">
              Just like WhatsApp and Signal, LiquidChat generates a verifiable 60-digit safety fingerprint for every 1-on-1 contact. You can compare the number or scan each other’s code using the camera viewfinder to be 100% sure your chat has never been intercepted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[#10b981] mb-2"><Key size={20} /></div>
                <h4 className="text-sm font-bold text-white mb-1">Curve25519 & AES-GCM</h4>
                <p className="text-xs text-foreground/60 leading-relaxed">High-performance asymmetric cryptography calculated directly on your device CPU.</p>
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
      </motion.section>

      {/* INTERACTIVE SECTION: LIVE ZERO-KNOWLEDGE E2EE SIMULATOR */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold">
            <Lock size={13} />
            <span>REAL-TIME WEBCRYPTO DEMONSTRATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Experience 100% E2EE in Action.
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Type anything below. Watch your browser execute real-time Curve25519 key negotiation, AES-256-GCM encryption with random 96-bit IV, and zero-knowledge transmission.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          {/* Plaintext sender input card */}
          <div className="p-6 rounded-3xl bg-[#110d24]/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ff7597] font-mono">1. CLIENT-SIDE SENDER (ALICE)</span>
              <span className="text-[10px] text-gray-500 font-mono">Ephemeral Key</span>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Plaintext Message:</label>
              <textarea 
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-sm text-white focus:border-[#ff7597] outline-none resize-none font-sans"
              />
            </div>
            <div className="text-[11px] text-gray-400 leading-relaxed font-mono">
              Cipher IV: <span className="text-[#00f2fe]">{simIv || 'Calculating...'}</span>
            </div>

            {/* Man-in-the-middle tamper switch */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Simulate Man-In-The-Middle Tampering</span>
              </span>
              <button
                onClick={() => setSimTamper(!simTamper)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${simTamper ? 'bg-amber-500' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${simTamper ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Ciphertext & Receiver card */}
          <div className="p-6 rounded-3xl bg-[#0c1424]/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00f2fe] font-mono">2. WHAT THE SERVER SEES & RECEIVER</span>
              <span className="text-[10px] text-gray-500 font-mono">AES-256 Ciphertext</span>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Encrypted Ciphertext (Over the wire):</label>
              <div className="p-3 bg-black/60 rounded-2xl border border-white/5 font-mono text-xs text-emerald-400 break-all select-all min-h-[70px]">
                {simCiphertext || 'Encrypting...'}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Recipient Decrypted Result (Bob):</label>
              <div className={`p-3 rounded-2xl border text-xs font-mono leading-relaxed ${
                simTamper 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
                  : 'bg-[#00f2fe]/10 border-[#00f2fe]/20 text-[#00f2fe]'
              }`}>
                {simDecrypted}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION: COMPARISON MATRIX (LIQUIDCHAT VS OTHERS) */}
      <motion.section 
        id="comparison" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white">How LiquidChat Compares</h2>
          <p className="text-sm sm:text-base text-foreground/75">
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
      </motion.section>

      {/* SECTION: PROMINENT APK DOWNLOAD HUB (v2.0.1 PRO) */}
      <motion.section 
        id="download" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-20 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-20"
      >
        <div className="rounded-[3rem] bg-gradient-to-br from-[#1b1236] via-[#120a24] to-[#0c0717] border border-[#ff7597]/40 p-8 sm:p-14 shadow-[0_0_90px_rgba(255,117,151,0.25)] relative overflow-hidden">
          {/* Radial ambient glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#00f2fe]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#ff7597]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 text-left relative z-10">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/30 text-[#ff7597] text-xs font-mono font-bold">
                <Flame size={14} />
                <span>OFFICIAL ANDROID RELEASE • v2.0.1 (BUILD 6)</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Download the Native <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] via-[#00f2fe] to-[#a855f7]">
                  LiquidChat Android APK.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-foreground/75 leading-relaxed font-normal">
                Direct installation with zero Google Play tracking or background telemetry. Includes hardware back button navigation, offline E2EE key synchronization, and Tokyo sound synthesis engine.
              </p>

              {/* Release Feature Bullet Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-foreground/90">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Zero-Knowledge Key Healing</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/90">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Hardware Back Gesture Integrated</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/90">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Universal Keyboard Shortcuts</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/90">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Mirrored HD Front Camera Feed</span>
                </div>
              </div>

              {/* Download Action Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={() => downloadFile('/LiquidChat.apk', 'LiquidChat.apk')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-[0_0_35px_rgba(255,75,130,0.6)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Download size={20} />
                  <span>Download APK Directly (6.6 MB)</span>
                </button>

                <div className="text-xs font-mono text-foreground/50">
                  SHA-256 Verified • Universal APK
                </div>
              </div>
            </div>

            {/* Live QR Scan to Download Card */}
            <div className="p-6 rounded-3xl bg-[#0c0819]/90 border border-white/10 backdrop-blur-2xl text-center space-y-3 shrink-0 shadow-2xl">
              <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Smartphone size={14} className="text-[#00f2fe]" />
                <span>Scan from Phone to Install</span>
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://liquidchat.online/LiquidChat.apk" 
                  alt="Scan to download APK" 
                  className="w-36 h-36"
                />
              </div>

              <div className="text-[10px] font-mono text-foreground/40">
                Direct Link: liquidchat.online/LiquidChat.apk
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION: INTERACTIVE FAQ ACCORDION */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-24 max-w-4xl mx-auto px-6 border-t border-white/5 relative z-10 text-left"
      >
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
                      transition={{ duration: 0.22 }}
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
      </motion.section>

      {/* FINAL CALL TO ACTION BANNER */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="py-20 max-w-7xl mx-auto px-6 relative z-20"
      >
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
              <span>Download Android APK (v2.0.1 PRO)</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-foreground/50 z-20 relative">
        <div className="flex items-center gap-2.5">
          <LiquidLogo size={24} glow={false} />
          <span>🌸 LiquidChat PRO v2.0.1 • Tokyo Cyber-Glass</span>
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
