"use client";

import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Sparkles, Video, QrCode, Download, 
  ArrowRight, Smartphone, Monitor, Globe, CheckCircle2, 
  MessageSquare, CircleDashed, Users, Bot, Zap, Star
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0914] text-[#fbfaff] relative overflow-x-hidden font-sans selection:bg-[#ff7597] selection:text-black">
      {/* Background Ambient Cyber-Glow Auras */}
      <div className="absolute top-[-100px] left-1/4 w-[600px] h-[500px] bg-[#ff7597]/15 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[400px] right-[-50px] w-[550px] h-[550px] bg-[#a855f7]/15 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-[200px] left-[-100px] w-[500px] h-[500px] bg-[#00f2fe]/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-30 relative">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff4b82] via-[#f43f5e] to-[#a855f7] flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,75,130,0.45)]">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              LiquidChat <span className="text-[#ff7597] text-xs font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#ff7597]/20 border border-[#ff7597]/30">🌸 暗号化</span>
            </span>
            <p className="text-[10px] text-foreground/50 tracking-wider uppercase font-mono">Private • Encrypted • Japanese Kawaii</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <a
            href="/web"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,75,130,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Open Liquid Web</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-12 pb-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-20">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/30 text-[#ff8da1] text-xs font-medium backdrop-blur-md shadow-sm"
          >
            <span>🌸</span>
            <span>Zero-Knowledge 100% E2EE Messenger</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-ping" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white"
          >
            Privacy, Reimagined in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7597] via-[#f43f5e] to-[#b388ff]">Liquid Glass.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-foreground/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
          >
            Award-winning Japanese Kawaii cyber aesthetic meets military-grade elliptic-curve encryption. Instant AI assistance, crystal-clear mirrored calls, dynamic stories, and seamless WhatsApp Web-style QR desktop login.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
          >
            <a
              href="/web"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-[0_0_30px_rgba(255,75,130,0.5)] hover:shadow-[0_0_40px_rgba(255,75,130,0.7)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Monitor size={18} />
              <span>Launch Liquid Web</span>
            </a>

            <a
              href="/LiquidChat.apk"
              download
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#1a1433]/90 hover:bg-[#251d47] text-foreground font-bold text-sm border border-[#a855f7]/30 shadow-lg hover:border-[#ff7597]/50 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download size={18} className="text-[#00f2fe]" />
              <span>Download Android APK</span>
            </a>
          </motion.div>

          <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-foreground/50">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Free & Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>No Trackers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>100% Private</span>
            </div>
          </div>
        </div>

        {/* Interactive Cyber-Glass Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-full max-w-md lg:max-w-none relative"
        >
          <div className="relative rounded-3xl bg-[#140f26]/90 border border-[#a855f7]/40 shadow-[0_0_60px_rgba(168,85,247,0.3)] backdrop-blur-2xl p-4 sm:p-6 overflow-hidden">
            {/* Header Mockup */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#ff7597] to-[#a855f7]">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura"
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover bg-[#0b0914]"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1">
                    Sakura Tanaka <span className="text-xs">🌸</span>
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-medium">Online • Verified E2EE</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-foreground/70">
                <div className="p-2 rounded-xl bg-foreground/5 text-[#ff7597]"><Video size={16} /></div>
                <div className="p-2 rounded-xl bg-foreground/5 text-[#00f2fe]"><ShieldCheck size={16} /></div>
              </div>
            </div>

            {/* E2EE Pill */}
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-r from-[#2c153a]/80 via-[#1a1228]/90 to-[#2c153a]/80 border border-[#ff7597]/30 text-[#f5c2d8] rounded-full px-3 py-1 text-[10px] flex items-center gap-1.5 shadow-sm">
                <Lock size={10} className="text-[#ff7597]" />
                <span>🌸 End-to-End Encrypted • 暗号化</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-xs bg-[#1b1532] text-[#f6edff] border border-[#a855f7]/30 px-3.5 py-2.5 max-w-[80%] shadow-md">
                  Konichiwa! Did you test the 60-digit security code scanner? ✨
                </div>
              </div>

              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#ff5e97] via-[#f04f85] to-[#9333ea] text-white px-3.5 py-2.5 max-w-[80%] shadow-[0_4px_20px_rgba(255,94,151,0.3)]">
                  Yes! Verified in 0.2s using the camera scanner. The fingerprint matched 100%! 🌸
                </div>
              </div>

              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-xs bg-[#1b1532] text-[#f6edff] border border-[#a855f7]/30 px-3.5 py-2.5 max-w-[80%] shadow-md flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00f2fe] font-mono font-bold">
                    <Sparkles size={11} />
                    <span>Liquid AI Copilot</span>
                  </div>
                  <span>Translated: "Verified instantly with zero latency! ⚡"</span>
                </div>
              </div>
            </div>

            {/* Input Capsule Preview */}
            <div className="bg-[#17122b] rounded-full border border-[#ff7597]/30 px-3 py-2 flex items-center gap-2 shadow-inner">
              <span className="text-sm">🌸</span>
              <span className="text-xs text-foreground/40 flex-1">Type a secure message...</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff4b82] to-[#a855f7] flex items-center justify-center text-white shadow-sm">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#ff7597] tracking-wider uppercase">Engineered for Perfection</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Why the World is Switching to LiquidChat</h2>
          <p className="text-sm text-foreground/60">Every line of code is designed to give you privacy without compromising on beauty and speed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: E2EE */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#ff7597]/20 text-[#ff7597] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">100% End-to-End Encryption</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Every message, image, file, and voice note is encrypted using ECDH P-256 and AES-GCM before leaving your device. Even server operators cannot read your data.
            </p>
          </div>

          {/* Card 2: Desktop QR Login */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#00f2fe]/20 text-[#00f2fe] flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">WhatsApp Web-Style QR Login</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Open <span className="text-[#00f2fe]">web.liquidchat.online</span> on any computer and scan the QR code from your phone's Linked Devices to log in immediately.
            </p>
          </div>

          {/* Card 3: Liquid AI */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#b388ff]/20 text-[#b388ff] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time AI Copilot</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Instant multi-language translation (Spanish, Japanese, French, Hindi, and more), smart contextual replies, and knowledge base lookups with zero subscription fees.
            </p>
          </div>

          {/* Card 4: Mirrored HD Calling */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#ff4b82]/20 text-[#ff4b82] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Mirrored WebRTC HD Calls</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Peer-to-peer encrypted audio and video calling with automatic mirror feeds by default, low latency, and crystal-clear screen sharing.
            </p>
          </div>

          {/* Card 5: Liquid Stories */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/20 text-[#10b981] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleDashed size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic 24h Stories</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Post photo, video, and styled text status updates that vanish after 24 hours. React with emojis directly into private 1-on-1 chats.
            </p>
          </div>

          {/* Card 6: Anti-Mod Security */}
          <div className="p-6 rounded-3xl bg-[#140f26]/80 border border-[#a855f7]/25 hover:border-[#ff7597]/50 transition-all backdrop-blur-xl space-y-3 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-[#eab308]/20 text-[#eab308] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Mod-Proof Architecture</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Robust cryptographic signature verification, strict CORS and CSP headers, and foreground notification suppression so you are never spammed.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 relative z-20">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-[#211438] via-[#1b122e] to-[#25123d] border border-[#ff7597]/30 p-8 sm:p-14 text-center relative overflow-hidden shadow-[0_0_80px_rgba(255,117,151,0.2)]">
          <div className="absolute top-0 left-1/3 w-64 h-32 bg-[#ff7597]/20 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Start Chatting in Private Today</h2>
          <p className="text-sm sm:text-base text-foreground/70 max-w-xl mx-auto mb-8 leading-relaxed">
            No phone number required. Claim your unique Liquid ID and join the new era of beautiful, confidential communication.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/web"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-sm shadow-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Open web.liquidchat.online</span>
              <ArrowRight size={16} />
            </a>

            <a
              href="/LiquidChat.apk"
              download
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={16} />
              <span>Get Android App</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/50 z-20 relative">
        <div className="flex items-center gap-2">
          <span>🌸 LiquidChat v3.0.0</span>
          <span>•</span>
          <span>© 2026 LiquidChat.online</span>
        </div>

        <div className="flex items-center gap-5">
          <a href="https://web.liquidchat.online" className="hover:text-foreground transition-colors">Web Client</a>
          <a href="/LiquidChat.apk" className="hover:text-foreground transition-colors">Android APK</a>
          <Link href="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          <a href="https://github.com/Deependra-yad/apk" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

