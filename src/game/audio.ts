/**
 * High-Performance Web Audio Engine for NEON RUN: 2099
 * Integrates the player's custom car engine sound recording with dynamic
 * RPM, throttle, gear, and braking response, seamless looping,
 * robust browser autoplay unlocking, and instantaneous preloading.
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

  // Real Engine Audio Nodes
  private engineGain: GainNode | null = null;
  private engineSource: AudioBufferSourceNode | null = null;
  private engineGainNode: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineBassBoost: BiquadFilterNode | null = null;
  private engineBuffer: AudioBuffer | null = null;
  private fullEngineBuffer: AudioBuffer | null = null;

  // Procedural fallback nodes while audio buffer loads over network
  private fallbackOsc1: OscillatorNode | null = null;
  private fallbackOsc2: OscillatorNode | null = null;
  private fallbackGain: GainNode | null = null;

  private isEngineLoading = false;
  private isEngineRunning = false;
  private engineVolume = 1.0;

  // Raw array buffers cached during preload
  private cachedLoopArray: ArrayBuffer | null = null;
  private cachedFullArray: ArrayBuffer | null = null;

  private isMuted = false;
  private initialized = false;

  constructor() {
    // Automatically kick off network preloading as soon as the module loads
    this.preload();
  }

  /**
   * Preload audio recordings over the network ahead of time.
   * Caches raw ArrayBuffers so they can be decoded instantly when AudioContext unlocks.
   */
  public async preload() {
    if (this.cachedLoopArray && this.cachedFullArray) return;

    const candidateLoopPaths = [
      '/audio/player-engine-loop.wav',
      'audio/player-engine-loop.wav',
      './audio/player-engine-loop.wav',
      '/audio/player-engine.wav',
      'audio/player-engine.wav',
      '/assets/aistudio/se_senjbmkoivgr57j4_fbf67cce.wav',
      'assets/aistudio/se_senjbmkoivgr57j4_fbf67cce.wav',
    ];

    if (!this.cachedLoopArray) {
      for (const path of candidateLoopPaths) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            this.cachedLoopArray = await res.arrayBuffer();
            break;
          }
        } catch {
          // Try next fallback
        }
      }
    }

    if (!this.cachedFullArray) {
      const candidateFullPaths = [
        '/audio/player-engine.wav',
        'audio/player-engine.wav',
        '/assets/aistudio/se_senjbmkoivgr57j4_fbf67cce.wav',
        'assets/aistudio/se_senjbmkoivgr57j4_fbf67cce.wav',
      ];
      for (const path of candidateFullPaths) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            this.cachedFullArray = await res.arrayBuffer();
            break;
          }
        } catch {
          // Try next fallback
        }
      }
    }

    // If AudioContext is already available, decode immediately
    if (this.ctx && !this.engineBuffer && this.cachedLoopArray) {
      this.decodeCachedBuffers();
    }
  }

  /**
   * Initializes the Web Audio graph and immediately resumes the AudioContext
   * to comply with browser autoplay unlock policies.
   */
  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output bus (loud and punchy)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.95, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Player Engine bus (Full dynamic presence)
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.engineVolume, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      // Cyberpunk Synthwave Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;

      // Resume context immediately on initialization
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // Decode preloaded buffers or fetch if not ready
      if (this.cachedLoopArray) {
        this.decodeCachedBuffers();
      } else {
        this.loadEngineAudio();
      }
    } catch (err) {
      console.warn('AudioContext initialization failed:', err);
    }
  }

  /**
   * Explicitly resumes the AudioContext. Safe to call on any user interaction.
   */
  public async resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }
  }

  public isUnlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /**
   * Decodes the cached ArrayBuffers into usable Web Audio buffers.
   */
  private async decodeCachedBuffers() {
    if (!this.ctx) return;

    if (this.cachedLoopArray && !this.engineBuffer) {
      try {
        // Clone array buffer for decodeAudioData since it detaches the source buffer
        const copy = this.cachedLoopArray.slice(0);
        this.engineBuffer = await this.ctx.decodeAudioData(copy);
      } catch (err) {
        console.warn('Error decoding cached loop buffer:', err);
      }
    }

    if (this.cachedFullArray && !this.fullEngineBuffer) {
      try {
        const copy = this.cachedFullArray.slice(0);
        this.fullEngineBuffer = await this.ctx.decodeAudioData(copy);
      } catch (err) {
        console.warn('Error decoding cached full buffer:', err);
      }
    }

    // If engine was waiting to start, start immediately
    if (this.isEngineRunning && !this.engineSource && this.engineBuffer) {
      this.startRealEngine();
    }
  }

  /**
   * Loads the custom engine audio recording into memory.
   */
  private async loadEngineAudio() {
    if (!this.ctx || this.engineBuffer || this.isEngineLoading) return;
    this.isEngineLoading = true;

    try {
      await this.preload();
      await this.decodeCachedBuffers();
    } catch (err) {
      console.warn('Failed to load engine audio:', err);
    } finally {
      this.isEngineLoading = false;
    }

    if (this.isEngineRunning && !this.engineSource && this.engineBuffer) {
      this.startRealEngine();
    }
  }

  /**
   * Starts procedural engine hum as an immediate fallback while WAV is loading.
   */
  private startProceduralFallback() {
    if (!this.ctx || !this.engineGain || this.fallbackGain) return;

    const time = this.ctx.currentTime;
    this.fallbackGain = this.ctx.createGain();
    this.fallbackGain.gain.setValueAtTime(0.2, time);

    this.fallbackOsc1 = this.ctx.createOscillator();
    this.fallbackOsc1.type = 'sawtooth';
    this.fallbackOsc1.frequency.setValueAtTime(55, time);

    this.fallbackOsc2 = this.ctx.createOscillator();
    this.fallbackOsc2.type = 'triangle';
    this.fallbackOsc2.frequency.setValueAtTime(110, time);

    const fallbackFilter = this.ctx.createBiquadFilter();
    fallbackFilter.type = 'lowpass';
    fallbackFilter.frequency.setValueAtTime(800, time);

    this.fallbackOsc1.connect(fallbackFilter);
    this.fallbackOsc2.connect(fallbackFilter);
    fallbackFilter.connect(this.fallbackGain);
    this.fallbackGain.connect(this.engineGain);

    this.fallbackOsc1.start(time);
    this.fallbackOsc2.start(time);
  }

  private stopProceduralFallback() {
    if (this.fallbackGain && this.ctx) {
      const time = this.ctx.currentTime;
      try {
        this.fallbackGain.gain.cancelScheduledValues(time);
        this.fallbackGain.gain.setTargetAtTime(0.0001, time, 0.05);
      } catch {
        // Ignore
      }
      const osc1 = this.fallbackOsc1;
      const osc2 = this.fallbackOsc2;
      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          osc1?.disconnect();
          osc2?.disconnect();
        } catch {
          // Ignore
        }
      }, 70);
      this.fallbackOsc1 = null;
      this.fallbackOsc2 = null;
      this.fallbackGain = null;
    }
  }

  /**
   * Starts the player car engine sound using the custom recording.
   * Sets up a continuous, artifact-free loop with dynamic filters and gain stages.
   */
  public startRealEngine(_carId?: string) {
    this.isEngineRunning = true;
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx || !this.engineGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // If buffer is not ready yet, run procedural fallback and trigger load
    if (!this.engineBuffer) {
      this.startProceduralFallback();
      if (!this.isEngineLoading) {
        this.loadEngineAudio();
      }
      return;
    }

    // Clean up fallback if active
    this.stopProceduralFallback();

    // Stop existing source if already running
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

    // Dynamic Lowpass Filter: allows full mechanical roar while controlling brightness
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(4500, time);
    this.engineFilter.Q.setValueAtTime(1.0, time);

    // Bass Boost Filter: adds heavy low-end visceral power
    this.engineBassBoost = this.ctx.createBiquadFilter();
    this.engineBassBoost.type = 'lowshelf';
    this.engineBassBoost.frequency.setValueAtTime(110, time);
    this.engineBassBoost.gain.setValueAtTime(4.2, time);

    // Dynamic Gain stage (starts at clear, audible level)
    this.engineGainNode = this.ctx.createGain();
    this.engineGainNode.gain.setValueAtTime(0.55, time);

    // Initial pitch rate at idle
    this.engineSource.playbackRate.setValueAtTime(0.65, time);

    // Audio Graph: Source -> Filter -> BassBoost -> GainNode -> EngineBus -> Master -> Destination
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
    if (!this.ctx) return;

    // If engine was requested to run but source hasn't started yet (e.g. buffer just finished loading)
    if (this.isEngineRunning && !this.engineSource && this.engineBuffer) {
      this.startRealEngine();
    }

    // Update procedural fallback if active
    if (this.fallbackOsc1 && this.fallbackOsc2 && this.fallbackGain) {
      const now = this.ctx.currentTime;
      const baseFreq = 50 + rpmNormalized * 120 + throttle * 40;
      try {
        this.fallbackOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
        this.fallbackOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.05);
      } catch {
        // Ignore
      }
    }

    if (!this.engineSource || !this.engineGainNode || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    const clampedRpm = Math.max(0, Math.min(1.0, rpmNormalized));

    // Dynamic Pitch / Playback Rate:
    // Low aggressive idle rumble (~0.65x rate), climbs smoothly to ~1.45x at high RPM
    let targetRate = 0.65 + clampedRpm * 0.75;
    if (isShifting) {
      targetRate *= 0.84;
    }
    targetRate = Math.max(0.52, Math.min(1.68, targetRate));

    try {
      this.engineSource.playbackRate.cancelScheduledValues(now);
      this.engineSource.playbackRate.setTargetAtTime(targetRate, now, 0.06);
    } catch {
      this.engineSource.playbackRate.value = targetRate;
    }

    // Dynamic Filter Cutoff:
    // Warm rumble at idle (4200 Hz), open screaming induction under throttle (up to 20 kHz)
    const targetCutoff = 3800 + clampedRpm * 11000 + throttle * 5200;
    try {
      this.engineFilter.frequency.cancelScheduledValues(now);
      this.engineFilter.frequency.setTargetAtTime(Math.max(1200, Math.min(21000, targetCutoff)), now, 0.06);
    } catch {
      this.engineFilter.frequency.value = targetCutoff;
    }

    // Dynamic Loudness:
    // Clear presence at idle, expands aggressively with throttle
    let targetGain = 0.48 + throttle * 0.38 + clampedRpm * 0.14;
    if (brake > 0.1) {
      targetGain *= 0.76;
    }
    if (isShifting) {
      targetGain *= 0.65;
    }
    targetGain = Math.max(0.25, Math.min(1.0, targetGain));

    try {
      this.engineGainNode.gain.cancelScheduledValues(now);
      this.engineGainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    } catch {
      this.engineGainNode.gain.value = targetGain;
    }
  }

  /**
   * Exhaust crackle / backfire pop on high-RPM upshifts.
   */
  public playGearShiftPop(gear: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const time = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.014));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100 + gear * 150, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.setTargetAtTime(0.001, time + 0.01, 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.09);
  }

  /**
   * Momentary throttle rev-match blip on downshifts.
   */
  public playDownshiftBlip(_gear: number) {
    if (!this.ctx || !this.engineSource) return;
    const time = this.ctx.currentTime;
    try {
      const currentRate = this.engineSource.playbackRate.value;
      this.engineSource.playbackRate.cancelScheduledValues(time);
      this.engineSource.playbackRate.setValueAtTime(currentRate + 0.18, time);
      this.engineSource.playbackRate.setTargetAtTime(currentRate, time + 0.04, 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Stops the engine sound smoothly with no click or abrupt cutoff.
   */
  public stopEngine() {
    this.isEngineRunning = false;
    this.stopProceduralFallback();

    if (!this.ctx) return;

    if (this.engineGainNode) {
      const time = this.ctx.currentTime;
      try {
        this.engineGainNode.gain.cancelScheduledValues(time);
        this.engineGainNode.gain.setTargetAtTime(0.0001, time, 0.04);
      } catch {
        this.engineGainNode.gain.value = 0;
      }
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
    this.init();
    this.resume();

    if (!this.ctx || this.isMuted) return;
    const buf = this.fullEngineBuffer || this.engineBuffer;
    if (!buf) {
      // If buffer not decoded yet, preload and try
      this.loadEngineAudio();
      return;
    }

    try {
      const time = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(6000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, time);
      gain.gain.setTargetAtTime(0.001, time + 1.6, 0.2);

      src.playbackRate.setValueAtTime(0.7, time);
      src.playbackRate.setTargetAtTime(1.35, time + 0.1, 0.4);
      src.playbackRate.setTargetAtTime(0.8, time + 1.1, 0.3);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      src.start(time, 1.2);
      src.stop(time + 2.0);
    } catch (err) {
      console.warn('Engine rev preview error:', err);
    }
  }

  public setEngineVolume(val: number) {
    this.engineVolume = Math.max(0, Math.min(1, val));
    if (this.engineGain && this.ctx) {
      const time = this.ctx.currentTime;
      const target = this.isMuted ? 0 : this.engineVolume;
      try {
        this.engineGain.gain.cancelScheduledValues(time);
        this.engineGain.gain.setValueAtTime(target, time);
      } catch {
        this.engineGain.gain.value = target;
      }
    }
  }

  public getEngineVolume(): number {
    return this.engineVolume;
  }

  public playNearMiss() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, time);
    osc.frequency.setTargetAtTime(1500, time, 0.05);
    osc.frequency.setTargetAtTime(450, time + 0.1, 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.setTargetAtTime(0.001, time + 0.05, 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  public playTrafficPass(pan: number = 0) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, time);
    osc.frequency.setTargetAtTime(140, time, 0.12);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.setTargetAtTime(0.001, time + 0.1, 0.1);

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
    osc.stop(time + 0.38);
  }

  public playNitro() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.setTargetAtTime(3400, time, 0.1);
    filter.Q.setValueAtTime(4.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.setTargetAtTime(0.001, time + 0.1, 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.42);
  }

  public playCrash() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const sub = this.ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(130, time);
    sub.frequency.setTargetAtTime(30, time, 0.15);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.75, time);
    subGain.gain.setTargetAtTime(0.001, time + 0.1, 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, time);
    noiseGain.gain.setTargetAtTime(0.001, time + 0.1, 0.2);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(time);
    sub.start(time);
    noise.stop(time + 0.72);
    sub.stop(time + 0.65);
  }

  public playClick() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, time);
    osc.frequency.setTargetAtTime(1450, time, 0.015);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.setTargetAtTime(0.001, time + 0.01, 0.015);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  public startCyberpunkMusic() {
    this.init();
    this.resume();
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    const bassFreqs = [73.42, 73.42, 87.31, 73.42, 98.00, 73.42, 110.00, 98.00];
    const arpHarmonics = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66, 220.0];
    const stepDuration = 120; // ms (~128 BPM)

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
        bassFilter.frequency.setValueAtTime(500, t);
        bassFilter.frequency.setTargetAtTime(130, t, 0.05);

        bGain.gain.setValueAtTime(0.24, t);
        bGain.gain.setTargetAtTime(0.001, t + 0.05, 0.05);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bGain);
        bGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.20);
      }

      // Arpeggio synth on 16th notes
      if (step % 2 === 1 || step % 4 === 0) {
        const arpNote = arpHarmonics[step % arpHarmonics.length];
        const arpOsc = this.ctx.createOscillator();
        const aGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpNote, t);

        aGain.gain.setValueAtTime(0.1, t);
        aGain.gain.setTargetAtTime(0.001, t + 0.03, 0.04);

        arpOsc.connect(aGain);
        aGain.connect(this.musicGain);

        arpOsc.start(t);
        arpOsc.stop(t + 0.13);
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
    this.init();
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const time = this.ctx.currentTime;
      const target = this.isMuted ? 0 : 0.95;
      try {
        this.masterGain.gain.cancelScheduledValues(time);
        this.masterGain.gain.setValueAtTime(target, time);
      } catch {
        this.masterGain.gain.value = target;
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const time = this.ctx.currentTime;
      const target = this.isMuted ? 0 : Math.max(0, Math.min(1, val));
      try {
        this.masterGain.gain.cancelScheduledValues(time);
        this.masterGain.gain.setValueAtTime(target, time);
      } catch {
        this.masterGain.gain.value = target;
      }
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
