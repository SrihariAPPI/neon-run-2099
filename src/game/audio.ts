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
  private engineGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine Synthesis Nodes
  private engineCylinderOsc: OscillatorNode | null = null;
  private engineHarmonicOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineNoiseNode: AudioBufferSourceNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;

  // Turbocharger Nodes
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;

  // Music loop state
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private currentStep = 0;

  private isMuted = false;
  private initialized = false;

  // Rev limiter state
  private limiterActive = false;
  private limiterCounter = 0;

  // Previous throttle state to detect turbo blow-off release
  private prevThrottle = 0;
  private boostPressure = 0;

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
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // silent until run begins
      this.engineGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupTurboSynth();
      this.initialized = true;
    } catch {
      // Audio context might fail in restricted environments
    }
  }

  /**
   * Builds an analog-style saturation curve for realistic exhaust rasp
   */
  private makeDistortionCurve(amount = 20): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.engineGain) return;

    // 1. Primary cylinder firing pulse oscillator (Sawtooth)
    this.engineCylinderOsc = this.ctx.createOscillator();
    this.engineCylinderOsc.type = 'sawtooth';
    this.engineCylinderOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    // 2. Harmonic secondary oscillator (Triangle with subtle detuning)
    this.engineHarmonicOsc = this.ctx.createOscillator();
    this.engineHarmonicOsc.type = 'triangle';
    this.engineHarmonicOsc.frequency.setValueAtTime(90, this.ctx.currentTime);

    // 3. Sub-bass rumble oscillator (Sine)
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    // 4. Exhaust / intake air rumble noise generator
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.2;
    }
    this.engineNoiseNode = this.ctx.createBufferSource();
    this.engineNoiseNode.buffer = noiseBuffer;
    this.engineNoiseNode.loop = true;

    this.engineNoiseGain = this.ctx.createGain();
    this.engineNoiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // 5. Saturation distortion
    this.engineDistortion = this.ctx.createWaveShaper();
    this.engineDistortion.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;
    this.engineDistortion.oversample = '2x';

    // 6. Dynamic resonant lowpass filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Routing: Oscillators -> Distortion -> Dynamic Filter -> Engine Gain
    this.engineCylinderOsc.connect(this.engineDistortion);
    this.engineHarmonicOsc.connect(this.engineDistortion);
    this.engineSubOsc.connect(this.engineGain); // clean punchy sub bypasses distortion

    this.engineNoiseNode.connect(this.engineNoiseGain);
    this.engineNoiseGain.connect(this.engineDistortion);

    this.engineDistortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.engineCylinderOsc.start();
    this.engineHarmonicOsc.start();
    this.engineSubOsc.start();
    this.engineNoiseNode.start();
  }

  private setupTurboSynth() {
    if (!this.ctx || !this.engineGain) return;

    // High-pitched turbo turbine whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
    this.turboFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.turboOsc.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.engineGain);

    this.turboOsc.start();
  }

  /**
   * Updates the engine audio in real-time based on RPM, Gear, Throttle, and Brake.
   * Scales cylinder firing frequency, harmonic richness, intake filter sweep, and turbo whistle.
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
    if (
      !this.ctx ||
      !this.engineGain ||
      !this.engineCylinderOsc ||
      !this.engineHarmonicOsc ||
      !this.engineSubOsc ||
      !this.engineFilter ||
      !this.engineNoiseGain ||
      !this.turboGain ||
      !this.turboOsc
    ) {
      return;
    }

    const t = this.ctx.currentTime;

    // During gear shift (clutch disengaged / ignition cut), drop engine volume momentarily
    if (isShifting) {
      this.engineGain.gain.setTargetAtTime(0.08, t, 0.02);
      return;
    }

    // Cylinder firing frequency calculation:
    // A high-revving 6-cylinder engine fires 3 times per revolution:
    // Fundamental Hz = (RPM / 60) * 3
    // At 1000 RPM: 50 Hz. At 4000 RPM: 200 Hz. At 8500 RPM: 425 Hz.
    const cylinders = 6;
    const baseCylinderFreq = (actualRpm / 60) * (cylinders / 2);

    // Apply rev limiter bounce if hovering near redline (e.g. > 8400 RPM)
    let limiterAttenuation = 1.0;
    if (rpmNormalized >= 0.96 && throttle > 0.8) {
      this.limiterCounter++;
      // High-speed ignition cut flutter ("tut-tut-tut")
      if (this.limiterCounter % 4 < 2) {
        limiterAttenuation = 0.25;
      }
    }

    // Dynamic Filter Cutoff: Muffled low idle (280Hz) to screaming open throttle (3800Hz+)
    const targetFilterCutoff = Math.max(
      220,
      280 + (actualRpm / 8500) * 2600 + throttle * 950 - brake * 200
    );

    // Engine volume scales with throttle and RPM
    const targetGain = Math.min(
      0.55,
      (0.12 + (actualRpm / 8500) * 0.28 + throttle * 0.14) * limiterAttenuation
    );

    // Turbo boost builds with throttle and RPM
    if (throttle > 0.4 && actualRpm > 3200) {
      this.boostPressure = Math.min(1.0, this.boostPressure + 0.04);
    } else {
      // If throttle dropped abruptly while under boost, trigger blow-off valve
      if (this.prevThrottle > 0.6 && throttle < 0.2 && this.boostPressure > 0.4) {
        this.playTurboBlowOff(this.boostPressure);
      }
      this.boostPressure = Math.max(0, this.boostPressure - 0.06);
    }
    this.prevThrottle = throttle;

    // Smooth Web Audio parameter transitions via setTargetAtTime
    this.engineCylinderOsc.frequency.setTargetAtTime(baseCylinderFreq, t, 0.03);
    this.engineHarmonicOsc.frequency.setTargetAtTime(baseCylinderFreq * 1.5, t, 0.03);
    this.engineSubOsc.frequency.setTargetAtTime(baseCylinderFreq * 0.5, t, 0.03);
    this.engineFilter.frequency.setTargetAtTime(targetFilterCutoff, t, 0.04);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.03);

    // Air noise intake increases with throttle
    this.engineNoiseGain.gain.setTargetAtTime(0.02 + throttle * 0.06, t, 0.05);

    // Turbocharger whistle pitch and volume
    const turboFreq = 1600 + this.boostPressure * 3800 + (actualRpm / 8500) * 1200;
    const turboVol = this.boostPressure * 0.09 * (this.isMuted ? 0 : 1);
    this.turboOsc.frequency.setTargetAtTime(turboFreq, t, 0.05);
    this.turboGain.gain.setTargetAtTime(turboVol, t, 0.05);
  }

  /**
   * Triggers an authentic exhaust gear shift "pop" / DSG crackle on upshift.
   */
  public playGearShiftPop(gear: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. Sharp exhaust explosion pop (noise transient)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const popFilter = this.ctx.createBiquadFilter();
    popFilter.type = 'lowpass';
    popFilter.frequency.setValueAtTime(800 + gear * 150, t);
    popFilter.frequency.exponentialRampToValueAtTime(180, t + 0.1);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.42, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(this.sfxGain);

    // 2. Low-frequency exhaust cylinder thud
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(t);
    subOsc.start(t);
    noise.stop(t + 0.12);
    subOsc.stop(t + 0.15);
  }

  /**
   * Triggers an aggressive throttle rev-match blip sound on downshift.
   */
  public playDownshiftBlip(gear: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110 + gear * 30, t);
    osc.frequency.exponentialRampToValueAtTime(260 + gear * 40, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(130 + gear * 20, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Triggers realistic pneumatic turbo blow-off flutter release ("pshhhh-tut-tut").
   */
  private playTurboBlowOff(boostIntensity: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const duration = 0.25;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.exp(-i / (this.ctx.sampleRate * 0.08));
      // Multi-frequency flutter modulation
      const flutter = 1.0 + 0.3 * Math.sin((i / this.ctx.sampleRate) * Math.PI * 32);
      data[i] = (Math.random() * 2 - 1) * envelope * flutter;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + duration);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2 * boostIntensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration + 0.02);
  }

  public stopEngine() {
    if (!this.ctx || !this.engineGain) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
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
