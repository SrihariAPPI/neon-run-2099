import * as THREE from 'three';
import {
  createCarbonFiberTexture,
  createContactShadowTexture,
  createBrakeRotorTexture,
  createTireTreadTexture,
  CockpitDashboardDisplay,
} from './textures';
import { CarSpec } from '../types/game';

/**
 * AAA-Quality Procedural 3D Sports Car & Traffic Models
 * Features sculpted aerodynamic bodywork, complete functional 3D cockpit interior,
 * dynamic digital instrument cluster, animated steering wheel, alloy wheels with
 * slotted brake rotors, and realistic automotive materials.
 */

// Shared textures & materials cache
const shadowTexture = createContactShadowTexture();
const carbonTexture = createCarbonFiberTexture();
const rotorTexture = createBrakeRotorTexture();
const treadTexture = createTireTreadTexture();

// Shared Geometries
const tireGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.32, 28);
const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.33, 20);
const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24);
const caliperGeo = new THREE.BoxGeometry(0.12, 0.18, 0.09);
const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.34, 12);

// Shared Materials
const tireMaterial = new THREE.MeshStandardMaterial({
  map: treadTexture,
  color: 0x18191c,
  roughness: 0.85,
  metalness: 0.12,
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xd8e0ea,
  roughness: 0.18,
  metalness: 0.92,
});

const rotorMaterial = new THREE.MeshStandardMaterial({
  map: rotorTexture,
  roughness: 0.25,
  metalness: 0.95,
});

const caliperMaterial = new THREE.MeshStandardMaterial({
  color: 0xef4444, // Brembo red
  roughness: 0.3,
  metalness: 0.75,
});

const hubMaterial = new THREE.MeshStandardMaterial({
  color: 0x00f5ff, // Cyber cyan center-lock nut
  roughness: 0.2,
  metalness: 0.9,
});

const carbonMaterial = new THREE.MeshStandardMaterial({
  map: carbonTexture,
  roughness: 0.35,
  metalness: 0.65,
});

const interiorTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x101319,
  roughness: 0.75,
  metalness: 0.2,
});

const leatherMaterial = new THREE.MeshStandardMaterial({
  color: 0x161a22,
  roughness: 0.6,
  metalness: 0.15,
});

const chromeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.08,
  metalness: 0.98,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x020710,
  metalness: 0.1,
  roughness: 0.04,
  transmission: 0.75,
  transparent: true,
  opacity: 0.88,
  ior: 1.52,
});

/**
 * Creates an assembled high-detail wheel with forged rim, slotted rotor, caliper and center lock
 */
function createHighDetailWheel(isLeft: boolean): { wheelGroup: THREE.Group; rotatingGroup: THREE.Group } {
  const wheelGroup = new THREE.Group();
  const rotatingGroup = new THREE.Group();

  // Rubber Tire
  const tire = new THREE.Mesh(tireGeo, tireMaterial);
  tire.rotation.z = Math.PI / 2;
  rotatingGroup.add(tire);

  // Forged Alloy Rim
  const rim = new THREE.Mesh(rimGeo, rimMaterial);
  rim.rotation.z = Math.PI / 2;
  rotatingGroup.add(rim);

  // Center-Lock Wheel Nut
  const hub = new THREE.Mesh(hubGeo, hubMaterial);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = isLeft ? -0.01 : 0.01;
  rotatingGroup.add(hub);

  // Slotted Brake Rotor
  const rotor = new THREE.Mesh(rotorGeo, rotorMaterial);
  rotor.rotation.z = Math.PI / 2;
  rotor.position.x = isLeft ? 0.08 : -0.08;
  rotatingGroup.add(rotor);

  wheelGroup.add(rotatingGroup);

  // Fixed Brake Caliper (does not spin with the wheel, stays upright)
  const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
  caliper.position.set(isLeft ? 0.08 : -0.08, 0.18, 0.04);
  wheelGroup.add(caliper);

  return { wheelGroup, rotatingGroup };
}

export interface PlayerCarMesh extends THREE.Group {
  wheels: THREE.Group[];
  frontSteerKnuckles: THREE.Group[];
  steeringWheel: THREE.Group;
  dashboardDisplay: CockpitDashboardDisplay;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglow: THREE.PointLight;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  headlightBeams: THREE.SpotLight[];
}

/**
 * Builds the AAA-Quality Futuristic Sports Car with complete Exterior & Interior
 */
export function buildPlayerCar(spec: CarSpec, customPaint?: string, customUnderglow?: string): PlayerCarMesh {
  const root = new THREE.Group() as PlayerCarMesh;
  const paintColor = new THREE.Color(customPaint || spec.bodyColor);
  const glowColor = new THREE.Color(customUnderglow || spec.underglowColor);

  // 1. Automotive Multi-Coat Metallic Body Material
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: paintColor,
    metalness: 0.88,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  root.bodyMaterial = bodyMaterial;

  const chassis = new THREE.Group();

  // ==========================================
  // EXTERIOR SCULPTED BODYWORK
  // ==========================================

  // Lower Carbon-Fiber Floor / Undertray
  const undertray = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.14, 4.5), carbonMaterial);
  undertray.position.set(0, 0.22, 0);
  chassis.add(undertray);

  // Front Aerodynamic Splitter with Endplates
  const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.08, 0.8), carbonMaterial);
  frontSplitter.position.set(0, 0.2, -2.25);
  chassis.add(frontSplitter);

  const leftCanard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), carbonMaterial);
  leftCanard.position.set(-1.02, 0.28, -2.25);
  const rightCanard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), carbonMaterial);
  rightCanard.position.set(1.02, 0.28, -2.25);
  chassis.add(leftCanard, rightCanard);

  // Front Bumper / Nosecone with Air Intakes
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.38, 0.9), bodyMaterial);
  frontBumper.position.set(0, 0.42, -1.95);
  chassis.add(frontBumper);

  // Lower Air Intake Mesh
  const intakeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.1), interiorTrimMaterial);
  intakeMesh.position.set(0, 0.32, -2.41);
  chassis.add(intakeMesh);

  // Sculpted Hood with Aerodynamic Sloping
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 1.6), bodyMaterial);
  hood.position.set(0, 0.63, -1.25);
  hood.rotation.x = -0.1;
  chassis.add(hood);

  // Hood Heat Extractors (Twin Carbon Vents)
  const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.55), carbonMaterial);
  ventL.position.set(-0.46, 0.73, -1.1);
  ventL.rotation.x = -0.1;
  const ventR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.55), carbonMaterial);
  ventR.position.set(0.46, 0.73, -1.1);
  ventR.rotation.x = -0.1;
  chassis.add(ventL, ventR);

  // Windshield Wiper Blades on Cowl
  const wiperL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.03), interiorTrimMaterial);
  wiperL.position.set(-0.35, 0.81, -0.48);
  wiperL.rotation.z = -0.1;
  const wiperR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.03), interiorTrimMaterial);
  wiperR.position.set(0.35, 0.81, -0.48);
  wiperR.rotation.z = -0.1;
  chassis.add(wiperL, wiperR);

  // Muscular Front Fender Arches (Left & Right)
  const fenderFL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 1.1), bodyMaterial);
  fenderFL.position.set(-0.92, 0.58, -1.35);
  const fenderFR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 1.1), bodyMaterial);
  fenderFR.position.set(0.92, 0.58, -1.35);
  chassis.add(fenderFL, fenderFR);

  // Main Mid-Body Cockpit Outer Shell & Sills
  const mainHull = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.44, 2.2), bodyMaterial);
  mainHull.position.set(0, 0.52, 0.1);
  chassis.add(mainHull);

  // Carbon Aerodynamic Side Skirts
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.2), carbonMaterial);
  skirtL.position.set(-1.0, 0.22, 0.1);
  const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.2), carbonMaterial);
  skirtR.position.set(1.0, 0.22, 0.1);
  chassis.add(skirtL, skirtR);

  // Sculpted Rear Fender Arches (Widebody Stance)
  const fenderRL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 1.2), bodyMaterial);
  fenderRL.position.set(-0.94, 0.6, 1.35);
  const fenderRR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 1.2), bodyMaterial);
  fenderRR.position.set(0.94, 0.6, 1.35);
  chassis.add(fenderRL, fenderRR);

  // Aerodynamic Side Mirrors
  const mirrorL = new THREE.Group();
  const stalkL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), carbonMaterial);
  const capL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.14), bodyMaterial);
  capL.position.set(-0.16, 0.02, 0);
  const glassL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), chromeMaterial);
  glassL.position.set(-0.16, 0.02, 0.071);
  mirrorL.add(stalkL, capL, glassL);
  mirrorL.position.set(-0.84, 0.88, -0.42);

  const mirrorR = new THREE.Group();
  const stalkR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), carbonMaterial);
  const capR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.14), bodyMaterial);
  capR.position.set(0.16, 0.02, 0);
  const glassR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), chromeMaterial);
  glassR.position.set(0.16, 0.02, 0.071);
  mirrorR.add(stalkR, capR, glassR);
  mirrorR.position.set(0.84, 0.88, -0.42);

  chassis.add(mirrorL, mirrorR);

  // Aerodynamic Greenhouse Canopy (A-Pillars, Roof, C-Pillars)
  const aPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.8), interiorTrimMaterial);
  aPillarL.position.set(-0.7, 0.98, -0.05);
  aPillarL.rotation.x = -0.55;
  aPillarL.rotation.y = 0.15;

  const aPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.8), interiorTrimMaterial);
  aPillarR.position.set(0.7, 0.98, -0.05);
  aPillarR.rotation.x = -0.55;
  aPillarR.rotation.y = -0.15;

  const roofPanel = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.45), bodyMaterial);
  roofPanel.position.set(0, 1.18, 0.35);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.04, 0.85), glassMaterial);
  rearGlass.position.set(0, 1.05, 1.25);
  rearGlass.rotation.x = 0.45;

  chassis.add(aPillarL, aPillarR, roofPanel, rearGlass);

  // Front Windshield Glass
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.52, 0.04), glassMaterial);
  windshield.position.set(0, 0.96, -0.22);
  windshield.rotation.x = -0.52;
  chassis.add(windshield);

  // Rear Decklid & Engine Louvers
  const decklid = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 1.1), bodyMaterial);
  decklid.position.set(0, 0.68, 1.6);
  chassis.add(decklid);

  // Rear Diffuser with 4 Vertical Aero Fins
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.25, 0.6), carbonMaterial);
  rearDiffuser.position.set(0, 0.28, 2.2);
  for (let f = -0.6; f <= 0.6; f += 0.4) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.55), carbonMaterial);
    fin.position.set(f, 0.26, 2.22);
    chassis.add(fin);
  }
  chassis.add(rearDiffuser);

  // Quad Titanium Exhaust Pipes (Dual Left, Dual Right with blue thermal sheen)
  const exhaustMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.95,
    roughness: 0.15,
  });
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
  const exOffsets = [-0.58, -0.4, 0.4, 0.58];
  exOffsets.forEach(x => {
    const pipe = new THREE.Mesh(exhaustGeo, exhaustMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 0.28, 2.38);
    chassis.add(pipe);
  });

  // High-Downforce Active GT Rear Wing
  const wingPylonL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.16), carbonMaterial);
  wingPylonL.position.set(-0.62, 0.92, 1.95);
  const wingPylonR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.16), carbonMaterial);
  wingPylonR.position.set(0.62, 0.92, 1.95);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.42), carbonMaterial);
  mainWing.position.set(0, 1.14, 1.95);
  mainWing.rotation.x = -0.06;

  const wingEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.48), carbonMaterial);
  wingEndL.position.set(-0.95, 1.14, 1.95);
  const wingEndR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.48), carbonMaterial);
  wingEndR.position.set(0.95, 1.14, 1.95);

  chassis.add(wingPylonL, wingPylonR, mainWing, wingEndL, wingEndR);

  // Headlight Assemblies (Aggressive Projector LEDs & Cyan DRL Eyebrows)
  const headlightHousingMat = new THREE.MeshBasicMaterial({ color: 0x050914 });
  const headlightLensMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff });
  const drlMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });

  const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.1), headlightLensMat);
  hlLeft.position.set(-0.7, 0.58, -2.25);
  hlLeft.rotation.y = -0.16;

  const drlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.08), drlMat);
  drlLeft.position.set(-0.7, 0.66, -2.24);
  drlLeft.rotation.y = -0.16;

  const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.1), headlightLensMat);
  hlRight.position.set(0.7, 0.58, -2.25);
  hlRight.rotation.y = 0.16;

  const drlRight = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.08), drlMat);
  drlRight.position.set(0.7, 0.66, -2.24);
  drlRight.rotation.y = 0.16;

  chassis.add(hlLeft, drlLeft, hlRight, drlRight);

  // Taillight Continuous Holographic OLED Lightbar
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const tailLightbar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.1, 0.08), taillightMat);
  tailLightbar.position.set(0, 0.68, 2.26);
  chassis.add(tailLightbar);

  // ==========================================
  // REALISTIC COCKPIT & INTERIOR
  // ==========================================

  // 1. Dashboard Assembly (Sculpted Multi-Tiered Dash)
  const dashboardGroup = new THREE.Group();

  const mainDash = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.28, 0.65), leatherMaterial);
  mainDash.position.set(0, 0.82, -0.32);
  dashboardGroup.add(mainDash);

  const dashBinnacle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.45), interiorTrimMaterial);
  dashBinnacle.position.set(-0.38, 0.94, -0.28);
  dashBinnacle.rotation.x = -0.25;
  dashboardGroup.add(dashBinnacle);

  // 2. Real-Time Dynamic Instrument Cluster Display Screen
  const dashboardDisplay = new CockpitDashboardDisplay();
  const screenMat = new THREE.MeshBasicMaterial({
    map: dashboardDisplay.texture,
  });
  const clusterScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), screenMat);
  clusterScreen.position.set(-0.38, 0.93, -0.18);
  clusterScreen.rotation.x = -0.26;
  dashboardGroup.add(clusterScreen);

  // 3. Ergonomic Steering Wheel with Illuminated Controls & Center Hub
  const steeringGroup = new THREE.Group();
  steeringGroup.position.set(-0.38, 0.88, -0.06);

  // Steering Column
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12), interiorTrimMaterial);
  column.rotation.x = Math.PI / 2.6;
  column.position.set(0, -0.02, -0.1);
  steeringGroup.add(column);

  // D-Cut Racing Wheel Rim
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.028, 12, 28), leatherMaterial);
  wheelRim.rotation.x = 0.38;
  steeringGroup.add(wheelRim);

  // Carbon Center Spoke & Hub
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), carbonMaterial);
  wheelHub.rotation.x = 0.38;
  steeringGroup.add(wheelHub);

  // Illuminated Wheel Buttons (Left & Right)
  const btnL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x00f5ff }));
  btnL.position.set(-0.09, 0.02, 0.01);
  const btnR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
  btnR.position.set(0.09, 0.02, 0.01);
  steeringGroup.add(btnL, btnR);

  // Paddle Shifters behind the wheel
  const paddleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
  const paddleUp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.01), paddleMat);
  paddleUp.position.set(0.15, 0.04, -0.04);
  const paddleDown = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.01), paddleMat);
  paddleDown.position.set(-0.15, 0.04, -0.04);
  steeringGroup.add(paddleUp, paddleDown);

  dashboardGroup.add(steeringGroup);

  // 4. Center Console & Infotainment Screen
  const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.95), carbonMaterial);
  centerConsole.position.set(0, 0.55, 0.25);
  dashboardGroup.add(centerConsole);

  // Center Infotainment Screen
  const centerScreenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const centerScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.04), centerScreenMat);
  centerScreen.position.set(0, 0.78, -0.15);
  centerScreen.rotation.x = -0.3;
  dashboardGroup.add(centerScreen);

  // Gear Selector & Engine Start/Stop Switch
  const startBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
  startBtn.position.set(0, 0.72, 0.05);
  const gearShifter = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.12, 12), chromeMaterial);
  gearShifter.position.set(0, 0.76, 0.25);
  dashboardGroup.add(startBtn, gearShifter);

  // 5. Driver's Performance Bucket Seat
  const createBucketSeat = (x: number): THREE.Group => {
    const seat = new THREE.Group();
    // Cushion
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.52), leatherMaterial);
    cushion.position.set(0, 0.36, 0.15);
    // Backrest with lateral bolsters
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.12), leatherMaterial);
    backrest.position.set(0, 0.72, 0.42);
    backrest.rotation.x = 0.18;
    // Headrest
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.1), leatherMaterial);
    headrest.position.set(0, 1.08, 0.48);
    // 4-Point Harness Straps (Cyan Racing Webbing)
    const harnessMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.02), harnessMat);
    strapL.position.set(-0.1, 0.75, 0.47);
    strapL.rotation.x = 0.18;
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.02), harnessMat);
    strapR.position.set(0.1, 0.75, 0.47);
    strapR.rotation.x = 0.18;

    seat.add(cushion, backrest, headrest, strapL, strapR);
    seat.position.x = x;
    return seat;
  };

  const driverSeat = createBucketSeat(-0.38);
  const passengerSeat = createBucketSeat(0.38);
  dashboardGroup.add(driverSeat, passengerSeat);

  // 6. Door Cards & Armrests (Left & Right)
  const doorCardL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 1.3), interiorTrimMaterial);
  doorCardL.position.set(-0.72, 0.68, 0.2);
  const armrestL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.45), leatherMaterial);
  armrestL.position.set(-0.66, 0.68, 0.1);

  const doorCardR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 1.3), interiorTrimMaterial);
  doorCardR.position.set(0.72, 0.68, 0.2);
  const armrestR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.45), leatherMaterial);
  armrestR.position.set(0.66, 0.68, 0.1);

  // Ambient Interior Neon Light Tubes
  const ambientTubeMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
  const tubeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.2), ambientTubeMat);
  tubeL.position.set(-0.68, 0.85, 0.2);
  const tubeR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.2), ambientTubeMat);
  tubeR.position.set(0.68, 0.85, 0.2);

  // Rearview Mirror
  const mirrorGroup = new THREE.Group();
  const mirrorMount = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), interiorTrimMaterial);
  const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.04), interiorTrimMaterial);
  mirrorFrame.position.set(0, -0.04, 0);
  const mirrorSurface = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.05), chromeMaterial);
  mirrorSurface.position.set(0, -0.04, 0.021);
  mirrorGroup.add(mirrorMount, mirrorFrame, mirrorSurface);
  mirrorGroup.position.set(0, 1.15, -0.15);
  dashboardGroup.add(mirrorGroup);

  dashboardGroup.add(doorCardL, armrestL, doorCardR, armrestR, tubeL, tubeR);
  chassis.add(dashboardGroup);

  root.add(chassis);

  // ==========================================
  // WHEEL ASSEMBLIES WITH STEERING KNUCKLES
  // ==========================================
  const wheels: THREE.Group[] = [];
  const frontKnuckles: THREE.Group[] = [];
  const wheelX = 0.95;
  const wheelZFront = -1.35;
  const wheelZRear = 1.35;
  const wheelY = 0.38;

  // Front Left Wheel with Steering Knuckle
  const knuckleFL = new THREE.Group();
  knuckleFL.position.set(-wheelX, wheelY, wheelZFront);
  const wFL = createHighDetailWheel(true);
  knuckleFL.add(wFL.wheelGroup);
  root.add(knuckleFL);
  frontKnuckles.push(knuckleFL);
  wheels.push(wFL.rotatingGroup);

  // Front Right Wheel with Steering Knuckle
  const knuckleFR = new THREE.Group();
  knuckleFR.position.set(wheelX, wheelY, wheelZFront);
  const wFR = createHighDetailWheel(false);
  knuckleFR.add(wFR.wheelGroup);
  root.add(knuckleFR);
  frontKnuckles.push(knuckleFR);
  wheels.push(wFR.rotatingGroup);

  // Rear Left Wheel (Fixed knuckle)
  const knuckleRL = new THREE.Group();
  knuckleRL.position.set(-wheelX, wheelY, wheelZRear);
  const wRL = createHighDetailWheel(true);
  knuckleRL.add(wRL.wheelGroup);
  root.add(knuckleRL);
  wheels.push(wRL.rotatingGroup);

  // Rear Right Wheel (Fixed knuckle)
  const knuckleRR = new THREE.Group();
  knuckleRR.position.set(wheelX, wheelY, wheelZRear);
  const wRR = createHighDetailWheel(false);
  knuckleRR.add(wRR.wheelGroup);
  root.add(knuckleRR);
  wheels.push(wRR.rotatingGroup);

  root.wheels = wheels;
  root.frontSteerKnuckles = frontKnuckles;
  root.steeringWheel = steeringGroup;
  root.dashboardDisplay = dashboardDisplay;
  root.headlights = [hlLeft, hlRight];
  root.taillights = [tailLightbar];

  // Ground Contact Shadow
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 5.4), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.03, 0);
  root.add(contactShadow);

  // Dual Projector Spotlight Beams for Realistic Night Road Illumination
  const spotLeft = new THREE.SpotLight(0xc8f0ff, 14, 75, Math.PI / 6.5, 0.45, 1.1);
  spotLeft.position.set(-0.68, 0.62, -2.25);
  const targetLeft = new THREE.Object3D();
  targetLeft.position.set(-0.68, 0, -45);
  root.add(spotLeft, targetLeft);
  spotLeft.target = targetLeft;

  const spotRight = new THREE.SpotLight(0xc8f0ff, 14, 75, Math.PI / 6.5, 0.45, 1.1);
  spotRight.position.set(0.68, 0.62, -2.25);
  const targetRight = new THREE.Object3D();
  targetRight.position.set(0.68, 0, -45);
  root.add(spotRight, targetRight);
  spotRight.target = targetRight;

  root.headlightBeams = [spotLeft, spotRight];

  // Neon Underglow
  const underglowLight = new THREE.PointLight(glowColor, 5.5, 6.5, 1.6);
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
  speed: number;
  boundingRadius: number;
  passedPlayer: boolean;
  nearMissChecked: boolean;
}

/**
 * Builds realistic cyberpunk traffic vehicles with detailed bodies, wheels and lights
 */
export function buildTrafficVehicle(type: TrafficType): TrafficMesh {
  const root = new THREE.Group() as TrafficMesh;
  root.vehicleType = type;
  root.wheels = [];
  root.passedPlayer = false;
  root.nearMissChecked = false;

  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  if (type === 'hauler') {
    root.boundingRadius = 3.8;
    // Heavy futuristic cyber hauler
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.65, roughness: 0.35 });
    const warningGlowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Chassis frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 8.2), carbonMaterial);
    chassis.position.set(0, 0.5, 0);
    root.add(chassis);

    // Aerodynamic cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.36, 1.9, 2.4), cabMat);
    cab.position.set(0, 1.65, -2.7);
    root.add(cab);

    // Sloped Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.1), glassMaterial);
    windshield.position.set(0, 1.85, -3.85);
    windshield.rotation.x = -0.15;
    root.add(windshield);

    // Glowing Cargo Container with side hazard ribs
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.38, 2.3, 5.2), cargoMat);
    cargo.position.set(0, 1.85, 1.2);
    root.add(cargo);

    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 5.0), warningGlowMat);
    stripL.position.set(-1.2, 1.65, 1.2);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 5.0), warningGlowMat);
    stripR.position.set(1.2, 1.65, 1.2);
    root.add(stripL, stripR);

    // Lights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0, 0.85, -3.88);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 0.1), new THREE.MeshBasicMaterial({ color: 0xff1e00 }));
    tl.position.set(0, 0.95, 3.82);
    root.add(hl, tl);

    // 6 Wheels
    const zOffsets = [-2.5, 1.0, 2.8];
    zOffsets.forEach(z => {
      const wL = createHighDetailWheel(true);
      wL.wheelGroup.position.set(-1.25, 0.44, z);
      const wR = createHighDetailWheel(false);
      wR.wheelGroup.position.set(1.25, 0.44, z);
      root.wheels.push(wL.rotatingGroup, wR.rotatingGroup);
      root.add(wL.wheelGroup, wR.wheelGroup);
    });

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 8.8), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);

  } else if (type === 'pod') {
    root.boundingRadius = 2.0;
    // Autonomous glass transit pod
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.75, roughness: 0.18 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });

    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.25, 24), bodyMat);
    hull.position.set(0, 0.95, 0);
    root.add(hull);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial);
    dome.position.set(0, 1.5, 0);
    root.add(dome);

    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.06, 12, 28), glowMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, 0.95, 0);
    root.add(haloRing);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    tl.position.set(0, 0.75, 1.35);
    root.add(tl);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);

  } else {
    // Cyber sedan or taxi
    root.boundingRadius = 2.4;
    const isTaxi = type === 'taxi';
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: isTaxi ? 0xeab308 : 0x475569,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.8,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.46, 4.3), bodyMat);
    chassis.position.set(0, 0.54, 0);
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.48, 2.1), glassMaterial);
    cabin.position.set(0, 0.94, 0.1);
    root.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.06, 1.7), bodyMat);
    roof.position.set(0, 1.18, 0.1);
    root.add(roof);

    if (isTaxi) {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.26), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      sign.position.set(0, 1.3, 0.1);
      root.add(sign);
    }

    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.11, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0, 0.6, -2.16);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.11, 0.08), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    tl.position.set(0, 0.64, 2.16);
    root.add(hl, tl);

    // 4 Wheels
    const wFL = createHighDetailWheel(true);
    wFL.wheelGroup.position.set(-0.94, 0.38, -1.35);
    const wFR = createHighDetailWheel(false);
    wFR.wheelGroup.position.set(0.94, 0.38, -1.35);
    const wRL = createHighDetailWheel(true);
    wRL.wheelGroup.position.set(-0.94, 0.38, 1.35);
    const wRR = createHighDetailWheel(false);
    wRR.wheelGroup.position.set(0.94, 0.38, 1.35);

    root.wheels.push(wFL.rotatingGroup, wFR.rotatingGroup, wRL.rotatingGroup, wRR.rotatingGroup);
    root.add(wFL.wheelGroup, wFR.wheelGroup, wRL.wheelGroup, wRR.wheelGroup);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.03, 0);
    root.add(shadow);
  }

  return root;
}
