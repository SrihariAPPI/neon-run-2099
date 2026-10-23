import * as THREE from 'three';

/**
 * Procedural texture generator conforming to Three.js PBR standards.
 * Generates wet asphalt, neon highway stripes, carbon fiber,
 * holographic signs, and contact shadow gradients without external assets.
 */

export function createWetAsphaltTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro-aggregate noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain + 2)); // slight cool blue-gray tone
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain + 6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle wet puddle streaks and sheen
  for (let j = 0; j < 40; j++) {
    const y = Math.random() * 1024;
    const x = Math.random() * 1024;
    const rad = 30 + Math.random() * 70;
    const grad = ctx.createRadialGradient(x, y, 5, x, y, rad);
    grad.addColorStop(0, 'rgba(18, 28, 48, 0.45)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
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

  // Dash line with neon cyan glow and cat-eye reflector
  const grad = ctx.createLinearGradient(0, 40, 0, 216);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.1, '#00e5ff');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(0.9, '#00e5ff');
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(24, 40, 16, 176);

  // Embedded cat-eye LED reflector
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(32, 128, 5, 0, Math.PI * 2);
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
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#121418';
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = '#1e2229';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillRect(16, 16, 16, 16);

  ctx.fillStyle = '#282d37';
  ctx.fillRect(2, 2, 12, 12);
  ctx.fillRect(18, 18, 12, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
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
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, 256, 100);

  // Subtext
  ctx.font = '24px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 8;
  ctx.fillText(subtext, 256, 170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
