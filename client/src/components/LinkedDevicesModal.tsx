"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Laptop, Smartphone, Plus, X, Shield, 
  CheckCircle2, AlertCircle, Clock, ExternalLink, LogOut, Loader2, Trash2
} from 'lucide-react';
import CameraQrScannerModal from './CameraQrScannerModal';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface LinkedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LinkedSessionItem {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  linkedAt: number;
  lastActive: number;
}

export default function LinkedDevicesModal({ isOpen, onClose }: LinkedDevicesModalProps) {
  const { token, user } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedSession, setScannedSession] = useState<{ sessionId: string; deviceInfo?: any } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeSessions, setActiveSessions] = useState<LinkedSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const res = await axios.get('/api/auth/qr/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSessions(res.data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchSessions();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleScanSuccess = async (decodedText: string) => {
    setIsScannerOpen(false);
    setErrorMessage(null);

    // Expected format: liquid-qr-login:${sessionId}
    let sessionId = '';
    if (decodedText.startsWith('liquid-qr-login:')) {
      sessionId = decodedText.split(':')[1];
    } else {
      sessionId = decodedText.trim();
    }

    if (!sessionId) {
      setErrorMessage("Invalid QR Code. Please scan the QR code shown on Liquid Web.");
      return;
    }

    try {
      // Step 1: Notify server that QR was scanned
      const res = await axios.post('/api/auth/qr/scan', { sessionId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScannedSession({
        sessionId,
        deviceInfo: res.data.deviceInfo
      });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Failed to connect to desktop session. QR code may have expired.");
    }
  };

  const handleApprove = async () => {
    if (!scannedSession?.sessionId) return;
    setIsApproving(true);
    setErrorMessage(null);

    try {
      await axios.post('/api/auth/qr/approve', { sessionId: scannedSession.sessionId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMessage("🌸 Device linked successfully! Desktop is now logged in.");
      setScannedSession(null);
      fetchSessions();
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Failed to authorize device. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!token) return;
    setRevokingId(sessionId);
    try {
      await axios.delete(`/api/auth/qr/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      setStatusMessage("Device logged out successfully.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      setErrorMessage("Failed to disconnect device session.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!token) return;
    if (!window.confirm("Log out of all other linked devices? You will need to scan QR code again to log back in.")) return;
    try {
      await axios.delete('/api/auth/qr/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSessions([]);
      setStatusMessage("All linked sessions have been logged out.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      setErrorMessage("Failed to log out all devices.");
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Active just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Linked ${days}d ago`;
  };

  const getDeviceIcon = (os: string) => {
    if (/Android|iOS|iPhone/i.test(os)) return <Smartphone size={18} className="text-[#00f2fe]" />;
    if (/macOS|Macintosh/i.test(os)) return <Laptop size={18} className="text-[#ff7597]" />;
    return <Monitor size={18} className="text-[#a855f7]" />;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#16112c]/95 border border-[#a855f7]/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-foreground/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ff7597]/20 border border-[#ff7597]/30 flex items-center justify-center text-[#ff7597]">
                <Monitor size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Linked Devices</h2>
                <p className="text-[11px] text-foreground/60">Manage & control active desktop sessions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Success / Error Banners */}
          {statusMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Device Confirmation Modal Card */}
          {scannedSession ? (
            <div className="my-5 p-4 rounded-2xl bg-[#1d163a] border border-[#ff7597]/40 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#ff7597]/20 text-[#ff7597] flex items-center justify-center mb-3">
                <Laptop size={24} />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">Link with Liquid Web?</h3>
              <p className="text-xs text-foreground/70 mb-3 max-w-xs leading-relaxed">
                A computer is requesting to access your chats and messages via QR code login.
              </p>

              <div className="w-full bg-black/40 rounded-xl p-2.5 mb-4 text-left text-xs space-y-1 font-mono border border-white/5">
                <p className="text-foreground/80 truncate"><strong>Device:</strong> {scannedSession.deviceInfo?.userAgent?.slice(0, 45) || 'Desktop Browser'}</p>
                <p className="text-foreground/60"><strong>IP Address:</strong> {scannedSession.deviceInfo?.ip || 'Connected Device'}</p>
                <p className="text-[#00f2fe]"><strong>Security:</strong> 100% E2EE Synced</p>
              </div>

              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => setScannedSession(null)}
                  className="flex-1 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4b82] to-[#a855f7] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,75,130,0.5)] disabled:opacity-50"
                >
                  {isApproving ? "Authorizing..." : "Confirm & Link"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Feature Hero Illustration */}
              <div className="my-4 flex flex-col items-center text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff7597]/20 to-[#a855f7]/20 border border-[#ff7597]/30 flex items-center justify-center mb-2.5 shadow-[0_0_25px_rgba(255,117,151,0.2)]">
                  <Monitor size={28} className="text-[#ff7597]" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">Liquid Web & Desktop</h3>
                <p className="text-[11px] text-foreground/60 max-w-xs leading-relaxed">
                  Visit <span className="text-[#ff7597] font-semibold">web.liquidchat.online</span> on your PC or Mac and scan the QR code to link sessions.
                </p>
              </div>

              {/* Action: Link a Device Button */}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,75,130,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer mb-5"
              >
                <Plus size={18} />
                <span>Link a Device (Scan QR)</span>
              </button>

              {/* Active Logged-In Sessions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    Linked Devices ({activeSessions.length})
                  </span>
                  {activeSessions.length > 1 && (
                    <button
                      onClick={handleRevokeAll}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                    >
                      Log out all
                    </button>
                  )}
                </div>

                {isLoadingSessions ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-foreground/50 text-xs">
                    <Loader2 size={18} className="animate-spin text-[#ff7597]" />
                    <span>Loading active sessions...</span>
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5 text-center text-xs text-foreground/50">
                    No other devices currently logged in
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                            {getDeviceIcon(session.os)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                              <span>{session.deviceName}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            </h4>
                            <p className="text-[10px] text-foreground/50 truncate font-mono">
                              {session.ip} • {formatRelativeTime(session.lastActive || session.linkedAt)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingId === session.id}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 active:scale-95 disabled:opacity-50"
                          title="Log out of this device"
                        >
                          <LogOut size={13} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Security Assurance Footer */}
          <div className="mt-5 pt-3 border-t border-foreground/10 flex items-center justify-between text-[11px] text-foreground/50 shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-400" />
              <span>Zero-Knowledge Session Keys</span>
            </div>
            <a 
              href="https://web.liquidchat.online" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#ff7597] hover:underline flex items-center gap-1"
            >
              <span>web.liquidchat.online</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Camera Scanner Modal */}
          <CameraQrScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={handleScanSuccess}
            title="Scan Web QR Code"
            description="Point your phone camera at the QR code on web.liquidchat.online"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
