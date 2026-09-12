// High-Reliability Native WebRTC Peer Connection Manager

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

// Generates a working synthetic media stream if hardware devices are blocked
function createSyntheticStream(needVideo: boolean = true): MediaStream {
  const stream = new MediaStream();

  // 1. Silent Audio Oscillator Track
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        stream.addTrack(audioTrack);
      }
    }
  } catch (e) {}

  // 2. Animated Liquid Video Canvas Track
  if (needVideo) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#00d2ff';
        ctx.font = '20px sans-serif';
        ctx.fillText('Simulated HD Camera 🌊', 210, 240);
      }
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null;
      if (canvasStream) {
        const videoTrack = canvasStream.getVideoTracks()[0];
        if (videoTrack) stream.addTrack(videoTrack);
      }
    } catch (e) {}
  }

  return stream;
}

export class WebRTCManager {
  public peer: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public currentFacingMode: 'user' | 'environment' = 'user';
  private pendingCandidates: RTCIceCandidateInit[] = [];
  
  public onRemoteStream?: (stream: MediaStream) => void;
  public onIceCandidate?: (candidate: RTCIceCandidate) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  async initLocalStream(video: boolean = true, audio: boolean = true): Promise<{ stream: MediaStream; isPermissionDenied: boolean }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }

      this.currentFacingMode = 'user';
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 }
        } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
      });

      // Synchronize to active peer if it exists
      this.syncTracksToPeer();

      return { stream: this.localStream, isPermissionDenied: false };
    } catch (err: any) {
      console.warn("Camera/Mic hardware not accessible with primary constraints, trying fallback:", err);
      try {
        // Fallback with minimal video constraints
        if (video) {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: audio ? { echoCancellation: true } : false
          });
          this.syncTracksToPeer();
          return { stream: this.localStream, isPermissionDenied: false };
        }
      } catch (e) {}

      try {
        // Fallback to audio only
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        this.syncTracksToPeer();
        return { stream: this.localStream, isPermissionDenied: false };
      } catch (err2) {
        console.warn("Using synthetic fallback stream:", err2);
        this.localStream = createSyntheticStream(video);
        this.syncTracksToPeer();
        return { stream: this.localStream, isPermissionDenied: true };
      }
    }
  }

  syncTracksToPeer() {
    if (!this.peer || !this.localStream) return;
    try {
      const senders = this.peer.getSenders();
      this.localStream.getTracks().forEach(track => {
        const existing = senders.find(s => s.track?.kind === track.kind);
        if (existing) {
          existing.replaceTrack(track).catch(() => {});
        } else {
          try {
            this.peer?.addTrack(track, this.localStream!);
          } catch (e) {}
        }
      });
    } catch (e) {
      console.warn("Track sync error:", e);
    }
  }

  async switchCamera(): Promise<{ success: boolean; facingMode: 'user' | 'environment' }> {
    if (!this.localStream) return { success: false, facingMode: this.currentFacingMode };
    try {
      const targetFacing = this.currentFacingMode === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return { success: false, facingMode: this.currentFacingMode };

      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      this.localStream.addTrack(newVideoTrack);
      this.currentFacingMode = targetFacing;

      if (this.peer) {
        const sender = this.peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
      return { success: true, facingMode: targetFacing };
    } catch (err) {
      console.warn("Camera flip note:", err);
      return { success: false, facingMode: this.currentFacingMode };
    }
  }

  createPeerConnection(): RTCPeerConnection {
    if (this.peer && this.peer.signalingState !== 'closed') {
      this.syncTracksToPeer();
      return this.peer;
    }

    this.peer = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Attach local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          this.peer?.addTrack(track, this.localStream!);
        } catch (e) {}
      });
    }

    // Capture incoming remote tracks and bundle into single MediaStream
    this.peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (event.track && this.remoteStream) {
        this.remoteStream.addTrack(event.track);
      }
      if (this.remoteStream) {
        this.onRemoteStream?.(this.remoteStream);
      }
    };

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(event.candidate);
      }
    };

    this.peer.onconnectionstatechange = () => {
      if (this.peer) {
        this.onConnectionStateChange?.(this.peer.connectionState);
      }
    };

    return this.peer;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    this.syncTracksToPeer();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection();
    this.syncTracksToPeer();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Drain queued ICE candidates
    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) return;
    try {
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));

      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        if (candidate) {
          try {
            await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Error setting remote answer description:", err);
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peer && this.peer.remoteDescription) {
      try {
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  async startScreenShare(): Promise<MediaStream | null> {
    if (!this.peer) return null;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = this.peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        if (this.localStream) {
          const originalVideoTrack = this.localStream.getVideoTracks()[0];
          if (originalVideoTrack && sender) {
            sender.replaceTrack(originalVideoTrack);
          }
        }
      };

      return screenStream;
    } catch (e) {
      console.warn("Screen sharing cancelled:", e);
      return null;
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.remoteStream = null;
    }
    if (this.peer) {
      try {
        this.peer.close();
      } catch (e) {}
      this.peer = null;
    }
    this.pendingCandidates = [];
  }
}
