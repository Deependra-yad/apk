"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Video, PhoneOff, Mic, MicOff, VideoOff, 
  Monitor, Minimize2, Maximize2, Volume2, AlertCircle 
} from 'lucide-react';
import { WebRTCManager } from '@/utils/webrtc';
import { soundEffects } from '@/utils/audioSynth';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

interface CallModalProps {
  callState: 'idle' | 'calling' | 'receiving' | 'connected';
  setCallState: (state: 'idle' | 'calling' | 'receiving' | 'connected') => void;
  incomingCallData: { from: any; offer: any; isVideo: boolean } | null;
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
    targetIdRef.current = activeContact?.id || incomingCallData?.from?.id || targetIdRef.current;
  }, [activeContact, incomingCallData]);

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
      if (remoteAudioRef.current) {
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
  }, [socket]);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState]);

  // Bind remote stream
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, callState]);

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

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCallData || !socket || !webrtcRef.current) return;
    soundEffects.stopRinging();
    try {
      const isVideo = incomingCallData.isVideo;
      setIsVideoCall(isVideo);
      targetIdRef.current = incomingCallData.from.id;

      // Ensure audio plays
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }

      const { stream, isPermissionDenied } = await webrtcRef.current.initLocalStream(isVideo, true);
      setLocalStream(stream);
      setHasPermissionWarning(isPermissionDenied);

      const answer = await webrtcRef.current.handleOffer(incomingCallData.offer);
      socket.emit('call_answer', {
        to: incomingCallData.from.id,
        answer
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
    const targetId = targetIdRef.current || activeContact?.id || incomingCallData?.from?.id;

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
      socket.emit('end_call', { to: targetId });
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
    if (!isScreenSharing) {
      const stream = await webrtcRef.current?.startScreenShare();
      if (stream) {
        setLocalStream(stream);
        setIsScreenSharing(true);
      }
    } else {
      const { stream } = await webrtcRef.current?.initLocalStream(isVideoCall, !isMuted) || {};
      if (stream) {
        setLocalStream(stream);
      }
      setIsScreenSharing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  const targetUser = activeContact || incomingCallData?.from;

  // Minimized Picture-in-Picture Bubble
  if (isMinimized && callState === 'connected') {
    return (
      <motion.div
        drag
        dragConstraints={{ left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 250 : 500, top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 200 : 500 }}
        className="fixed bottom-6 right-6 z-50 w-64 h-44 bg-liquid-base/95 border border-liquid-accent/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,210,255,0.5)] backdrop-blur-xl cursor-grab active:cursor-grabbing flex flex-col justify-between p-2.5"
      >
        <div className="flex justify-between items-center text-xs text-white/90 px-1">
          <span className="font-semibold truncate">{targetUser?.username}</span>
          <button onClick={() => setIsMinimized(false)} className="hover:text-liquid-accent p-1"><Maximize2 size={14} /></button>
        </div>

        <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-black/70 flex items-center justify-center my-1">
          {isVideoCall && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full overflow-hidden border border-liquid-accent">
              <img src={targetUser?.avatar} alt={targetUser?.username} className="w-full h-full object-cover" />
            </div>
          )}
          <audio ref={remoteAudioRef} autoPlay playsInline />
        </div>

        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] text-green-400 font-mono font-medium">{formatTimer(callDuration)}</span>
          <button onClick={() => endCall('completed')} className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600">
            <PhoneOff size={12} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 sm:p-6"
      >
        {/* Hidden Audio Element ensuring Remote Audio Always Plays */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="w-full max-w-4xl h-full sm:h-[85vh] bg-liquid-base/95 border-0 sm:border border-white/10 rounded-none sm:rounded-3xl overflow-hidden relative shadow-[0_0_80px_rgba(0,210,255,0.25)] flex flex-col justify-between"
        >
          {/* Permission Notice Banner */}
          {hasPermissionWarning && (
            <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-30">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-400 shrink-0" />
                <span>
                  Microphone/Camera blocked by browser. Connected in simulation mode. Click the lock icon in address bar to allow.
                </span>
              </div>
              <button onClick={() => setHasPermissionWarning(false)} className="text-amber-300 hover:text-white font-bold ml-2">
                Dismiss
              </button>
            </div>
          )}

          {/* Header Bar */}
          <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between z-20 bg-liquid-dark/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-liquid-accent/40">
                <img src={targetUser?.avatar} alt={targetUser?.username} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{targetUser?.username}</h3>
                <p className="text-xs text-liquid-accent font-mono">
                  {callState === 'connected' ? `Connected • ${formatTimer(callDuration)}` : callState === 'calling' ? 'Calling...' : 'Incoming Call...'}
                </p>
              </div>
            </div>

            {callState === 'connected' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                title="Minimize call"
              >
                <Minimize2 size={18} />
              </button>
            )}
          </div>

          {/* Main Stage */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-liquid-dark/60 to-liquid-base/60">
            {/* Incoming Call View */}
            {callState === 'receiving' && (
              <div className="flex flex-col items-center text-center z-10">
                <div className="relative mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute -inset-6 bg-liquid-accent/30 rounded-full blur-xl"
                  />
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-[0_0_40px_rgba(0,210,255,0.6)]">
                    <img src={targetUser?.avatar} alt="Caller" className="w-full h-full rounded-full object-cover bg-liquid-base" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{targetUser?.username}</h2>
                <p className="text-gray-400 mb-10 flex items-center gap-2">
                  {incomingCallData?.isVideo ? <Video size={18} className="text-liquid-accent" /> : <Phone size={18} className="text-liquid-accent" />}
                  Incoming {incomingCallData?.isVideo ? 'Video' : 'Voice'} Call...
                </p>

                <div className="flex gap-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={answerCall}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-pointer"
                  >
                    <Phone size={28} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => endCall('rejected')}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] cursor-pointer"
                  >
                    <PhoneOff size={28} />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Outgoing Calling View */}
            {callState === 'calling' && (
              <div className="flex flex-col items-center text-center z-10">
                <div className="relative mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-4 bg-liquid-accent/30 rounded-full blur-lg"
                  />
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-[0_0_30px_rgba(0,210,255,0.4)]">
                    <img src={targetUser?.avatar} alt="Target" className="w-full h-full rounded-full object-cover bg-liquid-base" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Calling {targetUser?.username}...</h2>
                <p className="text-sm text-gray-400 mb-10">Ringing liquid bell...</p>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => endCall('missed')}
                  className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  <PhoneOff size={24} />
                </motion.button>
              </div>
            )}

            {/* Active Connected Call */}
            {callState === 'connected' && (
              <div className="w-full h-full relative">
                {/* Remote Video or Audio Visualizer */}
                {isVideoCall ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="absolute -inset-8 bg-liquid-accent/20 rounded-full blur-2xl"
                      />
                      <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-[0_0_50px_rgba(0,210,255,0.5)]">
                        <img src={targetUser?.avatar} alt={targetUser?.username} className="w-full h-full rounded-full object-cover bg-liquid-base" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{targetUser?.username}</h3>
                    <div className="flex items-center gap-2 text-liquid-accent text-sm font-medium">
                      <Volume2 size={16} className="animate-pulse" />
                      <span>HD Voice Audio Connected</span>
                    </div>
                  </div>
                )}

                {/* Self View (Picture-in-Picture) */}
                {isVideoCall && (
                  <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 300, top: 0, bottom: 200 }}
                    className="absolute top-4 right-4 w-44 h-60 bg-black/80 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 cursor-grab active:cursor-grabbing"
                  >
                    {!isCameraOff ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover -scale-x-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-liquid-base">
                        Camera Off
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                      You
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Control Bar */}
          {callState === 'connected' && (
            <div className="h-24 bg-liquid-dark/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-center gap-4 sm:gap-6 px-6 z-20">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {isVideoCall && (
                <>
                  <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isCameraOff ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                    title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isScreenSharing ? 'bg-liquid-accent text-liquid-dark font-bold' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                    title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                  >
                    <Monitor size={20} />
                  </button>
                </>
              )}

              <button
                onClick={() => endCall('completed')}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:brightness-110 transition-all ml-2 cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
