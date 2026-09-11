"use client";

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { QrCode, RefreshCw, Smartphone, CheckCircle2, ShieldCheck, Monitor } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '@/utils/apiUrl';
import { useAuthStore } from '@/store/authStore';

interface QrLoginPanelProps {
  onSuccess?: () => void;
}

export default function QrLoginPanel({ onSuccess }: QrLoginPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'scanned' | 'approved' | 'expired'>('loading');
  const [timeLeft, setTimeLeft] = useState(90);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  const initQrSession = async () => {
    setStatus('loading');
    setErrorMessage(null);
    setTimeLeft(90);

    // Clean up previous socket & polling
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    try {
      const res = await axios.post('/api/auth/qr/init');
      const newSessionId = res.data.sessionId;
      setSessionId(newSessionId);
      setStatus('ready');

      // 1. Connect Socket.IO to QR session room
      const backendUrl = getApiUrl();
      const socket = io(backendUrl, {
        query: { qrSessionId: newSessionId },
        transports: ['polling', 'websocket'],
        reconnection: true
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_qr_session', newSessionId);
      });

      socket.on('qr_scanned', () => {
        setStatus('scanned');
      });

      socket.on('qr_login_success', (data: { token: string; user: any; sessionId?: string }) => {
        handleSuccessfulLogin(data.token, data.user, data.sessionId || newSessionId);
      });

      // 2. HTTP Polling fallback every 2 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await axios.get(`/api/auth/qr/status/${newSessionId}`);
          if (pollRes.data.status === 'scanned') {
            setStatus('scanned');
          } else if (pollRes.data.status === 'approved' && pollRes.data.token) {
            handleSuccessfulLogin(pollRes.data.token, pollRes.data.user, pollRes.data.sessionId || newSessionId);
          } else if (pollRes.data.status === 'expired') {
            setStatus('expired');
          }
        } catch (e) {}
      }, 2000);

    } catch (err) {
      setStatus('expired');
      setErrorMessage('Failed to initialize QR session. Please check your connection.');
    }
  };

  const handleSuccessfulLogin = (token: string, user: any, sessionId?: string) => {
    setStatus('approved');
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (socketRef.current) socketRef.current.disconnect();

    localStorage.setItem('liquid_token', token);
    localStorage.setItem('liquid_user', JSON.stringify(user));
    if (sessionId) {
      localStorage.setItem('liquid_session_id', sessionId);
    }
    useAuthStore.getState().setAuth(user, token);

    if (onSuccess) {
      onSuccess();
    } else {
      setTimeout(() => {
        window.location.href = '/';
      }, 600);
    }
  };

  useEffect(() => {
    initQrSession();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (status === 'ready' || status === 'scanned') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  return (
    <div className="w-full flex flex-col items-center text-center p-2">
      {/* Title */}
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center justify-center gap-1.5">
        <Monitor size={16} className="text-[#ff7597]" />
        <span>Login with QR Code</span>
      </h3>
      <p className="text-xs text-foreground/60 mb-4 max-w-xs leading-relaxed">
        Scan this code with Liquid Chat on your phone to log in instantly.
      </p>

      {/* QR Code Frame */}
      <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-[#ff7597]/30 my-2 flex items-center justify-center w-60 h-60">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw size={28} className="animate-spin text-[#ff7597]" />
            <span className="text-xs text-black font-semibold">Generating code...</span>
          </div>
        )}

        {(status === 'ready' || status === 'scanned') && sessionId && (
          <>
            <QRCodeSVG
              value={`liquid-qr-login:${sessionId}`}
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "https://api.dicebear.com/7.x/identicon/svg?seed=LQ",
                height: 32,
                width: 32,
                excavate: true,
              }}
            />

            {/* Scanned Notification Overlay */}
            {status === 'scanned' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-[#0b0914]/92 rounded-3xl flex flex-col items-center justify-center p-4 text-center z-10 backdrop-blur-sm"
              >
                <Smartphone size={32} className="text-[#00f2fe] animate-bounce mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">Code Scanned!</h4>
                <p className="text-[11px] text-foreground/70 leading-tight">
                  Please tap <strong className="text-[#ff7597]">"Link Device"</strong> on your phone to confirm.
                </p>
              </motion.div>
            )}
          </>
        )}

        {status === 'approved' && (
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <CheckCircle2 size={40} className="text-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-black">Login Successful!</span>
            <span className="text-[10px] text-gray-500">Opening your chats...</span>
          </div>
        )}

        {status === 'expired' && (
          <div 
            onClick={initQrSession}
            className="absolute inset-0 bg-[#0b0914]/95 rounded-3xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/90 transition-colors z-10"
          >
            <RefreshCw size={30} className="text-[#ff7597] mb-2" />
            <p className="text-xs font-bold text-white mb-1">QR Code Expired</p>
            <p className="text-[11px] text-foreground/60 underline">Click to reload</p>
          </div>
        )}
      </div>

      {/* Countdown & Status */}
      {(status === 'ready' || status === 'scanned') && (
        <div className="flex items-center gap-2 mt-2 text-[11px] text-foreground/50 font-mono">
          <span>Expires in:</span>
          <span className={`font-bold ${timeLeft < 20 ? 'text-rose-400 animate-pulse' : 'text-[#ff7597]'}`}>
            {timeLeft}s
          </span>
        </div>
      )}

      {/* Step Instructions */}
      <div className="w-full bg-background/40 rounded-2xl p-3 mt-4 text-left border border-foreground/5 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-foreground/80">
          <span className="w-4 h-4 rounded-full bg-[#ff7597]/20 text-[#ff7597] font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
          <span>Open <strong>Liquid Chat</strong> on your mobile phone</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <span className="w-4 h-4 rounded-full bg-[#ff7597]/20 text-[#ff7597] font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
          <span>Tap <strong>Settings</strong> &gt; <strong>Linked Devices</strong></span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <span className="w-4 h-4 rounded-full bg-[#ff7597]/20 text-[#ff7597] font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
          <span>Tap <strong>Link a Device</strong> and point camera to this screen</span>
        </div>
      </div>
    </div>
  );
}

