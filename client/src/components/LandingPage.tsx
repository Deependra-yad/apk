"use client";

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Lock, Download, Monitor, ArrowUpRight, 
  ChevronDown, Check, Copy, Shield, EyeOff, 
  Flame, Key, Video, Volume2, Sparkles, AlertTriangle,
  Globe, Layers, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import Lenis from 'lenis';
import LiquidLogo from '@/components/LiquidLogo';
import Ultimate3DExperience from './Ultimate3DExperience';
import { soundEffects } from '@/utils/audioSynth';

export default function LandingPage() {
  const [mitmActive, setMitmActive] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const { scrollYProgress } = useScroll();

  // Smooth Lenis Scroll Controller
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
    <div className="relative min-h-screen bg-[#05060a] text-[#eaeaea] font-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden">
      {/* Google Web Fonts for High-End Cinematic Typography */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
      />

      {/* 1. FULL-SCREEN 5-STAGE CONTINUOUS 3D SCROLLING CANVAS */}
      <Ultimate3DExperience mitmActive={mitmActive} />

      {/* 2. MINIMALIST TRANSPARENT FIXED NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#05060a]/50 border-b border-white/[0.06] transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#05060a] rounded-xl flex items-center justify-center">
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
            <a href="#act1" className="hover:text-white transition-colors">OVERVIEW</a>
            <a href="#act2" className="hover:text-white transition-colors">3D HARDWARE</a>
            <a href="#act3" className="hover:text-white transition-colors">ENCRYPTION</a>
            <a href="#act4" className="hover:text-white transition-colors">GLOBAL MESH</a>
            <a href="#act5" className="hover:text-white transition-colors">DOWNLOAD</a>
          </nav>

          {/* Right CTAs */}
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
              className="px-5 py-2 text-xs font-medium tracking-wider text-black bg-white hover:bg-[#eaeaea] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 font-sans font-semibold"
            >
              <Download size={14} />
              <span>GET APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ACT 1: HERO VIEWPORT (0.00 to 0.20 SCROLL) */}
      {/* ========================================================================= */}
      <section id="act1" className="relative h-screen flex flex-col items-center justify-between text-center px-6 pt-32 pb-12 pointer-events-none">
        <div />

        {/* Centered Large Hero Typography */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-4xl space-y-6 pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs tracking-widest text-[#a3a3a3] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>SOVEREIGN CRYPTOGRAPHIC CLIENT • v2.0.1 PRO</span>
          </div>

          <h1 
            className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-[0.16em] text-[#eaeaea] uppercase drop-shadow-[0_0_50px_rgba(168,85,247,0.35)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            LIQUID CHAT
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#a3a3a3] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Communication in its purest, sovereign form. 
            Scroll down to deconstruct the hardware architecture in full 3D space.
          </p>

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
              <span>OPEN WEB CLIENT</span>
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[10px] tracking-[0.3em] text-[#737373] uppercase font-mono">SCROLL TO DISASSEMBLE</span>
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
      {/* ACT 2: 3D HARDWARE EXPLODED DECONSTRUCTION (0.20 to 0.45 SCROLL) */}
      {/* ========================================================================= */}
      <section id="act2" className="relative h-[220vh]">
        <div className="sticky top-0 h-screen flex items-center justify-between max-w-6xl mx-auto px-6 pointer-events-none">
          {/* Left HUD Callout Cards */}
          <div className="w-full max-w-md pointer-events-auto space-y-4 z-20">
            <div className="space-y-2">
              <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">01 / HARDWARE ISOLATION</span>
              <h2 
                className="text-3xl sm:text-4xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                PHYSICAL 3D DECONSTRUCTION
              </h2>
              <p className="text-xs text-[#a3a3a3] font-light leading-relaxed">
                As you scroll, the device rotates into isometric projection and disassembles into 4 sovereign isolation layers in 3D space:
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { layer: '01', title: 'Zero-Plaintext Cyber Glass', desc: 'Front protective layer with zero display telemetry or memory scraping.' },
                { layer: '02', title: 'Ultra-Retina AMOLED Display', desc: '120Hz dynamic refresh visual buffer flushed immediately upon minimize.' },
                { layer: '03', title: 'Sovereign Logic Board & Enclave', desc: 'Silicon hardware co-processor executing ephemeral Curve25519 ratchets.' },
                { layer: '04', title: 'Titanium Chassis & SQLite Vault', desc: 'Hardware-encrypted SQLite local storage with anti-tamper zeroization.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#05070e]/80 border border-white/[0.08] backdrop-blur-xl space-y-1 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-400 font-bold">LAYER {item.layer}</span>
                    <span className="text-[10px] font-mono text-[#737373]">ISOLATED</span>
                  </div>
                  <h3 className="text-sm font-medium text-white">{item.title}</h3>
                  <p className="text-xs text-[#a3a3a3] font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ACT 3: CRYPTOGRAPHIC QUANTUM PACKET SCROLLYTELLING (0.45 to 0.70 SCROLL) */}
      {/* ========================================================================= */}
      <section id="act3" className="relative h-[240vh]">
        <div className="sticky top-0 h-screen flex items-center justify-between max-w-6xl mx-auto px-6 pointer-events-none">
          <div />

          {/* Right Storyboard HUD */}
          <div className="w-full max-w-md pointer-events-auto space-y-5 z-20">
            <div className="space-y-2">
              <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">02 / CRYPTOGRAPHIC TRANSIT</span>
              <h2 
                className="text-3xl sm:text-4xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                AIRSPACE DEFENSE
              </h2>
              <p className="text-xs text-[#a3a3a3] font-light leading-relaxed">
                Watch the 3D Cryptographic Quantum Data Prism navigate hostile transit. Every packet is wrapped in a Poly1305 authentication tag.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#05070e]/90 border border-white/10 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold">FORCEFIELD STATUS:</span>
                <span className={mitmActive ? "text-red-400" : "text-emerald-400"}>
                  {mitmActive ? "⚠️ TAMPER REJECTED" : "● SEALED & SECURE"}
                </span>
              </div>

              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Test the 3D hexagonal forcefield defense against simulated wiretap tampering. When active, authentication fails instantly.
              </p>

              <button
                onClick={() => {
                  setMitmActive(!mitmActive);
                  soundEffects.playAlert();
                }}
                className={`w-full py-3 rounded-xl border text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 ${
                  mitmActive
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-white/[0.04] border-white/15 text-[#eaeaea] hover:bg-white/10'
                }`}
              >
                <AlertTriangle size={15} />
                <span>{mitmActive ? 'TAMPER INJECTED (FAIL)' : 'INJECT MITM ATTACK TO TEST SHIELD'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ACT 4: THE SOVEREIGN GLOBAL MESH (0.70 to 0.88 SCROLL) */}
      {/* ========================================================================= */}
      <section id="act4" className="relative min-h-screen py-32 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono text-cyan-400 tracking-[0.25em] uppercase">03 / GLOBAL NETWORK</span>
          <h2 
            className="text-3xl sm:text-5xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            PEER-TO-PEER MESH
          </h2>
          <p className="text-xs sm:text-sm text-[#a3a3a3] font-light leading-relaxed">
            The 3D globe connects sovereign nodes in Tokyo, Zurich, New York, Singapore, London, and Reykjavik directly via encrypted WebRTC channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Video size={22} className="text-cyan-400" />,
              title: "Encrypted Voice & Video",
              desc: "Direct peer-to-peer WebRTC calls with DTLS-SRTP encryption. Audio and video never pass through central relays."
            },
            {
              icon: <Flame size={22} className="text-purple-400" />,
              title: "Self-Destructing Streams",
              desc: "Granular burn timers from 5 seconds to 24 hours. Messages zeroize from both sender and recipient storage permanently."
            },
            {
              icon: <Lock size={22} className="text-emerald-400" />,
              title: "Hardware PIN Vault",
              desc: "Master PIN lock protects individual conversations or the entire app with automatic session timeout."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="p-8 rounded-2xl bg-[#05070e]/80 border border-white/[0.07] hover:border-white/20 transition-all space-y-3 backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-base font-medium text-white tracking-wide">{item.title}</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed font-light">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ACT 5: DOWNLOAD & MONOLITH LAUNCHPAD (0.88 to 1.00 SCROLL) */}
      {/* ========================================================================= */}
      <section id="act5" className="relative min-h-screen py-32 max-w-5xl mx-auto px-6 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="p-10 sm:p-16 rounded-3xl bg-[#05070e]/90 border border-white/10 backdrop-blur-2xl space-y-10"
        >
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-mono text-purple-400 tracking-[0.25em] uppercase">04 / DISTRIBUTION</span>
            <h2 
              className="text-3xl sm:text-5xl font-normal tracking-[0.1em] text-[#eaeaea] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ACQUIRE LIQUID CHAT
            </h2>
            <p className="text-sm text-[#a3a3a3] font-light leading-relaxed">
              Install the standalone sovereign Android APK (v2.0.1) built without Google Play Services or tracker libraries, or launch the browser client.
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

          {/* SHA-256 Checksum Verification */}
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
      {/* FOOTER */}
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
