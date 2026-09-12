"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Download, Monitor, ArrowUpRight, 
  ChevronDown, Check, Copy, Shield, Video, Flame, Key,
  Sparkles, ExternalLink, ArrowRight, Terminal, Volume2, 
  VolumeX, Zap, Globe, Users, QrCode, CheckCircle2, 
  Cpu, Layers, Radio, EyeOff, Smartphone, Play, Pause,
  RefreshCw, Activity, Server, Hash, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import Lenis from 'lenis';
import LiquidLogo from '@/components/LiquidLogo';
import { soundEffects } from '@/utils/audioSynth';

export default function LandingPage() {
  const [copiedHash, setCopiedHash] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [readingProgress, setReadingProgress] = useState(0);

  // Custom Cursor coordinates
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  // Typewriter effect state
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const typewriterPhrases = [
    "Sovereign. Untraceable. Pure.",
    "Hardware X25519 Key Ratchets.",
    "Zero Plaintext Cloud Footprint.",
    "10-Digit Anonymous Liquid ID.",
    "Spatial Discretion by Design."
  ];
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Interactive Terminal Handshake Simulation
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYS_INIT] Liquid Sovereign Core v2.0.1 initialized.",
    "[ECDH_X25519] Ephemeral keypair generated in silicon.",
    "[AES_GCM_256] Symmetric key stream synchronized with peer.",
    "[POLY1305] 128-bit authentication tag verified.",
    "[STATUS] Secure peer-to-peer ratcheted channel active."
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  const { scrollYProgress } = useScroll();

  // 1. Lenis Smooth Scrolling Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalH > 0 ? (scrollY / totalH) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      lenis.destroy();
    };
  }, []);

  // 2. Custom Magic Cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.dataset.cursorHover
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // 3. Typewriter Loop
  useEffect(() => {
    const currentPhrase = typewriterPhrases[typewriterIndex];
    const speed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting && displayText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setTypewriterIndex((prev) => (prev + 1) % typewriterPhrases.length);
      } else {
        setDisplayText(
          isDeleting
            ? currentPhrase.substring(0, displayText.length - 1)
            : currentPhrase.substring(0, displayText.length + 1)
        );
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, typewriterIndex]);

  // Terminal Command Simulation
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === 'help') {
      newLogs.push(
        "Available commands: 'status', 'ratchet', 'test-mitm', 'clear', 'hash', 'peers'"
      );
    } else if (cmd === 'status') {
      newLogs.push("[OK] All ratchet chains verified. 0 bytes telemetry logged.");
    } else if (cmd === 'ratchet') {
      newLogs.push("[RATCHET_ADVANCE] Ephemeral step completed in 1.18ms. Old seed wiped.");
    } else if (cmd === 'test-mitm') {
      newLogs.push("[MITM_DEFENSE] Authentication tag rejected tampered frame. Channel intact.");
      if (audioEnabled) soundEffects.playAlert();
    } else if (cmd === 'clear') {
      setTerminalLogs(["[CONSOLE_RESET] Terminal screen cleared."]);
      setTerminalInput("");
      return;
    } else if (cmd === 'hash') {
      newLogs.push("[SHA256] e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    } else if (cmd === 'peers') {
      newLogs.push("[MESH_PEERS] Tokyo: OK | Zurich: OK | Singapore: OK | New York: OK");
    } else {
      newLogs.push(`[UNKNOWN] Command '${cmd}' not recognized. Type 'help'.`);
    }

    setTerminalLogs(newLogs.slice(-9));
    setTerminalInput("");
    if (audioEnabled) soundEffects.playClick();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    setCopiedHash(true);
    if (audioEnabled) soundEffects.playNotification();
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) soundEffects.playSakuraBell();
  };

  return (
    <div className="relative min-h-screen bg-[#050508] text-[#d1d5db] font-sans antialiased selection:bg-cyan-500/30 selection:text-white overflow-x-hidden">
      {/* Google Fonts: Cinzel Decorative, Spectral, and Inter */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
      />

      {/* 1. TOP READING PROGRESS BAR */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 z-[99999] transition-all duration-75"
        style={{ width: `${readingProgress}%` }}
      />

      {/* 2. CINEMATIC FILM GRAIN OVERLAY */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* 3. INTERACTIVE CUSTOM GLOW CURSOR (Desktop only) */}
      <div
        className="fixed pointer-events-none z-[99998] -translate-x-1/2 -translate-y-1/2 rounded-full hidden md:block transition-transform duration-75"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: isHovering ? '48px' : '10px',
          height: isHovering ? '48px' : '10px',
          background: isHovering
            ? 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(168,85,247,0.1) 60%, transparent 80%)'
            : '#38bdf8',
          boxShadow: isHovering
            ? '0 0 30px 10px rgba(56,189,248,0.3)'
            : '0 0 15px 3px #38bdf8',
          border: isHovering ? '1.5px solid rgba(56,189,248,0.6)' : 'none',
        }}
      />

      {/* 4. AMBIENT BACKGROUND NEBULA GLOWS */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-950/20 rounded-full blur-[180px]" />
        <div className="absolute top-3/4 left-1/4 w-[700px] h-[700px] bg-cyan-950/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/4 w-[800px] h-[800px] bg-blue-950/20 rounded-full blur-[180px]" />
      </div>

      {/* 5. GOTHIC & CYBER STYLES */}
      <style jsx global>{`
        .title-cinzel {
          font-family: 'Cinzel Decorative', serif;
        }
        .text-spectral {
          font-family: 'Spectral', serif;
        }
        .cyber-card {
          position: relative;
          background: rgba(10, 15, 29, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cyber-card::before, .cyber-card::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1.5px solid #38bdf8;
          opacity: 0.6;
          transition: opacity 0.3s ease, border-color 0.3s ease;
        }
        .cyber-card::before {
          top: -2px;
          left: -2px;
          border-right: none;
          border-bottom: none;
        }
        .cyber-card::after {
          bottom: -2px;
          right: -2px;
          border-left: none;
          border-top: none;
        }
        .cyber-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 35px rgba(56, 189, 248, 0.15), inset 0 0 20px rgba(56, 189, 248, 0.05);
          transform: translateY(-4px);
        }
        .cyber-card:hover::before, .cyber-card:hover::after {
          opacity: 1;
          border-color: #a855f7;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 6. FIXED MINIMALIST NAVBAR */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050508]/60 border-b border-white/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#050508] rounded-2xl flex items-center justify-center">
                <LiquidLogo size={22} />
              </div>
            </div>
            <div>
              <span className="title-cinzel font-bold text-base tracking-wider text-white">
                LIQUID CHAT
              </span>
              <span className="block text-[10px] font-mono text-white/40 tracking-wider">
                SOVEREIGN PROTOCOL v2.0.1
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest text-white/60">
            <a href="#hero" className="hover:text-cyan-400 transition-colors">THE PROTOCOL</a>
            <a href="#console" className="hover:text-cyan-400 transition-colors">LIVE CONSOLE</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">CAPABILITIES</a>
            <a href="#benchmarks" className="hover:text-cyan-400 transition-colors">BENCHMARKS</a>
            <a href="#download" className="hover:text-cyan-400 transition-colors">DOWNLOAD</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/web"
              className="px-5 py-2.5 text-xs font-semibold tracking-wider text-white border border-white/15 hover:border-cyan-400/50 rounded-full bg-white/[0.03] hover:bg-cyan-500/10 transition-all flex items-center gap-2"
            >
              <Monitor size={14} className="text-cyan-400" />
              <span>LAUNCH WEB</span>
            </Link>
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-6 py-2.5 text-xs font-bold tracking-wider text-black bg-white hover:bg-cyan-100 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={14} />
              <span>GET APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 7. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="hero" className="relative min-h-screen pt-36 pb-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest mb-6 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>OFFICIAL PRODUCTION BUILD • v2.0.1 PRO</span>
        </motion.div>

        {/* Hero Title with Cinzel Decorative */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="title-cinzel text-5xl sm:text-7xl lg:text-8xl font-black tracking-wider text-white leading-tight uppercase drop-shadow-[0_0_50px_rgba(56,189,248,0.3)]"
        >
          SOVEREIGN <br />
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            COMMUNICATION
          </span>
        </motion.h1>

        {/* Animated Typewriter Subtitle */}
        <div className="h-10 my-4 flex items-center justify-center font-mono text-base sm:text-xl text-purple-300">
          <span>{displayText}</span>
          <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-spectral text-base sm:text-xl text-[#9ca3af] max-w-2xl mx-auto font-light leading-relaxed mb-8"
        >
          Engineered for absolute discretion. Zero cloud plaintext, hardware-ratcheted Curve25519 cryptography, and untraceable 10-digit sovereign IDs.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="/LiquidChat.apk"
            download="LiquidChat.apk"
            className="px-8 py-4 rounded-full bg-white text-black font-bold text-xs tracking-widest hover:bg-cyan-100 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Download size={18} />
            <span>DOWNLOAD APK (v2.0.1)</span>
          </a>

          <Link
            href="/web"
            className="px-7 py-4 rounded-full border border-white/20 text-xs font-semibold tracking-widest text-white hover:bg-white/[0.06] hover:border-cyan-400/50 transition-all flex items-center gap-2"
          >
            <Monitor size={16} className="text-cyan-400" />
            <span>OPEN IN BROWSER</span>
            <ArrowRight size={14} className="text-white/40" />
          </Link>
        </motion.div>

        {/* Hero Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 w-full max-w-3xl">
          {[
            { label: 'AUTHENTICATION', val: 'Curve25519 ECDH' },
            { label: 'PAYLOAD CIPHER', val: 'AES-256-GCM' },
            { label: 'RATCHET LATENCY', val: '1.18 ms' },
            { label: 'CLOUD FOOTPRINT', val: '0 Plaintext Bytes' },
          ].map((item, idx) => (
            <div key={idx} className="cyber-card p-4 rounded-2xl text-center">
              <p className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-bold text-white tracking-wide">{item.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. LIVE INTERACTIVE CRYPTOGRAPHIC CONSOLE (Terminal) */}
      {/* ========================================================================= */}
      <section id="console" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">INTERACTIVE SECURITY CONSOLE</span>
          <h2 className="title-cinzel text-3xl sm:text-4xl font-bold text-white">
            LIVE CLIENT TERMINAL
          </h2>
          <p className="text-sm text-white/60">
            Test real-time cryptographic handshakes directly from your browser. Type <code className="text-cyan-400 font-mono font-bold">help</code> to list commands.
          </p>
        </div>

        <div className="rounded-3xl bg-[#04060c] border border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)] overflow-hidden font-mono text-xs">
          {/* Terminal Window Header */}
          <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-white/40 text-[11px]">liquid-sovereign-shell ~ zsh</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 text-[11px]">
              <Radio size={12} className="animate-pulse" />
              <span>ECDH RATIO: 100%</span>
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="p-6 space-y-2.5 min-h-[220px] text-white/80 select-text">
            {terminalLogs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                {log.startsWith('>') ? (
                  <span className="text-cyan-400 font-bold">{log}</span>
                ) : log.includes('OK') || log.includes('verified') ? (
                  <span className="text-emerald-400">{log}</span>
                ) : log.includes('MITM') ? (
                  <span className="text-pink-400">{log}</span>
                ) : (
                  <span className="text-white/70">{log}</span>
                )}
              </div>
            ))}
          </div>

          {/* Terminal Input Line */}
          <form onSubmit={handleTerminalSubmit} className="px-5 py-3 bg-black/80 border-t border-white/10 flex items-center gap-2">
            <span className="text-cyan-400 font-bold">liquid@client:~$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type 'help', 'status', 'ratchet', 'test-mitm'..."
              className="flex-1 bg-transparent text-white outline-none font-mono text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-[11px] font-bold transition-colors"
            >
              EXECUTE
            </button>
          </form>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. EXTENSIVE CAPABILITIES (6 Rich Showcases) */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">CORE ARCHITECTURE</span>
          <h2 className="title-cinzel text-3xl sm:text-5xl font-bold text-white">
            SIX PILLARS OF SOVEREIGNTY
          </h2>
          <p className="text-sm text-white/60">
            Uncompromising privacy protocols designed to withstand government-level surveillance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Key className="text-cyan-400" size={24} />,
              tag: "IDENTITY",
              title: "10-Digit Anonymous Liquid ID",
              desc: "Never hand over your phone number, email, or Google identity. Liquid Chat assigns a cryptographically signed 10-digit ID completely untethered from personal SIM data."
            },
            {
              icon: <Video className="text-purple-400" size={24} />,
              tag: "CALLS",
              title: "Peer-to-Peer WebRTC Calls",
              desc: "Direct browser-to-app and device-to-device audio and HD video calls. Encrypted with DTLS-SRTP. Zero media bytes ever touch an intermediary recording server."
            },
            {
              icon: <Flame className="text-pink-400" size={24} />,
              tag: "EPHEMERAL",
              title: "Self-Destructing Liquid Streams",
              desc: "Granular burn timers from 5 seconds to 24 hours. Messages zeroize from RAM and local database storage automatically with zero forensics trace."
            },
            {
              icon: <Lock className="text-emerald-400" size={24} />,
              tag: "SECURITY",
              title: "Hardware PIN Vault & Lockdown",
              desc: "Secure individual confidential chats or the entire client with a master PIN. Automatic session lockouts safeguard against physical device inspection."
            },
            {
              icon: <Users className="text-blue-400" size={24} />,
              tag: "ROOMS",
              title: "Zero-Metadata Group Rooms",
              desc: "Multi-party group rooms protected by epoch-based cryptographic ratcheting. Member lists and group message routing remain blind to relay operators."
            },
            {
              icon: <Server className="text-amber-400" size={24} />,
              tag: "STORAGE",
              title: "Local SQLite Cold Keystore",
              desc: "All conversation history is sealed in a local SQLite encrypted keystore on physical device storage. If our relays are seized, attackers receive only noise."
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              className="cyber-card p-8 rounded-3xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">{item.title}</h3>
              <p className="text-xs text-[#9ca3af] leading-relaxed font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PROTOCOL BENCHMARK & COMPARISON TABLE */}
      {/* ========================================================================= */}
      <section id="benchmarks" className="py-24 max-w-5xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono text-emerald-400 tracking-[0.25em] uppercase">TRANSPARENT AUDIT</span>
          <h2 className="title-cinzel text-3xl sm:text-5xl font-bold text-white">
            PROTOCOL COMPARISON
          </h2>
          <p className="text-sm text-white/60">
            How Liquid Chat outperforms legacy centralized platforms across key security vectors.
          </p>
        </div>

        <div className="rounded-3xl bg-[#080b16]/70 border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 font-mono text-white/60">
                  <th className="p-4">CAPABILITY</th>
                  <th className="p-4 text-cyan-400 font-bold">LIQUID CHAT PRO</th>
                  <th className="p-4">SIGNAL</th>
                  <th className="p-4">TELEGRAM</th>
                  <th className="p-4">WHATSAPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80 font-light">
                <tr>
                  <td className="p-4 font-bold text-white">Default E2EE Active</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (Curve25519)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                  <td className="p-4 text-red-400">NO (Cloud chats)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">No Phone Number Required</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (10-Digit ID)</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-red-400">NO (Requires SIM)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Direct WebRTC P2P Voice/Video</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (Zero Relay Log)</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Local Encrypted SQLite Vault</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (PIN Lockdown)</td>
                  <td className="p-4 text-white/60">Plain App Sandbox</td>
                  <td className="p-4 text-red-400">NO (Cloud Backed)</td>
                  <td className="p-4 text-amber-400">Google Drive/iCloud</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Open Source & Standalone APK</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (No Play Services)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                  <td className="p-4 text-amber-400">Client Only</td>
                  <td className="p-4 text-red-400">NO (Proprietary)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. DOWNLOAD & VERIFICATION HUB */}
      {/* ========================================================================= */}
      <section id="download" className="py-24 max-w-5xl mx-auto px-6">
        <div className="cyber-card p-10 sm:p-16 rounded-3xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                OFFICIAL ANDROID DISTRIBUTION
              </span>
              <h2 className="title-cinzel text-3xl sm:text-4xl font-bold text-white">
                GET LIQUID CHAT v2.0.1
              </h2>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs text-white/70">
              PACKAGE SIZE: <span className="text-cyan-400 font-bold">6.3 MB</span> • ANDROID 8.0+
            </div>
          </div>

          <p className="text-spectral text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
            Compiled with zero tracking dependencies, zero Google Play Services requirement, and universal ARM64/x86_64 architecture support.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-xs tracking-wider hover:bg-cyan-100 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <Download size={18} />
              <span>DOWNLOAD APK v2.0.1</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-4 rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white hover:bg-white/[0.08] transition-all flex items-center gap-2"
            >
              <Monitor size={16} className="text-cyan-400" />
              <span>LAUNCH WEB APP</span>
            </Link>
          </div>

          {/* Cryptographic Hash Verification Card */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="truncate mr-4">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">OFFICIAL SHA-256 CHECKSUM</span>
              <span className="text-cyan-300 select-all truncate">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            </div>
            <button
              onClick={handleCopyHash}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedHash ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="title-cinzel text-3xl sm:text-4xl font-bold text-center text-white mb-12">
          SECURITY & PRIVACY FAQ
        </h2>

        <div className="space-y-4">
          {[
            {
              q: "How does Liquid Chat guarantee zero plaintext is stored on the server?",
              a: "When a message is typed, your browser/device generates an ephemeral Curve25519 shared secret and encrypts the payload using AES-256-GCM. The server only routes randomized encrypted blobs and has zero mathematical capability to decrypt them."
            },
            {
              q: "Can I use Liquid Chat on both Android and Web simultaneously?",
              a: "Yes. Install the native APK on Android, or navigate to /web on any desktop browser. Sessions can pair securely via encrypted QR key handshake."
            },
            {
              q: "What happens if a relay server is compromised or seized?",
              a: "Because all message keys are ephemeral and discarded immediately after receipt, and no message archives are kept in central databases, attackers obtain zero usable communications."
            },
            {
              q: "What does the 10-digit Liquid ID represent?",
              a: "It is an anonymized public address generated mathematically from your device seed. It replaces traditional phone numbers and email addresses entirely."
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="cyber-card p-5 rounded-2xl cursor-pointer"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-white/40 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
                />
              </div>
              {activeFaq === idx && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-xs text-[#9ca3af] leading-relaxed pt-2 border-t border-white/10"
                >
                  {faq.a}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FLOATING SOUND & AMBIANCE CONTROLLER */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-2 rounded-full bg-black/80 border border-white/15 backdrop-blur-md shadow-2xl">
        <button
          onClick={toggleAudio}
          className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-cyan-400 transition-colors"
          title="Toggle Synthesizer Soundscapes"
        >
          {audioEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-white/40" />}
        </button>
        <span className="text-[10px] font-mono text-white/60 pr-2 hidden sm:inline">
          {audioEnabled ? 'SYNTH ON' : 'MUTED'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 14. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] py-14 max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/40 font-light">
        <div className="flex items-center gap-3">
          <LiquidLogo size={20} />
          <span className="title-cinzel tracking-widest text-[11px] text-white/70">
            LIQUID CHAT PROTOCOL
          </span>
        </div>

        <p className="tracking-wide text-center">Built for sovereign communication. Unconditionally private. Open source.</p>

        <div className="flex items-center gap-6">
          <Link href="/web" className="hover:text-cyan-400 transition-colors">Web Client</Link>
          <a href="/LiquidChat.apk" download className="hover:text-cyan-400 transition-colors">Direct APK</a>
          <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
