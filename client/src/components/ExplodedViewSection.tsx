"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Layers, Cpu, ShieldCheck, Lock, Sparkles, Key, 
  Terminal, Shield, Zap, EyeOff, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function ExplodedViewSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001
  });

  // Opacities and transforms for each exploded architectural layer
  const opacityLayer1 = useTransform(smoothProgress, [0, 0.28, 0.38], [1, 1, 0.2]);
  const scaleLayer1 = useTransform(smoothProgress, [0, 0.28, 0.38], [1, 1, 0.95]);

  const opacityLayer2 = useTransform(smoothProgress, [0.25, 0.35, 0.65, 0.75], [0.2, 1, 1, 0.2]);
  const scaleLayer2 = useTransform(smoothProgress, [0.25, 0.35, 0.65, 0.75], [0.95, 1, 1, 0.95]);

  const opacityLayer3 = useTransform(smoothProgress, [0.62, 0.72, 1], [0.2, 1, 1]);
  const scaleLayer3 = useTransform(smoothProgress, [0.62, 0.72, 1], [0.95, 1, 1]);

  return (
    <section ref={containerRef} className="relative h-[220vh] bg-transparent text-foreground">
      {/* Sticky Pinned Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-6 max-w-7xl mx-auto z-10 overflow-hidden pointer-events-none">
        
        {/* Section Title Pill */}
        <div className="text-center mb-8 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-xs font-mono text-[#a855f7] mb-3 backdrop-blur-md">
            <Layers size={14} className="text-[#a855f7] animate-pulse" />
            <span>3D ARCHITECTURAL DECONSTRUCTION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Exploded View: <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff7597] via-[#a855f7] to-[#00f2fe]">Three Sovereign Layers</span>
          </h2>
          <p className="text-foreground/65 text-xs sm:text-sm mt-2 max-w-xl mx-auto font-normal">
            Scroll downwards to separate the hardware architecture. Every layer operates in zero-knowledge isolation.
          </p>
        </div>

        {/* 3 Floating Interactive Architectural Callouts (Pointer events auto) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mx-auto pointer-events-auto">
          
          {/* Layer 1: Zero-Plaintext Cyber Glass */}
          <motion.div 
            style={{ opacity: opacityLayer1, scale: scaleLayer1 }}
            className="p-6 rounded-3xl bg-[#110b24]/85 border border-[#00f2fe]/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,242,254,0.15)] flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#00f2fe]/20 text-[#00f2fe] font-bold border border-[#00f2fe]/40">
                  LAYER 01 • DISPLAY
                </span>
                <span className="text-[10px] font-mono text-emerald-400">0 KB DISK</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <EyeOff size={18} className="text-[#00f2fe]" />
                <span>Zero-Plaintext Cyber Glass</span>
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Messages render directly from encrypted RAM into GPU raster memory. No background screen capture, zero disk caching, and immediate memory purge on chat closure.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#00f2fe]">
              <span>Hardware Raster Lock</span>
              <CheckCircle2 size={12} className="text-emerald-400" />
            </div>
          </motion.div>

          {/* Layer 2: X25519 & AES-256-GCM Co-Processor */}
          <motion.div 
            style={{ opacity: opacityLayer2, scale: scaleLayer2 }}
            className="p-6 rounded-3xl bg-[#1a0f28]/85 border border-[#ff7597]/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(255,117,151,0.15)] flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#ff7597]/20 text-[#ff7597] font-bold border border-[#ff7597]/40">
                  LAYER 02 • CRYPTO
                </span>
                <span className="text-[10px] font-mono text-[#ff7597]">256-BIT AES-GCM</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <Cpu size={18} className="text-[#ff7597]" />
                <span>X25519 Ratchet Engine</span>
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Curve25519 ECDH key negotiation computed client-side. Every single message receives an ephemeral 96-bit random IV and an unforgeable 128-bit authentication tag.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#ff7597]">
              <span>Sub-Millisecond Execution</span>
              <Zap size={12} className="text-amber-400" />
            </div>
          </motion.div>

          {/* Layer 3: Sovereign Anti-Tamper Keystore */}
          <motion.div 
            style={{ opacity: opacityLayer3, scale: scaleLayer3 }}
            className="p-6 rounded-3xl bg-[#101428]/85 border border-[#a855f7]/40 backdrop-blur-2xl shadow-[0_10px_40px_rgba(168,85,247,0.15)] flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#a855f7]/20 text-[#a855f7] font-bold border border-[#a855f7]/40">
                  LAYER 03 • CHASSIS
                </span>
                <span className="text-[10px] font-mono text-[#00f2fe]">ZERO-KNOWLEDGE</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#a855f7]" />
                <span>Anti-Tamper Local Keystore</span>
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Private keys are sealed in IndexedDB keystores with remote WebView inspection disabled, APK signature verification, and domain pinning against man-in-the-middle attacks.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#a855f7]">
              <span>Sovereign Storage Lock</span>
              <Lock size={12} className="text-emerald-400" />
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
