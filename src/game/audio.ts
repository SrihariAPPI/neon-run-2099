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

  private engineGain: GainNode | null = null;
  private engineSource: AudioBufferSourceNode | null = null;
  private engineGainNode: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineBassBoost: BiquadFilterNode | null = null;
  private engineBuffer: AudioBuffer | null = null;
  private fullEngineBuffer: AudioBuffer | null = null;
  private isEngineLoading = false;
  private isEngineRunning = false;
  private engineVolume = 0.85;

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

      // Engine bus
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.engineVolume, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;

      // Asynchronously load the custom engine recording
      this.loadEngineAudio();
    } catch {
      // Audio context might fail in restricted environments
    }
  }

  /**
   * Loads the custom engine audio recording into memory.
   * Loads the seamless loop version and the full 30s recording.
   */
  private async loadEngineAudio() {
    if (!this.ctx || this.engineBuffer || this.isEngineLoading) return;
    this.isEngineLoading = true;

    try {
      // First attempt to load the seamlessly crossfaded version
      const loopRes = await fetch('/audio/player-engine-loop.wav');
      if (loopRes.ok) {
        const loopArray = await loopRes.arrayBuffer();
        if (this.ctx) {
          this.engineBuffer = await this.ctx.decodeAudioData(loopArray);
        }
      }
    } catch {
      // Loop fetch fallback
    }

    // If loop version failed, fallback to the full recording
    if (!this.engineBuffer && this.ctx) {
      try {
        const res = await fetch('/audio/player-engine.wav');
        if (res.ok) {
          const arr = await res.arrayBuffer();
          if (this.ctx) {
            this.engineBuffer = await this.ctx.decodeAudioData(arr);
          }
        }
      } catch {
        // Ignore fallback error
      }
    }

    // Also load the full recording for rev preview and events
    try {
      const fullRes = await fetch('/audio/player-engine.wav');
      if (fullRes.ok && this.ctx) {
        const fullArr = await fullRes.arrayBuffer();
        this.fullEngineBuffer = await this.ctx.decodeAudioData(fullArr);
      }
    } catch {
      // Optional full recording load
    }

    this.isEngineLoading = false;

    // If engine was requested to start while loading was in progress, start now
    if (this.isEngineRunning && !this.engineSource) {
      this.startRealEngine();
    }
  }

  /**
   * Starts the player car engine sound using the custom recording.
   * Sets up a continuous, artifact-free loop with dynamic filters and gain stages.
   */
  public startRealEngine(_carId?: string) {
    this.isEngineRunning = true;
    if (!this.ctx || !this.engineGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.engineBuffer) {
      if (!this.isEngineLoading) {
        this.loadEngineAudio();
      }
      return;
    }

    // Stop existing instance if any
    if (this.engineSource) {
      try {
        this.engineSource.stop();
        this.engineSource.disconnect();
      } catch {
        // Ignore
      }
      this.engineSource = null;
    }

    const time = this.ctx.currentTime;

    // Buffer source from the custom recording
    this.engineSource = this.ctx.createBufferSource();
    this.engineSource.buffer = this.engineBuffer;
    this.engineSource.loop = true;

    // Dynamic Lowpass Filter: controls harmonic brightness with RPM and throttle
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(1200, time);
    this.engineFilter.Q.setValueAtTime(1.2, time);

    // Bass Boost Filter: adds weight and cyberpunk low-end rumble
    this.engineBassBoost = this.ctx.createBiquadFilter();
    this.engineBassBoost.type = 'lowshelf';
    this.engineBassBoost.frequency.setValueAtTime(110, time);
    this.engineBassBoost.gain.setValueAtTime(3.5, time);

    // Dynamic Gain stage
    this.engineGainNode = this.ctx.createGain();
    this.engineGainNode.gain.setValueAtTime(0.001, time);
    // Smooth fade in to avoid start clicks
    this.engineGainNode.gain.exponentialRampToValueAtTime(0.35, time + 0.08);

    // Initial pitch rate at idle
    this.engineSource.playbackRate.setValueAtTime(0.58, time);

    // Routing graph: Source -> Filter -> BassBoost -> GainNode -> EngineBus -> Master
    this.engineSource.connect(this.engineFilter);
    this.engineFilter.connect(this.engineBassBoost);
    this.engineBassBoost.connect(this.engineGainNode);
    this.engineGainNode.connect(this.engineGain);

    this.engineSource.start(0);
  }

  /**
   * Responds dynamically to driving: speed, gear, RPM, throttle, braking, and shift states.
   * Smoothly adjusts pitch (playbackRate), filter cutoff, and loudness.
   */
  public updateEngine(
    speedKmH: number,
    gear: number,
    rpmNormalized: number,
    actualRpm: number,
    throttle: number,
    brake: number,
    isShifting: boolean
  ) {
    if (!this.ctx || !this.engineSource || !this.engineGainNode || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    const clampedRpm = Math.max(0, Math.min(1.0, rpmNormalized));

    // Dynamic Pitch / Playback Rate:
    // Low rumble at idle (~0.56x rate). Climbs aggressively to ~1.44x at redline.
    let targetRate = 0.56 + clampedRpm * 0.86;

    // During gear shift, momentary clutch dip
    if (isShifting) {
      targetRate *= 0.82;
    }

    targetRate = Math.max(0.48, Math.min(1.75, targetRate));

    // Smooth exponential ramp without clicks
    this.engineSource.playbackRate.setTargetAtTime(targetRate, now, 0.07);

    // Dynamic Filter Brightness:
    // Warm rumble at idle, full screaming frequency spectrum under throttle & revs
    const targetCutoff = 1100 + (throttle * 0.65 + clampedRpm * 0.35) * 16500;
    this.engineFilter.frequency.setTargetAtTime(Math.max(900, Math.min(20000, targetCutoff)), now, 0.06);

    // Dynamic Loudness:
    // Responsive to throttle demand, speed, and braking
    let targetGain = 0.32 + (throttle * 0.42) + (clampedRpm * 0.16);
    if (brake > 0.1) {
      targetGain *= 0.72;
    }
    if (isShifting) {
      targetGain *= 0.60;
    }
    targetGain = Math.max(0.12, Math.min(0.92, targetGain));

    this.engineGainNode.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  /**
   * Exhaust crackle / backfire pop on high-RPM upshifts.
   */
  public playGearShiftPop(gear: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const time = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.012));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900 + gear * 120, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.08);
  }

  /**
   * Momentary throttle rev-match blip on downshifts.
   */
  public playDownshiftBlip(_gear: number) {
    if (!this.ctx || !this.engineSource) return;
    const time = this.ctx.currentTime;
    const currentRate = this.engineSource.playbackRate.value;
    this.engineSource.playbackRate.cancelScheduledValues(time);
    this.engineSource.playbackRate.setValueAtTime(currentRate + 0.15, time);
    this.engineSource.playbackRate.setTargetAtTime(currentRate, time + 0.04, 0.08);
  }

  /**
   * Stops the engine sound smoothly with no click or abrupt cutoff.
   */
  public stopEngine() {
    this.isEngineRunning = false;
    if (!this.ctx) return;

    if (this.engineGainNode) {
      const time = this.ctx.currentTime;
      this.engineGainNode.gain.cancelScheduledValues(time);
      this.engineGainNode.gain.setValueAtTime(this.engineGainNode.gain.value, time);
      this.engineGainNode.gain.setTargetAtTime(0.0001, time, 0.04);
    }

    const src = this.engineSource;
    if (src) {
      setTimeout(() => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // Already stopped
        }
      }, 50);
      this.engineSource = null;
    }
  }

  /**
   * Garage / showcase engine rev preview using the custom recording.
   */
  public previewEngineRev(_carId?: string) {
    if (!this.ctx || this.isMuted) return;
    const buf = this.fullEngineBuffer || this.engineBuffer;
    if (!buf) return;

    try {
      const time = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.65, time + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

      src.playbackRate.setValueAtTime(0.62, time);
      src.playbackRate.exponentialRampToValueAtTime(1.3, time + 0.7);
      src.playbackRate.exponentialRampToValueAtTime(0.75, time + 1.8);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      src.start(time, 1.5);
      src.stop(time + 1.85);
    } catch {
      // Ignore
    }
  }

  public setEngineVolume(val: number) {
    this.engineVolume = Math.max(0, Math.min(1, val));
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : this.engineVolume, this.ctx.currentTime);
    }
  }

  public getEngineVolume(): number {
    return this.engineVolume;
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

  public getIsMuted(): boolean {
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
