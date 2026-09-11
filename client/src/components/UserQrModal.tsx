"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Share2, Copy, Download, QrCode, Camera, Check, Sparkles 
} from 'lucide-react';
import CameraQrScannerModal from './CameraQrScannerModal';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface UserQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChatWithUser?: (user: any) => void;
}

export default function UserQrModal({ isOpen, onClose, onStartChatWithUser }: UserQrModalProps) {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my_code' | 'scan_code'>('my_code');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !user) return null;

  const qrData = `liquidchat-id:${user.id}:${user.liquidNumber || ''}:${user.username}`;
  const shareUrl = `https://liquidchat.online/c/${user.liquidNumber || user.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedToast("Profile link copied!");
    setTimeout(() => setCopiedToast(null), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chat with ${user.username} on LiquidChat`,
          text: `Add me on LiquidChat: ${user.liquidNumber || user.username}. 100% End-to-End Encrypted Messenger 🌸`,
          url: shareUrl
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('user-qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 10, 10, 280, 280);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `liquidchat-${user.username}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        setCopiedToast("QR Code saved to gallery!");
        setTimeout(() => setCopiedToast(null), 2500);
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Expected format: liquidchat-id:userId:liquidNumber:username or URL or raw number
    let targetNum = '';
    let targetId = '';

    if (decodedText.startsWith('liquidchat-id:')) {
      const parts = decodedText.split(':');
      targetId = parts[1];
      targetNum = parts[2];
    } else if (decodedText.includes('/c/')) {
      targetNum = decodedText.split('/c/')[1].trim();
    } else {
      targetNum = decodedText.trim();
    }

    try {
      let resolvedUser = null;
      if (targetNum) {
        const cleanNum = targetNum.replace(/\D/g, '');
        const res = await axios.get(`/api/users/search?liquidNumber=${encodeURIComponent(cleanNum || targetNum)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        resolvedUser = Array.isArray(res.data) ? res.data[0] : res.data;
      }

      if (resolvedUser && onStartChatWithUser) {
        onClose();
        onStartChatWithUser(resolvedUser);
      } else {
        alert("Contact not found for this QR code.");
      }
    } catch (e) {
      alert("Could not find contact for this QR code.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-sm bg-[#15102a]/95 border border-[#ff7597]/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(255,117,151,0.25)] flex flex-col items-center relative overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>

          {/* Segmented Control: My Code / Scan Code */}
          <div className="flex bg-[#0d091a]/80 p-1 rounded-2xl border border-foreground/10 text-xs font-semibold mb-5 w-full max-w-[240px]">
            <button
              onClick={() => setActiveTab('my_code')}
              className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'my_code'
                  ? 'bg-gradient-to-r from-[#ff5e97] to-[#a855f7] text-white font-bold shadow-md'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <QrCode size={14} />
              <span>My Code</span>
            </button>
            <button
              onClick={() => setActiveTab('scan_code')}
              className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'scan_code'
                  ? 'bg-gradient-to-r from-[#ff5e97] to-[#a855f7] text-white font-bold shadow-md'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Camera size={14} />
              <span>Scan Code</span>
            </button>
          </div>

          {activeTab === 'my_code' ? (
            <div ref={cardRef} className="w-full flex flex-col items-center text-center">
              {/* User Avatar with Cyber Border */}
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#ff7597] via-[#b388ff] to-[#00f2fe] shadow-[0_0_20px_rgba(255,117,151,0.4)]">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover bg-[#181329]"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#10b981] p-1 rounded-full border-2 border-[#15102a]" />
              </div>

              <h2 className="text-lg font-bold text-foreground leading-tight flex items-center justify-center gap-1">
                <span>{user.username}</span>
                <Sparkles size={14} className="text-[#ff7597]" />
              </h2>

              {user.liquidNumber && (
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/30 text-[#ff8da1] text-xs font-mono font-bold tracking-wider">
                  ID: {user.liquidNumber}
                </div>
              )}

              <p className="text-[11px] text-foreground/60 mt-1.5 max-w-xs leading-relaxed italic line-clamp-1">
                "{user.about || "Hey there! I am using Liquid Chat 🌊"}"
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl shadow-2xl my-4 border-2 border-[#ff7597]/20 flex items-center justify-center">
                <QRCodeSVG
                  id="user-qr-code-svg"
                  value={qrData}
                  size={170}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "https://api.dicebear.com/7.x/identicon/svg?seed=LQ",
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>

              <p className="text-[10px] text-foreground/50 max-w-xs mb-4">
                Your QR code is private. Anyone who scans it can start a 100% end-to-end encrypted chat with you.
              </p>

              {/* Toast Notification */}
              {copiedToast && (
                <div className="mb-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30">
                  <Check size={13} />
                  <span>{copiedToast}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-foreground/10">
                <button
                  onClick={handleShare}
                  className="py-2.5 px-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Share2 size={15} className="text-[#ff7597]" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Copy size={15} className="text-[#00f2fe]" />
                  <span>Copy ID</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="py-2.5 px-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Download size={15} className="text-[#b388ff]" />
                  <span>Save QR</span>
                </button>
              </div>
            </div>
          ) : (
            <CameraQrScannerModal
              isOpen={activeTab === 'scan_code'}
              onClose={() => setActiveTab('my_code')}
              onScanSuccess={handleScanSuccess}
              title="Scan Liquid ID"
              description="Point camera at another user's QR code to start chat"
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
