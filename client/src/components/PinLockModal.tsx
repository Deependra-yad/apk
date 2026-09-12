"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, KeyRound, AlertCircle, Check, Delete, X, RefreshCw, LogOut } from 'lucide-react';
import { 
  verifySecurityPin, 
  setSecurityPin, 
  removeSecurityPin, 
  isPinConfigured,
  unlockAppSession,
  setLockedChatsFolderUnlocked 
} from '@/utils/securityLock';
import { soundEffects } from '@/utils/audioSynth';
import { useAuthStore } from '@/store/authStore';

export interface PinLockModalProps {
  isOpen: boolean;
  mode: 'set' | 'unlock_app' | 'unlock_chats' | 'confirm_action' | 'remove';
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function PinLockModal({
  isOpen,
  mode,
  title,
  description,
  onSuccess,
  onCancel
}: PinLockModalProps) {
  const { logout } = useAuthStore();
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const isFullScreen = mode === 'unlock_app';

  // Reset state when opened or mode changed
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setFirstPin(null);
      setStep('create');
      setError(null);
      setIsShaking(false);
    }
  }, [isOpen, mode]);

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    soundEffects.playCyberPulse();
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 500);
  };

  const handleCompletePin = useCallback(async (enteredPin: string) => {
    if (mode === 'set') {
      if (step === 'create') {
        setFirstPin(enteredPin);
        setPin('');
        setStep('confirm');
        setError(null);
      } else {
        // Confirm step
        if (enteredPin === firstPin) {
          await setSecurityPin(enteredPin);
          soundEffects.playKawaiiChime();
          onSuccess();
        } else {
          triggerError('PINs do not match. Try again.');
          setStep('create');
          setFirstPin(null);
        }
      }
      return;
    }

    if (mode === 'remove') {
      const valid = await verifySecurityPin(enteredPin);
      if (valid) {
        removeSecurityPin();
        soundEffects.playKawaiiChime();
        onSuccess();
      } else {
        triggerError('Incorrect current PIN');
      }
      return;
    }

    // Unlocking app or chats
    const valid = await verifySecurityPin(enteredPin);
    if (valid) {
      if (mode === 'unlock_app') unlockAppSession();
      if (mode === 'unlock_chats') setLockedChatsFolderUnlocked(true);
      soundEffects.playKawaiiChime();
      onSuccess();
    } else {
      triggerError('Incorrect PIN. Access Denied.');
    }
  }, [mode, step, firstPin, onSuccess]);

  const handleKeyPress = useCallback((num: string) => {
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        handleCompletePin(next);
      }
    }
  }, [pin, handleCompletePin]);

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  // Keyboard support (0-9, Backspace, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' && onCancel && !isFullScreen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleKeyPress, onCancel, isFullScreen]);

  if (!isOpen) return null;

  const displayTitle = title || (
    mode === 'set'
      ? (step === 'create' ? 'Create 4-Digit Security PIN' : 'Confirm Your PIN')
      : mode === 'unlock_app'
      ? 'LiquidChat is Locked'
      : mode === 'unlock_chats'
      ? 'Unlock Protected Chats'
      : mode === 'remove'
      ? 'Enter PIN to Disable Lock'
      : 'Verify Security PIN'
  );

  const displayDesc = description || (
    mode === 'set'
      ? (step === 'create' ? 'Set a 4-digit PIN to lock sensitive chats & protect your app' : 'Re-enter your 4-digit PIN to confirm')
      : mode === 'unlock_app'
      ? 'Enter your PIN to access your end-to-end encrypted conversations'
      : mode === 'unlock_chats'
      ? 'Enter your security PIN to reveal your locked chats'
      : mode === 'remove'
      ? 'Confirm your 4-digit PIN to disable security lock'
      : 'Enter your 4-digit PIN to continue'
  );

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
      isFullScreen 
        ? 'bg-[#07050e]' 
        : 'bg-black/80 backdrop-blur-xl'
    }`}>
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="w-full max-w-sm bg-[#110d24]/95 border border-[#ff7597]/30 rounded-[2.25rem] p-6 sm:p-7 shadow-[0_0_60px_rgba(255,117,151,0.2)] flex flex-col items-center text-center relative backdrop-blur-2xl"
      >
        {/* Close Button (only if not full-screen app lock) */}
        {!isFullScreen && onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 text-foreground/40 hover:text-foreground rounded-full hover:bg-foreground/5 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>
        )}

        {/* Lock Shield Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff4b82] to-[#a855f7] p-0.5 shadow-[0_0_25px_rgba(255,75,130,0.4)] mb-4 shrink-0">
          <div className="w-full h-full bg-[#110d24] rounded-2xl flex items-center justify-center text-[#ff7597]">
            <Lock size={26} className="animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground tracking-wide mb-1">
          {displayTitle}
        </h3>
        <p className="text-xs text-foreground/60 leading-relaxed max-w-xs mb-6">
          {displayDesc}
        </p>

        {/* 4 Masked PIN Indicator Dots */}
        <motion.div
          animate={isShaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-gradient-to-tr from-[#ff4b82] to-[#00f2fe] scale-125 shadow-[0_0_12px_rgba(255,75,130,0.8)] border border-white/50'
                    : 'bg-foreground/10 border border-foreground/20'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Error / Alert Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-rose-400 font-semibold mb-3 flex items-center gap-1.5"
            >
              <AlertCircle size={13} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cyber-Glass Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-foreground/5 hover:bg-[#ff7597]/20 border border-foreground/10 hover:border-[#ff7597]/50 text-foreground font-bold text-xl active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer select-none"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/50 hover:text-foreground font-semibold text-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
            title="Clear"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-foreground/5 hover:bg-[#ff7597]/20 border border-foreground/10 hover:border-[#ff7597]/50 text-foreground font-bold text-xl active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/50 hover:text-rose-400 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
            title="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Emergency Logout for App Lock Screen */}
        {isFullScreen && (
          <div className="mt-6 pt-4 border-t border-foreground/10 w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('Forgot your PIN? Logging out will require re-authenticating with your account.')) {
                  logout();
                  window.location.href = '/auth?logged_out=1';
                }
              }}
              className="text-xs text-foreground/40 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Forgot PIN? Log Out</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

