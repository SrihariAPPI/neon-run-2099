import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HighwayManager, ROAD_BOUNDARY_X } from './highway';
import { TrafficManager } from './traffic';
import { ParticleSystem } from './particles';
import { buildPlayerCar, PlayerCarMesh } from './models';
import { CameraView, CarSpec, GameMode, RunData } from '../types/game';
import { soundManager } from './audio';
import { CockpitPostProcessor } from './cockpitEffects';

// Reusable math vectors to ensure zero GC stutter during 60+ FPS loop
const _vec3Target = new THREE.Vector3();
const _vec3Look = new THREE.Vector3();

export interface EngineCallbacks {
  onRunUpdate: (data: RunData) => void;
  onNearMiss: (points: number, text: string) => void;
  onOvertake: () => void;
  onCrash: (finalRun: RunData) => void;
}

export const GEAR_MAX_SPEEDS = [56, 98, 148, 202, 260, 360];
export const GEAR_MIN_SPEEDS = [0, 42, 80, 125, 175, 230];

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private isSoftwareGl = false;
  private postProcessor: CockpitPostProcessor | null = null;

  // Cockpit Parallax & Head-Tracking State
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private targetPointerParallaxX = 0;
  private targetPointerParallaxY = 0;

  // Systems
  private highway: HighwayManager;
  private traffic: TrafficManager;
  private particles: ParticleSystem;

  // Player state
  private playerCar: PlayerCarMesh | null = null;
  private currentSpec: CarSpec;
  private customPaint?: string;
  private customUnderglow?: string;

  // Driving physics variables
  private playerX = 0;
  private playerZ = 0;
  private playerSpeed = 0; // in m/s (1 m/s = 3.6 km/h)
  private playerLateralVelocity = 0;
  private steerInput = 0; // -1 to 1
  private throttleInput = 0; // 0 to 1
  private brakeInput = 0; // 0 to 1
  private isNitroPressed = false;
  private nitroTank = 1.0;

  // Transmission & RPM Simulation
  private currentGear = 1;
  private currentRpm = 950; // Idle RPM
  private isShifting = false;
  private shiftTimer = 0;

  // Run statistics
  private distanceTraveled = 0; // meters
  private overtakesCount = 0;
  private nearMissesCount = 0;
  private score = 0;
  private maxSpeedReached = 0;

  // Mode & Camera
  private gameMode: GameMode = 'MENU';
  private cameraMode: CameraView = 'CHASE';
  private frameId = 0;
  private callbacks: EngineCallbacks;
  private isDestroyed = false;

  // Key tracking
  private keys: Record<string, boolean> = {};

  constructor(container: HTMLDivElement, initialSpec: CarSpec, callbacks: EngineCallbacks) {
    this.container = container;
    this.currentSpec = initialSpec;
    this.callbacks = callbacks;

    // 1. Detect software WebGL per Three.js Skill Directive
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 3. Scene and Midnight Cyberpunk Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030611);
    this.scene.fog = new THREE.FogExp2(0x030611, 0.0095);

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    this.camera.position.set(0, 3.5, 8);

    // 5. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting Rig
    this.setupLighting();

    // 7. Initialize Subsystems
    this.highway = new HighwayManager(this.scene, this.renderer);
    this.particles = new ParticleSystem(this.scene);
    this.traffic = new TrafficManager(this.scene, {
      onNearMiss: (pts, text) => {
        this.nearMissesCount++;
        this.score += pts;
        this.callbacks.onNearMiss(pts, text);
      },
      onOvertake: () => {
        this.overtakesCount++;
        this.score += 50;
        this.callbacks.onOvertake();
      },
      onCollision: (trafficPos) => {
        this.handleCrash(trafficPos);
      },
    });

    // 8. Spawn Player Car
    this.rebuildPlayerCar();

    // 9. Cockpit Depth-of-Field & Speed Tunnel Post-Processor
    if (!this.isSoftwareGl) {
      try {
        this.postProcessor = new CockpitPostProcessor(this.renderer, this.scene, this.camera);
      } catch (err) {
        console.warn('Post-processing fallback to direct render:', err);
      }
    }

    this.clock = new THREE.Clock();

    // 9. Input & Window Listeners
    this.bindInputs();
    window.addEventListener('resize', this.onResize);

    // 10. Start Loop
    this.tick = this.tick.bind(this);
    this.tick();
  }

  private setupLighting() {
    // Cool cyberpunk hemisphere light (skylight + ground light)
    const hemiLight = new THREE.HemisphereLight(0x06b6d4, 0x3b0764, 1.3);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Key directional light with warm cyan tint
    const dirLight = new THREE.DirectionalLight(0xe0f7ff, 2.0);
    dirLight.position.set(20, 45, 10);
    dirLight.castShadow = !this.isSoftwareGl;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);
  }

  public rebuildPlayerCar() {
    if (this.playerCar) {
      this.scene.remove(this.playerCar);
    }
    this.playerCar = buildPlayerCar(this.currentSpec, this.customPaint, this.customUnderglow);
    this.playerCar.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerCar);
  }

  public setCarSpec(spec: CarSpec, customPaint?: string, customUnderglow?: string) {
    this.currentSpec = spec;
    this.customPaint = customPaint;
    this.customUnderglow = customUnderglow;
    this.rebuildPlayerCar();
    if (this.gameMode === 'PLAYING') {
      soundManager.startRealEngine(this.currentSpec.id);
    }
  }

  public setCameraView(view: CameraView) {
    this.cameraMode = view;
  }

  public cycleCamera() {
    if (this.cameraMode === 'CHASE') this.cameraMode = 'COCKPIT';
    else if (this.cameraMode === 'COCKPIT') this.cameraMode = 'HOOD';
    else this.cameraMode = 'CHASE';
  }

  public setMode(mode: GameMode) {
    this.gameMode = mode;
    if (mode === 'PLAYING') {
      soundManager.init();
      soundManager.startRealEngine(this.currentSpec.id);
      soundManager.startCyberpunkMusic();
    } else {
      soundManager.stopEngine();
    }
  }

  public startRun() {
    this.playerX = 0;
    this.playerZ = 0;
    this.playerSpeed = 0;
    this.playerLateralVelocity = 0;
    this.distanceTraveled = 0;
    this.overtakesCount = 0;
    this.nearMissesCount = 0;
    this.score = 0;
    this.nitroTank = 1.0;
    this.maxSpeedReached = 0;

    // Reset Transmission & RPM
    this.currentGear = 1;
    this.currentRpm = 950;
    this.isShifting = false;
    this.shiftTimer = 0;

    this.highway.reset();
    this.particles.reset();
    this.traffic.init();

    if (this.playerCar) {
      this.playerCar.position.set(0, 0, 0);
      this.playerCar.rotation.set(0, 0, 0);
    }

    this.setMode('PLAYING');
  }

  private handleCrash(trafficPos: THREE.Vector3) {
    this.gameMode = 'GAMEOVER';
    soundManager.stopEngine();
    this.particles.triggerCrashSparks(trafficPos);

    // Immediate deceleration
    this.playerSpeed = Math.min(this.playerSpeed * 0.2, 5);

    const speedKmH = Math.round(this.playerSpeed * 3.6);
    this.callbacks.onCrash({
      speed: speedKmH,
      distance: Math.round(this.distanceTraveled),
      overtakes: this.overtakesCount,
      nearMisses: this.nearMissesCount,
      score: Math.round(this.score),
      nitroRemaining: this.nitroTank,
      isNitroActive: false,
      gear: this.currentGear,
      rpm: 0,
      actualRpm: 0,
      isShifting: false,
      maxSpeedReached: Math.round(this.maxSpeedReached),
    });
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'c' || e.key === 'C') {
        this.cycleCamera();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Subtle interactive pointer-based cabin glance parallax
    window.addEventListener('pointermove', this.onPointerMove);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.container || this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const normY = (e.clientY - rect.top) / Math.max(1, rect.height);
    this.targetPointerParallaxX = (normX - 0.5) * 0.12;
    this.targetPointerParallaxY = -(normY - 0.5) * 0.08;
  };

  public setVirtualInputs(steer: number, throttle: number, brake: number, nitro: boolean) {
    this.steerInput = steer;
    this.throttleInput = throttle;
    this.brakeInput = brake;
    this.isNitroPressed = nitro;
  }

  private updateInputs() {
    // Keyboard overrides virtual inputs if active
    let kbSteer = 0;
    let kbThrottle = 0;
    let kbBrake = 0;
    let kbNitro = false;

    if (this.keys['a'] || this.keys['arrowleft']) kbSteer -= 1;
    if (this.keys['d'] || this.keys['arrowright']) kbSteer += 1;
    if (this.keys['w'] || this.keys['arrowup']) kbThrottle = 1;
    if (this.keys['s'] || this.keys['arrowdown']) kbBrake = 1;
    if (this.keys[' ']) kbNitro = true;

    if (kbSteer !== 0 || kbThrottle !== 0 || kbBrake !== 0 || kbNitro) {
      this.steerInput = kbSteer;
      this.throttleInput = kbThrottle;
      this.brakeInput = kbBrake;
      this.isNitroPressed = kbNitro;
    }
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.postProcessor) {
      this.postProcessor.setSize(w, h);
    }
  };

  private tick() {
    if (this.isDestroyed) return;

    const delta = Math.min(this.clock.getDelta(), 0.08);

    if (this.gameMode === 'PLAYING') {
      this.updateSimulation(delta);
    } else if (this.gameMode === 'MENU' || this.gameMode === 'GARAGE') {
      this.updateShowroom(delta);
    }

    // Update Cockpit Depth-of-Field & Speed Tunnel Pass
    const speedNormalized = Math.min(1.0, (this.playerSpeed * 3.6) / this.currentSpec.topSpeed);
    if (this.postProcessor) {
      this.postProcessor.update(
        this.cameraMode === 'COCKPIT' && this.gameMode === 'PLAYING',
        speedNormalized,
        delta
      );
    }

    if (this.postProcessor && !this.isSoftwareGl) {
      this.postProcessor.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.frameId = requestAnimationFrame(this.tick);
  }

  private updateShowroom(delta: number) {
    if (!this.playerCar) return;

    // Slow cinematic turntable spin
    this.playerCar.position.set(0, 0, 0);
    this.playerCar.rotation.y += 0.5 * delta;

    this.camera.position.set(0, 2.2, 5.5);
    this.camera.lookAt(0, 0.7, 0);
  }

  private updateSimulation(delta: number) {
    this.updateInputs();

    const spec = this.currentSpec;
    const maxSpeedMs = (spec.topSpeed / 3.6);
    const nitroBoostMs = 15; // +54 km/h during nitro
    const isNitroActive = this.isNitroPressed && this.nitroTank > 0.05;

    // Nitro consumption
    if (isNitroActive) {
      this.nitroTank = Math.max(0, this.nitroTank - delta * 0.25);
      if (Math.random() < 0.15) soundManager.playNitro();
    } else {
      // Slow passive recharge over time
      this.nitroTank = Math.min(1.0, this.nitroTank + delta * 0.04);
    }

    const effectiveMaxSpeed = isNitroActive ? maxSpeedMs + nitroBoostMs : maxSpeedMs;

    // Acceleration & Braking physics
    if (this.throttleInput > 0) {
      const accelRate = 18 * spec.acceleration * (isNitroActive ? 2.2 : 1.0);
      this.playerSpeed += accelRate * this.throttleInput * delta;
      if (this.playerSpeed > effectiveMaxSpeed) {
        this.playerSpeed = effectiveMaxSpeed;
      }
    } else {
      // Natural aerodynamic drag & coasting resistance
      this.playerSpeed = Math.max(0, this.playerSpeed - 7.5 * delta);
    }

    if (this.brakeInput > 0) {
      this.playerSpeed = Math.max(0, this.playerSpeed - 32 * this.brakeInput * delta);
    }

    const currentSpeedKmH = this.playerSpeed * 3.6;
    if (currentSpeedKmH > this.maxSpeedReached) {
      this.maxSpeedReached = currentSpeedKmH;
    }

    // Steering Physics
    // Lateral sensitivity scales gracefully with speed
    const steerSensitivity = Math.min(1.0, this.playerSpeed / 12) * (14.5 * spec.handling);
    this.playerLateralVelocity = THREE.MathUtils.lerp(
      this.playerLateralVelocity,
      this.steerInput * steerSensitivity,
      delta * 12
    );

    this.playerX += this.playerLateralVelocity * delta;

    // Road Boundary Clamping with bumper rebound
    if (this.playerX < -ROAD_BOUNDARY_X) {
      this.playerX = -ROAD_BOUNDARY_X;
      this.playerLateralVelocity *= -0.3;
      this.playerSpeed *= 0.95;
    } else if (this.playerX > ROAD_BOUNDARY_X) {
      this.playerX = ROAD_BOUNDARY_X;
      this.playerLateralVelocity *= -0.3;
      this.playerSpeed *= 0.95;
    }

    // Move player along highway (-Z axis)
    this.playerZ -= this.playerSpeed * delta;
    this.distanceTraveled += this.playerSpeed * delta;
    this.score += (this.playerSpeed * delta) * (isNitroActive ? 1.8 : 1.0);

    // Update car mesh transform & chassis dynamic lean
    if (this.playerCar) {
      // Subtle road flutter / suspension movement over road expansion joints
      const roadFlutter = Math.sin(this.distanceTraveled * 0.4) * 0.008 * Math.min(1, this.playerSpeed / 15);
      this.playerCar.position.set(this.playerX, roadFlutter, this.playerZ);

      // Chassis Roll (lean into corners with physical weight)
      const targetRoll = -this.steerInput * 0.08 * Math.min(1, this.playerSpeed / 25);
      // Chassis Pitch (nose dips on brake, rises on accel)
      const targetPitch = (this.brakeInput * -0.045) + (this.throttleInput * 0.03);
      const targetYaw = -this.steerInput * 0.08;

      this.playerCar.rotation.z = THREE.MathUtils.lerp(this.playerCar.rotation.z, targetRoll, delta * 12);
      this.playerCar.rotation.x = THREE.MathUtils.lerp(this.playerCar.rotation.x, targetPitch, delta * 10);
      this.playerCar.rotation.y = THREE.MathUtils.lerp(this.playerCar.rotation.y, targetYaw, delta * 14);

      // Spin wheels based on actual forward distance traveled
      const wheelRotation = (this.playerSpeed / 0.39) * delta;
      for (const w of this.playerCar.wheels) {
        w.rotation.x -= wheelRotation;
      }

      // Turn front wheels realistically with steering input!
      const targetSteerAngle = -this.steerInput * 0.42;
      for (const knuckle of this.playerCar.frontSteerKnuckles) {
        knuckle.rotation.y = THREE.MathUtils.lerp(knuckle.rotation.y, targetSteerAngle, delta * 14);
      }

      // Rotate interior steering wheel realistically in driver's hands!
      const targetWheelRotation = -this.steerInput * 1.55;
      this.playerCar.steeringWheel.rotation.z = THREE.MathUtils.lerp(
        this.playerCar.steeringWheel.rotation.z,
        targetWheelRotation,
        delta * 14
      );

      // Update Live Cockpit Digital Instrument Cluster Display
      this.playerCar.dashboardDisplay.draw(
        Math.round(currentSpeedKmH),
        Math.round(this.currentRpm),
        this.currentGear,
        this.nitroTank,
        this.isShifting
      );

      // Taillight dynamic brake flare
      const tl = this.playerCar.taillights[0];
      if (tl && tl.material) {
        const mat = tl.material as THREE.MeshBasicMaterial;
        mat.color.setHex(this.brakeInput > 0 ? 0xff0033 : 0x880018);
      }
    }

    // Highway recycling
    this.highway.update(this.playerZ);

    // Traffic updates & collisions
    this.traffic.update(delta, this.playerX, this.playerZ, currentSpeedKmH, this.gameMode === 'GAMEOVER');

    // Particle speed lines, tire smoke & sparks
    this.particles.update(delta, this.playerX, this.playerZ, currentSpeedKmH, isNitroActive, this.brakeInput > 0.35);

    // Gear shift timer handling
    if (this.shiftTimer > 0) {
      this.shiftTimer -= delta;
      if (this.shiftTimer <= 0) {
        this.isShifting = false;
      }
    }

    // Upshift check: when current speed exceeds gear top speed and gear < 6
    if (
      !this.isShifting &&
      this.currentGear < 6 &&
      currentSpeedKmH >= GEAR_MAX_SPEEDS[this.currentGear - 1] &&
      this.throttleInput > 0.1
    ) {
      this.currentGear++;
      this.isShifting = true;
      this.shiftTimer = 0.12;
      soundManager.playGearShiftPop(this.currentGear);
    }
    // Downshift check: when speed falls below gear minimum threshold and gear > 1
    else if (
      !this.isShifting &&
      this.currentGear > 1 &&
      currentSpeedKmH < GEAR_MIN_SPEEDS[this.currentGear - 1]
    ) {
      this.currentGear--;
      this.isShifting = true;
      this.shiftTimer = 0.1;
      soundManager.playDownshiftBlip(this.currentGear);
    }

    // Calculate dynamic physical RPM scaling
    const gearIdx = this.currentGear - 1;
    const minSpeed = GEAR_MIN_SPEEDS[gearIdx];
    const maxSpeed = GEAR_MAX_SPEEDS[gearIdx];
    const gearSpan = Math.max(1, maxSpeed - minSpeed);
    const gearProgress = Math.max(0, (currentSpeedKmH - minSpeed) / gearSpan);

    let targetRpm = 950;
    if (currentSpeedKmH < 3) {
      // Free revving on standing launch
      targetRpm = 950 + this.throttleInput * 4800;
    } else {
      // In-gear RPM climbs from base up to redline (8450 RPM)
      const baseRpm = this.currentGear === 1 ? 1100 : 3100;
      targetRpm = baseRpm + gearProgress * (8450 - baseRpm);
    }

    // During gear shift, RPM drops sharply to simulate clutch disengagement
    if (this.isShifting) {
      targetRpm = Math.max(2200, targetRpm * 0.62);
    }

    // Smooth RPM interpolation with physical engine inertia
    const rpmLerpRate = this.isShifting ? 25 : (this.throttleInput > 0 ? 16 : 8);
    this.currentRpm = THREE.MathUtils.lerp(this.currentRpm, targetRpm, delta * rpmLerpRate);

    const normalizedRpm = Math.min(1.0, Math.max(0.1, (this.currentRpm - 900) / (8500 - 900)));

    // Audio API engine update scaling dynamically with RPM, gear and throttle
    soundManager.updateEngine(
      currentSpeedKmH,
      this.currentGear,
      normalizedRpm,
      Math.round(this.currentRpm),
      this.throttleInput,
      this.brakeInput,
      this.isShifting
    );

    // Update Camera
    this.updateCamera(delta, isNitroActive);

    // Broadcast Run Stats to HUD with exact RPM and shift status
    this.callbacks.onRunUpdate({
      speed: Math.round(currentSpeedKmH),
      distance: Math.round(this.distanceTraveled),
      overtakes: this.overtakesCount,
      nearMisses: this.nearMissesCount,
      score: Math.round(this.score),
      nitroRemaining: this.nitroTank,
      isNitroActive,
      gear: this.currentGear,
      rpm: normalizedRpm,
      actualRpm: Math.round(this.currentRpm),
      isShifting: this.isShifting,
      maxSpeedReached: Math.round(this.maxSpeedReached),
    });
  }

  private updateCamera(delta: number, isNitroActive: boolean) {
    const speedKmH = this.playerSpeed * 3.6;

    if (this.cameraMode === 'CHASE') {
      // Dynamic elastic follow camera behind vehicle
      const speedOffset = (this.playerSpeed / 40);
      _vec3Target.set(
        this.playerX * 0.72,
        2.75 + speedOffset * 0.35,
        this.playerZ + 6.9 + speedOffset * 1.15
      );

      _vec3Look.set(
        this.playerX * 0.3,
        1.15,
        this.playerZ - 28
      );

      // High-speed camera micro-shake at > 170 km/h
      if (speedKmH > 170) {
        const shake = (speedKmH - 170) / 180 * 0.018;
        _vec3Target.x += (Math.random() - 0.5) * shake;
        _vec3Target.y += (Math.random() - 0.5) * shake;
      }

      this.camera.position.lerp(_vec3Target, delta * 10);
      this.camera.lookAt(_vec3Look);

      // Dynamic FOV widening for speed sensation
      const targetFov = 62 + (this.playerSpeed / 30) * 14 + (isNitroActive ? 8 : 0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 6);
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'COCKPIT') {
      // Driver's eye level inside driver bucket seat (-0.38, 1.02, 0.05)
      // 1. Dynamic Look-to-Apex Parallax (head leans and looks toward apex when cornering)
      const apexLeanX = -this.steerInput * 0.085;
      const lookApexX = -this.steerInput * 0.72;
      const apexRoll = -this.steerInput * 0.038;

      // 2. Kinetic G-Force Parallax
      const gForceZ = (this.throttleInput * 0.045) - (this.brakeInput * 0.075);
      const gForceY = (this.throttleInput * 0.015) - (this.brakeInput * 0.035);

      // 3. Subtle Interactive Look Parallax (smoothed)
      this.pointerParallaxX = THREE.MathUtils.lerp(this.pointerParallaxX, this.targetPointerParallaxX, delta * 8);
      this.pointerParallaxY = THREE.MathUtils.lerp(this.pointerParallaxY, this.targetPointerParallaxY, delta * 8);

      // 4. Speed & Road Vibration Parallax
      const vibScale = Math.max(0, (speedKmH - 120) / 180) * 0.007;
      const vibX = (Math.random() - 0.5) * vibScale;
      const vibY = (Math.random() - 0.5) * vibScale;

      // Set target eye position with full 3D cabin parallax
      _vec3Target.set(
        this.playerX - 0.38 + apexLeanX + this.pointerParallaxX + vibX,
        1.02 + gForceY + this.pointerParallaxY + vibY,
        this.playerZ + 0.05 + gForceZ
      );

      // Look straight ahead through windshield past steering wheel and over the hood
      _vec3Look.set(
        this.playerX - 0.38 + lookApexX + this.pointerParallaxX * 3.5,
        0.98 + this.pointerParallaxY * 2.5,
        this.playerZ - 35
      );

      this.camera.position.lerp(_vec3Target, delta * 22);
      this.camera.lookAt(_vec3Look);

      // Apply subtle dynamic apex roll to emphasize G-force in the cabin
      this.camera.rotation.z += apexRoll;

      // Dynamic Cockpit FOV Breathing with speed and nitro
      const targetFov = 73 + (this.playerSpeed / 35) * 8 + (isNitroActive ? 5 : 0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 8);
      this.camera.updateProjectionMatrix();

    } else {
      // HOOD CAMERA: Positioned just above the sculpted front hood
      _vec3Target.set(
        this.playerX,
        0.72,
        this.playerZ - 1.25
      );

      _vec3Look.set(
        this.playerX - this.steerInput * 0.45,
        0.70,
        this.playerZ - 40
      );

      this.camera.position.lerp(_vec3Target, delta * 22);
      this.camera.lookAt(_vec3Look);
      this.camera.fov = 80;
      this.camera.updateProjectionMatrix();
    }
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.postProcessor?.dispose();
    soundManager.destroy();
    this.highway.reset();
    this.traffic.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
