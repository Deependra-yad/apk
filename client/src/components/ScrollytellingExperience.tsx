"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ShieldCheck, Lock, Key, Cpu, Zap, Radio, 
  CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Terminal, FileCode2,
  Shield, Check, Play, CornerDownRight, Wifi, AlertTriangle
} from 'lucide-react';

export default function ScrollytellingExperience() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress strictly within this 300vh story container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001
  });

  // Calculate current active act (1, 2, or 3)
  const [activeAct, setActiveAct] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      if (latest < 0.33) {
        setActiveAct(1);
      } else if (latest < 0.66) {
        setActiveAct(2);
      } else {
        setActiveAct(3);
      }
    });
  }, [smoothProgress]);

  // Click handler to jump to specific act
  const scrollToAct = (act: 1 | 2 | 3) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const containerHeight = rect.height;

    let targetRatio = 0.1;
    if (act === 2) targetRatio = 0.48;
    if (act === 3) targetRatio = 0.85;

    window.scrollTo({
      top: containerTop + containerHeight * targetRatio,
      behavior: 'smooth'
    });
  };

  // Story Acts Opacities & Transforms
  // Act 1: 0% -> 33%
  const opacityAct1 = useTransform(smoothProgress, [0, 0.22, 0.32], [1, 1, 0]);
  const yAct1 = useTransform(smoothProgress, [0, 0.22, 0.32], [0, 0, -35]);
  const scaleAct1 = useTransform(smoothProgress, [0, 0.22, 0.32], [1, 1, 0.94]);

  // Act 2: 33% -> 66%
  const opacityAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.66], [0, 1, 1, 0]);
  const yAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.66], [35, 0, 0, -35]);
  const scaleAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.66], [0.94, 1, 1, 0.94]);

  // Act 3: 66% -> 100%
  const opacityAct3 = useTransform(smoothProgress, [0.62, 0.72, 1], [0, 1, 1]);
  const yAct3 = useTransform(smoothProgress, [0.62, 0.72, 1], [35, 0, 0]);
  const scaleAct3 = useTransform(smoothProgress, [0.62, 0.72, 1], [0.94, 1, 1]);

  // 3D Visual Center Transforms
  const platformRotateY = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [-14, 0, 14, 0]);
  const platformRotateX = useTransform(smoothProgress, [0, 0.5, 1], [8, 0, -8]);
  const shieldScale = useTransform(smoothProgress, [0.38, 0.52], [0.85, 1.15]);
  const shieldOpacity = useTransform(smoothProgress, [0.32, 0.42, 0.6, 0.66], [0, 1, 1, 0]);

  // Vertical progress bar height
  const progressPercent = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-transparent text-foreground">
      {/* Pinned Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden px-4 sm:px-8 max-w-7xl mx-auto z-10">
        
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-xs font-mono text-[#00f2fe] mb-3 backdrop-blur-md">
            <Radio size={14} className="animate-pulse text-[#00f2fe]" />
            <span>INTERACTIVE SCROLLYTELLING PROTOCOL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            The Journey of a <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00f2fe] via-[#ff7597] to-[#a855f7]">Zero-Knowledge</span> Packet
          </h2>
          <p className="text-foreground/60 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Scroll downwards to follow cryptographic packets through quantum-hardened transit in real time.
          </p>

          {/* Clickable Act Jumper Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4">
            {[
              { num: 1, label: 'Act 01: Client Synthesis' },
              { num: 2, label: 'Act 02: Hostile Transit' },
              { num: 3, label: 'Act 03: Instant Decryption' }
            ].map(tab => (
              <button
                key={tab.num}
                onClick={() => scrollToAct(tab.num as 1 | 2 | 3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeAct === tab.num
                    ? 'bg-gradient-to-r from-[#ff4b82] to-[#a855f7] text-white shadow-[0_0_20px_rgba(255,75,130,0.5)] scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-foreground/60 border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Storyboard Grid: Left Storycard / Right 3D Visual Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[440px]">
          
          {/* Left Column: Progress Stepper & Act Cards (5 Cols) */}
          <div className="lg:col-span-5 relative min-h-[300px] flex items-center">
            
            {/* Vertical Progress Spine */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 rounded-full hidden sm:block">
              <motion.div 
                className="w-full bg-gradient-to-b from-[#00f2fe] via-[#ff7597] to-[#10b981] rounded-full"
                style={{ height: progressPercent }}
              />
            </div>

            <div className="sm:pl-8 w-full relative min-h-[280px]">
              
              {/* Act 1 Card */}
              <motion.div 
                style={{ 
                  opacity: opacityAct1, 
                  y: yAct1, 
                  scale: scaleAct1,
                  pointerEvents: activeAct === 1 ? 'auto' : 'none'
                }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-[#110c24]/90 border border-[#00f2fe]/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,254,0.15)]"
              >
                <div className="flex items-center gap-2.5 text-xs font-mono text-[#00f2fe] font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-[#00f2fe]/20 border border-[#00f2fe]/40">ACT 01</span>
                  <span>CLIENT-SIDE SYNTHESIS</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ephemeral Key Generation</h3>
                <p className="text-foreground/70 text-xs sm:text-sm leading-relaxed mb-4">
                  The moment you type, your browser computes an ephemeral ECDH keypair in client RAM via the WebCrypto API. Plaintext is instantly converted into a 256-bit AES-GCM cipher with a non-repeating 96-bit initialization vector.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#00f2fe] bg-black/50 p-3 rounded-xl border border-white/5">
                  <Key size={14} />
                  <span>X25519 Curve + AES-256-GCM Locked</span>
                </div>
              </motion.div>

              {/* Act 2 Card */}
              <motion.div 
                style={{ 
                  opacity: opacityAct2, 
                  y: yAct2, 
                  scale: scaleAct2,
                  pointerEvents: activeAct === 2 ? 'auto' : 'none'
                }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-[#1a0f26]/90 border border-[#ff7597]/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,117,151,0.15)]"
              >
                <div className="flex items-center gap-2.5 text-xs font-mono text-[#ff7597] font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-[#ff7597]/20 border border-[#ff7597]/40">ACT 02</span>
                  <span>HOSTILE AIRSPACE TRANSIT</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Zero-Knowledge Relay</h3>
                <p className="text-foreground/70 text-xs sm:text-sm leading-relaxed mb-4">
                  The ciphertext travels through public cloud relays and ISP networks. Even if intercepted by rogue routers or state-level adversaries, they see only pseudo-random mathematical noise. No server ever possesses the private key.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#ff7597] bg-black/50 p-3 rounded-xl border border-white/5">
                  <ShieldAlert size={14} />
                  <span>MITM Tamper-Proof 128-bit Authentication Tag</span>
                </div>
              </motion.div>

              {/* Act 3 Card */}
              <motion.div 
                style={{ 
                  opacity: opacityAct3, 
                  y: yAct3, 
                  scale: scaleAct3,
                  pointerEvents: activeAct === 3 ? 'auto' : 'none'
                }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-[#0d1c1c]/90 border border-[#10b981]/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-center gap-2.5 text-xs font-mono text-[#10b981] font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-[#10b981]/20 border border-[#10b981]/40">ACT 03</span>
                  <span>LOCAL ZERO-LATENCY RESOLUTION</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Peer Ratchet Decryption</h3>
                <p className="text-foreground/70 text-xs sm:text-sm leading-relaxed mb-4">
                  The recipient verifies cryptographic integrity locally in hardware. The shared secret unlocks the original message in under 1.2 milliseconds, triggering a delicate Tokyo chime and caching decrypted plaintext strictly in physical local storage.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#10b981] bg-black/50 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 size={14} />
                  <span>Verified 100% Cryptographic Parity (1.2ms)</span>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Right Column: Dynamic 3D Spatial Simulator Stage (7 Cols) */}
          <div className="lg:col-span-7 h-[380px] sm:h-[460px] relative flex items-center justify-center">
            
            {/* 3D Isometric Viewport Platform */}
            <motion.div 
              style={{ 
                rotateY: platformRotateY, 
                rotateX: platformRotateX,
                perspective: 1200 
              }}
              className="w-full max-w-lg aspect-[4/3] rounded-3xl bg-gradient-to-tr from-[#120e24]/95 via-[#181330]/90 to-[#0a0714]/95 border border-white/15 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] relative p-6 flex flex-col justify-between overflow-hidden"
            >
              {/* Animated Cyber Grid Matrix */}
              <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

              {/* Stage Top Status Bar */}
              <div className="flex items-center justify-between z-10 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeAct === 1 ? 'bg-[#00f2fe]' : activeAct === 2 ? 'bg-[#ff7597]' : 'bg-[#10b981]'} animate-ping`} />
                  <span className="text-xs font-mono text-white/90 font-bold">Liquid Relay #4092</span>
                </div>
                <div className="text-[11px] font-mono text-[#ff7597] flex items-center gap-1.5">
                  <Cpu size={13} />
                  <span>X25519 Ratchet Session</span>
                </div>
              </div>

              {/* Dynamic Visual Content based on active act */}
              <div className="relative flex-1 flex items-center justify-center my-4">
                
                {/* Visual 1: Client-side Live Typing & Cipher Transformation */}
                <motion.div 
                  style={{ 
                    opacity: opacityAct1,
                    pointerEvents: activeAct === 1 ? 'auto' : 'none'
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="p-4 rounded-2xl bg-[#00f2fe]/15 border border-[#00f2fe]/40 text-[#00f2fe] shadow-[0_0_30px_rgba(0,242,254,0.3)]">
                    <Lock size={32} className="animate-bounce" />
                  </div>

                  <div className="bg-black/70 border border-white/10 rounded-2xl p-4 max-w-xs w-full shadow-2xl text-left space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#00f2fe]">
                      <span>PLAIN $\to$ CIPHER</span>
                      <span className="text-emerald-400">ENCRYPTING</span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      "Secret rendezvous in Tokyo 🌸"
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 break-all bg-black/60 p-2 rounded-lg border border-white/5">
                      0x7F2A9C • AES-256-GCM • [Tag: 9b201a]
                    </div>
                  </div>
                </motion.div>

                {/* Visual 2: Transit Node Shielding Against Hostile Probes */}
                <motion.div 
                  style={{ 
                    opacity: opacityAct2,
                    pointerEvents: activeAct === 2 ? 'auto' : 'none'
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
                >
                  <motion.div 
                    style={{ scale: shieldScale, opacity: shieldOpacity }}
                    className="w-28 h-28 rounded-full border-2 border-dashed border-[#ff7597] flex items-center justify-center relative shadow-[0_0_40px_rgba(255,117,151,0.5)]"
                  >
                    <ShieldCheck size={48} className="text-[#ff7597] animate-pulse" />

                    {/* Deflected MITM Particle */}
                    <motion.div 
                      animate={{ 
                        x: [-50, 50, -50], 
                        y: [-25, 25, -25],
                        scale: [0.9, 1.1, 0.9]
                      }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500 text-[9px] font-mono text-rose-400 font-bold shadow-lg"
                    >
                      MITM DEFLECTED
                    </motion.div>
                  </motion.div>

                  <div className="bg-black/60 border border-[#ff7597]/30 rounded-xl px-4 py-2 text-[11px] font-mono text-foreground/80 max-w-xs">
                    Untrusted cloud relay. 128-bit authentication tag blocks tampering.
                  </div>
                </motion.div>

                {/* Visual 3: Recipient Ratchet Instant Decryption */}
                <motion.div 
                  style={{ 
                    opacity: opacityAct3,
                    pointerEvents: activeAct === 3 ? 'auto' : 'none'
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="p-4 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] shadow-[0_0_35px_rgba(16,185,129,0.4)]">
                    <Sparkles size={32} className="animate-spin" />
                  </div>

                  <div className="bg-gradient-to-r from-[#110c24] to-[#0c1f17] border border-[#10b981]/40 rounded-2xl p-4 max-w-xs w-full shadow-2xl text-left space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[#10b981] font-mono">
                      <span>DECRYPTED IN 1.2ms</span>
                      <CheckCircle2 size={13} />
                    </div>
                    <div className="text-xs font-semibold text-white">
                      "Secret rendezvous in Tokyo 🌸"
                    </div>
                    <div className="text-[10px] text-foreground/50 font-mono">
                      Verified ECDH ratchet signature ✓
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Stage Bottom Footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 border-t border-white/10 pt-2 z-10">
                <span>Curve25519 ECDH</span>
                <span className="text-[#00f2fe]">Zero-Knowledge Server Verified</span>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
