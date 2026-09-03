// Procedural Retro Arcade Audio Engine for Wordball Xtreme
// Uses Web Audio API with zero external audio dependencies.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('wordball_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('wordball_muted', String(this.muted));
    } catch {}
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private _playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gainVal: number = 0.15): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playLaunch(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  playBounce(): void {
    this._playTone(180, 'sine', 0.08, 0.12);
  }

  playHoleSink(multiplier: number = 1): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const baseNotes = multiplier >= 5 
      ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (High score chime)
      : [392.00, 523.25, 659.25];         // G4, C5, E5

    baseNotes.forEach((freq, idx) => {
      setTimeout(() => {
        this._playTone(freq, 'sine', 0.22, 0.18);
      }, idx * 60);
    });
  }

  playTileClick(): void {
    this._playTone(800, 'triangle', 0.04, 0.08);
  }

  playTileRemove(): void {
    this._playTone(400, 'sine', 0.05, 0.08);
  }

  playWordValid(points: number = 10): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this._playTone(freq, 'triangle', 0.35, 0.2);
      }, idx * 70);
    });
  }

  playWordInvalid(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this._playTone(220, 'sawtooth', 0.2, 0.15);
    this._playTone(207.65, 'sawtooth', 0.2, 0.15);
  }

  playTick(): void {
    this._playTone(900, 'sine', 0.03, 0.06);
  }

  playGameOver(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 392, 349.23, 329.63];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this._playTone(freq, 'sine', 0.35, 0.2);
      }, idx * 120);
    });
  }
}

export const sound = new SoundEngine();
