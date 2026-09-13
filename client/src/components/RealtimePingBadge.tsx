"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, RefreshCw, Server, Zap, ShieldCheck } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

interface RealtimePingBadgeProps {
  compact?: boolean;
  className?: string;
}

export default function RealtimePingBadge({ compact = false, className = '' }: RealtimePingBadgeProps) {
  const { ping, pingStatus, measurePing } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualPing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await measurePing();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isConnected = pingStatus === 'connected' && ping !== null;
  const isConnecting = pingStatus === 'connecting';
  
  // Quality rating
  let qualityColor = 'text-emerald-400';
  let dotBg = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]';
  let qualityText = 'Optimal (Ultra Fast)';

  if (!isConnected) {
    qualityColor = isConnecting ? 'text-amber-400' : 'text-rose-400';
    dotBg = isConnecting ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
    qualityText = isConnecting ? 'Reconnecting...' : 'Disconnected';
  } else if (ping > 250) {
    qualityColor = 'text-rose-400';
    dotBg = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
    qualityText = 'High Latency';
  } else if (ping > 110) {
    qualityColor = 'text-amber-400';
    dotBg = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    qualityText = 'Moderate Latency';
  }

  const displayText = !isConnected 
    ? (isConnecting ? 'Connecting...' : 'Offline') 
    : `${ping} ms`;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Interactive Cyber-Pill Badge */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-xl transition-all cursor-pointer select-none ${
          isConnected
            ? 'bg-black/40 border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : isConnecting
              ? 'bg-black/40 border-amber-500/30 hover:border-amber-400/60'
              : 'bg-black/40 border-rose-500/30 hover:border-rose-400/60'
        }`}
        title="Live Server Latency & Connection Health (Tap for details)"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`} />
        </span>

        <span className={`font-mono text-[10px] font-bold tracking-tight ${qualityColor}`}>
          {displayText}
        </span>

        {!compact && (
          <Activity size={10} className={`opacity-60 ${qualityColor}`} />
        )}
      </motion.button>

      {/* Popover Diagnostic Detail Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 w-64 p-3.5 rounded-2xl bg-[#0d0d17]/95 border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-left"
            >
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} className="text-liquid-accent" />
                  <span className="text-xs font-bold text-white tracking-wide">Live Diagnostics</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualPing}
                  disabled={isRefreshing}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Test ping now"
                >
                  <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-liquid-accent' : ''} />
                </button>
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/5">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Zap size={11} className="text-yellow-400" />
                    Round-Trip Ping:
                  </span>
                  <span className={`font-bold ${qualityColor}`}>
                    {isConnected ? `${ping} ms` : 'Disconnected'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/5">
                  <span className="text-white/60 flex items-center gap-1.5">
                    {isConnected ? <Wifi size={11} className="text-emerald-400" /> : <WifiOff size={11} className="text-rose-400" />}
                    Link Quality:
                  </span>
                  <span className={`font-medium ${qualityColor}`}>{qualityText}</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/5">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Server size={11} className="text-blue-400" />
                    Transport:
                  </span>
                  <span className="text-white font-medium">WebSocket TLS</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/5">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-liquid-accent" />
                    Server Edge:
                  </span>
                  <span className="text-white font-medium">Railway Active</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span>Auto-updates every 3.5s</span>
                <span className="text-emerald-400">● 100% Realtime</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

