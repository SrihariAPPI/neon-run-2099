import * as THREE from 'three';

/**
 * High-performance GPU particle system for speed streaks, crash sparks, and nitro flames
 */

export class ParticleSystem {
  private scene: THREE.Scene;

  // Speed lines
  private speedLinesMesh: THREE.LineSegments;
  private speedLinesGeo: THREE.BufferGeometry;
  private linePositions: Float32Array;
  private numLines = 60;

  // Sparks
  private sparksMesh: THREE.Points;
  private sparksGeo: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  private sparkLifetimes: Float32Array;
  private numSparks = 100;
  private areSparksActive = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Speed Lines
    this.speedLinesGeo = new THREE.BufferGeometry();
    this.linePositions = new Float32Array(this.numLines * 2 * 3);
    for (let i = 0; i < this.numLines; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * 16;
      const y = 0.5 + Math.random() * 3.5;
      const z = -Math.random() * 80;
      const length = 4 + Math.random() * 8;

      this.linePositions[idx] = x;
      this.linePositions[idx + 1] = y;
      this.linePositions[idx + 2] = z;

      this.linePositions[idx + 3] = x;
      this.linePositions[idx + 4] = y;
      this.linePositions[idx + 5] = z - length;
    }
    this.speedLinesGeo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0,
    });
    this.speedLinesMesh = new THREE.LineSegments(this.speedLinesGeo, linesMat);
    scene.add(this.speedLinesMesh);

    // 2. Crash Sparks
    this.sparksGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.numSparks * 3);
    this.sparkVelocities = new Float32Array(this.numSparks * 3);
    this.sparkLifetimes = new Float32Array(this.numSparks);

    for (let i = 0; i < this.numSparks; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = -100; // hide initially
      this.sparkPositions[i * 3 + 2] = 0;
      this.sparkLifetimes[i] = 0;
    }
    this.sparksGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    const sparksMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    this.sparksMesh = new THREE.Points(this.sparksGeo, sparksMat);
    scene.add(this.sparksMesh);
  }

  public triggerCrashSparks(origin: THREE.Vector3) {
    this.areSparksActive = true;
    for (let i = 0; i < this.numSparks; i++) {
      const idx = i * 3;
      this.sparkPositions[idx] = origin.x + (Math.random() - 0.5) * 0.5;
      this.sparkPositions[idx + 1] = origin.y + 0.5 + Math.random() * 0.5;
      this.sparkPositions[idx + 2] = origin.z + (Math.random() - 0.5) * 0.5;

      this.sparkVelocities[idx] = (Math.random() - 0.5) * 24;
      this.sparkVelocities[idx + 1] = 6 + Math.random() * 18;
      this.sparkVelocities[idx + 2] = (Math.random() - 0.5) * 24;

      this.sparkLifetimes[i] = 0.8 + Math.random() * 0.6;
    }
    this.sparksGeo.attributes.position.needsUpdate = true;
  }

  public update(delta: number, playerX: number, playerZ: number, speedKmH: number, isNitro: boolean) {
    // Speed lines opacity and positions
    const mat = this.speedLinesMesh.material as THREE.LineBasicMaterial;
    if (speedKmH > 140 || isNitro) {
      const targetOpacity = isNitro ? 0.75 : Math.min(0.55, (speedKmH - 140) / 120);
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);

      this.speedLinesMesh.position.set(playerX, 0, playerZ);

      // Scroll lines
      const pos = this.speedLinesGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < this.numLines; i++) {
        const idx = i * 6;
        pos[idx + 2] += (speedKmH * 0.3) * delta;
        pos[idx + 5] += (speedKmH * 0.3) * delta;

        if (pos[idx + 2] > 10) {
          pos[idx + 2] -= 80;
          pos[idx + 5] -= 80;
        }
      }
      this.speedLinesGeo.attributes.position.needsUpdate = true;
    } else {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.2);
    }

    // Sparks update
    if (this.areSparksActive) {
      let anyAlive = false;
      const pos = this.sparksGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < this.numSparks; i++) {
        if (this.sparkLifetimes[i] > 0) {
          anyAlive = true;
          this.sparkLifetimes[i] -= delta;

          const idx = i * 3;
          this.sparkVelocities[idx + 1] -= 28 * delta; // gravity
          pos[idx] += this.sparkVelocities[idx] * delta;
          pos[idx + 1] += this.sparkVelocities[idx + 1] * delta;
          pos[idx + 2] += this.sparkVelocities[idx + 2] * delta;

          // Bounce off floor
          if (pos[idx + 1] < 0.05) {
            pos[idx + 1] = 0.05;
            this.sparkVelocities[idx + 1] *= -0.4;
          }
        }
      }
      this.sparksGeo.attributes.position.needsUpdate = true;
      if (!anyAlive) {
        this.areSparksActive = false;
      }
    }
  }

  public reset() {
    this.areSparksActive = false;
    const pos = this.sparksGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < this.numSparks; i++) {
      pos[i * 3 + 1] = -100;
    }
    this.sparksGeo.attributes.position.needsUpdate = true;
  }
}
