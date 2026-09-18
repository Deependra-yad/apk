"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Video, PhoneOff, Mic, MicOff, VideoOff, 
  Monitor, Minimize2, Maximize2, Volume2, AlertCircle, 
  ShieldCheck, Sparkles, Wifi
} from 'lucide-react';
import { WebRTCManager } from '@/utils/webrtc';
import { soundEffects } from '@/utils/audioSynth';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

interface CallModalProps {
  callState: 'idle' | 'calling' | 'receiving' | 'connected';
  setCallState: (state: 'idle' | 'calling' | 'receiving' | 'connected') => void;
  incomingCallData: { from: any; offer: any; isVideo: boolean; callId?: string } | null;
  setIncomingCallData: (data: any) => void;
  isVideoCall: boolean;
  setIsVideoCall: (isVideo: boolean) => void;
}

export default function CallModal({
  callState,
  setCallState,
  incomingCallData,
  setIncomingCallData,
  isVideoCall,
  setIsVideoCall
}: CallModalProps) {
  const { socket, activeContact } = useChatStore();
  const { user, token } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasPermissionWarning, setHasPermissionWarning] = useState(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const durationTimerRef = useRef<any>(null);
  const targetIdRef = useRef<string | null>(null);

  // Keep target ID updated in ref
  useEffect(() => {
    if (callState === 'receiving' || incomingCallData) {
      targetIdRef.current = incomingCallData?.from?.id || incomingCallData?.from || targetIdRef.current;
    } else if (callState === 'calling' && activeContact?.id) {
      targetIdRef.current = activeContact.id;
    }
  }, [callState, activeContact, incomingCallData]);

  // Instantiate WebRTC Manager once on mount
  useEffect(() => {
    const manager = new WebRTCManager();
    webrtcRef.current = manager;

    manager.onRemoteStream = (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      // Only play through audio element for audio-only calls to prevent echoing
      if (!isVideoCall && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    manager.onIceCandidate = (candidate) => {
      const targetId = targetIdRef.current;
      if (targetId && socket) {
        socket.emit('ice_candidate', { to: targetId, candidate });
      }
    };

    return () => {
      manager.close();
      soundEffects.stopRinging();
    };
  }, [socket, isVideoCall]);

  // Continuous binding of local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState, isCameraOff]);

  // Continuous binding of remote stream
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (!isVideoCall && remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, callState, isMinimized, isVideoCall]);

  // Handle Socket Signaling Events
  useEffect(() => {
    if (!socket) return;

    const handleCallAnswered = async ({ answer }: { answer: any }) => {
      soundEffects.stopRinging();
      if (webrtcRef.current) {
        await webrtcRef.current.handleAnswer(answer);
        setCallState('connected');
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (webrtcRef.current && candidate) {
        await webrtcRef.current.addIceCandidate(candidate);
      }
    };

    const handleCallRejected = () => {
      endCall('rejected');
    };

    const handleCallEnded = () => {
      endCall('completed');
    };

    socket.on('call_answered', handleCallAnswered);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('call_answered', handleCallAnswered);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  // Start outgoing call
  const startOutgoingCall = useCallback(async () => {
    if (!activeContact || !user || !socket || !webrtcRef.current) return;
    try {
      targetIdRef.current = activeContact.id;
      soundEffects.startOutgoingRing();
      const { stream, isPermissionDenied } = await webrtcRef.current.initLocalStream(isVideoCall, true);
      setLocalStream(stream);
      setHasPermissionWarning(isPermissionDenied);

      const offer = await webrtcRef.current.createOffer();
      socket.emit('call_offer', {
        to: activeContact.id,
        offer,
        fromUser: { id: user.id, username: user.username, avatar: user.avatar },
        isVideo: isVideoCall
      });
    } catch (err) {
      console.warn('Outgoing call setup note:', err);
    }
  }, [activeContact, user, socket, isVideoCall]);

  useEffect(() => {
    if (callState === 'calling') {
      startOutgoingCall();
    }
  }, [callState, startOutgoingCall]);

  // Expose window callbacks for Android native call action buttons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__liquidAnswerCall = () => answerCall();
      (window as any).__liquidRejectCall = () => endCall('rejected');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__liquidAnswerCall;
        delete (window as any).__liquidRejectCall;
      }
    };
  }, [callState, incomingCallData]);

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCallData || !socket || !webrtcRef.current) return;
    soundEffects.stopRinging();
    if (typeof window !== 'undefined' && (window as any).Android?.stopCallRingtone) {
      try { (window as any).Android.stopCallRingtone(); } catch (e) {}
    }
    try {
      const isVideo = incomingCallData.isVideo;
      setIsVideoCall(isVideo);
      targetIdRef.current = incomingCallData.from.id;

      const { stream, isPermissionDenied } = await webrtcRef.current.initLocalStream(isVideo, true);
      setLocalStream(stream);
      setHasPermissionWarning(isPermissionDenied);

      const answer = await webrtcRef.current.handleOffer(incomingCallData.offer);
      socket.emit('call_answer', {
        to: incomingCallData.from.id,
        answer,
        callId: incomingCallData.callId
      });

      setCallState('connected');
    } catch (err) {
      console.warn('Answer call setup note:', err);
      endCall('rejected');
    }
  };

  // Log Call and Tear Down
  const endCall = (status: 'completed' | 'missed' | 'rejected' = 'completed') => {
    soundEffects.stopRinging();
    if (typeof window !== 'undefined' && (window as any).Android?.stopCallRingtone) {
      try { (window as any).Android.stopCallRingtone(); } catch (e) {}
    }
    const targetId = (callState === 'receiving' || incomingCallData)
      ? (incomingCallData?.from?.id || incomingCallData?.from || targetIdRef.current)
      : (targetIdRef.current || activeContact?.id);
    const callId = incomingCallData?.callId;

    if (token && targetId) {
      axios.post('/api/calls/log', {
        receiverId: targetId,
        type: isVideoCall ? 'video' : 'audio',
        status,
        duration: callDuration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }

    if (targetId && socket) {
      if (status === 'rejected') {
        socket.emit('call_rejected', { to: targetId, callId });
        axios.post('/api/calls/action', { action: 'reject', callerId: targetId, callId }).catch(() => {});
      } else {
        socket.emit('end_call', { to: targetId, callId });
      }
    }

    webrtcRef.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCallData(null);
    setIsMinimized(false);
    setIsScreenSharing(false);
    setHasPermissionWarning(false);
    targetIdRef.current = null;
  };

  // Controls
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    webrtcRef.current?.toggleAudio(!next);
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    webrtcRef.current?.toggleVideo(!next);
  };

  const toggleScreenShare = async () => {
    if (!webrtcRef.current) return;
    if (!isScreenSharing) {
      const screenStream = await webrtcRef.current.startScreenShare();
      if (screenStream) {
        setIsScreenSharing(true);
        setFitMode('contain'); // Auto-optimize screen fit to contain
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
      }
    } else {
      if (webrtcRef.current.localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = webrtcRef.current.localStream;
      }
      setIsScreenSharing(false);
      setFitMode('cover');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  const targetUser = activeContact || incomingCallData?.from;

  return (
    <>
      {!isVideoCall && <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />}

      <AnimatePresence>
        <div className={isMinimized && callState === 'connected'
          ? "fixed bottom-6 right-6 z-50 w-72 h-48 sm:w-84 sm:h-56 bg-[#0c1017]/95 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_15px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col justify-between p-2.5 select-none transition-all duration-300"
          : "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-0 sm:p-6 select-none"
        }>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full h-full bg-[#0b0e14] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl overflow-hidden relative shadow-[0_0_80px_rgba(0,210,255,0.2)] flex flex-col justify-between ${
              isMinimized ? 'rounded-2xl border border-cyan-500/30' : 'max-w-5xl sm:h-[88vh]'
            }`}
          >
            {/* Permission Warning */}
            {hasPermissionWarning && !isMinimized && (
              <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-30">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <span>Microphone/Camera permission not granted. Running in standard WebRTC compatibility mode.</span>
                </div>
                <button onClick={() => setHasPermissionWarning(false)} className="text-amber-300 hover:text-white font-bold ml-2">
                  Dismiss
                </button>
              </div>
            )}

            {/* Header Bar */}
            <div className={`flex items-center justify-between z-30 bg-black/50 backdrop-blur-xl border-b border-white/5 ${
              isMinimized ? 'p-2 text-xs' : 'h-18 px-5 sm:px-8'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-400/40 p-[1.5px] bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500">
                    <img src={targetUser?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=LQ`} alt={targetUser?.username} className="w-full h-full rounded-full object-cover bg-black" />
                  </div>
                  {callState === 'connected' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0b0e14] shadow-sm" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-sm tracking-wide truncate max-w-[150px] sm:max-w-xs">{targetUser?.username || 'Liquid User'}</h3>
                    {!isMinimized && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck size={11} /> E2EE WebRTC
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-cyan-400 font-mono font-medium flex items-center gap-1.5 mt-0.5">
                    {callState === 'connected' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected • {formatTimer(callDuration)}</span>
                      </>
                    ) : callState === 'calling' ? (
                      'Outgoing Call...'
                    ) : (
                      'Incoming Call...'
                    )}
                  </p>
                </div>
              </div>

              {callState === 'connected' && (
                <div className="flex items-center gap-2">
                  {/* Fit Mode Toggle for Screen Sharing */}
                  {!isMinimized && isVideoCall && (
                    <button
                      onClick={() => setFitMode(f => f === 'cover' ? 'contain' : 'cover')}
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium border border-white/10 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
                      title={fitMode === 'contain' ? 'Fill screen' : 'Fit full screen without crop'}
                    >
                      {fitMode === 'contain' ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                      <span className="text-[11px]">{fitMode === 'contain' ? 'Fit' : 'Fill'}</span>
                    </button>
                  )}

                  {/* Minimize / Maximize Button */}
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title={isMinimized ? 'Expand call' : 'Minimize call'}
                  >
                    {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={16} />}
                  </button>
                </div>
              )}
            </div>

            {/* Main Stage */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
              {/* Incoming Call View */}
              {callState === 'receiving' && (
                <div className="flex flex-col items-center text-center z-10 p-6">
                  <div className="relative mb-8">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="absolute -inset-6 bg-cyan-400/30 rounded-full blur-2xl"
                    />
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_50px_rgba(0,210,255,0.6)]">
                      <img src={targetUser?.avatar} alt="Caller" className="w-full h-full rounded-full object-cover bg-black" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">{targetUser?.username}</h2>
                  <p className="text-white/60 mb-10 flex items-center gap-2 text-sm">
                    {incomingCallData?.isVideo ? <Video size={18} className="text-cyan-400" /> : <Phone size={18} className="text-cyan-400" />}
                    Incoming {incomingCallData?.isVideo ? 'Video' : 'Voice'} Call...
                  </p>

                  <div className="flex gap-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={answerCall}
                      id="liquid-accept-call-btn"
                      data-testid="accept-call-btn"
                      title="Answer Call"
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center shadow-[0_0_35px_rgba(34,197,94,0.6)] cursor-pointer"
                    >
                      <Phone size={28} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => endCall('rejected')}
                      id="liquid-decline-call-btn"
                      data-testid="decline-call-btn"
                      title="Decline Call"
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.6)] cursor-pointer"
                    >
                      <PhoneOff size={28} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Outgoing Calling View */}
              {callState === 'calling' && (
                <div className="flex flex-col items-center text-center z-10 p-6">
                  <div className="relative mb-8">
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -inset-6 bg-cyan-400/25 rounded-full blur-2xl"
                    />
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_40px_rgba(0,210,255,0.4)]">
                      <img src={targetUser?.avatar} alt="Target" className="w-full h-full rounded-full object-cover bg-black" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Calling {targetUser?.username}...</h2>
                  <p className="text-sm text-white/60 mb-10">Ringing liquid bell...</p>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => endCall('missed')}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] cursor-pointer"
                  >
                    <PhoneOff size={24} />
                  </motion.button>
                </div>
              )}

              {/* Active Connected Call: Continuously mounted remote & local video tags */}
              <div className={`w-full h-full relative flex items-center justify-center bg-black ${callState === 'connected' ? 'flex' : 'hidden'}`}>
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${isVideoCall && remoteStream ? 'block' : 'hidden'} ${
                    fitMode === 'contain' ? 'object-contain bg-black' : 'object-cover'
                  } transition-all duration-300`}
                />

                {/* Audio-only or no-video visualizer avatar */}
                {(!isVideoCall || !remoteStream) && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0e121a] via-[#090b10] to-[#040507]">
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="absolute -inset-8 bg-cyan-400/20 rounded-full blur-2xl"
                      />
                      <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_50px_rgba(0,210,255,0.4)]">
                        <img src={targetUser?.avatar} alt={targetUser?.username} className="w-full h-full rounded-full object-cover bg-black" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{targetUser?.username}</h3>
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                      <Volume2 size={16} className="animate-pulse" />
                      <span>HD Sovereign Audio Connected</span>
                    </div>
                  </div>
                )}

                {/* Self View (Picture-in-Picture) - Continuously mounted with PERMANENT MIRROR */}
                {isVideoCall && (
                  <motion.div
                    drag={!isMinimized}
                    dragConstraints={{ left: -120, right: 120, top: -80, bottom: 180 }}
                    className={`absolute rounded-2xl overflow-hidden border border-cyan-400/50 shadow-2xl z-20 bg-[#0e121a] ${
                      isMinimized 
                        ? 'top-2 right-2 w-20 h-28 border-cyan-400/40' 
                        : 'top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="relative w-full h-full bg-black">
                      {/* Video element ALWAYS mounted to preserve track attachment */}
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: 'scaleX(-1)' }}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isCameraOff ? 'opacity-0' : 'opacity-100'
                        }`}
                      />

                      {/* Camera Off Overlay */}
                      {isCameraOff && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] text-white p-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 mb-1.5 shadow-md">
                            <img src={user?.avatar} alt={user?.username} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-white/70 font-semibold">Camera Off</span>
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] text-white/90 font-mono font-medium flex items-center gap-1 border border-white/10">
                        <span>You</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Dynamic Bottom Control Pill Dock */}
            {callState === 'connected' && (
              <div className={`z-30 flex items-center justify-center bg-black/60 backdrop-blur-2xl border-t border-white/10 ${
                isMinimized ? 'p-2 gap-3' : 'h-24 px-6 gap-4 sm:gap-6'
              }`}>
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className={`rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-lg ${
                    isMinimized ? 'w-10 h-10' : 'w-13 h-13 sm:w-14 sm:h-14'
                  } ${
                    isMuted 
                      ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={isMinimized ? 17 : 22} /> : <Mic size={isMinimized ? 17 : 22} />}
                </button>

                {isVideoCall && (
                  <>
                    {/* Camera Off/On Toggle */}
                    <button
                      onClick={toggleCamera}
                      className={`rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-lg ${
                        isMinimized ? 'w-10 h-10' : 'w-13 h-13 sm:w-14 sm:h-14'
                      } ${
                        isCameraOff 
                          ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`}
                      title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isCameraOff ? <VideoOff size={isMinimized ? 17 : 22} /> : <Video size={isMinimized ? 17 : 22} />}
                    </button>

                    {/* Screen Share Toggle */}
                    {!isMinimized && (
                      <button
                        onClick={toggleScreenShare}
                        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-lg ${
                          isScreenSharing 
                            ? 'bg-cyan-400 text-black font-bold shadow-[0_0_25px_rgba(0,210,255,0.6)]' 
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                        }`}
                        title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen (Android / PC)'}
                      >
                        <Monitor size={22} />
                      </button>
                    )}
                  </>
                )}

                {/* End Call Button */}
                <button
                  onClick={() => endCall('completed')}
                  className={`rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-pink-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.7)] hover:brightness-110 active:scale-95 transition-all cursor-pointer ${
                    isMinimized ? 'w-10 h-10' : 'w-14 h-14 sm:w-16 sm:h-16'
                  }`}
                  title="End Call"
                >
                  <PhoneOff size={isMinimized ? 18 : 24} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
}
