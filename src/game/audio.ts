/**
 * Procedural Web Audio Sound Engine for Vice City: Next-Gen
 * Features zero-dependency procedural 80s synth radio stations,
 * realistic dynamic engine audio, police sirens, gunshots, explosions, and UI SFX.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private radioGain: GainNode | null = null;

  // Engine Audio
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Siren Audio
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;
  private sirenState: boolean = false;

  // Radio Station Synthesizer
  private currentStation: number = 1; // 0 = Off, 1 = Vice Wave 103, 2 = Flash FM, 3 = V-Rock
  private radioTimer: number | null = null;
  private radioStep: number = 0;

  constructor() {
    // Lazy init on first user interaction
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    this.setupEngineSound();
  }

  public ensureContext() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- Dynamic Vehicle Engine Synthesis ---
  private setupEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(21, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    try {
      this.engineOsc.start();
      this.engineSubOsc.start();
    } catch {
      // ignore
    }
  }

  public updateEngine(inVehicle: boolean, speedNorm: number, throttle: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineOsc || !this.engineFilter || !this.engineSubOsc) return;

    if (!inVehicle) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    const targetGain = 0.22 + (throttle ? 0.15 : 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);

    // Dynamic pitch curve: idle ~42Hz, redline ~240Hz
    const baseFreq = 40 + Math.pow(speedNorm, 0.8) * 160 + (throttle ? 35 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.06);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.06);

    const filterFreq = 350 + speedNorm * 800 + (throttle ? 400 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.06);
  }

  // --- Police Siren Synthesis ---
  public setSiren(active: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    if (!active) {
      if (this.sirenGain) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      return;
    }

    if (!this.sirenOsc) {
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);
      try {
        this.sirenOsc.start();
      } catch {
        // ignore
      }
    }

    this.sirenGain?.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.1);

    if (!this.sirenInterval) {
      this.sirenState = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        this.sirenState = !this.sirenState;
        const targetFreq = this.sirenState ? 950 : 620;
        this.sirenOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.28);
      }, 500);
    }
  }

  // --- Sound Effects ---
  public playTireSkid() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(6, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  public playCarCrash(impactStrength: number = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.5, 0.2 * impactStrength), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playGunshot(type: 'pistol' | 'smg' | 'rifle' | 'rpg') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    if (type === 'rpg') {
      // Rocket boom + blast
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.2);

      // Noise tail
      this.playNoiseBurst(0.7, 0.6, 250);
      return;
    }

    // Handguns / Rifles
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const pitch = type === 'pistol' ? 380 : type === 'smg' ? 420 : 260;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    const gain = this.ctx.createGain();
    const vol = type === 'rifle' ? 0.45 : 0.35;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    this.playNoiseBurst(0.12, 0.25, type === 'rifle' ? 1200 : 2200);
  }

  private playNoiseBurst(duration: number, volume: number, filterFreq: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playPunch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(390, now);
    osc2.frequency.setValueAtTime(490, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  public playMissionFanfare(success: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const notes = success ? [440, 554, 659, 880] : [330, 311, 293, 220];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.14;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playCashSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [987, 1318].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.18);
    });
  }

  // --- Procedural 80s Synth Radio Synthesizer ---
  public setRadioStation(stationIndex: number) {
    this.initContext();
    this.currentStation = stationIndex;

    if (this.radioTimer) {
      clearInterval(this.radioTimer);
      this.radioTimer = null;
    }

    if (stationIndex === 0 || !this.ctx || !this.radioGain) {
      return;
    }

    // Step sequencer interval (125 BPM 16th notes = ~120ms per step)
    this.radioStep = 0;
    const intervalMs = stationIndex === 1 ? 125 : stationIndex === 2 ? 115 : 135;

    this.radioTimer = window.setInterval(() => {
      this.tickRadioBeat();
    }, intervalMs);
  }

  public getRadioStation(): number {
    return this.currentStation;
  }

  private tickRadioBeat() {
    if (!this.ctx || !this.radioGain || this.isMuted || this.currentStation === 0) return;

    const step = this.radioStep % 16;
    this.radioStep++;

    const now = this.ctx.currentTime;

    // Station 1: Vice Wave 103 (Synthwave Arpeggio in A minor)
    if (this.currentStation === 1) {
      const arpNotes = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63];
      const noteFreq = arpNotes[step % arpNotes.length];

      // Synth pluck
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900 + (step % 4) * 300, now);
      filter.Q.setValueAtTime(4, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.radioGain);

      osc.start(now);
      osc.stop(now + 0.12);

      // Bassline on steps 0, 4, 8, 12
      if (step % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(110, now);

        const bassGain = this.ctx.createGain();
        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        bassOsc.connect(bassGain);
        bassGain.connect(this.radioGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.3);
      }

      // Snare on steps 4 and 12
      if (step === 4 || step === 12) {
        this.playRadioSnare(now);
      }
    } else if (this.currentStation === 2) {
      // Station 2: Flash FM (Miami Electro Funk in F major)
      const funkNotes = [174.61, 220, 261.63, 349.23, 261.63, 329.63, 220, 196];
      const freq = funkNotes[step % funkNotes.length];

      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.radioGain);
      osc.start(now);
      osc.stop(now + 0.11);

      // Hi-hat on every 2nd step
      if (step % 2 === 1) {
        this.playRadioHiHat(now);
      }
    } else if (this.currentStation === 3) {
      // Station 3: V-Rock (80s Power Chords)
      if (step % 4 === 0) {
        const chordPitches = step < 8 ? [146.83, 220] : [130.81, 196]; // D power chord, then C
        chordPitches.forEach((p) => {
          if (!this.ctx || !this.radioGain) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(p, now);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(750, now);
          filter.Q.setValueAtTime(6, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.radioGain);

          osc.start(now);
          osc.stop(now + 0.38);
        });
      }
    }
  }

  private playRadioSnare(now: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  private playRadioHiHat(now: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(8000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundEngine = new SoundEngine();
