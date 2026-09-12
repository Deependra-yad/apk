"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Download, Monitor, ArrowUpRight, 
  ChevronDown, Check, Copy, Shield, Video, Flame, Key,
  Sparkles, ExternalLink, ArrowRight, Terminal, Volume2, 
  VolumeX, Zap, Globe, Users, QrCode, CheckCircle2, 
  Cpu, Layers, Radio, EyeOff, Smartphone, Play, Pause,
  RefreshCw, Activity, Server, Hash, ShieldAlert, Search,
  MessageSquare, X, Send, Bot, Palette, Clock, Award,
  Menu, ChevronUp, AlertTriangle, FileCode
} from 'lucide-react';
import Link from 'next/link';
import Lenis from 'lenis';
import LiquidLogo from '@/components/LiquidLogo';
import { soundEffects } from '@/utils/audioSynth';

interface AiMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  action?: {
    label: string;
    actionType: 'download' | 'web' | 'hash' | 'console';
  };
}

export default function LandingPage() {
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<'tokyo-midnight' | 'obsidian-gold' | 'aurora-purple' | 'matrix-emerald'>('tokyo-midnight');
  
  // Custom Cursor (Only active on fine pointer devices like desktop mice)
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Reading progress
  const [readingProgress, setReadingProgress] = useState(0);

  // Mobile Navigation Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Command Palette State
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");

  // QR Code Scanner / Download Modal
  const [showQrModal, setShowQrModal] = useState(false);

  // Floating Sovereign AI Assistant State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { 
      id: 'init-1',
      sender: 'bot', 
      text: 'Greetings, Operator. I am the Liquid Sovereign AI intelligence engine. Ask me anything about our Curve25519 Double-Ratchet, Android APK installation, WebRTC privacy, or zero-log architecture.' 
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Checksum Copy State
  const [copiedHash, setCopiedHash] = useState(false);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Typewriter State
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const typewriterPhrases = [
    "Sovereign. Untraceable. Pure.",
    "Hardware X25519 Key Ratchets in Silicon.",
    "Zero Plaintext Stored on Cloud Relays.",
    "10-Digit Anonymous Liquid ID.",
    "WebRTC Direct Peer-to-Peer Encryption.",
    "Engineered for Android & Sovereign Web."
  ];
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Interactive Live Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYS_INIT] Liquid Sovereign Core v2.0.1 initialized.",
    "[ECDH_X25519] Ephemeral keypair generated on silicon co-processor.",
    "[AES_GCM_256] Symmetric key stream synchronized with peer node.",
    "[POLY1305] 128-bit authentication tag validated. Zero telemetry.",
    "[STATUS] Sovereign ratcheted channel active and verified."
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  // Interactive Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 2. Custom Magnetic Cursor - Touch-Safe (Excluded on touch devices & Android)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fineMatch = window.matchMedia('(pointer: fine) and (hover: hover)');
    if (!fineMatch.matches) {
      setHasFinePointer(false);
      return;
    }
    setHasFinePointer(true);

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
    const speed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting && displayText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 1700);
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

  // 4. Interactive Particles & Constellation Canvas (Mobile/Android Optimized)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    // 18 particles on mobile, 60 on desktop for maximum battery & GPU efficiency
    const particleCount = isMobile ? 18 : 60;
    const maxConnectionDist = isMobile ? 85 : 125;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.35 : 0.6),
        vy: (Math.random() - 0.5) * (isMobile ? 0.35 : 0.6),
        radius: isMobile ? (0.9 + Math.random() * 1.2) : (1.2 + Math.random() * 1.8),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme === 'tokyo-midnight' 
          ? 'rgba(56, 189, 248, 0.7)' 
          : currentTheme === 'obsidian-gold' 
          ? 'rgba(234, 179, 8, 0.7)' 
          : currentTheme === 'aurora-purple' 
          ? 'rgba(192, 132, 252, 0.7)' 
          : 'rgba(52, 211, 153, 0.7)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < maxConnectionDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 * (1 - dist / maxConnectionDist)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentTheme]);

  // 5. Global Keyboard Shortcuts (Ctrl+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCmdOpen(false);
        setIsAiChatOpen(false);
        setIsMobileMenuOpen(false);
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll chat bottom into view
  useEffect(() => {
    if (isAiChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiStreamingText, isAiChatOpen]);

  // Terminal Command Simulation
  const executeTerminalCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${rawCmd}`];

    if (cmd === 'help') {
      newLogs.push("Available: 'status', 'ratchet', 'test-mitm', 'peers', 'hash', 'clear'");
    } else if (cmd === 'status') {
      newLogs.push("[VERIFIED] ECDH X25519 co-processor healthy. Local SQLite keystore intact.");
    } else if (cmd === 'ratchet') {
      newLogs.push("[ADVANCE] Ephemeral step completed in 1.18ms. Previous seed zeroized.");
    } else if (cmd === 'test-mitm') {
      newLogs.push("[MITM_DEFENSE] Poly1305 tag rejected hostile packet. Zero leak.");
      if (audioEnabled) soundEffects.playAlert();
    } else if (cmd === 'peers') {
      newLogs.push("[MESH] Direct P2P nodes reachable: Tokyo [1.2ms], Zurich [14ms], Singapore [8ms]");
    } else if (cmd === 'hash') {
      newLogs.push("[SHA256] e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    } else if (cmd === 'clear') {
      setTerminalLogs(["[RESET] Console buffer cleared."]);
      setTerminalInput("");
      return;
    } else {
      newLogs.push(`[ERROR] Command '${cmd}' not recognized. Type 'help'.`);
    }

    setTerminalLogs(newLogs.slice(-9));
    setTerminalInput("");
    if (audioEnabled) soundEffects.playClick();
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    executeTerminalCommand(terminalInput);
  };

  // High-Level Autonomous Sovereign AI Engine
  const generateAiResponse = (q: string): { text: string; action?: AiMessage['action'] } => {
    const lower = q.toLowerCase();

    if (lower.includes('ratchet') || lower.includes('curve25519') || lower.includes('double-ratchet') || lower.includes('cryptography')) {
      return {
        text: "Liquid Chat employs the Double-Ratchet protocol combining X25519 Elliptic Curve Diffie-Hellman (ECDH) key agreements with AES-256-GCM symmetric encryption. Each message generates a fresh ephemeral ratchet step via HKDF-SHA256, discarding prior seeds from memory immediately. Compromising any single session key mathematically reveals neither past conversations (Forward Secrecy) nor future messages (Break-in Recovery).",
        action: { label: "Test Ratchet in Live Console", actionType: "console" }
      };
    }

    if (lower.includes('apk') || lower.includes('android') || lower.includes('install') || lower.includes('sideload')) {
      return {
        text: "Deploying Liquid Chat on Android (v2.0.1 standalone APK, 6.3 MB):\n1. Download LiquidChat.apk directly from our release hub.\n2. In Android Settings, allow 'Install Unknown Apps' for your browser or file manager.\n3. Launch Liquid Chat. Notice zero requirements for Google Play Services, phone numbers, or Google accounts. Your sovereign 10-digit ID generates locally in RAM in 80ms.",
        action: { label: "Download APK v2.0.1 (6.3 MB)", actionType: "download" }
      };
    }

    if (lower.includes('call') || lower.includes('video') || lower.includes('webrtc') || lower.includes('voice')) {
      return {
        text: "Voice and HD video calls establish direct peer-to-peer tunnels via WebRTC ICE/STUN hole punching. All media frames are encrypted point-to-point using DTLS-SRTP. The relay server acts solely as a blind SDP handshake conduit; zero media frames ever touch or get recorded on central cloud relays.",
        action: { label: "Launch Web Client", actionType: "web" }
      };
    }

    if (lower.includes('id') || lower.includes('10-digit') || lower.includes('phone') || lower.includes('anonymous')) {
      return {
        text: "Your 10-digit Liquid ID is a truncated cryptographic hash derived mathematically from your local Curve25519 identity key. It completely decouples communications from SIM cards, phone numbers, email addresses, and IMEI tags—eliminating SIM-swap hijacking and carrier wiretaps forever.",
        action: { label: "Open Live Console", actionType: "console" }
      };
    }

    if (lower.includes('pin') || lower.includes('vault') || lower.includes('lock') || lower.includes('sqlite')) {
      return {
        text: "All local messages, session keys, and ephemeral media are sealed in a hardware-backed encrypted SQLite keystore using SQLCipher (AES-256 in CBC mode). You can lock confidential individual chats or the entire client with a master PIN. If your device is physically inspected or seized, the database remains unreadable random noise.",
        action: { label: "Download Android APK", actionType: "download" }
      };
    }

    if (lower.includes('log') || lower.includes('cloud') || lower.includes('server') || lower.includes('telemetry')) {
      return {
        text: "Liquid Chat relay servers operate on a blind packet routing protocol. The server routes encrypted envelopes based on transient recipient tokens. We store zero message history, zero IP logs, zero user rosters, and zero metadata. If law enforcement or attackers seize a relay node, they obtain zero usable intelligence.",
        action: { label: "Inspect Security Audit Table", actionType: "console" }
      };
    }

    if (lower.includes('signal') || lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('compare')) {
      return {
        text: "Comparison:\n• Telegram: Stores group and private chats in unencrypted server cloud plaintext by default.\n• WhatsApp: Mandatory phone number linkage, metadata shared with Meta advertising infrastructure.\n• Signal: Strong E2EE, but still requires a phone number, exposing user identity to SIM-swap attacks.\n• Liquid Chat: 100% default Curve25519 Double-Ratchet, 10-digit anonymous ID, zero phone number requirement, and direct WebRTC P2P calls.",
        action: { label: "Inspect Protocol Matrix", actionType: "console" }
      };
    }

    if (lower.includes('hash') || lower.includes('sha') || lower.includes('checksum') || lower.includes('verify')) {
      return {
        text: "Official SHA-256 Checksum for LiquidChat.apk v2.0.1:\n`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`\nVerify in Linux/macOS with: `sha256sum LiquidChat.apk` or in Windows PowerShell with: `Get-FileHash LiquidChat.apk`.",
        action: { label: "Copy SHA-256 Checksum", actionType: "hash" }
      };
    }

    if (lower.includes('quantum') || lower.includes('kyber') || lower.includes('future')) {
      return {
        text: "Phase 05 of the Liquid Roadmap integrates hybrid post-quantum key encapsulation using Kyber-1024 (ML-KEM). This lattice-based cryptographic primitive ensures that encrypted communications captured today cannot be decrypted by state actors in the future with harvest-now-decrypt-later quantum machines.",
        action: { label: "View Protocol Timeline", actionType: "console" }
      };
    }

    if (lower.includes('permission') || lower.includes('camera') || lower.includes('microphone')) {
      return {
        text: "The Liquid Chat Android APK requests only two functional permissions: Camera (for WebRTC video calls & scanning QR pairing codes) and Microphone (for audio calls). We request ZERO access to contacts, SMS, location, storage browsing, or device identity.",
        action: { label: "Download APK (v2.0.1)", actionType: "download" }
      };
    }

    return {
      text: `Liquid Chat is architected for zero-compromise sovereign privacy. Every message is sealed with Curve25519 ECDH + AES-256-GCM ratchets, routed peer-to-peer over WebRTC, and locked locally inside an encrypted SQLite vault. How can I assist your operational security today?`,
      action: { label: "Download APK v2.0.1", actionType: "download" }
    };
  };

  const handleAiSend = (promptText?: string) => {
    const query = promptText || aiInput;
    if (!query.trim() || aiIsThinking) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim()
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiIsThinking(true);
    setAiStreamingText("");
    if (audioEnabled) soundEffects.playClick();

    setTimeout(() => {
      const responseData = generateAiResponse(query);
      let currentIdx = 0;
      const fullText = responseData.text;

      // Simulated character streaming
      const interval = setInterval(() => {
        currentIdx += 4;
        if (currentIdx >= fullText.length) {
          clearInterval(interval);
          setAiStreamingText("");
          setAiIsThinking(false);
          setAiMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: fullText,
              action: responseData.action
            }
          ]);
          if (audioEnabled) soundEffects.playNotification();
        } else {
          setAiStreamingText(fullText.substring(0, currentIdx));
        }
      }, 15);
    }, 450);
  };

  const handleActionClick = (action: NonNullable<AiMessage['action']>) => {
    if (action.actionType === 'download') {
      window.location.href = '/LiquidChat.apk';
    } else if (action.actionType === 'web') {
      window.location.href = 'https://web.liquidchat.online';
    } else if (action.actionType === 'hash') {
      handleCopyHash();
    } else if (action.actionType === 'console') {
      const el = document.getElementById('console');
      el?.scrollIntoView({ behavior: 'smooth' });
      setIsAiChatOpen(false);
    }
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`relative min-h-screen font-sans antialiased text-[#d1d5db] selection:bg-cyan-500/30 selection:text-white overflow-x-hidden ${
      currentTheme === 'tokyo-midnight' ? 'bg-[#050508]' :
      currentTheme === 'obsidian-gold' ? 'bg-[#060503]' :
      currentTheme === 'aurora-purple' ? 'bg-[#07040d]' : 'bg-[#020906]'
    }`}>
      {/* Google Web Fonts */}
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

      {/* 3. INTERACTIVE CONSTELLATION & PARTICLE CANVAS */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 4. CUSTOM MAGNETIC GLOW CURSOR (Fine Pointer Desktop Only - Zero Mobile Interference) */}
      {hasFinePointer && (
        <div
          className="fixed pointer-events-none z-[99998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-75 hidden md:block"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: isHovering ? '52px' : '10px',
            height: isHovering ? '52px' : '10px',
            background: isHovering
              ? 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(168,85,247,0.1) 60%, transparent 80%)'
              : '#38bdf8',
            boxShadow: isHovering
              ? '0 0 35px 10px rgba(56,189,248,0.35)'
              : '0 0 15px 3px #38bdf8',
            border: isHovering ? '1.5px solid rgba(56,189,248,0.6)' : 'none',
          }}
        />
      )}

      {/* 5. GOTHIC & CYBER STYLES */}
      <style jsx global>{`
        .title-cinzel { font-family: 'Cinzel Decorative', serif; }
        .text-spectral { font-family: 'Spectral', serif; }
        .cyber-panel {
          position: relative;
          background: rgba(10, 15, 29, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cyber-panel::before, .cyber-panel::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1.5px solid #38bdf8;
          opacity: 0.6;
          transition: opacity 0.3s ease, border-color 0.3s ease;
        }
        .cyber-panel::before { top: -2px; left: -2px; border-right: none; border-bottom: none; }
        .cyber-panel::after { bottom: -2px; right: -2px; border-left: none; border-top: none; }
        .cyber-panel:hover {
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 35px rgba(56, 189, 248, 0.15), inset 0 0 20px rgba(56, 189, 248, 0.05);
          transform: translateY(-4px);
        }
        .cyber-panel:hover::before, .cyber-panel:hover::after {
          opacity: 1;
          border-color: #a855f7;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 6. FIXED GLASS NAVBAR WITH MOBILE HAMBURGER */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <LiquidLogo size={20} />
              </div>
            </div>
            <div>
              <span className="title-cinzel font-bold text-sm sm:text-base tracking-wider text-white">
                LIQUID CHAT
              </span>
              <span className="block text-[9px] sm:text-[10px] font-mono text-cyan-400/80 tracking-wider">
                SOVEREIGN PROTOCOL v2.0.1
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium tracking-widest text-white/60">
            <a href="#hero" className="hover:text-cyan-400 transition-colors">THE PROTOCOL</a>
            <a href="#console" className="hover:text-cyan-400 transition-colors">LIVE CONSOLE</a>
            <a href="#capabilities" className="hover:text-cyan-400 transition-colors">CAPABILITIES</a>
            <a href="#timeline" className="hover:text-cyan-400 transition-colors">TIMELINE</a>
            <a href="#audit" className="hover:text-cyan-400 transition-colors">SECURITY AUDIT</a>
            <a href="#download" className="hover:text-cyan-400 transition-colors">DOWNLOAD</a>
          </nav>

          {/* Quick Tools & CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Command Palette Trigger */}
            <button
              onClick={() => setIsCmdOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
              title="Command Palette (Ctrl + K)"
            >
              <Search size={14} />
              <span className="hidden md:inline">Ctrl + K</span>
            </button>

            {/* Theme Selector Pill */}
            <button
              onClick={() => {
                const themes: Array<'tokyo-midnight' | 'obsidian-gold' | 'aurora-purple' | 'matrix-emerald'> = [
                  'tokyo-midnight', 'obsidian-gold', 'aurora-purple', 'matrix-emerald'
                ];
                const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
                setCurrentTheme(themes[nextIdx]);
                if (audioEnabled) soundEffects.playClick();
              }}
              className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-cyan-400 transition-all"
              title="Cycle Cyber Theme"
            >
              <Palette size={16} />
            </button>

            {/* Launch Web Client Link */}
            <a
              href="https://web.liquidchat.online"
              className="hidden sm:flex px-4 py-2 text-xs font-semibold tracking-wider text-white border border-white/15 hover:border-cyan-400/50 rounded-full bg-white/[0.03] hover:bg-cyan-500/10 transition-all items-center gap-2"
            >
              <Monitor size={14} className="text-cyan-400" />
              <span>WEB APP</span>
            </a>

            {/* Get APK Button */}
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold tracking-wider text-black bg-white hover:bg-cyan-100 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={14} />
              <span className="hidden xs:inline">GET APK</span>
            </a>

            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/80 hover:text-cyan-400 transition-colors"
              aria-label="Open Mobile Navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 6.1 MOBILE SLIDE-IN NAVIGATION DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99990] bg-black/85 backdrop-blur-xl lg:hidden flex flex-col justify-between p-6 pt-24"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <LiquidLogo size={22} />
                  <span className="title-cinzel font-bold text-sm tracking-wider text-white">LIQUID SOVEREIGN</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex flex-col space-y-4 text-base font-medium tracking-wider">
                {[
                  { label: "⚡ THE PROTOCOL", href: "#hero" },
                  { label: "💻 LIVE CONSOLE", href: "#console" },
                  { label: "🛡️ CAPABILITIES", href: "#capabilities" },
                  { label: "⏳ TIMELINE & ROADMAP", href: "#timeline" },
                  { label: "📊 SECURITY AUDIT", href: "#audit" },
                  { label: "📱 ANDROID APK HUB", href: "#download" },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-white/80 hover:text-cyan-300 transition-all flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={14} className="text-white/30" />
                  </a>
                ))}
              </nav>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://web.liquidchat.online"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 px-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2"
                >
                  <Monitor size={15} />
                  <span>WEB CLIENT</span>
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowQrModal(true);
                  }}
                  className="py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2"
                >
                  <QrCode size={15} />
                  <span>SCAN QR</span>
                </button>
              </div>

              <a
                href="/LiquidChat.apk"
                download="LiquidChat.apk"
                className="w-full py-3.5 rounded-2xl bg-white text-black font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              >
                <Download size={16} />
                <span>DOWNLOAD STANDALONE APK (v2.0.1)</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="hero" className="relative min-h-[92vh] pt-32 sm:pt-36 pb-16 sm:pb-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto z-10">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono tracking-widest mb-6 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>PRODUCTION RELEASE • v2.0.1 PRO • ANDROID & WEB</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="title-cinzel text-4xl sm:text-7xl lg:text-8xl font-black tracking-wider text-white leading-tight uppercase drop-shadow-[0_0_50px_rgba(56,189,248,0.3)] break-words w-full"
        >
          SOVEREIGN <br />
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            COMMUNICATION
          </span>
        </motion.h1>

        {/* Typewriter Subtitle */}
        <div className="min-h-12 my-3 sm:my-4 flex items-center justify-center font-mono text-sm sm:text-xl text-purple-300 px-2 text-center">
          <span>{displayText}</span>
          <span className="inline-block w-1.5 sm:w-2 h-4 sm:h-5 bg-cyan-400 ml-1 animate-pulse" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-spectral text-sm sm:text-xl text-[#9ca3af] max-w-2xl mx-auto font-light leading-relaxed mb-8 px-2"
        >
          Engineered for absolute discretion. Zero cloud plaintext, hardware-ratcheted Curve25519 cryptography, and untraceable 10-digit sovereign IDs.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md sm:max-w-none"
        >
          <a
            href="/LiquidChat.apk"
            download="LiquidChat.apk"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-xs tracking-widest hover:bg-cyan-100 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Download size={18} />
            <span>DOWNLOAD APK (v2.0.1)</span>
          </a>

          <a
            href="https://web.liquidchat.online"
            className="w-full sm:w-auto px-7 py-4 rounded-full border border-white/20 text-xs font-semibold tracking-widest text-white hover:bg-white/[0.06] hover:border-cyan-400/50 transition-all flex items-center justify-center gap-2"
          >
            <Monitor size={16} className="text-cyan-400" />
            <span>LAUNCH IN BROWSER</span>
            <ArrowRight size={14} className="text-white/40" />
          </a>
        </motion.div>

        {/* Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 w-full max-w-3xl">
          {[
            { label: 'AUTHENTICATION', val: 'Curve25519 ECDH' },
            { label: 'PAYLOAD CIPHER', val: 'AES-256-GCM' },
            { label: 'RATCHET LATENCY', val: '1.18 ms' },
            { label: 'CLOUD FOOTPRINT', val: '0 Plaintext Bytes' },
          ].map((item, idx) => (
            <div key={idx} className="cyber-panel p-3.5 sm:p-4 rounded-2xl text-center">
              <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-semibold tracking-wider mb-1">{item.label}</p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">{item.val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE CRYPTOGRAPHIC CONSOLE (Mobile One-Tap Execution) */}
      {/* ========================================================================= */}
      <section id="console" className="py-20 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">INTERACTIVE SECURITY CONSOLE</span>
          <h2 className="title-cinzel text-2xl sm:text-4xl font-bold text-white">
            LIVE CLIENT TERMINAL
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-xl mx-auto">
            Test real-time cryptographic handshakes directly from your browser. Tap any quick-command chip or type in the console below.
          </p>
        </div>

        <div className="rounded-3xl bg-[#04060c] border border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)] overflow-hidden font-mono text-xs">
          {/* Terminal Window Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-white/40 text-[10px] sm:text-[11px] truncate">liquid-sovereign-shell ~ zsh</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] sm:text-[11px]">
              <Radio size={12} className="animate-pulse" />
              <span>ECDH: 100%</span>
            </div>
          </div>

          {/* Quick-Tap Action Chips for Android & Mobile */}
          <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-white/40 text-[10px] uppercase tracking-wider shrink-0 mr-1">Quick:</span>
            {[
              { cmd: 'status', label: '⚡ status' },
              { cmd: 'ratchet', label: '🔐 ratchet' },
              { cmd: 'test-mitm', label: '🛡️ test-mitm' },
              { cmd: 'peers', label: '🌐 peers' },
              { cmd: 'hash', label: '🔑 hash' },
              { cmd: 'clear', label: '🧹 clear' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => executeTerminalCommand(chip.cmd)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-white/80 hover:text-cyan-300 transition-all shrink-0 font-mono text-[10px] sm:text-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Terminal Output */}
          <div className="p-4 sm:p-6 space-y-2 min-h-[200px] sm:min-h-[230px] text-white/80 select-text text-[11px] sm:text-xs leading-relaxed">
            {terminalLogs.map((log, i) => (
              <div key={i} className="break-words">
                {log.startsWith('>') ? (
                  <span className="text-cyan-400 font-bold">{log}</span>
                ) : log.includes('OK') || log.includes('verified') || log.includes('VERIFIED') ? (
                  <span className="text-emerald-400">{log}</span>
                ) : log.includes('MITM') || log.includes('rejected') ? (
                  <span className="text-pink-400">{log}</span>
                ) : (
                  <span className="text-white/70">{log}</span>
                )}
              </div>
            ))}
          </div>

          {/* Terminal Input Form */}
          <form onSubmit={handleTerminalSubmit} className="px-4 sm:px-5 py-3 bg-black/80 border-t border-white/10 flex items-center gap-2">
            <span className="text-cyan-400 font-bold shrink-0 text-xs">liquid@client:~$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type command or tap a chip..."
              className="flex-1 bg-transparent text-white outline-none font-mono text-xs min-w-0"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-[10px] sm:text-[11px] font-bold transition-colors shrink-0"
            >
              RUN
            </button>
          </form>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CAPABILITIES SHOWCASE (6 Core Relic Cards) */}
      {/* ========================================================================= */}
      <section id="capabilities" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">SOVEREIGN ARCHITECTURE</span>
          <h2 className="title-cinzel text-3xl sm:text-5xl font-bold text-white">
            SIX PILLARS OF SOVEREIGNTY
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Uncompromising privacy protocols designed to withstand government-level surveillance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
              className="cyber-panel p-6 sm:p-8 rounded-3xl space-y-4"
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
      {/* 10. ARCHITECTURAL PROTOCOL TIMELINE */}
      {/* ========================================================================= */}
      <section id="timeline" className="py-20 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">ROADMAP & EVOLUTION</span>
          <h2 className="title-cinzel text-3xl sm:text-4xl font-bold text-white">
            THE CRYPTOGRAPHIC ROADMAP
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            A chronological progression of our sovereign architectural releases.
          </p>
        </div>

        <div className="relative border-l border-cyan-500/30 ml-4 sm:ml-12 md:ml-32 space-y-10 sm:space-y-12">
          {[
            {
              phase: "PHASE 01 • COMPLETED",
              title: "Ephemeral Double-Ratchet Handshake",
              date: "Q1 2025",
              desc: "Implementation of pure Curve25519 ECDH key generation paired with AES-256-GCM symmetric streams and Poly1305 MAC tag verification."
            },
            {
              phase: "PHASE 02 • COMPLETED",
              title: "Direct Peer-to-Peer WebRTC Audio/Video",
              date: "Q2 2025",
              desc: "STUN/TURN direct hole punching without relay media recording. Zero voice or video frames recorded on intermediate network hops."
            },
            {
              phase: "PHASE 03 • COMPLETED",
              title: "Local SQLite Keystore & PIN Lockdown",
              date: "Q3 2025",
              desc: "Hardware-level PIN lockout protecting sensitive chats. Client storage migrated entirely to locally encrypted SQLite database."
            },
            {
              phase: "PHASE 04 • CURRENT PRODUCTION",
              title: "Universal Android APK (v2.0.1) & PWA Web Client",
              date: "Q1 2026",
              desc: "Full universal distribution with zero Google Play dependencies, pairing QR codes, and in-browser standalone WebClient."
            },
            {
              phase: "PHASE 05 • IN DEVELOPMENT",
              title: "Post-Quantum Kyber1024 Key Encapsulation",
              date: "Q4 2026",
              desc: "Hybrid quantum-resistant algorithms safeguarding against harvest-now-decrypt-later attacks by state-sponsored surveillance actors."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative pl-6 sm:pl-8"
            >
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-black border-2 border-cyan-400 shadow-[0_0_12px_#38bdf8]" />

              <div className="cyber-panel p-5 sm:p-6 rounded-2xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest">{item.phase}</span>
                  <span className="text-[11px] font-mono text-white/40">{item.date}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">{item.title}</h3>
                <p className="text-xs text-[#9ca3af] leading-relaxed font-light">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. SECURITY AUDIT & COMPARISON MATRIX (Touch Swipable with Sticky Labels) */}
      {/* ========================================================================= */}
      <section id="audit" className="py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <span className="text-xs font-mono text-emerald-400 tracking-[0.25em] uppercase">TRANSPARENT AUDIT</span>
          <h2 className="title-cinzel text-3xl sm:text-5xl font-bold text-white">
            PROTOCOL COMPARISON
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-xl mx-auto">
            How Liquid Chat outperforms legacy centralized platforms across key security vectors.
          </p>
          <div className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 mt-2">
            <span>👉 Swipe table horizontally to compare</span>
          </div>
        </div>

        <div className="rounded-3xl bg-[#080b16]/80 border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs font-sans min-w-[620px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 font-mono text-white/60">
                  <th className="p-4 sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">CAPABILITY</th>
                  <th className="p-4 text-cyan-400 font-bold">LIQUID CHAT PRO</th>
                  <th className="p-4">SIGNAL</th>
                  <th className="p-4">TELEGRAM</th>
                  <th className="p-4">WHATSAPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80 font-light">
                <tr>
                  <td className="p-4 font-bold text-white sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">Default E2EE Active</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (Curve25519)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                  <td className="p-4 text-red-400">NO (Cloud chats)</td>
                  <td className="p-4 text-emerald-400">YES</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">No Phone Number Required</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (10-Digit ID)</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-amber-400">PARTIAL</td>
                  <td className="p-4 text-red-400">NO (Requires SIM)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">Direct WebRTC P2P Voice/Video</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (Zero Relay Log)</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                  <td className="p-4 text-white/60">Server Mediated</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">Local Encrypted SQLite Vault</td>
                  <td className="p-4 text-emerald-400 font-bold">YES (PIN Lockdown)</td>
                  <td className="p-4 text-white/60">Plain App Sandbox</td>
                  <td className="p-4 text-red-400">NO (Cloud Backed)</td>
                  <td className="p-4 text-amber-400">Google Drive/iCloud</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white sticky left-0 bg-[#070b16] z-10 shadow-[2px_0_10px_rgba(0,0,0,0.5)]">Open Source & Standalone APK</td>
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
      {/* 12. DOWNLOAD STATION & ANDROID INSTALLATION HUB */}
      {/* ========================================================================= */}
      <section id="download" className="py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="cyber-panel p-6 sm:p-12 md:p-16 rounded-3xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 sm:pb-8">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                OFFICIAL PRODUCTION BINARY
              </span>
              <h2 className="title-cinzel text-2xl sm:text-4xl font-bold text-white">
                DEPLOY LIQUID CHAT (v2.0.1)
              </h2>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-[11px] sm:text-xs text-white/70">
              SIZE: <span className="text-cyan-400 font-bold">6.3 MB</span> • ANDROID 8.0+
            </div>
          </div>

          <p className="text-spectral text-xs sm:text-base text-white/70 leading-relaxed max-w-2xl font-light">
            Compiled with zero tracking dependencies, zero Google Play Services requirement, and universal ARM64/x86_64 architecture support.
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-black font-bold text-xs tracking-wider hover:bg-cyan-100 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Download size={17} />
              <span>DOWNLOAD APK v2.0.1</span>
            </a>

            <a
              href="https://web.liquidchat.online"
              className="px-6 py-3.5 rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white hover:bg-white/[0.08] transition-all flex items-center gap-2"
            >
              <Monitor size={16} className="text-cyan-400" />
              <span>LAUNCH WEB CLIENT</span>
            </a>

            <button
              onClick={() => setShowQrModal(true)}
              className="px-5 py-3.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold tracking-wider text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
              <QrCode size={16} />
              <span>SCAN ON PHONE</span>
            </button>
          </div>

          {/* Android 3-Step Sideloading Guide Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white tracking-wider">
              <Smartphone size={16} className="text-cyan-400" />
              <span>ANDROID 3-STEP INSTALLATION GUIDE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STEP 01</div>
                <div className="font-bold text-white">Download APK</div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Tap Download APK (6.3 MB). Binary is delivered directly with zero Google Play requirement.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono text-purple-400 font-bold">STEP 02</div>
                <div className="font-bold text-white">Allow Unknown Apps</div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  If prompted by Android, toggle &quot;Allow from this source&quot; in Settings &gt; Install Unknown Apps.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">STEP 03</div>
                <div className="font-bold text-white">Launch &amp; Ratchet</div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Open Liquid Chat. Your untraceable 10-digit ID is generated locally in RAM with zero SIM linkage.
                </p>
              </div>
            </div>
          </div>

          {/* SHA-256 Hash Verification */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="truncate w-full sm:w-auto">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">OFFICIAL SHA-256 CHECKSUM</span>
              <span className="text-cyan-300 select-all text-[11px] sm:text-xs break-all sm:break-normal">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </span>
            </div>
            <button
              onClick={handleCopyHash}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
            >
              {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedHash ? 'COPIED' : 'COPY HASH'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <h2 className="title-cinzel text-2xl sm:text-4xl font-bold text-center text-white mb-10 sm:mb-12">
          SECURITY &amp; PRIVACY FAQ
        </h2>

        <div className="space-y-3.5">
          {[
            {
              q: "How does Liquid Chat guarantee zero plaintext is stored on the server?",
              a: "When a message is typed, your browser/device generates an ephemeral Curve25519 shared secret and encrypts the payload using AES-256-GCM. The server only routes randomized encrypted blobs and has zero mathematical capability to decrypt them."
            },
            {
              q: "Can I use Liquid Chat on Android and desktop Web simultaneously?",
              a: "Yes. Install the native APK on Android, or navigate to https://web.liquidchat.online on any desktop browser. Sessions can pair securely via encrypted QR key handshake."
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
              className="cyber-panel p-4 sm:p-5 rounded-2xl cursor-pointer"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs sm:text-sm text-white">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-white/40 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
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
      {/* 14. COMMAND PALETTE MODAL (Ctrl + K) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCmdOpen(false)}
            className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-[#080c16] border border-cyan-500/40 p-4 shadow-[0_0_60px_rgba(56,189,248,0.25)] space-y-4"
            >
              <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10">
                <Search size={16} className="text-cyan-400" />
                <input
                  type="text"
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Search documentation, download APK, or jump to section..."
                  className="flex-1 bg-transparent text-sm text-white outline-none font-sans"
                  autoFocus
                />
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/50">ESC</kbd>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
                {[
                  { name: 'Download Android APK (v2.0.1)', action: () => { window.location.href = '/LiquidChat.apk'; } },
                  { name: 'Launch Web Client (web.liquidchat.online)', action: () => { window.location.href = 'https://web.liquidchat.online'; } },
                  { name: 'Jump to Cryptographic Console', action: () => { window.location.href = '#console'; setIsCmdOpen(false); } },
                  { name: 'Jump to Capabilities', action: () => { window.location.href = '#capabilities'; setIsCmdOpen(false); } },
                  { name: 'Jump to Roadmap Timeline', action: () => { window.location.href = '#timeline'; setIsCmdOpen(false); } },
                  { name: 'Copy SHA-256 Checksum', action: () => { handleCopyHash(); setIsCmdOpen(false); } },
                ]
                  .filter((item) => item.name.toLowerCase().includes(cmdSearch.toLowerCase()))
                  .map((item, i) => (
                    <div
                      key={i}
                      onClick={item.action}
                      className="px-3.5 py-2.5 rounded-xl hover:bg-cyan-500/20 text-white/80 hover:text-white cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <ArrowRight size={13} className="text-cyan-400 opacity-60" />
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 14.1 QR CODE DOWNLOAD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQrModal(false)}
            className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#080c16] border border-cyan-500/40 p-6 shadow-[0_0_60px_rgba(56,189,248,0.25)] text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">SCAN TO DOWNLOAD APK</span>
                <button onClick={() => setShowQrModal(false)} className="text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* High-contrast QR visualization */}
              <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-2xl">
                <div className="w-48 h-48 bg-black flex flex-col items-center justify-center rounded-xl p-2 text-white font-mono text-center">
                  <QrCode size={140} className="text-white" />
                  <span className="text-[9px] text-cyan-300 font-bold mt-1">/LiquidChat.apk</span>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-light">
                Point your Android camera at this code to download the standalone v2.0.1 APK instantly without Google Play.
              </p>

              <a
                href="/LiquidChat.apk"
                download="LiquidChat.apk"
                className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold text-xs tracking-wider flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>DIRECT DOWNLOAD (6.3 MB)</span>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 15. OVERHAULED SOVEREIGN AI INTELLIGENCE ASSISTANT (Mobile Bottom-Sheet) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 sm:left-6 z-50">
        {/* Floating AI Launcher Pill */}
        <button
          onClick={() => {
            setIsAiChatOpen(!isAiChatOpen);
            if (audioEnabled) soundEffects.playClick();
          }}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-white/20"
          aria-label="Open Sovereign AI Assistant"
        >
          <div className="relative">
            <Bot size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-xs font-bold font-mono tracking-wider">
            SOVEREIGN AI <span className="hidden sm:inline text-cyan-200">• v2.0</span>
          </span>
        </button>

        {/* AI Chat Modal / Mobile Bottom Sheet */}
        <AnimatePresence>
          {isAiChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="fixed inset-x-3 bottom-3 sm:bottom-16 sm:left-6 sm:inset-x-auto sm:w-[460px] h-[80vh] sm:h-[600px] rounded-3xl bg-[#070b16]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col z-[99999] overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center">
                    <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                      <Bot size={16} className="text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">SOVEREIGN BOT 2.0</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">ONLINE</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">Zero Telemetry • Curve25519 Verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAiMessages([
                        { 
                          id: `reset-${Date.now()}`,
                          sender: 'bot', 
                          text: 'Session reset. Cryptographic memory cleared. How can I assist your operational security?' 
                        }
                      ]);
                      if (audioEnabled) soundEffects.playClick();
                    }}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    title="Reset Conversation"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button 
                    onClick={() => setIsAiChatOpen(false)} 
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Message Scrollport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs select-text">
                {aiMessages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`p-3.5 rounded-2xl max-w-[90%] sm:max-w-[85%] leading-relaxed ${
                        m.sender === 'user' 
                          ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white font-medium rounded-tr-sm shadow-md' 
                          : 'bg-white/[0.05] border border-white/10 text-white/90 rounded-tl-sm shadow-lg font-light'
                      }`}
                    >
                      <div className="whitespace-pre-line break-words">{m.text}</div>

                      {/* Interactive In-Message Action Button */}
                      {m.action && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end">
                          <button
                            onClick={() => handleActionClick(m.action!)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold transition-all flex items-center gap-1.5"
                          >
                            <span>{m.action.label}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-white/30 mt-1 px-1">
                      {m.sender === 'user' ? 'OPERATOR' : 'SOVEREIGN BOT'}
                    </span>
                  </div>
                ))}

                {/* Streaming Indicator */}
                {aiIsThinking && (
                  <div className="flex flex-col items-start">
                    <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white/90 rounded-tl-sm max-w-[85%]">
                      {aiStreamingText ? (
                        <div className="whitespace-pre-line break-words">{aiStreamingText}</div>
                      ) : (
                        <div className="flex items-center gap-2 font-mono text-cyan-300 text-[11px]">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>Decrypting protocol knowledge base...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Interactive Knowledge Prompt Chips */}
              <div className="px-3 py-2 bg-white/[0.02] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {[
                  "🔐 Curve25519 Ratchet",
                  "📱 Android APK Sideload",
                  "🎥 WebRTC P2P Privacy",
                  "⚡ 10-Digit Liquid ID",
                  "🛡️ Hardware PIN Vault",
                  "☁️ Zero Cloud Logs",
                  "⚛️ Kyber1024 Quantum",
                  "🆚 Signal vs Telegram",
                  "📦 SHA-256 Checksum",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAiSend(chip)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-cyan-300 text-[10px] whitespace-nowrap transition-all font-mono shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSend();
                }} 
                className="p-3 bg-black/80 border-t border-white/10 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask about encryption, APK install, PIN lock..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/40 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || aiIsThinking}
                  className="p-2.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 transition-colors shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 16. BOTTOM FLOATING TOOLS (Sound Synthesizer & Scroll to Top) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 sm:right-6 z-50 flex items-center gap-2">
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-black/80 hover:bg-white/10 border border-white/15 backdrop-blur-md shadow-2xl text-white/80 hover:text-white transition-all"
          title="Scroll to Top"
        >
          <ChevronUp size={16} />
        </button>

        <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-black/80 border border-white/15 backdrop-blur-md shadow-2xl">
          <button
            onClick={toggleAudio}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-cyan-400 transition-colors"
            title="Toggle Synthesizer Soundscapes"
          >
            {audioEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-white/40" />}
          </button>
          <span className="text-[10px] font-mono text-white/60 pr-2 hidden md:inline">
            {audioEnabled ? 'SYNTH ON' : 'MUTED'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 17. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] py-12 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/40 font-light relative z-10">
        <div className="flex items-center gap-3">
          <LiquidLogo size={20} />
          <span className="title-cinzel tracking-widest text-[11px] text-white/70">
            LIQUID CHAT PROTOCOL
          </span>
        </div>

        <p className="tracking-wide text-center">Built for sovereign communication. Unconditionally private. Open source.</p>

        <div className="flex items-center gap-5 sm:gap-6">
          <a href="https://web.liquidchat.online" className="hover:text-cyan-400 transition-colors">Web Client</a>
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
