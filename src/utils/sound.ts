class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    return this.getContext();
  }

  playDrop() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.11);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playLand(wasSliced: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(wasSliced ? 260 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);

    if (wasSliced) {
      const sliceOsc = ctx.createOscillator();
      const sliceGain = ctx.createGain();
      sliceOsc.type = 'sawtooth';
      sliceOsc.frequency.setValueAtTime(520, now + 0.02);
      sliceOsc.frequency.exponentialRampToValueAtTime(280, now + 0.09);
      sliceGain.gain.setValueAtTime(0.04, now + 0.02);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      sliceOsc.connect(sliceGain);
      sliceGain.connect(ctx.destination);
      sliceOsc.start(now + 0.02);
      sliceOsc.stop(now + 0.09);
    }
  }

  playPerfect(combo: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = 523.25 * Math.pow(1.06, Math.min(combo, 12));

    [1, 1.25, 1.5].forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.045;
      osc.frequency.setValueAtTime(baseFreq * mult, start);
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  playPowerUp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  playShieldSave() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }
}

export const soundFx = new SoundEffects();

// Cheerful Japanese kawaii patisserie eighth-note loop (C major, 118 BPM)
const NOTE_FREQ: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
};

// 32 eighth-note steps (4 bars of 4/4)
const MELODY_STEPS: (string | null)[] = [
  'E5', 'G5', 'A5', 'G5', 'E5', null, 'C5', 'D5',
  'E5', 'G5', 'C6', 'A5', 'G5', null, 'E5', null,
  'F5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'D5',
  'E5', 'G5', 'D5', 'E5', 'C5', null, null, null,
];

const BASS_STEPS: (string | null)[] = [
  'C3', null, 'G3', null, 'C3', null, 'G3', null,
  'A3', null, 'E4', null, 'A3', null, 'E4', null,
  'F3', null, 'C4', null, 'D3', null, 'A3', null,
  'G3', null, 'D4', null, 'C3', null, 'G3', null,
];

class KawaiiBgmPlayer {
  private timerId: number | null = null;
  private isPlaying = false;
  private step = 0;
  private nextNoteTime = 0;
  private masterGain: GainNode | null = null;

  private readonly stepDuration = 60 / 118 / 2; // eighth note ~0.254s

  private ensureMasterGain(ctx: AudioContext): GainNode {
    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.75;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private scheduleNote(ctx: AudioContext, master: GainNode, stepIdx: number, time: number) {
    const melodyKey = MELODY_STEPS[stepIdx];
    if (melodyKey && NOTE_FREQ[melodyKey]) {
      const freq = NOTE_FREQ[melodyKey];
      const osc = ctx.createOscillator();
      const bell = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq * 2, time);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0.18, time);
      bell.connect(bellGain);
      bellGain.connect(gain);

      osc.connect(gain);
      gain.connect(master);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.042, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.23);

      osc.start(time);
      bell.start(time);
      osc.stop(time + 0.24);
      bell.stop(time + 0.24);
    }

    const bassKey = BASS_STEPS[stepIdx];
    if (bassKey && NOTE_FREQ[bassKey]) {
      const freq = NOTE_FREQ[bassKey];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      osc.connect(gain);
      gain.connect(master);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.036, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.28);

      osc.start(time);
      osc.stop(time + 0.29);
    }
  }

  private scheduler = () => {
    if (!this.isPlaying) return;
    const ctx = soundFx.getContext();
    if (!ctx) return;

    const master = this.ensureMasterGain(ctx);
    const lookAhead = 0.16;

    while (this.nextNoteTime < ctx.currentTime + lookAhead) {
      this.scheduleNote(ctx, master, this.step, this.nextNoteTime);
      this.nextNoteTime += this.stepDuration;
      this.step = (this.step + 1) % MELODY_STEPS.length;
    }
  };

  play(resetStep = false) {
    if (resetStep) {
      this.step = 0;
    }
    if (this.isPlaying) return;

    const ctx = soundFx.getContext();
    if (!ctx) return;

    const master = this.ensureMasterGain(ctx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.75, ctx.currentTime, 0.04);

    this.isPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.04;
    this.scheduler();
    this.timerId = window.setInterval(this.scheduler, 60);
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    const ctx = soundFx.getContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
    }
  }

  stop() {
    this.pause();
    this.step = 0;
  }
}

export const bgmPlayer = new KawaiiBgmPlayer();
