"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw, Zap, ZapOff, AlertCircle } from 'lucide-react';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  description?: string;
}

export default function CameraQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan QR Code",
  description = "Align the QR code within the frame to scan"
}: CameraQrScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerRef = useRef<any>(null);
  const containerIdRef = useRef(`qr-scanner-${Math.random().toString(36).substring(7)}`);
  const isScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScan = useCallback((decodedText: string) => {
    if (isScannedRef.current) return;
    isScannedRef.current = true;
    
    // Play light haptic/audio feedback
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch (e) {}

    stopScanner().then(() => {
      onScanSuccess(decodedText);
    });
  }, [onScanSuccess, stopScanner]);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setScannerError(null);
    isScannedRef.current = false;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      await stopScanner();

      const scanner = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = scanner;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minDim * 0.72),
            height: Math.floor(minDim * 0.72)
          };
        },
        aspectRatio: 1.0
      };

      await scanner.start(
        { facingMode },
        qrConfig,
        (decodedText) => handleScan(decodedText),
        () => {} // Silent on intermediate non-matches
      );

      setIsInitializing(false);

      // Check if torch/flashlight is supported
      try {
        const capabilities = scanner.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setIsInitializing(false);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        setScannerError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setScannerError('No camera found on this device.');
      } else {
        setScannerError(err?.message || 'Failed to start camera. Please try again.');
      }
    }
  }, [facingMode, handleScan, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for DOM mount
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const newState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }]
      });
      setIsTorchOn(newState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-[#120d22]/95 border border-[#a855f7]/30 rounded-3xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col items-center relative overflow-hidden"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Camera size={18} className="text-[#ff7597]" />
                <span>{title}</span>
              </h3>
              <p className="text-[11px] text-foreground/60">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              title="Close Scanner"
            >
              <X size={18} />
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="w-full aspect-square bg-black/60 rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#ff7597]/20 shadow-inner">
            <div id={containerIdRef.current} className="w-full h-full object-cover" />

            {/* Target Reticle Overlay */}
            {!scannerError && !isInitializing && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                  {/* Top-Left Corner */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ff7597] rounded-tl-xl shadow-[0_0_12px_rgba(255,117,151,0.8)]" />
                  {/* Top-Right Corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ff7597] rounded-tr-xl shadow-[0_0_12px_rgba(255,117,151,0.8)]" />
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ff7597] rounded-bl-xl shadow-[0_0_12px_rgba(255,117,151,0.8)]" />
                  {/* Bottom-Right Corner */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ff7597] rounded-br-xl shadow-[0_0_12px_rgba(255,117,151,0.8)]" />

                  {/* Scanning Laser Line */}
                  <motion.div
                    animate={{ y: [0, 190, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00f2fe] to-transparent shadow-[0_0_10px_#00f2fe]"
                  />
                </div>
              </div>
            )}

            {/* Initializing Spinner */}
            {isInitializing && !scannerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2.5 z-10">
                <div className="w-10 h-10 border-3 border-[#ff7597] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-foreground/70 font-medium">Starting camera...</span>
              </div>
            )}

            {/* Error Message */}
            {scannerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 gap-3 z-10">
                <AlertCircle size={32} className="text-rose-400" />
                <p className="text-xs text-rose-200 leading-relaxed">{scannerError}</p>
                <button
                  onClick={startScanner}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff5e97] to-[#a855f7] text-white font-bold text-xs shadow-md"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="w-full flex items-center justify-around mt-4 pt-3 border-t border-foreground/10">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-full border transition-all ${
                  isTorchOn 
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-foreground/5 text-foreground/60 border-foreground/10 hover:text-foreground'
                }`}
                title={isTorchOn ? "Turn Flashlight Off" : "Turn Flashlight On"}
              >
                {isTorchOn ? <Zap size={18} /> : <ZapOff size={18} />}
              </button>
            )}

            <button
              onClick={toggleCamera}
              className="p-2.5 rounded-full bg-foreground/5 text-foreground/60 border border-foreground/10 hover:text-foreground hover:bg-foreground/10 transition-colors"
              title="Flip Camera"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-foreground/10 text-foreground/80 hover:text-foreground text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

