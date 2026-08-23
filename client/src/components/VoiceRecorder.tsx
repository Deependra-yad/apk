"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Trash2, Send, Play, Pause, FastForward } from 'lucide-react';
import axios from 'axios';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoiceNote, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
      if (previewAudioRef.current) previewAudioRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStopAndPreview = () => {
    stopRecordingCleanup();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    try {
      const formData = new FormData();
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('file', file);

      const res = await axios.post('/api/upload', formData);
      onSendVoiceNote(res.data.fileUrl, recordSeconds);
    } catch (err) {
      console.error("Failed to upload voice note:", err);
      onCancel();
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && audioUrl) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="flex-1 flex items-center justify-between bg-liquid-base/90 rounded-full px-5 py-2 border border-liquid-accent/30 shadow-[0_0_20px_rgba(0,210,255,0.25)]"
    >
      {/* Left: Delete / Cancel */}
      <button 
        onClick={onCancel}
        className="p-2 text-foreground/60 hover:text-red-400 rounded-full hover:bg-foreground/5 transition-colors"
        title="Discard Voice Note"
      >
        <Trash2 size={18} />
      </button>

      {/* Center: Waveform Visualizer & Timer */}
      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center gap-1.5 px-3">
            {[4, 12, 8, 16, 10, 14, 6, 18, 12, 8, 14, 10].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [h, h * 1.8, h] }}
                transition={{ repeat: Infinity, duration: 0.6 + (i % 4) * 0.1, ease: "easeInOut" }}
                className="w-1 bg-liquid-accent rounded-full"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        ) : (
          <button 
            onClick={togglePreviewPlay}
            className="p-2 bg-liquid-accent/20 text-liquid-accent rounded-full hover:bg-liquid-accent/30 transition-colors"
          >
            {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}

        <div className="flex items-center gap-2">
          {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          <span className="text-sm font-mono text-foreground/90 font-medium">
            {formatTimer(recordSeconds)}
          </span>
        </div>
      </div>

      {/* Right: Stop / Send Buttons */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <button
            onClick={handleStopAndPreview}
            className="p-2 bg-foreground/10 text-foreground rounded-full hover:bg-foreground/20 transition-colors"
            title="Stop Recording"
          >
            <Square size={16} />
          </button>
        ) : null}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          className="p-2.5 bg-gradient-to-tr from-liquid-accent to-liquid-secondary text-foreground rounded-full shadow-[0_0_15px_rgba(0,210,255,0.4)]"
          title="Send Voice Note"
        >
          <Send size={16} className="ml-0.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Custom Audio Wave Player for Chat Bubbles with Speed Controls & Seeking
export function AudioBubblePlayer({ audioUrl, duration }: { audioUrl: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleToggleSpeed = () => {
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (percentage: number) => {
    if (audioRef.current && audioDuration > 0) {
      const targetTime = (percentage / 100) * audioDuration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 min-w-[240px]">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-foreground/20 hover:bg-white/30 text-foreground flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Seekable Waveform progress bar */}
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = (clickX / rect.width) * 100;
            handleSeek(percent);
          }}
          className="h-5 flex items-center gap-0.5 cursor-pointer group"
          title="Click to seek"
        >
          {[6, 12, 18, 10, 14, 8, 16, 20, 14, 8, 12, 16, 10, 18, 14, 8, 12, 6].map((h, idx) => {
            const isFilled = (idx / 18) * 100 <= progressPercent;
            return (
              <div
                key={idx}
                className={`w-1 rounded-full transition-colors group-hover:brightness-125 ${
                  isFilled ? 'bg-white' : 'bg-white/30'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] text-foreground/80 font-mono">
          <span>{formatTimer(currentTime)}</span>
          <div className="flex items-center gap-2">
            <span>{formatTimer(audioDuration)}</span>
            {/* Speed Badge */}
            <button
              onClick={handleToggleSpeed}
              className="px-1.5 py-0.2 rounded-md bg-foreground/20 hover:bg-white/30 text-foreground font-bold text-[9px] transition-colors"
              title="Change playback speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
