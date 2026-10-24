import * as THREE from 'three';

/**
 * Procedural texture generator conforming to Three.js PBR standards.
 * Generates wet asphalt, neon highway stripes, carbon fiber,
 * slotted brake rotors, tire tread, safety barrier chevrons,
 * dynamic cockpit instrument clusters, and holographic signs.
 */

export function createWetAsphaltTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt with deep navy tone
  ctx.fillStyle = '#080b12';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-aggregate noise (fine asphalt pebbles & grit)
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 28;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain + 3));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain + 8)); // cyber midnight cool tone
  }
  ctx.putImageData(imgData, 0, 0);

  // Wet rain puddle patches with glossy reflections
  for (let j = 0; j < 55; j++) {
    const y = Math.random() * 1024;
    const x = Math.random() * 1024;
    const rad = 25 + Math.random() * 85;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
    grad.addColorStop(0, 'rgba(15, 26, 46, 0.65)');
    grad.addColorStop(0.7, 'rgba(10, 18, 32, 0.35)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle tire rubber streaks and wear marks
  ctx.fillStyle = 'rgba(2, 4, 8, 0.45)';
  for (let k = 0; k < 6; k++) {
    const x = 120 + k * 160 + (Math.random() - 0.5) * 40;
    ctx.fillRect(x, 0, 35 + Math.random() * 20, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 40);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

export function createLaneDividerTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 64, 256);

  // Dash line with neon cyan glow and sharp center
  const grad = ctx.createLinearGradient(0, 30, 0, 226);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.08, 'rgba(0, 229, 255, 0.6)');
  grad.addColorStop(0.2, '#00e5ff');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(0.8, '#00e5ff');
  grad.addColorStop(0.92, 'rgba(0, 229, 255, 0.6)');
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(22, 30, 20, 196);

  // Embedded cat-eye LED reflector
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(32, 128, 6, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, 64, 64);

  // 2x2 twill weave pattern
  ctx.fillStyle = '#1b1e24';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillRect(32, 32, 32, 32);

  ctx.fillStyle = '#262a33';
  ctx.fillRect(4, 4, 24, 24);
  ctx.fillRect(36, 36, 24, 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBrakeRotorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Brushed steel base
  const grad = ctx.createRadialGradient(128, 128, 40, 128, 128, 125);
  grad.addColorStop(0, '#555b66');
  grad.addColorStop(0.3, '#8892a0');
  grad.addColorStop(0.6, '#b0b8c4');
  grad.addColorStop(0.9, '#8892a0');
  grad.addColorStop(1, '#444a54');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 125, 0, Math.PI * 2);
  ctx.fill();

  // Hub cutout
  ctx.fillStyle = '#1e222a';
  ctx.beginPath();
  ctx.arc(128, 128, 45, 0, Math.PI * 2);
  ctx.fill();

  // Cross-drilled cooling holes and curved directional slots
  ctx.fillStyle = '#111317';
  ctx.strokeStyle = '#22262e';
  ctx.lineWidth = 3;

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    // Curved slot
    ctx.beginPath();
    ctx.arc(
      128 + Math.cos(angle) * 20,
      128 + Math.sin(angle) * 20,
      70,
      angle + 0.2,
      angle + 0.8
    );
    ctx.stroke();

    // Drilled holes along radius
    for (let r = 60; r <= 110; r += 16) {
      const hx = 128 + Math.cos(angle + 0.1) * r;
      const hy = 128 + Math.sin(angle + 0.1) * r;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Rubber base
  ctx.fillStyle = '#16171a';
  ctx.fillRect(0, 0, 256, 256);

  // Directional V-grooves
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  for (let y = -20; y < 280; y += 24) {
    // Left chevron
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(120, y + 18);
    ctx.stroke();

    // Right chevron
    ctx.beginPath();
    ctx.moveTo(236, y);
    ctx.lineTo(136, y + 18);
    ctx.stroke();

    // Circumferential drainage grooves
    ctx.fillRect(45, 0, 8, 256);
    ctx.fillRect(124, 0, 8, 256);
    ctx.fillRect(203, 0, 8, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBarrierChevronTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b'; // concrete base
  ctx.fillRect(0, 0, 256, 128);

  // Black and safety yellow diagonal warning stripes
  const stripeWidth = 32;
  for (let x = -128; x < 384; x += stripeWidth * 2) {
    ctx.fillStyle = '#eab308'; // safety amber
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + stripeWidth, 128);
    ctx.lineTo(x + stripeWidth + 64, 0);
    ctx.lineTo(x + 64, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a'; // dark carbon black
    ctx.beginPath();
    ctx.moveTo(x + stripeWidth, 128);
    ctx.lineTo(x + stripeWidth * 2, 128);
    ctx.lineTo(x + stripeWidth * 2 + 64, 0);
    ctx.lineTo(x + stripeWidth + 64, 0);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 25, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createHologramSignTexture(text: string, subtext: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark translucent background with neon border
  ctx.fillStyle = 'rgba(5, 8, 18, 0.95)';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 240);

  // Scanline grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 16; y < 240; y += 8) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(496, y);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = color;
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, 256, 95);

  // Subtext
  ctx.font = '22px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 8;
  ctx.fillText(subtext, 256, 165);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Real-time Dynamic Instrument Cluster Canvas Texture for Cockpit View
 */
export class CockpitDashboardDisplay {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.draw(0, 950, 1, 1.0, false);
  }

  public draw(speedKmH: number, actualRpm: number, gear: number, nitroFraction: number, isShifting: boolean) {
    const ctx = this.ctx;
    const w = 512;
    const h = 256;

    // Dark cyber screen background
    ctx.fillStyle = '#050914';
    ctx.fillRect(0, 0, w, h);

    // Bezel border & subtle grid
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w - 20; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h - 20);
      ctx.stroke();
    }

    // 1. Center Tachometer Circular Dial Arc
    const cx = 256;
    const cy = 145;
    const radius = 95;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;

    // Background track
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    // Active RPM Sweep Arc
    const rpmFraction = Math.min(1.0, Math.max(0, (actualRpm - 900) / (8500 - 900)));
    const currentAngle = startAngle + (endAngle - startAngle) * rpmFraction;

    const rpmGrad = ctx.createLinearGradient(150, 150, 360, 150);
    rpmGrad.addColorStop(0, '#00f5ff');
    rpmGrad.addColorStop(0.65, '#38bdf8');
    rpmGrad.addColorStop(0.85, '#f59e0b');
    rpmGrad.addColorStop(1, '#ef4444');

    ctx.strokeStyle = rpmGrad;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, currentAngle);
    ctx.stroke();

    // 2. Center Large Digital Speedometer
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px monospace';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 12;
    ctx.fillText(`${speedKmH}`, cx, cy - 10);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('KM / H', cx, cy + 32);

    // 3. Left Side: Gear Indicator Box
    ctx.fillStyle = isShifting ? '#f59e0b' : '#0f172a';
    ctx.strokeStyle = isShifting ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(35, 75, 75, 95);
    ctx.strokeRect(35, 75, 75, 95);

    ctx.fillStyle = isShifting ? '#050914' : '#ffffff';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(isShifting ? 'UP' : `${gear}`, 72, 118);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = isShifting ? '#050914' : '#94a3b8';
    ctx.fillText('GEAR', 72, 152);

    // 4. Right Side: RPM Readout & Nitro Tank Gauge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(w - 110, 75, 75, 95);
    ctx.strokeRect(w - 110, 75, 75, 95);

    // Nitro Bar inside box
    const nH = Math.round(nitroFraction * 70);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(w - 102, 155 - nH, 59, nH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('N2O', w - 72, 92);
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${Math.round(nitroFraction * 100)}%`, w - 72, 130);

    // Top Header Status Ribbon
    ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
    ctx.fillRect(15, 15, w - 30, 28);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`RPM: ${actualRpm.toLocaleString()}  |  SYSTEM: ARMED`, 30, 32);

    ctx.textAlign = 'right';
    ctx.fillStyle = actualRpm > 8000 ? '#ef4444' : '#38bdf8';
    ctx.fillText(actualRpm > 8000 ? 'SHIFT REQUIRED!' : 'DRIVE MODE: SPORT+', w - 30, 32);

    this.texture.needsUpdate = true;
  }
}
