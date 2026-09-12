"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ShieldCheck, Lock, Key, Cpu, Zap, Radio, 
  CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Terminal, FileCode2
} from 'lucide-react';

export default function ScrollytellingExperience() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track progress strictly inside this 300vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001
  });

  // Story Acts Opacities & Transforms
  // Act 1: 0% -> 33%
  const opacityAct1 = useTransform(smoothProgress, [0, 0.22, 0.33], [1, 1, 0]);
  const yAct1 = useTransform(smoothProgress, [0, 0.22, 0.33], [0, 0, -40]);
  const scaleAct1 = useTransform(smoothProgress, [0, 0.22, 0.33], [1, 1, 0.92]);

  // Act 2: 33% -> 66%
  const opacityAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.68], [0, 1, 1, 0]);
  const yAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.68], [40, 0, 0, -40]);
  const scaleAct2 = useTransform(smoothProgress, [0.28, 0.38, 0.58, 0.68], [0.92, 1, 1, 0.92]);

  // Act 3: 66% -> 100%
  const opacityAct3 = useTransform(smoothProgress, [0.63, 0.75, 1], [0, 1, 1]);
  const yAct3 = useTransform(smoothProgress, [0.63, 0.75, 1], [40, 0, 0]);
  const scaleAct3 = useTransform(smoothProgress, [0.63, 0.75, 1], [0.92, 1, 1]);

  // 3D Visual Center Transforms
  const phoneRotateY = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [-18, 0, 18, 0]);
  const phoneRotateX = useTransform(smoothProgress, [0, 0.5, 1], [10, 0, -10]);
  const packetProgress = useTransform(smoothProgress, [0.33, 0.66], [0, 100]);
  const shieldScale = useTransform(smoothProgress, [0.4, 0.55], [0.8, 1.2]);
  const shieldOpacity = useTransform(smoothProgress, [0.35, 0.45, 0.6, 0.68], [0, 1, 1, 0]);

  // Progress Bar Height
  const progressPercent = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-liquid-dark text-foreground">
      {/* Pinned Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden px-4 sm:px-8 max-w-7xl mx-auto z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-liquid-accent/10 border border-liquid-accent/30 text-xs font-mono text-liquid-accent mb-3">
            <Radio size={14} className="animate-pulse text-liquid-accent" />
            <span>INTERACTIVE SCROLLYTELLING PROTOCOL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            The Journey of a <span className="bg-clip-text text-transparent bg-gradient-to-r from-liquid-accent via-white to-liquid-secondary">Zero-Knowledge</span> Packet
          </h2>
          <p className="text-foreground/60 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Scroll downwards to follow cryptographic packets through quantum-hardened transit in real time.
          </p>
        </div>

        {/* Storyboard Grid: Left Storycard / Right 3D Visual Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
          
          {/* Left Column: Progress Stepper & Act Cards (5 Cols) */}
          <div className="lg:col-span-5 relative min-h-[300px] flex items-center">
            
            {/* Vertical Progress Spine */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 rounded-full hidden sm:block">
              <motion.div 
                className="w-full bg-gradient-to-b from-liquid-accent via-liquid-secondary to-pink-500 rounded-full"
                style={{ height: progressPercent }}
              />
            </div>

            <div className="sm:pl-8 w-full relative">
              
              {/* Act 1 Card */}
              <motion.div 
                style={{ opacity: opacityAct1, y: yAct1, scale: scaleAct1 }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-liquid-base/80 border border-liquid-accent/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,210,255,0.15)]"
              >
                <div className="flex items-center gap-3 text-xs font-mono text-liquid-accent font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-liquid-accent/20 border border-liquid-accent/40">ACT 01</span>
                  <span>CLIENT-SIDE SYNTHESIS</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ephemeral Key Generation</h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                  The moment you type, your device computes an ephemeral ECDH keypair in client RAM via the WebCrypto API.
                  Plaintext is wrapped in a 256-bit AES-GCM cipher with a non-repeating 96-bit initialization vector.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-liquid-accent bg-black/40 p-3 rounded-xl border border-white/5">
                  <Key size={14} />
                  <span>X25519 Curve + AES-256-GCM Locked</span>
                </div>
              </motion.div>

              {/* Act 2 Card */}
              <motion.div 
                style={{ opacity: opacityAct2, y: yAct2, scale: scaleAct2 }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-liquid-base/80 border border-liquid-secondary/30 backdrop-blur-xl shadow-[0_0_30px_rgba(255,117,151,0.15)]"
              >
                <div className="flex items-center gap-3 text-xs font-mono text-liquid-secondary font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-liquid-secondary/20 border border-liquid-secondary/40">ACT 02</span>
                  <span>HOSTILE AIRSPACE TRANSIT</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Zero-Knowledge Relay</h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                  The ciphertext travels through public Internet relays. Even if inspected by rogue ISP routers or state-level adversaries,
                  they see only mathematically uncrackable pseudo-random noise. No server ever possesses the private decryption key.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-liquid-secondary bg-black/40 p-3 rounded-xl border border-white/5">
                  <ShieldAlert size={14} />
                  <span>MITM Tamper-Proof 128-bit Authentication Tag</span>
                </div>
              </motion.div>

              {/* Act 3 Card */}
              <motion.div 
                style={{ opacity: opacityAct3, y: yAct3, scale: scaleAct3 }}
                className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 rounded-3xl bg-liquid-base/80 border border-green-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.15)]"
              >
                <div className="flex items-center gap-3 text-xs font-mono text-green-400 font-bold mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/40">ACT 03</span>
                  <span>LOCAL ZERO-LATENCY RESOLUTION</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Peer Ratchet Decryption</h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-4">
                  The recipient verifies cryptographic integrity in hardware. The shared secret unlocks the original message in under 1.4 milliseconds,
                  playing a delicate Kawaii chime and caching decrypted plaintext strictly on physical storage.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-green-400 bg-black/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 size={14} />
                  <span>Verified 100% Cryptographic Parity</span>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Right Column: Dynamic 3D Spatial Simulator Stage (7 Cols) */}
          <div className="lg:col-span-7 h-[380px] sm:h-[460px] relative flex items-center justify-center">
            
            {/* 3D Isometric Viewport Platform */}
            <motion.div 
              style={{ 
                rotateY: phoneRotateY, 
                rotateX: phoneRotateX,
                perspective: 1200 
              }}
              className="w-full max-w-lg aspect-[4/3] rounded-3xl bg-gradient-to-tr from-[#12121e]/90 via-[#181829]/80 to-[#0c0c14]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative p-6 flex flex-col justify-between overflow-hidden"
            >
              {/* Cyber Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#00d2ff_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* Stage Top Status Bar */}
              <div className="flex items-center justify-between z-10 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-liquid-accent animate-ping" />
                  <span className="text-xs font-mono text-white/80 font-bold">Liquid Node #4092</span>
                </div>
                <div className="text-[11px] font-mono text-liquid-secondary flex items-center gap-1.5">
                  <Cpu size={13} />
                  <span>X25519 Ratchet Active</span>
                </div>
              </div>

              {/* Dynamic Interactive Visuals Driven by Scroll Progress */}
              <div className="relative flex-1 flex items-center justify-center my-4">
                
                {/* Visual 1: Origin Device Encrypting Bubble */}
                <motion.div 
                  style={{ opacity: opacityAct1 }}
                  className="absolute flex flex-col items-center gap-3 text-center"
                >
                  <div className="p-4 rounded-2xl bg-liquid-accent/15 border border-liquid-accent/40 text-liquid-accent shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                    <Lock size={36} className="animate-bounce" />
                  </div>
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-4 max-w-xs shadow-xl">
                    <div className="text-xs text-liquid-accent font-mono mb-1 text-left">Plaintext $\to$ Ciphertext</div>
                    <div className="text-sm font-semibold text-white">"Secret rendezvous in Tokyo 🌸"</div>
                    <div className="mt-2 text-[11px] font-mono text-white/40 break-all text-left bg-black/40 p-2 rounded-lg">
                      U2FsdGVkX19sM8q...7hK90pA==
                    </div>
                  </div>
                </motion.div>

                {/* Visual 2: Transit Node Shielding Against Rogue MITM */}
                <motion.div 
                  style={{ opacity: opacityAct2 }}
                  className="absolute flex flex-col items-center gap-4 text-center"
                >
                  <motion.div 
                    style={{ scale: shieldScale, opacity: shieldOpacity }}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-liquid-secondary flex items-center justify-center relative shadow-[0_0_35px_rgba(255,117,151,0.4)]"
                  >
                    <ShieldCheck size={44} className="text-liquid-secondary animate-pulse" />
                    {/* Bouncing Attacker Particle */}
                    <motion.div 
                      animate={{ x: [-40, 40, -40], y: [-20, 20, -20] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500 text-[10px] font-mono text-red-400"
                    >
                      MITM Blocked
                    </motion.div>
                  </motion.div>
                  <p className="text-xs font-mono text-foreground/70 max-w-xs">
                    Encrypted payload passing through hostile relays with cryptographic immunity.
                  </p>
                </motion.div>

                {/* Visual 3: Recipient Ratchet Instant Decryption */}
                <motion.div 
                  style={{ opacity: opacityAct3 }}
                  className="absolute flex flex-col items-center gap-3 text-center"
                >
                  <div className="p-4 rounded-2xl bg-green-500/15 border border-green-500/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.3)]">
                    <Sparkles size={36} className="animate-spin" />
                  </div>
                  <div className="bg-gradient-to-r from-liquid-accent/20 to-pink-500/20 border border-liquid-accent/40 rounded-2xl p-4 max-w-xs shadow-xl text-left">
                    <div className="flex items-center justify-between text-xs text-green-400 font-mono mb-1">
                      <span>Decrypted in 1.2ms</span>
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="text-sm font-semibold text-white">"Secret rendezvous in Tokyo 🌸"</div>
                    <div className="mt-1 text-[11px] text-white/50">Verified ECDH ratchet signature ✓</div>
                  </div>
                </motion.div>

              </div>

              {/* Stage Bottom Footer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/40 border-t border-white/10 pt-2 z-10">
                <span>Curve25519 ECDH</span>
                <span>Zero-Knowledge Server Logs</span>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
