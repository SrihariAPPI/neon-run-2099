/**
 * Procedural Web Audio Engine for NEON RUN: 2099
 * Features dynamic multi-harmonic engine revving synthesis scaling with RPM,
 * simulated gear upshift pops, downshift rev-blips, turbo spool & blow-off,
 * rev limiter stutter, near-miss whoosh, collision impacts, nitro, and cyberpunk ambient music.
 */

export type ShiftType = 'UP' | 'DOWN';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Music loop state
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private currentStep = 0;

  private isMuted = false;
  private initialized = false;

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      // Audio context might fail in restricted environments
    }
  }

  /**
   * Car sound fully disabled per user request
   */
  public startRealEngine(_carId?: string) {
    // Car sound fully removed
  }

  public updateEngine(
    _speedKmH: number,
    _gear: number,
    _rpmNormalized: number,
    _actualRpm: number,
    _throttle: number,
    _brake: number,
    _isShifting: boolean
  ) {
    // Car sound fully removed
  }

  public playGearShiftPop(_gear: number) {
    // Car sound fully removed
  }

  public playDownshiftBlip(_gear: number) {
    // Car sound fully removed
  }

  public stopEngine() {
    // Car sound fully removed
  }

  public previewEngineRev(_carId?: string) {
    // Car sound fully removed
  }

  public playNearMiss() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.1);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.25);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  public playTrafficPass(pan: number = 0) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, time);
    osc.frequency.exponentialRampToValueAtTime(130, time + 0.35);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    if (panner) {
      panner.pan.setValueAtTime(pan, time);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    osc.start(time);
    osc.stop(time + 0.36);
  }

  public playNitro() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Create white noise burst for futuristic nitro afterburner
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(3200, time + 0.35);
    filter.Q.setValueAtTime(4.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.41);
  }

  public playCrash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Metallic noise crash
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Sub thud
    const sub = this.ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(120, time);
    sub.frequency.exponentialRampToValueAtTime(30, time + 0.5);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.7, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(time);
    sub.start(time);
    noise.stop(time + 0.71);
    sub.stop(time + 0.61);
  }

  public playClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.04);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  public startCyberpunkMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    // Synthwave bassline notes (D minor: D1, F1, G1, A1, C2)
    const bassFreqs = [73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 110.00, 98.00];
    const arpHarmonics = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66, 220.0];

    // 128 BPM = 16th note step is 60 / (128 * 4) = ~0.117s
    const stepDuration = 120; // ms

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      const step = this.currentStep % 16;
      const bassNote = bassFreqs[Math.floor(step / 2) % bassFreqs.length];

      // Bass punch on every 8th note
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNote, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, t);
        bassFilter.frequency.exponentialRampToValueAtTime(120, t + 0.16);

        bGain.gain.setValueAtTime(0.2, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bGain);
        bGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.19);
      }

      // Arpeggio synth on 16th notes with cyber resonance
      if (step % 2 === 1 || step % 4 === 0) {
        const arpNote = arpHarmonics[step % arpHarmonics.length];
        const arpOsc = this.ctx.createOscillator();
        const aGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpNote, t);

        aGain.gain.setValueAtTime(0.08, t);
        aGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        arpOsc.connect(aGain);
        aGain.connect(this.musicGain);

        arpOsc.start(t);
        arpOsc.stop(t + 0.12);
      }

      this.currentStep++;
    }, stepDuration);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : val, this.ctx.currentTime);
    }
  }

  public destroy() {
    this.stopMusic();
    this.stopEngine();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const soundManager = new SoundSystem();
