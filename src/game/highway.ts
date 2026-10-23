import * as THREE from 'three';
import { createWetAsphaltTexture, createLaneDividerTexture, createHologramSignTexture } from './textures';

/**
 * Reusable Endless Highway Chunks with Cyberpunk Megacity Scenery
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
  private barrierMaterial: THREE.MeshStandardMaterial;
  private neonRailMaterial: THREE.MeshBasicMaterial;
  private buildingMaterial: THREE.MeshStandardMaterial;
  private windowMaterial: THREE.MeshBasicMaterial;
  private billboardMats: THREE.MeshBasicMaterial[] = [];

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    const asphaltTex = createWetAsphaltTexture(renderer);
    const dividerTex = createLaneDividerTexture(renderer);

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.15, // wet rain-slick asphalt sheen
      metalness: 0.25,
    });

    this.dividerMaterial = new THREE.MeshBasicMaterial({
      map: dividerTex,
      transparent: true,
    });

    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4,
    });

    this.neonRailMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
    });

    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.7,
      metalness: 0.8,
    });

    this.windowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
    });

    // Hologram billboards
    const ad1 = createHologramSignTexture('NEO TOKYO 2099', 'VANTA EXPRESSWAY', '#00f5ff');
    const ad2 = createHologramSignTexture('QUANTUM DRIVE', 'ZERO EMISSION HYPERLANE', '#f43f5e');
    const ad3 = createHologramSignTexture('CYBERDINE SYS', 'AI TRAFFIC NETWORK ACTIVE', '#eab308');
    const ad4 = createHologramSignTexture('ARASAKA TOWER', 'NEXT EXIT 2.4 KM', '#a855f7');
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

    // 2. Glowing Lane Dividers (3 dividing lines for 4 lanes)
    const dividerOffsets = [-3.8, 0, 3.8];
    dividerOffsets.forEach(x => {
      const lineGeo = new THREE.PlaneGeometry(0.3, CHUNK_LENGTH);
      const line = new THREE.Mesh(lineGeo, this.dividerMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, -CHUNK_LENGTH / 2);
      chunk.add(line);
    });

    // 3. Concrete Barriers & Neon Rails on left and right
    [-ROAD_WIDTH / 2, ROAD_WIDTH / 2].forEach((x, idx) => {
      // Concrete lower barrier
      const barrierGeo = new THREE.BoxGeometry(0.6, 1.2, CHUNK_LENGTH);
      const barrier = new THREE.Mesh(barrierGeo, this.barrierMaterial);
      barrier.position.set(x + (idx === 0 ? 0.3 : -0.3), 0.6, -CHUNK_LENGTH / 2);
      chunk.add(barrier);

      // Glowing Neon Rail on top
      const railGeo = new THREE.BoxGeometry(0.2, 0.15, CHUNK_LENGTH);
      const rail = new THREE.Mesh(railGeo, this.neonRailMaterial);
      rail.position.set(x + (idx === 0 ? 0.3 : -0.3), 1.25, -CHUNK_LENGTH / 2);
      chunk.add(rail);
    });

    // 4. Street Lights / Overhead Cyber Arches (every 40m)
    for (let z = -20; z >= -CHUNK_LENGTH; z -= 40) {
      const arch = this.createOverheadArch();
      arch.position.set(0, 0, z);
      chunk.add(arch);
    }

    // 5. Overhead Hologram Billboard (on select chunks)
    if (chunkIndex % 2 === 1) {
      const adMat = this.billboardMats[chunkIndex % this.billboardMats.length];
      const billboardGeo = new THREE.PlaneGeometry(12, 4.5);
      const billboard = new THREE.Mesh(billboardGeo, adMat);
      billboard.position.set(0, 8.5, -CHUNK_LENGTH / 2);
      chunk.add(billboard);
    }

    // 6. Flanking Cyberpunk Skyscrapers in the background
    this.addBackgroundBuildings(chunk);

    return chunk;
  }

  private createOverheadArch(): THREE.Group {
    const arch = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });

    // Left pillar
    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), frameMat);
    pL.position.set(-ROAD_WIDTH / 2 - 0.8, 4.5, 0);
    // Right pillar
    const pR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), frameMat);
    pR.position.set(ROAD_WIDTH / 2 + 0.8, 4.5, 0);

    // Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 2.2, 0.6, 0.6), frameMat);
    beam.position.set(0, 9, 0);

    // Downward Neon Light Strip
    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.1, 0.2), lightMat);
    lightStrip.position.set(0, 8.65, 0);

    arch.add(pL, pR, beam, lightStrip);
    return arch;
  }

  private addBackgroundBuildings(chunk: THREE.Group) {
    const leftOffsets = [-24, -38, -55];
    const rightOffsets = [24, 38, 55];
    const allOffsets = [...leftOffsets, ...rightOffsets];

    allOffsets.forEach((x, i) => {
      const height = 45 + ((i * 37) % 65);
      const width = 14 + ((i * 13) % 18);
      const depth = 20 + ((i * 19) % 25);
      const z = -20 - (i * 16) % (CHUNK_LENGTH - 30);

      const bldgGeo = new THREE.BoxGeometry(width, height, depth);
      const bldg = new THREE.Mesh(bldgGeo, this.buildingMaterial);
      bldg.position.set(x, height / 2, z);
      chunk.add(bldg);

      // Window grid rows
      const winGeo = new THREE.BoxGeometry(width * 0.9, height * 0.7, 0.1);
      const win = new THREE.Mesh(winGeo, this.windowMaterial);
      win.position.set(x, height / 2, z + (x > 0 ? -depth / 2 : depth / 2));
      chunk.add(win);

      // Rooftop neon beacon / spire
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 12, 6), this.neonRailMaterial);
      spire.position.set(x, height + 6, z);
      chunk.add(spire);
    });
  }

  public update(playerZ: number) {
    // Check if the farthest behind chunk needs to be recycled to the front
    for (const chunk of this.chunks) {
      if (chunk.position.z > playerZ + CHUNK_LENGTH) {
        // Find current furthest front chunk
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
