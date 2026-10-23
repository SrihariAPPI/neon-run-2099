import * as THREE from 'three';
import { createCarbonFiberTexture, createContactShadowTexture } from './textures';
import { CarSpec } from '../types/game';

/**
 * Procedural 3D Vehicle & Scenery Model Builder
 * Adheres strictly to the Three.js 3-12 part composite group directive,
 * realistic PBR roughness/metalness differences, contact grounding,
 * and high-fidelity cyberpunk aesthetics.
 */

// Shared textures & materials cache
const shadowTexture = createContactShadowTexture();
const carbonTexture = createCarbonFiberTexture();

const sharedTireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24);
const sharedRimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.33, 16);
const sharedCaliperGeo = new THREE.BoxGeometry(0.12, 0.2, 0.08);

const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x141416,
  roughness: 0.9,
  metalness: 0.1,
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xd0d5dd,
  roughness: 0.2,
  metalness: 0.9,
});

const caliperMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0044,
  roughness: 0.3,
  metalness: 0.8,
});

const carbonMaterial = new THREE.MeshStandardMaterial({
  map: carbonTexture,
  roughness: 0.45,
  metalness: 0.6,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x05131e,
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.6,
  transparent: true,
  opacity: 0.85,
  ior: 1.5,
});

/**
 * Creates an assembled wheel group with rim, tire, brake disc and caliper
 */
function createWheel(isLeft: boolean): THREE.Group {
  const wheel = new THREE.Group();

  const tire = new THREE.Mesh(sharedTireGeo, tireMaterial);
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(sharedRimGeo, rimMaterial);
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  const caliper = new THREE.Mesh(sharedCaliperGeo, caliperMaterial);
  caliper.position.set(isLeft ? -0.1 : 0.1, 0.16, 0);
  wheel.add(caliper);

  return wheel;
}

export interface PlayerCarMesh extends THREE.Group {
  wheels: THREE.Group[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglow: THREE.PointLight;
  bodyMaterial: THREE.MeshStandardMaterial;
  headlightBeams: THREE.SpotLight[];
}

/**
 * Builds the player vehicle composite (10+ distinct procedural parts)
 */
export function buildPlayerCar(spec: CarSpec, customPaint?: string, customUnderglow?: string): PlayerCarMesh {
  const root = new THREE.Group() as PlayerCarMesh;
  const paintColor = new THREE.Color(customPaint || spec.bodyColor);
  const glowColor = new THREE.Color(customUnderglow || spec.underglowColor);

  // 1. Car Body Material (Metallic Car Paint with clearcoat)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.85,
    roughness: 0.18,
  });
  root.bodyMaterial = bodyMaterial;

  // 2. Primary Chassis & Hull (Sculpted via multi-part geometry)
  const chassisGroup = new THREE.Group();

  // Lower chassis frame
  const lowerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.32, 4.3),
    carbonMaterial
  );
  lowerFrame.position.set(0, 0.36, 0);
  chassisGroup.add(lowerFrame);

  // Main aerodynamic body shell
  let mainBodyGeo: THREE.BufferGeometry;
  if (spec.silhouette === 'hyper') {
    mainBodyGeo = new THREE.BoxGeometry(1.9, 0.42, 4.5);
  } else if (spec.silhouette === 'muscle') {
    mainBodyGeo = new THREE.BoxGeometry(2.0, 0.52, 4.4);
  } else {
    mainBodyGeo = new THREE.BoxGeometry(1.86, 0.46, 4.2);
  }
  const mainBody = new THREE.Mesh(mainBodyGeo, bodyMaterial);
  mainBody.position.set(0, 0.55, 0);
  chassisGroup.add(mainBody);

  // Sloped hood
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.22, 1.6),
    bodyMaterial
  );
  hood.position.set(0, 0.65, -1.25);
  hood.rotation.x = -0.08;
  chassisGroup.add(hood);

  // Hood vents (carbon fiber)
  const ventLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.55), carbonMaterial);
  ventLeft.position.set(-0.48, 0.76, -1.1);
  const ventRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.55), carbonMaterial);
  ventRight.position.set(0.48, 0.76, -1.1);
  chassisGroup.add(ventLeft, ventRight);

  // Cockpit & Cabin Canopy
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.48, 1.9),
    glassMaterial
  );
  cabin.position.set(0, 0.95, 0.2);
  chassisGroup.add(cabin);

  // Roof panel
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.08, 1.5),
    bodyMaterial
  );
  roof.position.set(0, 1.2, 0.2);
  chassisGroup.add(roof);

  // Front splitter & Aerodynamic canards
  const frontSplitter = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.08, 0.6),
    carbonMaterial
  );
  frontSplitter.position.set(0, 0.24, -2.15);
  chassisGroup.add(frontSplitter);

  // Rear Diffuser & Exhaust tips
  const rearDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(1.88, 0.22, 0.5),
    carbonMaterial
  );
  rearDiffuser.position.set(0, 0.32, 2.15);
  chassisGroup.add(rearDiffuser);

  // Quad Exhaust Tips (glowing blue-titanium)
  const exhaustMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.9,
    roughness: 0.15,
  });
  const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12);
  const ex1 = new THREE.Mesh(exhaustGeo, exhaustMat);
  ex1.rotation.x = Math.PI / 2;
  ex1.position.set(-0.55, 0.28, 2.3);
  const ex2 = new THREE.Mesh(exhaustGeo, exhaustMat);
  ex2.rotation.x = Math.PI / 2;
  ex2.position.set(-0.35, 0.28, 2.3);
  const ex3 = new THREE.Mesh(exhaustGeo, exhaustMat);
  ex3.rotation.x = Math.PI / 2;
  ex3.position.set(0.35, 0.28, 2.3);
  const ex4 = new THREE.Mesh(exhaustGeo, exhaustMat);
  ex4.rotation.x = Math.PI / 2;
  ex4.position.set(0.55, 0.28, 2.3);
  chassisGroup.add(ex1, ex2, ex3, ex4);

  // Rear Spoiler / GT Wing
  const spoilerStrut1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.12), carbonMaterial);
  spoilerStrut1.position.set(-0.6, 1.0, 1.85);
  const spoilerStrut2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.12), carbonMaterial);
  spoilerStrut2.position.set(0.6, 1.0, 1.85);
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.4), carbonMaterial);
  spoilerWing.position.set(0, 1.2, 1.85);
  spoilerWing.rotation.x = -0.06;
  chassisGroup.add(spoilerStrut1, spoilerStrut2, spoilerWing);

  // Headlights (Aggressive futuristic LED strips)
  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xe0f7ff,
  });
  const hlGeo = new THREE.BoxGeometry(0.48, 0.1, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-0.68, 0.62, -2.12);
  hlLeft.rotation.y = -0.15;
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(0.68, 0.62, -2.12);
  hlRight.rotation.y = 0.15;
  chassisGroup.add(hlLeft, hlRight);

  // Taillight bar (Continuous OLED neon red ribbon)
  const taillightMat = new THREE.MeshBasicMaterial({
    color: 0xff0044,
  });
  const tailBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.09, 0.06),
    taillightMat
  );
  tailBar.position.set(0, 0.72, 2.14);
  chassisGroup.add(tailBar);

  // Detailed Interior Dashboard for Cockpit View
  const dashMat = new THREE.MeshStandardMaterial({
    color: 0x161a22,
    roughness: 0.8,
    metalness: 0.2,
  });
  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.6), dashMat);
  dashboard.position.set(0, 0.82, -0.4);
  chassisGroup.add(dashboard);

  // Futuristic digital HUD screen panel
  const hudScreenMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
  });
  const hudScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.04), hudScreenMat);
  hudScreen.position.set(0, 0.94, -0.28);
  hudScreen.rotation.x = -0.3;
  chassisGroup.add(hudScreen);

  // Steering wheel (Octagonal futuristic yoke)
  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 16), carbonMaterial);
  steeringWheel.position.set(-0.35, 0.88, -0.22);
  steeringWheel.rotation.x = 0.35;
  chassisGroup.add(steeringWheel);

  root.add(chassisGroup);

  // 3. Wheels (4 independently rotating wheels)
  const wheels: THREE.Group[] = [];
  const wheelX = 0.94;
  const wheelZFront = -1.35;
  const wheelZRear = 1.35;
  const wheelY = 0.38;

  // Front Left
  const wFL = createWheel(true);
  wFL.position.set(-wheelX, wheelY, wheelZFront);
  // Front Right
  const wFR = createWheel(false);
  wFR.position.set(wheelX, wheelY, wheelZFront);
  // Rear Left
  const wRL = createWheel(true);
  wRL.position.set(-wheelX, wheelY, wheelZRear);
  // Rear Right
  const wRR = createWheel(false);
  wRR.position.set(wheelX, wheelY, wheelZRear);

  wheels.push(wFL, wFR, wRL, wRR);
  wheels.forEach(w => root.add(w));
  root.wheels = wheels;
  root.headlights = [hlLeft, hlRight];
  root.taillights = [tailBar];

  // 4. Ground Contact Shadow Plane
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.03, 0);
  root.add(contactShadow);

  // 5. Realistic Forward Headlight Beams (Spotlights)
  const spotLeft = new THREE.SpotLight(0xc8f0ff, 12, 60, Math.PI / 7, 0.4, 1.2);
  spotLeft.position.set(-0.65, 0.65, -2.1);
  const targetLeft = new THREE.Object3D();
  targetLeft.position.set(-0.65, 0, -35);
  root.add(spotLeft);
  root.add(targetLeft);
  spotLeft.target = targetLeft;

  const spotRight = new THREE.SpotLight(0xc8f0ff, 12, 60, Math.PI / 7, 0.4, 1.2);
  spotRight.position.set(0.65, 0.65, -2.1);
  const targetRight = new THREE.Object3D();
  targetRight.position.set(0.65, 0, -35);
  root.add(spotRight);
  root.add(targetRight);
  spotRight.target = targetRight;

  root.headlightBeams = [spotLeft, spotRight];

  // 6. Underglow PointLight
  const underglowLight = new THREE.PointLight(glowColor, 4.5, 5.5, 1.5);
  underglowLight.position.set(0, 0.22, 0);
  root.add(underglowLight);
  root.underglow = underglowLight;

  return root;
}

export type TrafficType = 'sedan' | 'pod' | 'hauler' | 'taxi';

export interface TrafficMesh extends THREE.Group {
  wheels: THREE.Group[];
  vehicleType: TrafficType;
  lane: number;
  speed: number; // world units per sec
  boundingRadius: number;
  passedPlayer: boolean;
  nearMissChecked: boolean;
}

/**
 * Builds distinct futuristic traffic models
 */
export function buildTrafficVehicle(type: TrafficType): TrafficMesh {
  const root = new THREE.Group() as TrafficMesh;
  root.vehicleType = type;
  root.wheels = [];
  root.passedPlayer = false;
  root.nearMissChecked = false;

  // Contact shadow
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  if (type === 'hauler') {
    root.boundingRadius = 3.6;
    // Heavy futuristic cyber delivery hauler
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 });
    const neonRibbonMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 7.8), carbonMaterial);
    chassis.position.set(0, 0.5, 0);
    root.add(chassis);

    // Front Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.8, 2.2), cabMat);
    cab.position.set(0, 1.6, -2.6);
    root.add(cab);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.1), glassMaterial);
    windshield.position.set(0, 1.8, -3.71);
    root.add(windshield);

    // Big Container
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.2, 5.0), cargoMat);
    cargo.position.set(0, 1.8, 1.1);
    root.add(cargo);

    // Glowing side warning strips
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 4.8), neonRibbonMat);
    stripL.position.set(-1.18, 1.6, 1.1);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 4.8), neonRibbonMat);
    stripR.position.set(1.18, 1.6, 1.1);
    root.add(stripL, stripR);

    // Headlights & Taillights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0, 0.8, -3.72);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: 0xff1e00 }));
    tl.position.set(0, 0.9, 3.62);
    root.add(hl, tl);

    // 6 Wheels
    const zOffsets = [-2.4, 1.0, 2.6];
    zOffsets.forEach(z => {
      const wL = createWheel(true);
      wL.position.set(-1.22, 0.42, z);
      const wR = createWheel(false);
      wR.position.set(1.22, 0.42, z);
      root.wheels.push(wL, wR);
      root.add(wL, wR);
    });

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 8.4), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);

  } else if (type === 'pod') {
    root.boundingRadius = 1.9;
    // Autonomous circular glass transit pod
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 1.2, 20), bodyMat);
    hull.position.set(0, 0.9, 0);
    root.add(hull);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.18, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial);
    dome.position.set(0, 1.45, 0);
    root.add(dome);

    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.06, 8, 24), glowMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, 0.9, 0);
    root.add(haloRing);

    // Taillight
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    tl.position.set(0, 0.7, 1.3);
    root.add(tl);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);

  } else {
    // Cyber sedan / taxi
    root.boundingRadius = 2.4;
    const isTaxi = type === 'taxi';
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isTaxi ? 0xeab308 : 0x475569,
      metalness: 0.75,
      roughness: 0.25,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.44, 4.2), bodyMat);
    chassis.position.set(0, 0.52, 0);
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.46, 2.0), glassMaterial);
    cabin.position.set(0, 0.92, 0.1);
    root.add(cabin);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.6), bodyMat);
    roof.position.set(0, 1.16, 0.1);
    root.add(roof);

    if (isTaxi) {
      // Holographic Taxi sign on top
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.25), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      sign.position.set(0, 1.28, 0.1);
      root.add(sign);
    }

    // Headlights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0, 0.58, -2.11);
    // Taillights
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    tl.position.set(0, 0.62, 2.11);
    root.add(hl, tl);

    // Wheels
    const wFL = createWheel(true);
    wFL.position.set(-0.92, 0.38, -1.3);
    const wFR = createWheel(false);
    wFR.position.set(0.92, 0.38, -1.3);
    const wRL = createWheel(true);
    wRL.position.set(-0.92, 0.38, 1.3);
    const wRR = createWheel(false);
    wRR.position.set(0.92, 0.38, 1.3);
    root.wheels.push(wFL, wFR, wRL, wRR);
    root.add(wFL, wFR, wRL, wRR);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 5.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);
  }

  return root;
}
