// Web Audio API Ringtone and Sound Synthesizer

class SoundEffects {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play outgoing phone ringtone (classic periodic dual-tone)
  startOutgoingRing() {
    this.stopRinging();
    const playTone = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // 440 Hz
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now); // 480 Hz

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.setValueAtTime(0.15, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      } catch (e) {}
    };

    playTone();
    this.ringInterval = setInterval(playTone, 4000);
  }

  // Play incoming call melody according to user preference
  startIncomingRing() {
    this.stopRinging();
    const ringtone = (typeof window !== 'undefined' ? localStorage.getItem('liquid_ringtone') : null) || 'sakura';
    
    const playSelectedChime = () => {
      if (ringtone === 'cyber') {
        this.playCyberPulse();
      } else if (ringtone === 'kawaii') {
        this.playKawaiiChime();
      } else if (ringtone === 'tokyo') {
        this.playTokyoNeon();
      } else {
        this.playSakuraBell();
      }
    };

    playSelectedChime();
    this.ringInterval = setInterval(playSelectedChime, 2400);
  }

  stopRinging() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Play subtle message sent 'pop'
  playMessageSent() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Play subtle message receive 'liquid drop' sound
  playMessageReceived() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Kawaii Synth 1: Sakura Bell (Japanese Pentatonic Blossom)
  playSakuraBell() {
    try {
      const ctx = this.getContext();
      const notes = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D5, E5, G5, A5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch (e) {}
  }

  // Kawaii Synth 2: Cyber Pulse (Tokyo Neon Wave)
  playCyberPulse() {
    try {
      const ctx = this.getContext();
      const freqs = [329.63, 440.00, 554.37, 659.25]; // E4, A4, C#5, E5
      freqs.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch (e) {}
  }

  // Kawaii Synth 3: Kawaii Chime (Cute Anime Sparkle)
  playKawaiiChime() {
    try {
      const ctx = this.getContext();
      const notes = [698.46, 880.00, 1046.50, 1396.91]; // F5, A5, C6, F6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch (e) {}
  }

  // Kawaii Synth 4: Tokyo Neon (Future Cyber Arpeggio)
  playTokyoNeon() {
    try {
      const ctx = this.getContext();
      const notes = [440, 523.25, 659.25, 880, 1046.50];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffects();

