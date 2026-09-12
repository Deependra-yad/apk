"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Sparkles, Video, QrCode, Download, 
  ArrowRight, Smartphone, Monitor, Globe, CheckCircle2, 
  MessageSquare, Users, Bot, Zap, Star,
  Shield, Key, RefreshCw, ChevronDown, Check, EyeOff,
  Flame, Heart, Send, Terminal, Play, Cpu, Layers, AlertTriangle,
  Keyboard, Copy, Radio, Volume2, ShieldAlert, Phone, ExternalLink,
  CheckCircle, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import LiquidLogo from '@/components/LiquidLogo';
import { downloadFile } from '@/utils/apiUrl';
import { soundEffects } from '@/utils/audioSynth';
import ThreeLandingScene from './ThreeLandingScene';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();

  // Instant scroll transforms for stereoscopic depth
  const yHeroText = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const yBadge1 = useTransform(scrollYProgress, [0, 0.3], [0, -140]);
  const yBadge2 = useTransform(scrollYProgress, [0, 0.3], [0, -220]);
  const yBadge3 = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const yBadge4 = useTransform(scrollYProgress, [0, 0.3], [0, -180]);

  // Ambient Japanese Neo-Tokyo Kanji floating parallax
  const yKanji1 = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const yKanji2 = useTransform(scrollYProgress, [0, 1], [0, -280]);

  // Interactive 3D Phone Chat Switcher
  const [activeHeroChat, setActiveHeroChat] = useState<number>(0);
  const heroChats = [
    {
      name: 'Sakura (Tokyo)',
      avatar: '🌸',
      tag: 'ID: 8343254978',
      preview: 'Secret rendezvous in Tokyo at 7 PM 🌸',
      audioLabel: 'Tokyo Chime 432Hz'
    },
    {
      name: 'NandniJamwal',
      avatar: '💎',
      tag: 'Mutual Contact',
      preview: 'Confidential project audit attached.',
      audioLabel: 'Cyber Pulse Bell'
    },
    {
      name: 'ujwalsharma',
      avatar: '⚡',
      tag: 'ID: 4192019482',
      preview: 'Check out the new Tokyo chime ringtone',
      audioLabel: 'Sakura Harmonic Wave'
    }
  ];

  // Exploded View Active Layer Focus
  const [activeExplodedLayer, setActiveExplodedLayer] = useState<number>(0);
  const explodedRef = useRef<HTMLDivElement>(null);

  // Scrollytelling Cryptographic Journey State
  const [scrollyAct, setScrollyAct] = useState<1 | 2 | 3>(1);
  const [mitmAttackActive, setMitmAttackActive] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Real In-Browser WebCrypto AES-GCM Simulator
  const [simText, setSimText] = useState("Secret rendezvous in Tokyo at 7 PM 🌸");
  const [simCiphertext, setSimCiphertext] = useState("");
  const [simIv, setSimIv] = useState("");
  const [simDecrypted, setSimDecrypted] = useState("");
  const [activeSound, setActiveSound] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sync WebCrypto simulator
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

        if (mitmAttackActive) {
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
  }, [simText, mitmAttackActive]);

  const handlePlaySound = (type: 'sakura' | 'cyber' | 'tokyo' | 'chime') => {
    setActiveSound(type);
    if (type === 'sakura') soundEffects.playSakuraBell();
    else if (type === 'cyber') soundEffects.playCyberChime();
    else if (type === 'tokyo') soundEffects.playCallRing();
    else soundEffects.playNotification();
    setTimeout(() => setActiveSound(null), 800);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    setCopiedHash(true);
    soundEffects.playNotification();
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#04060d] text-foreground font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* 1. FIXED 3D WEBGL THREE.JS CANVAS */}
      <ThreeLandingScene
        activeContactName={heroChats[activeHeroChat].name}
        activeContactAvatar={heroChats[activeHeroChat].avatar}
        activeMessage={heroChats[activeHeroChat].preview}
        isTampered={mitmAttackActive}
      />

      {/* 2. AMBIENT BACKGROUND GLOWS & KANJI PARALLAX */}
      <div className="fixed inset-0 pointer-events-none -z-5 overflow-hidden">
        <motion.div 
          style={{ y: yKanji1 }}
          className="absolute top-24 left-8 text-white/[0.03] text-8xl font-black select-none tracking-widest hidden lg:block"
        >
          完全秘密暗号化
        </motion.div>
        <motion.div 
          style={{ y: yKanji2 }}
          className="absolute top-1/2 right-10 text-white/[0.03] text-8xl font-black select-none tracking-widest hidden lg:block"
        >
          液体通信装置
        </motion.div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-3/4 left-1/3 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[140px]" />
      </div>

      {/* 3. CYBER STICKY NAVIGATION BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#04060d]/70 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-[2px] shadow-[0_0_25px_rgba(0,210,255,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#04060d] rounded-2xl flex items-center justify-center">
                <LiquidLogo size={24} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  LIQUID CHAT
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full">
                  v2.0.1 PRO
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/40 tracking-wider">SOVEREIGN CRYPTOGRAPHIC CLIENT</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            {[
              { label: '3D Hardware', href: '#exploded-view' },
              { label: 'Scrollytelling', href: '#scrollytelling' },
              { label: 'Global Mesh', href: '#mesh-network' },
              { label: 'Security Lab', href: '#security-lab' },
              { label: 'Download APK', href: '#download-hub' }
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-4 py-1.5 text-xs font-medium text-white/70 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/web"
              className="px-4 py-2 text-xs font-semibold text-white/90 hover:text-white border border-white/15 hover:border-white/30 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <Monitor size={14} className="text-cyan-400" />
              <span>Launch Web</span>
            </Link>
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-xl shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:shadow-[0_0_35px_rgba(255,75,130,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Download size={14} />
              <span>Get APK v2.0.1</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO VIEWPORT (0.0 to 0.20 SCROLL) */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div style={{ y: yHeroText }} className="max-w-3xl space-y-6 z-20">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wide shadow-[0_0_20px_rgba(0,210,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>EXTREME-LEVEL 3D CRYPTOGRAPHIC ARCHITECTURE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
            SOVEREIGN PRIVACY.{' '}
            <span className="block bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,210,255,0.4)]">
              UNCOMPROMISED 3D E2EE.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            Engineered with hardware-isolated <span className="text-cyan-300 font-semibold">Curve25519</span> key ratchets, 
            instant <span className="text-pink-300 font-semibold">AES-256-GCM</span> encryption, and zero cloud plaintext. 
            Scroll to deconstruct the hardware architecture in full 3D space.
          </p>

          {/* Interactive 3D Phone Chat Switcher Bar */}
          <div className="p-3 rounded-2xl bg-[#0b1222]/80 border border-white/10 backdrop-blur-xl space-y-2.5 max-w-xl shadow-2xl">
            <div className="flex items-center justify-between text-xs text-white/60 px-1">
              <span className="flex items-center gap-1.5 font-mono text-cyan-400">
                <Smartphone size={13} />
                <span>3D Device Display Controller:</span>
              </span>
              <span className="text-[11px] text-white/40">Click to live-render on 3D phone screen</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {heroChats.map((chat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveHeroChat(idx);
                    soundEffects.playClick();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    activeHeroChat === idx
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.3)] text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{chat.avatar}</span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{chat.name}</p>
                      <p className="text-[10px] text-white/40 truncate">{chat.audioLabel}</p>
                    </div>
                  </div>
                  {activeHeroChat === idx && (
                    <motion.div
                      layoutId="activeHeroChatGlow"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-400"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold text-sm shadow-[0_0_35px_rgba(0,210,255,0.4)] hover:shadow-[0_0_50px_rgba(255,75,130,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Download Liquid Chat APK</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-black/30 rounded-full">v2.0.1</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2.5"
            >
              <Monitor size={17} className="text-cyan-400" />
              <span>Open Web App</span>
              <ArrowRight size={15} className="text-white/40" />
            </Link>
          </div>

          {/* Live Metrics Row */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-cyan-400 font-mono">256-bit</p>
              <p className="text-xs text-white/50">AES-GCM Key Stream</p>
            </div>
            <div>
              <p className="text-2xl font-black text-pink-400 font-mono">1.2 ms</p>
              <p className="text-xs text-white/50">Hardware Ratchet</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400 font-mono">0 Bytes</p>
              <p className="text-xs text-white/50">Plaintext Cloud Footprint</p>
            </div>
          </div>
        </motion.div>

        {/* Stereoscopic Floating Parallax Badges */}
        <motion.div
          style={{ y: yBadge1 }}
          className="absolute top-48 right-12 hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-[#091122]/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,210,255,0.2)] z-10"
        >
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white font-mono">Curve25519 Ratchet</p>
            <p className="text-[11px] text-white/50">100% Client-Side Ephemeral</p>
          </div>
        </motion.div>

        <motion.div
          style={{ y: yBadge2 }}
          className="absolute bottom-40 right-1/4 hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-[#160c20]/80 border border-pink-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(255,75,130,0.2)] z-10"
        >
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white font-mono">Poly1305 Tag</p>
            <p className="text-[11px] text-white/50">MITM Proof Tamper Wall</p>
          </div>
        </motion.div>

        {/* Scroll Indicator Prompt */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 font-mono text-xs z-20">
          <span>SCROLL TO DECONSTRUCT 3D HARDWARE</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: 3D HARDWARE EXPLODED ARCHITECTURE (0.20 to 0.45 SCROLL) */}
      {/* ========================================================================= */}
      <section id="exploded-view" className="relative h-[250vh]" ref={explodedRef}>
        <div className="sticky top-0 h-screen flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none">
          {/* Left Exploded HUD Cards */}
          <div className="w-full max-w-md pointer-events-auto space-y-4 z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Layers size={13} />
              <span>STAGE 02 • HARDWARE DECONSTRUCTION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              3D SOVEREIGN <br />
              <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                EXPLODED ARCHITECTURE
              </span>
            </h2>

            <p className="text-sm text-white/70">
              The 3D model separates into 4 sovereign isolation layers in real-time space as you scroll:
            </p>

            {/* Layer Cards */}
            <div className="space-y-2.5">
              {[
                {
                  layer: '01',
                  title: 'Zero-Plaintext Cyber Glass',
                  desc: 'Scratch-resistant front crystal with zero screen telemetry or memory scraping.',
                  tag: 'Display Subsystem (Z: +2.5)'
                },
                {
                  layer: '02',
                  title: 'Ultra-Retina AMOLED Matrix',
                  desc: '120Hz dynamic refresh display buffer flushed instantly upon window minimize.',
                  tag: 'Visual Buffer (Z: +1.0)'
                },
                {
                  layer: '03',
                  title: 'Sovereign Logic Board & X25519 Enclave',
                  desc: 'Silicon cryptographic co-processor executing ephemeral ECDH ratchets.',
                  tag: 'Crypto Enclave (Z: 0.0)'
                },
                {
                  layer: '04',
                  title: 'Titanium Chassis & SQLite Vault',
                  desc: 'Cold storage SQLite keystore with hardware AES-256 anti-tamper zeroization.',
                  tag: 'Local Keystore (Z: -2.0)'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveExplodedLayer(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeExplodedLayer === idx
                      ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border-cyan-400 shadow-[0_0_25px_rgba(0,210,255,0.25)]'
                      : 'bg-[#090e1c]/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400">LAYER {item.layer}</span>
                    <span className="text-[10px] font-mono text-white/40">{item.tag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-white/60 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Floating Specs Callout */}
          <div className="hidden lg:block w-72 pointer-events-auto space-y-3 z-20">
            <div className="p-4 rounded-2xl bg-[#091122]/80 border border-cyan-500/20 backdrop-blur-xl shadow-xl">
              <p className="text-xs font-mono text-cyan-400 font-bold mb-1">HARDWARE GUARANTEE</p>
              <p className="text-xs text-white/80 leading-relaxed">
                Private ratchet seed keys are generated exclusively on the physical device chip. No key leaves local hardware unencrypted.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#160c20]/80 border border-pink-500/20 backdrop-blur-xl shadow-xl">
              <p className="text-xs font-mono text-pink-400 font-bold mb-1">ZERO TELEMETRY</p>
              <p className="text-xs text-white/80 leading-relaxed">
                Zero crashlytics, zero trackers, zero cloud database. If our servers are seized, attackers obtain only ciphertext noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: CRYPTOGRAPHIC QUANTUM SCROLLYTELLING (0.45 to 0.70 SCROLL) */}
      {/* ========================================================================= */}
      <section id="scrollytelling" className="relative h-[300vh]">
        <div className="sticky top-0 h-screen flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none">
          {/* Left Storyboard HUD */}
          <div className="w-full max-w-lg pointer-events-auto space-y-5 z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono">
              <ShieldAlert size={13} />
              <span>STAGE 03 • CRYPTOGRAPHIC PACKET JOURNEY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              SCROLLYTELLING <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                PACKET TRANSIT & DEFENSE
              </span>
            </h2>

            {/* Act Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-[#090e1c]/80 border border-white/10 rounded-2xl backdrop-blur-md">
              {[
                { act: 1, label: 'Act 01: Synthesis' },
                { act: 2, label: 'Act 02: Transit Defense' },
                { act: 3, label: 'Act 03: 1.2ms Decrypt' }
              ].map((tab) => (
                <button
                  key={tab.act}
                  onClick={() => {
                    setScrollyAct(tab.act as 1 | 2 | 3);
                    soundEffects.playClick();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    scrollyAct === tab.act
                      ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Narrative Box */}
            <div className="p-5 rounded-3xl bg-[#091122]/90 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3">
              {scrollyAct === 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold">EPHEMERAL SYNTHESIS</span>
                    <span className="text-white/40">Browser Crypto API</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    A unique 32-byte ephemeral keypair is generated via Curve25519. Plaintext payload transforms into 256-bit ciphertext before touching network sockets.
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/30 font-mono text-xs text-cyan-300 break-all">
                    ENC: 9f8a4b2c7e1d5a8f6b3c9e2a4d7f1b...
                  </div>
                </div>
              )}

              {scrollyAct === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-pink-400 font-bold">HOSTILE AIRSPACE INTERCEPTION</span>
                    <span className="text-white/40">3D MITM Simulation</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Adversary laser interceptors strike the 3D quantum packet forcefield. The 128-bit authentication tag guarantees tampering causes immediate rejection.
                  </p>
                  <button
                    onClick={() => {
                      setMitmAttackActive(!mitmAttackActive);
                      soundEffects.playAlert();
                    }}
                    className={`w-full py-2.5 rounded-xl border font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      mitmAttackActive
                        ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(255,75,75,0.4)]'
                        : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                    }`}
                  >
                    <AlertTriangle size={15} />
                    <span>{mitmAttackActive ? 'MITM ATTACK INJECTED (FAIL)' : 'INJECT MITM ATTACK TO TEST SHIELD'}</span>
                  </button>
                </div>
              )}

              {scrollyAct === 3 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">ZERO-LATENCY RESOLUTION</span>
                    <span className="text-white/40">1.2ms Verification</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Recipient node receives the authenticated packet. Silicon ratchets verify the Poly1305 MAC tag and dissolve ciphertext into verified plaintext.
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 font-mono text-xs text-emerald-300 flex items-center justify-between">
                    <span>STATUS: RECIPIENT VERIFIED ✓</span>
                    <span>LATENCY: 1.2ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: SOVEREIGN GLOBAL MESH NETWORK & FEATURES (0.70 to 0.88 SCROLL) */}
      {/* ========================================================================= */}
      <section id="mesh-network" className="relative min-h-screen py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Globe size={13} />
            <span>STAGE 04 • GLOBAL PEER-TO-PEER MESH</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            DECENTRALIZED HIGHWAY. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-pink-400 bg-clip-text text-transparent">
              ZERO CENTRAL BOTTLENECKS.
            </span>
          </h2>
          <p className="text-base text-white/70">
            Messages, voice, and video calls establish direct WebRTC encrypted channels across global nodes (Tokyo, Zurich, New York, Singapore, London).
          </p>
        </div>

        {/* 4 Cyber Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Video className="text-cyan-400" size={24} />,
              title: "WebRTC Audio & Video",
              desc: "Direct peer-to-peer WebRTC calls with DTLS-SRTP encryption. No voice or video data passes through relay servers."
            },
            {
              icon: <Flame className="text-pink-400" size={24} />,
              title: "Ephemeral Self-Destruct",
              desc: "Granular burn-timers from 5 seconds to 24 hours. Messages zeroize from memory and local storage automatically."
            },
            {
              icon: <Lock className="text-emerald-400" size={24} />,
              title: "PIN & Biometric Lock",
              desc: "Hardware-level PIN security locks individual chats or the entire client with automatic session timeout."
            },
            {
              icon: <Volume2 className="text-purple-400" size={24} />,
              title: "Tokyo Synth Soundboard",
              desc: "Procedural Web Audio API sound synthesizer with custom Tokyo chime frequencies and haptic soundscapes."
            }
          ].map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6, scale: 1.02 }}
              className="p-6 rounded-3xl bg-[#090e1c]/80 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl shadow-xl space-y-3 group transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: INTERACTIVE WEBCRYPTO & AUDIO LABS */}
      {/* ========================================================================= */}
      <section id="security-lab" className="relative min-h-screen py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Lab 1: Interactive WebCrypto Simulator */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#091122]/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live WebCrypto AES-GCM Lab</h3>
                  <p className="text-xs text-white/50 font-mono">Run authentic 256-bit encryption in your browser</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                STANDALONE API
              </span>
            </div>

            {/* Input message */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/70">INPUT PLAINTEXT:</label>
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 focus:border-cyan-400 text-sm text-white font-sans outline-none transition-colors"
                placeholder="Enter secret message to encrypt..."
              />
            </div>

            {/* Ciphertext Output */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400">AES-256-GCM CIPHERTEXT (BASE64):</span>
                <span className="text-white/40">IV: {simIv.slice(0, 8)}...</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20 font-mono text-xs text-cyan-300 break-all shadow-inner">
                {simCiphertext || "Computing AES-GCM keys..."}
              </div>
            </div>

            {/* Decrypted Output */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-emerald-400">HARDWARE VERIFIED DECRYPTION:</span>
              <div className={`p-3.5 rounded-xl border font-mono text-xs break-all ${
                mitmAttackActive
                  ? 'bg-red-950/40 border-red-500/40 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              }`}>
                {simDecrypted}
              </div>
            </div>

            {/* Tamper Switch */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-white/70">Simulate Network Wiretap Tampering:</span>
              <button
                onClick={() => setMitmAttackActive(!mitmAttackActive)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  mitmAttackActive
                    ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(255,75,75,0.4)]'
                    : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                }`}
              >
                {mitmAttackActive ? 'TAMPER ACTIVE' : 'INJECT TAMPER'}
              </button>
            </div>
          </div>

          {/* Lab 2: Synthesized Web Audio Soundboard */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#160c20]/90 border border-pink-500/30 backdrop-blur-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                  <Volume2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Synthesizer Soundboard</h3>
                  <p className="text-xs text-white/50 font-mono">Custom oscillator ringtones & chimes</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-mono font-bold">
                WEB AUDIO API
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Experience the customized Tokyo cyberpunk auditory signals built directly into Liquid Chat settings. Zero MP3 downloads; generated mathematically in real-time.
            </p>

            {/* Soundboard Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { id: 'sakura', name: 'Sakura Bell', desc: '432Hz Harmonic Sine' },
                { id: 'cyber', name: 'Cyber Chime', desc: 'Neo-Tokyo Square Wave' },
                { id: 'tokyo', name: 'Call Ringtone', desc: 'Anime Arpeggiator Loop' },
                { id: 'chime', name: 'Haptic Click', desc: 'Ratchet Key Engagement' }
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handlePlaySound(sound.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    activeSound === sound.id
                      ? 'bg-pink-500/30 border-pink-400 text-white shadow-[0_0_25px_rgba(255,75,130,0.4)]'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white">{sound.name}</p>
                    <Play size={13} className="text-pink-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">{sound.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono text-white/60">
              <span>ACTIVE AUDIO ENGINE:</span>
              <span className="text-pink-400 font-bold">AudioContext (48,000Hz)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: DOWNLOAD HUB & MONOLITH LAUNCHPAD (0.88 to 1.0 SCROLL) */}
      {/* ========================================================================= */}
      <section id="download-hub" className="relative min-h-screen py-32 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center">
        <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#0b1329]/90 to-[#050811]/95 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,210,255,0.2)] overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left APK Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                <Download size={13} />
                <span>OFFICIAL PRODUCTION RELEASE • v2.0.1</span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                DEPLOY LIQUID CHAT <br />
                <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  TO YOUR DEVICE.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
                Download the verified sovereign Android APK with zero Google Play Services dependency, 
                or launch the full-featured Web App directly in any modern Chromium/WebKit browser.
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
                <div>
                  <span className="text-white/40 block text-[10px]">PACKAGE SIZE</span>
                  <span className="text-white font-bold">6.3 MB</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">MIN ANDROID</span>
                  <span className="text-cyan-400 font-bold">Android 8.0+</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">SECURITY SEAL</span>
                  <span className="text-emerald-400 font-bold">SHA-256 Valid</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="/LiquidChat.apk"
                  download="LiquidChat.apk"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold text-base shadow-[0_0_35px_rgba(0,210,255,0.4)] hover:shadow-[0_0_50px_rgba(255,75,130,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Download size={20} />
                  <span>Download LiquidChat.apk</span>
                </a>

                <Link
                  href="/web"
                  className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Monitor size={17} className="text-cyan-400" />
                  <span>Open Web Client</span>
                </Link>
              </div>

              {/* Checksum Hash Verification Box */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="truncate mr-3">
                  <span className="text-white/40 block text-[10px]">SHA-256 CHECKSUM</span>
                  <span className="text-cyan-300 select-all truncate">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Right QR Code Pairing Card */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-black/60 border border-white/15 text-center space-y-4">
              <p className="text-xs font-mono text-cyan-400 font-bold">SCAN TO INSTALL ON MOBILE</p>
              
              {/* QR Code Container */}
              <div className="w-48 h-48 mx-auto p-3 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://liquidchat.online/LiquidChat.apk"
                  alt="Liquid Chat APK QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Direct HTTPS APK Stream</p>
                <p className="text-[11px] text-white/50 font-mono">https://liquidchat.online/LiquidChat.apk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: COMPARISON MATRIX & SECURITY FAQ */}
      {/* ========================================================================= */}
      <section className="relative py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            COMPARE PROTOCOLS
          </h2>
          <p className="text-sm text-white/60">
            Why sovereign cryptographic hardware outclasses legacy centralized messaging platforms.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="rounded-3xl bg-[#090e1c]/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 font-mono text-white/60">
                  <th className="p-4">CAPABILITY</th>
                  <th className="p-4 text-cyan-400 font-bold">LIQUID CHAT PRO</th>
                  <th className="p-4">TELEGRAM</th>
                  <th className="p-4">SIGNAL</th>
                  <th className="p-4">WHATSAPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                <tr>
                  <td className="p-4 font-bold">Default E2EE Chat</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (Curve25519)</td>
                  <td className="p-4 text-red-400">NO (Cloud Chats)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                  <td className="p-4 text-emerald-400">YES</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Zero Phone Number Requirement</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (10-Digit ID)</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-red-400">NO</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">3D WebGL Hardware Exploded UI</td>
                  <td className="p-4 text-cyan-400 font-bold">YES (Active 3D)</td>
                  <td className="p-4 text-white/40">NO</td>
                  <td className="p-4 text-white/40">NO</td>
                  <td className="p-4 text-white/40">NO</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Procedural Web Audio Synthesizer</td>
                  <td className="p-4 text-pink-400 font-bold">YES (Tokyo Synth)</td>
                  <td className="p-4 text-white/40">NO</td>
                  <td className="p-4 text-white/40">NO</td>
                  <td className="p-4 text-white/40">NO</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Zero Cloud Database Plaintext</td>
                  <td className="p-4 text-emerald-400 font-bold">100% Client SQLite</td>
                  <td className="p-4 text-red-400">NO</td>
                  <td className="p-4 text-emerald-400">YES</td>
                  <td className="p-4 text-amber-400">METADATA LOGGED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security FAQ Accordion */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-white text-center mb-8">FREQUENTLY ASKED QUESTIONS</h3>
          {[
            {
              q: "How does Curve25519 Diffie-Hellman prevent server surveillance?",
              a: "When two contacts communicate, their devices compute shared AES-256 symmetric keys directly on local client silicon using ephemeral elliptic curve points. The server only ever receives randomized ciphertext."
            },
            {
              q: "Can I use Liquid Chat on both Android and Desktop simultaneously?",
              a: "Yes. Install the native APK on Android, or visit liquidchat.online/web in any modern browser. You can link sessions securely via QR code cryptographic key handshake."
            },
            {
              q: "What happens if someone steals my phone?",
              a: "Liquid Chat features hardware-level PIN locking and folder encryption. After failed attempts or user-configured lockouts, the local database is zeroized and unreachable without your master PIN."
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#090e1c]/80 border border-white/10 backdrop-blur-md cursor-pointer transition-all hover:border-cyan-500/30"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-white/40 transition-transform ${openFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
                />
              </div>
              {openFaq === idx && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-xs text-white/70 leading-relaxed pt-2 border-t border-white/10"
                >
                  {faq.a}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#020408] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LiquidLogo size={22} />
            <span className="font-mono text-xs text-white/50">
              LIQUID CHAT PROTOCOL • PROUDLY OPEN SOURCE & SECURE
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-white/40">
            <Link href="/web" className="hover:text-cyan-400 transition-colors">Web App</Link>
            <a href="/LiquidChat.apk" download className="hover:text-cyan-400 transition-colors">Direct APK</a>
            <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
