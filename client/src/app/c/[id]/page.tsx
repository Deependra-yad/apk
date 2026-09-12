"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Shield, Lock, MessageSquare, Download, Smartphone, 
  Sparkles, CheckCircle, ExternalLink, ArrowRight, UserX, Copy, Check,
  Zap, RefreshCw
} from 'lucide-react';
import LiquidLogo from '@/components/LiquidLogo';
import { downloadFile } from '@/utils/apiUrl';

export default function PublicContactSharePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [appLaunchAttempted, setAppLaunchAttempted] = useState(false);

  // Forcefully open in downloaded Android app when shared ID link is opened
  useEffect(() => {
    if (!id) return;

    const fetchContact = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/users/public/${encodeURIComponent(id)}`);
        setContact(res.data);

        // Pre-save pending contact so that if app opens, chat is instantly available
        const targetIdentifier = res.data?.liquidNumber || res.data?.username || res.data?.id;
        try {
          localStorage.setItem('liquid_pending_chat', JSON.stringify({
            id: res.data.id,
            username: res.data.username,
            liquidNumber: res.data.liquidNumber,
            avatar: res.data.avatar,
            about: res.data.about,
            publicKey: res.data.publicKey
          }));
        } catch (e) {}

        // Automatic forceful launch for mobile / Android devices
        if (typeof window !== 'undefined') {
          const isAndroid = /Android/i.test(navigator.userAgent);
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const cleanId = encodeURIComponent(targetIdentifier || id);

          // If inside the Android app already, navigate right away
          if ((window as any).Android) {
            window.location.href = `https://web.liquidchat.online/?chat=${cleanId}`;
            return;
          }

          if (isAndroid || isMobile) {
            setAppLaunchAttempted(true);
            // 1. Android Intent URI (Forces OS to invoke com.liquidchat.app package if installed)
            const intentUrl = `intent://chat/${cleanId}#Intent;scheme=liquidchat;package=com.liquidchat.app;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;
            // 2. Custom Scheme
            const customSchemeUrl = `liquidchat://chat/${cleanId}`;

            // Attempt launch
            try {
              window.location.href = intentUrl;
            } catch (e) {
              window.location.href = customSchemeUrl;
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch contact:', err);
        setError(err.response?.data?.error || 'User not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const handleOpenInApp = () => {
    if (!contact) return;
    const identifier = contact.liquidNumber || contact.username || contact.id;
    const cleanId = encodeURIComponent(identifier);
    const intentUrl = `intent://chat/${cleanId}#Intent;scheme=liquidchat;package=com.liquidchat.app;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;
    const customSchemeUrl = `liquidchat://chat/${cleanId}`;

    try {
      window.location.href = intentUrl;
    } catch (e) {
      window.location.href = customSchemeUrl;
    }

    // Secondary fallback after 2s
    setTimeout(() => {
      window.location.href = customSchemeUrl;
    }, 500);
  };

  const handleStartChatOnWeb = () => {
    if (!contact) return;
    
    const targetIdentifier = contact.liquidNumber || contact.username || contact.id;
    localStorage.setItem('liquid_pending_chat', JSON.stringify({
      id: contact.id,
      username: contact.username,
      liquidNumber: contact.liquidNumber,
      avatar: contact.avatar,
      about: contact.about,
      publicKey: contact.publicKey
    }));

    // Redirect to web.liquidchat.online directly
    window.location.href = `https://web.liquidchat.online/?chat=${encodeURIComponent(targetIdentifier)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-pink-500/30 selection:text-pink-200">
      {/* Ambient Cyber Neon Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-500/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between py-4 z-10">
        <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <LiquidLogo size={32} />
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-white/90 to-pink-300 bg-clip-text text-transparent">
            LiquidChat
          </span>
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all backdrop-blur-md"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Main Card Container */}
      <main className="w-full max-w-md my-auto z-10 py-6">
        {loading ? (
          <div className="p-8 rounded-3xl bg-[#0e0e18]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-h-[360px] text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={20} className="text-pink-400" />
              </div>
            </div>
            <p className="text-gray-300 text-sm font-medium">Resolving Secure Liquid Contact...</p>
            <p className="text-gray-500 text-xs mt-1">Verifying Curve25519 public key</p>
          </div>
        ) : error || !contact ? (
          <div className="p-8 rounded-3xl bg-[#0e0e18]/80 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UserX size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Contact Not Found</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              {error || `The user "${id}" does not exist or this invite link has expired.`}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2"
              >
                <span>Return to LiquidChat</span>
                <ArrowRight size={16} />
              </a>
              <button
                onClick={() => downloadFile('/LiquidChat.apk', 'LiquidChat.apk')}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                <span>Download App APK</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            {/* Outer Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />

            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0e0e18]/90 backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
              {/* App Opening Toast Banner on Mobile */}
              {appLaunchAttempted && (
                <div className="mb-4 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span>Opening in downloaded Liquid Chat app...</span>
                  </div>
                  <button onClick={handleOpenInApp} className="underline font-bold text-[11px] shrink-0 ml-2">
                    Retry
                  </button>
                </div>
              )}

              {/* Top Security Pill */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle size={12} />
                  <span>Verified Liquid ID</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-pink-400/80 font-mono">
                  <Lock size={11} />
                  <span>100% E2EE</span>
                </div>
              </div>

              {/* Profile Avatar & Name */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_24px_rgba(236,72,153,0.35)]">
                    <div className="w-full h-full rounded-full bg-[#131322] overflow-hidden flex items-center justify-center">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.username} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-3xl font-black bg-gradient-to-br from-pink-400 to-purple-400 bg-clip-text text-transparent uppercase">
                          {contact.username?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0e0e18] flex items-center justify-center text-white shadow-lg" title="Active">
                    <Sparkles size={11} />
                  </div>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white mb-1 flex items-center gap-2">
                  <span>{contact.username}</span>
                </h1>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-cyan-300 font-semibold mb-3">
                  <Shield size={12} className="text-cyan-400" />
                  <span>ID: {contact.liquidNumber || contact.id.slice(0, 10)}</span>
                </div>

                <p className="text-gray-400 text-sm max-w-xs italic line-clamp-2">
                  &quot;{contact.about || 'Hey there! I am using Liquid Chat 🌸'}&quot;
                </p>
              </div>

              {/* End-to-End Encryption Guarantee Box */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                    <Lock size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      End-to-End Encrypted Chat
                    </p>
                    <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                      Messages and media are encrypted with Curve25519 &amp; AES-256-GCM. Only you and {contact.username} have the keys.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* 1. Forceful Primary Launch Button */}
                <button
                  onClick={handleOpenInApp}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm transition-all shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Smartphone size={18} className="animate-bounce" />
                  <span>OPEN IN LIQUID CHAT APP</span>
                  <ArrowRight size={16} />
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => downloadFile('/LiquidChat.apk', 'LiquidChat.apk')}
                    className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} className="text-pink-400" />
                    <span>Download APK</span>
                  </button>

                  <button
                    onClick={handleStartChatOnWeb}
                    className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={14} className="text-cyan-400" />
                    <span>Open on Web</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4 z-10">
        <p className="text-[11px] text-gray-500">
          Powered by <span className="text-gray-400 font-semibold">LiquidChat Cryptographic Core</span> • Zero Knowledge E2EE
        </p>
      </footer>
    </div>
  );
}
