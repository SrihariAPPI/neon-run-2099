import * as THREE from 'three';
import { buildTrafficVehicle, TrafficMesh, TrafficType } from './models';
import { LANE_CENTERS } from './highway';
import { soundManager } from './audio';

export interface TrafficCallbacks {
  onNearMiss: (points: number, text: string) => void;
  onOvertake: () => void;
  onCollision: (trafficPos: THREE.Vector3) => void;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private vehicles: TrafficMesh[] = [];
  private callbacks: TrafficCallbacks;
  private maxVehicles = 14;

  constructor(scene: THREE.Scene, callbacks: TrafficCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public init() {
    this.clear();
    // Pre-populate traffic vehicles ahead of player
    for (let i = 0; i < this.maxVehicles; i++) {
      this.spawnInitialVehicle(i);
    }
  }

  private getRandomType(): TrafficType {
    const r = Math.random();
    if (r < 0.4) return 'sedan';
    if (r < 0.65) return 'pod';
    if (r < 0.85) return 'taxi';
    return 'hauler';
  }

  private spawnInitialVehicle(index: number) {
    const type = this.getRandomType();
    const mesh = buildTrafficVehicle(type);

    const laneIndex = Math.floor(Math.random() * LANE_CENTERS.length);
    mesh.lane = laneIndex;
    mesh.position.x = LANE_CENTERS[laneIndex];
    mesh.position.y = 0;
    // Initial spawn spaced 60m to 350m ahead
    mesh.position.z = -60 - (index * 22) - Math.random() * 15;

    // Traffic travels forward (-Z) at roughly 55 - 95 km/h (15 - 26 m/s)
    mesh.speed = 15 + Math.random() * 11;

    this.scene.add(mesh);
    this.vehicles.push(mesh);
  }

  private respawnVehicle(mesh: TrafficMesh, playerZ: number) {
    // Pick lane with safest forward clearance
    let bestLane = Math.floor(Math.random() * LANE_CENTERS.length);
    const targetZ = playerZ - (140 + Math.random() * 120);

    mesh.position.x = LANE_CENTERS[bestLane];
    mesh.lane = bestLane;
    mesh.position.z = targetZ;
    mesh.speed = 16 + Math.random() * 10;
    mesh.passedPlayer = false;
    mesh.nearMissChecked = false;
  }

  public update(delta: number, playerX: number, playerZ: number, playerSpeedKmH: number, isGameOver: boolean) {
    const playerHalfWidth = 0.95;
    const playerHalfLength = 2.15;

    for (const v of this.vehicles) {
      if (!isGameOver) {
        // Move traffic forward along negative Z
        v.position.z -= v.speed * delta;

        // Spin wheels
        const wheelRotSpeed = (v.speed / 0.38) * delta;
        for (const w of v.wheels) {
          w.rotation.x -= wheelRotSpeed;
        }
      }

      // Check for overtake
      if (!v.passedPlayer && v.position.z > playerZ + 2.0) {
        v.passedPlayer = true;
        this.callbacks.onOvertake();
        // Play subtle doppler pass sound if close enough
        const lateralDist = Math.abs(v.position.x - playerX);
        if (lateralDist < 8) {
          const pan = (v.position.x - playerX) / 8;
          soundManager.playTrafficPass(pan);
        }
      }

      // Check for near miss (within 2.1m laterally, player going fast >= 90 km/h, just passing)
      if (
        !v.nearMissChecked &&
        !isGameOver &&
        playerSpeedKmH >= 90 &&
        Math.abs(v.position.z - playerZ) < 2.5 &&
        Math.abs(v.position.x - playerX) < 2.3 &&
        Math.abs(v.position.x - playerX) > 1.2
      ) {
        v.nearMissChecked = true;
        soundManager.playNearMiss();
        const bonus = Math.round(playerSpeedKmH > 200 ? 250 : 150);
        this.callbacks.onNearMiss(bonus, `NEAR MISS +${bonus} CR`);
      }

      // Check for collision with player
      if (!isGameOver) {
        const dx = Math.abs(v.position.x - playerX);
        const dz = Math.abs(v.position.z - playerZ);

        // Traffic dimensions based on vehicle type
        let trafficHalfWidth = 0.95;
        let trafficHalfLength = 2.1;
        if (v.vehicleType === 'hauler') {
          trafficHalfWidth = 1.25;
          trafficHalfLength = 3.8;
        } else if (v.vehicleType === 'pod') {
          trafficHalfWidth = 1.1;
          trafficHalfLength = 1.1;
        }

        if (dx < playerHalfWidth + trafficHalfWidth - 0.25 && dz < playerHalfLength + trafficHalfLength - 0.3) {
          soundManager.playCrash();
          this.callbacks.onCollision(v.position);
          return;
        }
      }

      // Recycle vehicle when it falls 45m behind player
      if (v.position.z > playerZ + 45) {
        this.respawnVehicle(v, playerZ);
      }
    }
  }

  public clear() {
    for (const v of this.vehicles) {
      this.scene.remove(v);
    }
    this.vehicles = [];
  }
}
