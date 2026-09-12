"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Download, Monitor, ArrowUpRight, 
  Smartphone, ChevronDown, Check, Copy, Shield, EyeOff, 
  Flame, Key, Video, Volume2, Sparkles, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Lenis from 'lenis';
import LiquidLogo from '@/components/LiquidLogo';
import LiquidHeroSphere from './LiquidHeroSphere';
import { soundEffects } from '@/utils/audioSynth';

export default function LandingPage() {
  const [copiedHash, setCopiedHash] = useState(false);
  const { scrollYProgress } = useScroll();

  // Parallax transforms for Hero
  const yHeroText = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const scaleHero3D = useTransform(scrollYProgress, [0, 0.4], [1, 1.25]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0.1]);

  // Lenis Buttery-Smooth Scrolling Engine
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

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const handleCopyHash = () => {
    navigator.clipboard.writeText("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    setCopiedHash(true);
    soundEffects.playNotification();
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-[#eaeaea] font-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden">
      {/* Google Web Fonts for High-End Cinematic Typography */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
      />

      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 right-1/4 w-[700px] h-[700px] bg-purple-950/15 rounded-full blur-[160px]" />
      </div>

      {/* ========================================================================= */}
      {/* 1. NAVBAR: Transparent, fixed, minimalist */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#070709]/60 border-b border-white/[0.06] transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070709] rounded-xl flex items-center justify-center">
                <LiquidLogo size={22} />
              </div>
            </div>
            <span 
              className="font-bold text-lg tracking-wider text-[#eaeaea] group-hover:text-white transition-colors"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              LIQUID CHAT
            </span>
          </Link>

          {/* Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest text-[#a3a3a3]">
            <a href="#about" className="hover:text-white transition-colors">ABOUT</a>
            <a href="#features" className="hover:text-white transition-colors">CAPABILITIES</a>
            <a href="#security" className="hover:text-white transition-colors">SECURITY</a>
            <a href="#download" className="hover:text-white transition-colors">DOWNLOAD</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/web"
              className="px-5 py-2 text-xs font-medium tracking-wider text-[#eaeaea] hover:text-white border border-white/15 hover:border-white/30 rounded-full bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center gap-2"
            >
              <Monitor size={14} className="text-purple-400" />
              <span>LAUNCH WEB</span>
            </Link>
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-5 py-2 text-xs font-medium tracking-wider text-black bg-white hover:bg-[#eaeaea] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 font-sans"
            >
              <Download size={14} />
              <span>GET APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (100vh): Centered heading, 3D liquid orb, scroll indicator */}
      {/* ========================================================================= */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <motion.div
          style={{ y: yHeroText, opacity: opacityHero }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-4xl space-y-6 pt-12"
        >
          {/* Subtle Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs tracking-widest text-[#a3a3a3] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>SOVEREIGN CRYPTOGRAPHIC CLIENT • v2.0.1</span>
          </div>

          {/* Centered Large Elegant Heading */}
          <h1 
            className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-[0.18em] text-[#eaeaea] uppercase drop-shadow-[0_0_60px_rgba(168,85,247,0.3)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            LIQUID CHAT
          </h1>

          {/* Cinematic Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-[#a3a3a3] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Communication in its purest, sovereign form. Zero plaintext on cloud. No phone numbers required. Sovereign by design.
          </p>

          {/* Minimalist CTA row */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-8 py-3.5 rounded-full bg-white text-black text-xs font-semibold tracking-wider hover:bg-[#eaeaea] shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              <span>DOWNLOAD APK v2.0.1</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-3.5 rounded-full border border-white/15 text-xs font-medium tracking-wider text-[#eaeaea] hover:text-white hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center gap-2"
            >
              <Monitor size={15} className="text-purple-400" />
              <span>OPEN IN BROWSER</span>
            </Link>
          </div>
        </motion.div>

        {/* Prominent 3D Liquid Chrome Orb Container Directly Behind / Below Heading */}
        <motion.div
          style={{ scale: scaleHero3D }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] relative">
            <LiquidHeroSphere />
          </div>
        </motion.div>

        {/* Subtle Animated Scroll Down Indicator at Bottom Center */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[10px] tracking-[0.3em] text-[#737373] uppercase font-mono">SCROLL</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1 h-2 bg-white/70 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 1: ABOUT LIQUID CHAT ("The Sovereign Standard") */}
      {/* ========================================================================= */}
      <section id="about" className="relative py-32 md:py-48 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-16"
        >
          <div className="space-y-4">
            <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">01 / ARCHITECTURE</span>
            <h2 
              className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              BUILT FOR THOSE WHO <br />
              <span className="text-[#737373]">REFUSE SURVEILLANCE.</span>
            </h2>
          </div>

          <p className="text-base sm:text-xl text-[#a3a3a3] font-light leading-relaxed max-w-3xl">
            Liquid Chat is an uncompromising private messaging system. No central servers store your conversations. 
            No phone numbers or emails tether your identity to corporate databases. Every packet is sealed in hardware before leaving your device.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/[0.08]">
            <div className="space-y-3">
              <span className="font-mono text-xs text-cyan-400">10-DIGIT LIQUID ID</span>
              <h3 className="text-lg font-medium text-white tracking-wide">Zero Personal Telemetry</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Generate an untraceable 10-digit cryptographic identifier. Communicate with complete anonymity without SIM card verification.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs text-purple-400">CURVE25519 & AES-256</span>
              <h3 className="text-lg font-medium text-white tracking-wide">Hardware Key Ratchets</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Ephemeral Diffie-Hellman handshakes calculate independent keys for every message. Even if one key is captured, historical traffic remains sealed.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs text-emerald-400">ZERO CLOUD FOOTPRINT</span>
              <h3 className="text-lg font-medium text-white tracking-wide">Local SQLite Keystore</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Your conversations reside strictly in encrypted local device storage. If our relay nodes are seized, attackers receive only randomized ciphertext noise.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 2: KEY CAPABILITIES ("Engineered for Discretion") */}
      {/* ========================================================================= */}
      <section id="features" className="relative py-32 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-16"
        >
          <div className="space-y-4">
            <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">02 / CAPABILITIES</span>
            <h2 
              className="text-3xl sm:text-5xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ENGINEERED FOR DISCRETION
            </h2>
            <p className="text-sm text-[#a3a3a3] max-w-xl font-light">
              Every feature is built around the single principle of client sovereignty and uncompromising confidentiality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Video size={22} className="text-cyan-400" />,
                title: "Peer-to-Peer Voice & Video",
                desc: "Direct WebRTC audio and high-definition video calls sealed with DTLS-SRTP encryption. Streams never pass through relay servers."
              },
              {
                icon: <Flame size={22} className="text-purple-400" />,
                title: "Self-Destructing Streams",
                desc: "Granular burn timers from 5 seconds to 24 hours. Messages vanish from both sender and recipient storage permanently with zero recovery trace."
              },
              {
                icon: <Lock size={22} className="text-emerald-400" />,
                title: "Hardware PIN Lockdown & Vault",
                desc: "Secure individual confidential chats or the entire client with a master PIN. Automatic session lockouts safeguard against physical device inspection."
              },
              {
                icon: <ShieldCheck size={22} className="text-blue-400" />,
                title: "Zero-Metadata Group Rooms",
                desc: "Group messaging protected by epoch-based cryptographic ratcheting. Group memberships and rosters are shielded from relay observers."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/20 transition-all space-y-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-white tracking-wide">{feature.title}</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 3: DOWNLOAD & SECURITY STATION */}
      {/* ========================================================================= */}
      <section id="download" className="relative py-32 md:py-48 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 relative overflow-hidden space-y-10"
        >
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">03 / DISTRIBUTION</span>
            <h2 
              className="text-3xl sm:text-5xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              TAKE CONTROL OF YOUR PRIVACY
            </h2>
            <p className="text-sm text-[#a3a3a3] font-light leading-relaxed">
              Download the standalone Android APK built without Google Play Services or tracker libraries, or launch the browser client immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="px-8 py-4 rounded-full bg-white text-black text-xs font-bold tracking-wider hover:bg-[#eaeaea] shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <Download size={18} />
              <span>DOWNLOAD APK (v2.0.1 • 6.3MB)</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-4 rounded-full border border-white/20 text-xs font-medium tracking-wider text-[#eaeaea] hover:text-white hover:border-white/40 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center gap-2"
            >
              <Monitor size={16} className="text-purple-400" />
              <span>LAUNCH WEB CLIENT</span>
              <ArrowUpRight size={14} className="text-[#737373]" />
            </Link>
          </div>

          {/* Cryptographic Hash Verification */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <div className="truncate mr-4">
              <span className="text-[#737373] block text-[10px] tracking-wider uppercase">SHA-256 CHECKSUM</span>
              <span className="text-[#a3a3a3] select-all truncate">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            </div>
            <button
              onClick={handleCopyHash}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedHash ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOOTER: Minimalist, elegant, dark */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.06] py-14 max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#737373] font-light">
        <div className="flex items-center gap-3">
          <LiquidLogo size={18} />
          <span className="tracking-widest uppercase font-mono text-[11px]">LIQUID CHAT PROTOCOL</span>
        </div>

        <p className="tracking-wide">Designed for absolute discretion. Open source.</p>

        <div className="flex items-center gap-6">
          <Link href="/web" className="hover:text-white transition-colors">Web App</Link>
          <a href="/LiquidChat.apk" download className="hover:text-white transition-colors">APK</a>
          <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
