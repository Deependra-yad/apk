"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

interface RealtimePingBadgeProps {
  compact?: boolean;
  className?: string;
}

export default function RealtimePingBadge({ compact = false, className = '' }: RealtimePingBadgeProps) {
  const { ping, pingStatus, measurePing } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside without capturing or blocking screen clicks
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
  let dotBg = 'bg-emerald-400';
  let qualityText = 'Optimal (< 100ms)';

  if (!isConnected) {
    qualityColor = isConnecting ? 'text-amber-400' : 'text-rose-400';
    dotBg = isConnecting ? 'bg-amber-400' : 'bg-rose-500';
    qualityText = isConnecting ? 'Reconnecting...' : 'Disconnected';
  } else if (ping > 250) {
    qualityColor = 'text-rose-400';
    dotBg = 'bg-rose-500';
    qualityText = 'High Latency';
  } else if (ping > 110) {
    qualityColor = 'text-amber-400';
    dotBg = 'bg-amber-400';
    qualityText = 'Moderate Latency';
  }

  const displayText = !isConnected 
    ? (isConnecting ? 'Connecting...' : 'Offline') 
    : `${ping} ms`;

  return (
    <div ref={containerRef} className={`relative inline-block select-none ${className}`}>
      {/* Sleek Minimalist Status Pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
          isConnected
            ? 'bg-black/30 border-emerald-500/30 hover:border-emerald-400/50'
            : isConnecting
              ? 'bg-black/30 border-amber-500/30 hover:border-amber-400/50'
              : 'bg-black/30 border-rose-500/30 hover:border-rose-400/50'
        }`}
        title="Live Server Latency (Click for details)"
      >
        <span className="relative flex h-1.5 w-1.5">
          {isConnected && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotBg}`} />
        </span>

        <span className={`font-mono text-[10px] font-semibold tracking-tight ${qualityColor}`}>
          {displayText}
        </span>
      </button>

      {/* Non-intrusive Compact Flyout Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 bottom-full mb-2 z-50 w-52 p-3 rounded-xl bg-[#0e0e18]/95 border border-white/15 backdrop-blur-xl shadow-2xl text-left"
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Activity size={12} className="text-emerald-400" />
                <span>Live Latency</span>
              </span>
              <button
                type="button"
                onClick={handleManualPing}
                disabled={isRefreshing}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                title="Refresh ping"
              >
                <RefreshCw size={10} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
              </button>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/50 flex items-center gap-1">
                  <Zap size={10} className="text-yellow-400" /> Ping:
                </span>
                <span className={`font-bold ${qualityColor}`}>{isConnected ? `${ping} ms` : 'Disconnected'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/50 flex items-center gap-1">
                  {isConnected ? <Wifi size={10} className="text-emerald-400" /> : <WifiOff size={10} className="text-rose-400" />} Link:
                </span>
                <span className={qualityColor}>{qualityText}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/50">Edge:</span>
                <span className="text-white/80">Railway Active (TLS)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
