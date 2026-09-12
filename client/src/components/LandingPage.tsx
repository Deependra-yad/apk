"use client";

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Lock, Download, Monitor, ArrowUpRight, 
  ChevronDown, Check, Copy, Shield, Video, Flame, Key,
  Sparkles, ExternalLink, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Lenis from 'lenis';
import LiquidLogo from '@/components/LiquidLogo';
import LapzHero3D from './LapzHero3D';
import { soundEffects } from '@/utils/audioSynth';

export default function LandingPage() {
  const [copiedHash, setCopiedHash] = useState(false);
  const { scrollYProgress } = useScroll();

  // Lenis Buttery-Smooth Cinematic Scroll Engine
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
    <div className="relative min-h-screen bg-[#000000] text-[#eaeaea] font-sans antialiased selection:bg-cyan-500/30 selection:text-white overflow-x-hidden">
      {/* 1. THREE.JS SPATIAL FLOATING GLASS RIG (LAPZ.IO VISION PRO EXPERIENCE) */}
      <LapzHero3D />

      {/* Radial Vignette Mask (like lapz.io .hero-mask-radial) */}
      <div className="fixed inset-0 pointer-events-none -z-5 bg-[radial-gradient(ellipse_closest-side,rgba(0,0,0,0)_0%,#000000_100%)]" />

      {/* Custom Button Styles Inspired by Lapz.io */}
      <style jsx global>{`
        .button-lapz-primary {
          position: relative;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .button-lapz-primary::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(148deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.15));
          opacity: 0.8;
          transition: opacity 0.4s ease, transform 0.6s ease;
        }
        .button-lapz-primary:hover::before {
          opacity: 1;
          transform: rotate(180deg);
        }
        .button-lapz-primary:hover {
          background-color: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 2. NAVBAR: Transparent, fixed at top, minimalist (Lapz.io style) */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/[0.07] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 p-[1.5px] shadow-[0_0_25px_rgba(56,189,248,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <LiquidLogo size={22} />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">
                LIQUID CHAT
              </span>
              <span className="block text-[10px] font-mono text-white/40 tracking-wider">
                SPATIAL PRIVACY CLIENT
              </span>
            </div>
          </Link>

          {/* Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider text-white/60">
            <a href="#overview" className="hover:text-white transition-colors">OVERVIEW</a>
            <a href="#spatial" className="hover:text-white transition-colors">SPATIAL ROOM</a>
            <a href="#capabilities" className="hover:text-white transition-colors">CAPABILITIES</a>
            <a href="#download" className="hover:text-white transition-colors">DOWNLOAD</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/web"
              className="px-5 py-2.5 text-xs font-medium tracking-wide text-white/80 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex items-center gap-2"
            >
              <Monitor size={14} className="text-cyan-400" />
              <span>Launch Web</span>
            </Link>
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="button-lapz-primary px-6 py-2.5 text-xs font-bold text-white rounded-full flex items-center gap-2"
            >
              <Download size={14} className="relative z-10" />
              <span className="relative z-10">Get APK v2.0.1</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION (100vh): Lapz.io inspired spatial showcase */}
      {/* ========================================================================= */}
      <section id="overview" className="relative h-screen flex flex-col items-center justify-between text-center px-6 pt-32 pb-12 pointer-events-none">
        {/* Top Announcement Badge (Like Lapz.io announcement badge) */}
        <div className="pointer-events-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs font-medium text-white/70 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Liquid Chat v2.0.1 Sovereign Release is now live</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-4xl space-y-6 pointer-events-auto"
        >
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05]">
            Private Messaging <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              in Spatial Sovereignty
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto font-normal leading-relaxed">
            Follow your encrypted chats in full spatial depth. Zero plaintext on cloud. No phone numbers required. Sovereign by design.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="button-lapz-primary px-8 py-4 rounded-full text-xs font-bold text-white shadow-2xl flex items-center gap-2.5"
            >
              <Download size={16} className="relative z-10" />
              <span className="relative z-10">DOWNLOAD FOR ANDROID (v2.0.1)</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-xs font-medium text-white transition-all flex items-center gap-2"
            >
              <Monitor size={15} className="text-cyan-400" />
              <span>OPEN WEB CLIENT</span>
              <ArrowRight size={14} className="text-white/40" />
            </Link>
          </div>
        </motion.div>

        {/* Animated Scroll Down Indicator (Like Lapz.io) */}
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[10px] tracking-[0.25em] text-white/40 uppercase font-mono">SCROLL TO EXPLORE SPATIAL LAYERS</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1 h-2 bg-white/70 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SPATIAL INTERIOR SECTION (Like Lapz.io Interior UI Section) */}
      {/* ========================================================================= */}
      <section id="spatial" className="relative py-32 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-mono">
            <span>SPATIAL INTERFACE</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
            Created for <br />
            <span className="text-white/40">Absolute Discretion</span>
          </h2>
          <p className="text-base text-white/60 max-w-xl mx-auto">
            Layered glass windows engineered with mathematical precision. Every interaction is cryptographically isolated from your operating system.
          </p>
        </div>

        {/* 4 Spatial Showcases (Like Lapz.io UI 1, UI 2, UI 3, UI 4) */}
        <div className="space-y-16">
          {/* Showcase 1: Large Spatial Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
            className="p-8 sm:p-14 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="max-w-xl space-y-4 mb-8">
              <span className="text-xs font-mono text-cyan-400">01 / SPATIAL ROOM</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Zero-Plaintext Conversation Flow
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Messages dissolve into encrypted fragments before transmission. Even when windows are minimized, the video and display buffers flush immediately from RAM.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-mono text-cyan-400 font-bold mb-1">CURVE25519</p>
                <p className="text-xs text-white/70">Ephemeral ECDH key agreements computed directly in-memory.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-mono text-purple-400 font-bold mb-1">128-BIT TAG</p>
                <p className="text-xs text-white/70">Poly1305 authentication tags instantly detect and reject network tampering.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-mono text-emerald-400 font-bold mb-1">0 TELEMETRY</p>
                <p className="text-xs text-white/70">Zero analytics, zero tracking, and zero cloud backups stored on servers.</p>
              </div>
            </div>
          </motion.div>

          {/* Showcase 2 & 3: Two Column Spatial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Card: P2P Calls */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl space-y-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <Video className="text-cyan-400" size={24} />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-cyan-400">02 / REAL-TIME STREAMING</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Direct WebRTC Voice & Video</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Calls establish true peer-to-peer tunnels using DTLS-SRTP encryption. Audio and video streams never pass through intermediate recording servers.
                </p>
              </div>
            </motion.div>

            {/* Right Card: Local SQLite Keystore */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl space-y-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <Lock className="text-purple-400" size={24} />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-purple-400">03 / LOCAL SECURITY</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Hardware PIN & SQLite Vault</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Your chat logs and media files reside strictly in local encrypted SQLite storage. Lock specific sensitive conversations or the entire app behind a master PIN.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. "BUILT WITH" SECTION (Like Lapz.io Tooling Section) */}
      {/* ========================================================================= */}
      <section className="py-24 border-y border-white/[0.07] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <span className="text-base font-medium text-white/60 tracking-wide">
            Built with Sovereign Cryptography
          </span>

          <div className="flex flex-wrap items-center gap-8 sm:gap-12">
            {[
              { name: 'Curve25519', tag: 'Key Ratchet' },
              { name: 'AES-256-GCM', tag: 'Authenticated Cipher' },
              { name: 'WebRTC P2P', tag: 'DTLS-SRTP Audio/Video' },
              { name: 'SQLite Vault', tag: 'Encrypted Local Storage' }
            ].map((tech, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div>
                  <p className="text-sm font-bold text-white">{tech.name}</p>
                  <p className="text-[10px] font-mono text-white/40">{tech.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CTA SECTION (Like Lapz.io CTA Section 3) */}
      {/* ========================================================================= */}
      <section id="download" className="relative py-36 max-w-6xl mx-auto px-6">
        <div className="p-10 sm:p-20 rounded-3xl bg-gradient-to-b from-white/[0.04] to-black border border-white/15 relative overflow-hidden space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
              Ready to step into <br />
              <span className="text-cyan-400">the Future of Privacy?</span>
            </h2>
            <p className="text-base text-white/60 leading-relaxed">
              Download the standalone Android APK built without Google Play Services or tracker libraries, or launch the browser client immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/LiquidChat.apk"
              download="LiquidChat.apk"
              className="button-lapz-primary px-8 py-4 rounded-full text-xs font-bold text-white shadow-2xl flex items-center gap-3"
            >
              <Download size={18} className="relative z-10" />
              <span className="relative z-10">DOWNLOAD LIQUIDCHAT.APK (v2.0.1)</span>
            </a>

            <Link
              href="/web"
              className="px-7 py-4 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white/[0.06] transition-all flex items-center gap-2"
            >
              <Monitor size={16} className="text-cyan-400" />
              <span>LAUNCH WEB CLIENT</span>
              <ArrowUpRight size={14} className="text-white/40" />
            </Link>
          </div>

          {/* SHA-256 Checksum */}
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
      {/* 7. FOOTER: Minimalist, clean hairline (Lapz.io style) */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.07] py-14 max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/40 font-normal">
        <div className="flex items-center gap-3">
          <LiquidLogo size={20} />
          <span className="tracking-widest uppercase font-mono text-[11px] text-white/60">
            LIQUID CHAT PROTOCOL
          </span>
        </div>

        <p className="tracking-wide">Designed for spatial sovereignty and absolute discretion. Open source.</p>

        <div className="flex items-center gap-6">
          <Link href="/web" className="hover:text-white transition-colors">Web App</Link>
          <a href="/LiquidChat.apk" download className="hover:text-white transition-colors">Download APK</a>
          <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
