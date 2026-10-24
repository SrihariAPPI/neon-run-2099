import * as THREE from 'three';
import {
  createWetAsphaltTexture,
  createLaneDividerTexture,
  createHologramSignTexture,
  createBarrierChevronTexture,
  createCarbonFiberTexture,
} from './textures';

/**
 * AAA Realistic Endless Cyberpunk Highway & Megacity Scenery
 * Features wet asphalt, embedded 3D cat-eye reflectors, concrete jersey barriers
 * with hazard chevrons, drainage curbs, highway support pillars, multi-tier overpasses,
 * and towering skyscrapers with animated beacon lights.
 */

export const LANE_WIDTH = 3.8;
export const LANE_CENTERS = [-5.7, -1.9, 1.9, 5.7];
export const ROAD_WIDTH = 18.0;
export const ROAD_BOUNDARY_X = 7.4;
export const CHUNK_LENGTH = 120;
export const CHUNK_COUNT = 8;

export class HighwayManager {
  private chunks: THREE.Group[] = [];
  private roadMaterial: THREE.MeshStandardMaterial;
  private dividerMaterial: THREE.MeshBasicMaterial;
  private barrierConcreteMat: THREE.MeshStandardMaterial;
  private chevronMat: THREE.MeshStandardMaterial;
  private neonRailCyanMat: THREE.MeshBasicMaterial;
  private neonRailMagentaMat: THREE.MeshBasicMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private pillarMaterial: THREE.MeshStandardMaterial;
  private buildingMat: THREE.MeshStandardMaterial;
  private windowMatCyan: THREE.MeshBasicMaterial;
  private windowMatAmber: THREE.MeshBasicMaterial;
  private windowMatViolet: THREE.MeshBasicMaterial;
  private beaconLightMat: THREE.MeshBasicMaterial;
  private billboardMats: THREE.MeshBasicMaterial[] = [];

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    const asphaltTex = createWetAsphaltTexture(renderer);
    const dividerTex = createLaneDividerTexture(renderer);
    const chevronTex = createBarrierChevronTexture();
    const carbonTex = createCarbonFiberTexture();

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.16, // Wet rain-slick asphalt sheen
      metalness: 0.28,
    });

    this.dividerMaterial = new THREE.MeshBasicMaterial({
      map: dividerTex,
      transparent: true,
    });

    this.barrierConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.7,
      metalness: 0.35,
    });

    this.chevronMat = new THREE.MeshStandardMaterial({
      map: chevronTex,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.neonRailCyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
    });

    this.neonRailMagentaMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.85,
      metalness: 0.2,
    });

    this.buildingMat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.8,
      metalness: 0.6,
    });

    this.windowMatCyan = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    this.windowMatAmber = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    this.windowMatViolet = new THREE.MeshBasicMaterial({ color: 0x7c3aed });
    this.beaconLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Holographic billboard advertisements
    const ad1 = createHologramSignTexture('NEO TOKYO 2099', 'VANTA EXPRESSWAY — SECTOR 07', '#00f5ff');
    const ad2 = createHologramSignTexture('QUANTUM HYPERLANE', 'MAX VELOCITY 350 KM/H', '#f43f5e');
    const ad3 = createHologramSignTexture('ARASAKA ORBITAL', 'NEXT LEVEL AUTOMOTIVE AI', '#eab308');
    const ad4 = createHologramSignTexture('CYBERDINE DYNAMICS', 'AUTONOMOUS CORRIDOR ACTIVE', '#a855f7');

    this.billboardMats = [
      new THREE.MeshBasicMaterial({ map: ad1, transparent: true }),
      new THREE.MeshBasicMaterial({ map: ad2, transparent: true }),
      new THREE.MeshBasicMaterial({ map: ad3, transparent: true }),
      new THREE.MeshBasicMaterial({ map: ad4, transparent: true }),
    ];

    // Build the initial sequence of road chunks
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunk = this.createChunk(i);
      chunk.position.z = -i * CHUNK_LENGTH;
      scene.add(chunk);
      this.chunks.push(chunk);
    }
  }

  private createChunk(chunkIndex: number): THREE.Group {
    const chunk = new THREE.Group();

    // 1. Asphalt Road Bed
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -CHUNK_LENGTH / 2);
    chunk.add(road);

    // 2. Concrete Curbs & Drainage Gutters (Outer Left & Right)
    [-ROAD_WIDTH / 2 - 0.25, ROAD_WIDTH / 2 + 0.25].forEach(x => {
      const curbGeo = new THREE.BoxGeometry(0.5, 0.12, CHUNK_LENGTH);
      const curb = new THREE.Mesh(curbGeo, this.curbMaterial);
      curb.position.set(x, 0.06, -CHUNK_LENGTH / 2);
      chunk.add(curb);
    });

    // 3. Glowing Lane Dividers (3 divider lines for 4 highway lanes)
    const dividerOffsets = [-3.8, 0, 3.8];
    dividerOffsets.forEach(x => {
      const lineGeo = new THREE.PlaneGeometry(0.3, CHUNK_LENGTH);
      const line = new THREE.Mesh(lineGeo, this.dividerMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.015, -CHUNK_LENGTH / 2);
      chunk.add(line);

      // Embedded 3D Cat-Eye Reflectors every 15m
      for (let z = -7.5; z >= -CHUNK_LENGTH; z -= 15) {
        const catEyeGeo = new THREE.BoxGeometry(0.12, 0.03, 0.18);
        const catEye = new THREE.Mesh(catEyeGeo, this.neonRailCyanMat);
        catEye.position.set(x, 0.02, z);
        chunk.add(catEye);
      }
    });

    // 4. Concrete Barriers with Hazard Chevrons & Neon Light Rails
    [-ROAD_WIDTH / 2, ROAD_WIDTH / 2].forEach((x, idx) => {
      const isLeft = idx === 0;
      const barrierOffset = x + (isLeft ? 0.35 : -0.35);

      // Heavy Concrete Base Wall
      const wallGeo = new THREE.BoxGeometry(0.7, 1.15, CHUNK_LENGTH);
      const wall = new THREE.Mesh(wallGeo, this.barrierConcreteMat);
      wall.position.set(barrierOffset, 0.58, -CHUNK_LENGTH / 2);
      chunk.add(wall);

      // Hazard Warning Chevron Facing the Road
      const chevronGeo = new THREE.PlaneGeometry(CHUNK_LENGTH, 0.55);
      const chevron = new THREE.Mesh(chevronGeo, this.chevronMat);
      chevron.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      chevron.position.set(barrierOffset + (isLeft ? 0.36 : -0.36), 0.58, -CHUNK_LENGTH / 2);
      chunk.add(chevron);

      // Neon Guide Rail on Top (Cyan on left, Magenta on right)
      const railGeo = new THREE.BoxGeometry(0.18, 0.12, CHUNK_LENGTH);
      const rail = new THREE.Mesh(railGeo, isLeft ? this.neonRailCyanMat : this.neonRailMagentaMat);
      rail.position.set(barrierOffset, 1.22, -CHUNK_LENGTH / 2);
      chunk.add(rail);
    });

    // 5. Overhead Highway Gantries & Streetlights (every 40m)
    for (let z = -20; z >= -CHUNK_LENGTH; z -= 40) {
      const gantry = this.createHighwayGantry();
      gantry.position.set(0, 0, z);
      chunk.add(gantry);
    }

    // 6. Giant Overhead Hologram Billboard (on select chunks)
    if (chunkIndex % 2 === 1) {
      const adMat = this.billboardMats[chunkIndex % this.billboardMats.length];
      const billboardGeo = new THREE.PlaneGeometry(14, 4.8);
      const billboard = new THREE.Mesh(billboardGeo, adMat);
      billboard.position.set(0, 8.8, -CHUNK_LENGTH / 2);
      chunk.add(billboard);

      // Backing structural frame
      const frameGeo = new THREE.BoxGeometry(14.4, 5.2, 0.2);
      const frame = new THREE.Mesh(frameGeo, this.pillarMaterial);
      frame.position.set(0, 8.8, -CHUNK_LENGTH / 2 + 0.12);
      chunk.add(frame);
    }

    // 7. Highway Support Pillars Underneath
    for (let z = -30; z >= -CHUNK_LENGTH; z -= 60) {
      const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 25, 16);
      const pillar = new THREE.Mesh(pillarGeo, this.pillarMaterial);
      pillar.position.set(0, -12.5, z);
      chunk.add(pillar);
    }

    // 8. Distant Cyberpunk Skyline & Layered Architecture
    this.addCyberpunkCityscape(chunk, chunkIndex);

    return chunk;
  }

  private createHighwayGantry(): THREE.Group {
    const gantry = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.85, roughness: 0.25 });

    // Left Vertical Structural Truss
    const colL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9.5, 0.55), frameMat);
    colL.position.set(-ROAD_WIDTH / 2 - 0.9, 4.75, 0);
    // Right Vertical Structural Truss
    const colR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9.5, 0.55), frameMat);
    colR.position.set(ROAD_WIDTH / 2 + 0.9, 4.75, 0);

    // Crossbeam Truss
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 2.6, 0.65, 0.65), frameMat);
    beam.position.set(0, 9.5, 0);

    // High-Intensity Downward Neon Road Luminaire
    const luminaire = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.1, 0.25), this.neonRailCyanMat);
    luminaire.position.set(0, 9.15, 0);

    gantry.add(colL, colR, beam, luminaire);
    return gantry;
  }

  private addCyberpunkCityscape(chunk: THREE.Group, chunkIndex: number) {
    // 3 Layers of depth on both sides of the elevated expressway:
    // Layer 1: Roadside commercial towers (24m - 32m out)
    // Layer 2: Mid-tier corporate spires (40m - 60m out)
    // Layer 3: Giant megatowers & distant skyline (70m - 120m out)

    const buildingConfigs = [
      // Left side buildings
      { x: -28, zOffset: -15, width: 16, height: 55, depth: 18, color: 'cyan' },
      { x: -45, zOffset: -50, width: 22, height: 85, depth: 24, color: 'violet' },
      { x: -80, zOffset: -85, width: 35, height: 140, depth: 35, color: 'amber' },
      { x: -32, zOffset: -95, width: 14, height: 60, depth: 16, color: 'cyan' },
      // Right side buildings
      { x: 28, zOffset: -25, width: 15, height: 50, depth: 18, color: 'violet' },
      { x: 48, zOffset: -65, width: 24, height: 95, depth: 26, color: 'cyan' },
      { x: 85, zOffset: -35, width: 38, height: 160, depth: 38, color: 'violet' },
      { x: 34, zOffset: -105, width: 16, height: 65, depth: 18, color: 'amber' },
    ];

    buildingConfigs.forEach((cfg, idx) => {
      const bldgGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
      const bldg = new THREE.Mesh(bldgGeo, this.buildingMat);
      bldg.position.set(cfg.x, cfg.height / 2 - 5, cfg.zOffset);
      chunk.add(bldg);

      // Illuminated Window Matrix
      const winMat =
        cfg.color === 'cyan'
          ? this.windowMatCyan
          : cfg.color === 'amber'
          ? this.windowMatAmber
          : this.windowMatViolet;

      const winPanelGeo = new THREE.BoxGeometry(cfg.width * 0.92, cfg.height * 0.72, 0.1);
      const winPanel = new THREE.Mesh(winPanelGeo, winMat);
      const zFace = cfg.x > 0 ? -cfg.depth / 2 - 0.05 : cfg.depth / 2 + 0.05;
      winPanel.position.set(cfg.x, cfg.height / 2, cfg.zOffset + zFace);
      chunk.add(winPanel);

      // Rooftop Telecommunication Spire & Aviation Beacon
      const spireHeight = 12 + (idx % 3) * 6;
      const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, spireHeight, 8);
      const spire = new THREE.Mesh(spireGeo, this.pillarMaterial);
      spire.position.set(cfg.x, cfg.height + spireHeight / 2 - 5, cfg.zOffset);
      chunk.add(spire);

      // Red Aviation Obstruction Light
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), this.beaconLightMat);
      beacon.position.set(cfg.x, cfg.height + spireHeight - 5, cfg.zOffset);
      chunk.add(beacon);
    });

    // Elevated Cross-Overpass in background on every 4th chunk
    if (chunkIndex % 4 === 2) {
      const overpassGroup = new THREE.Group();
      const overpassRoad = new THREE.Mesh(new THREE.BoxGeometry(180, 2.5, 14), this.buildingMat);
      overpassRoad.position.set(0, 22, -CHUNK_LENGTH / 2);

      const overpassRail = new THREE.Mesh(new THREE.BoxGeometry(180, 0.4, 0.4), this.neonRailCyanMat);
      overpassRail.position.set(0, 23.5, -CHUNK_LENGTH / 2 - 6.8);

      overpassGroup.add(overpassRoad, overpassRail);
      chunk.add(overpassGroup);
    }
  }

  public update(playerZ: number) {
    // Check if the farthest behind chunk needs to be recycled to the front
    for (const chunk of this.chunks) {
      if (chunk.position.z > playerZ + CHUNK_LENGTH) {
        let minZ = 0;
        for (const c of this.chunks) {
          if (c.position.z < minZ) {
            minZ = c.position.z;
          }
        }
        chunk.position.z = minZ - CHUNK_LENGTH;
      }
    }
  }

  public reset() {
    for (let i = 0; i < CHUNK_COUNT; i++) {
      this.chunks[i].position.z = -i * CHUNK_LENGTH;
    }
  }
}
