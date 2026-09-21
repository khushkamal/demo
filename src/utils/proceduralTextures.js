import * as THREE from 'three';

/**
 * Procedural Texture Generator for Rajasthani Heritage Aesthetics
 * Generates lightweight canvas textures without external image dependencies
 */

// 1. Procedural Sandstone Texture
export function createSandstoneTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base warm desert sandstone color
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, '#d4a373');
  baseGrad.addColorStop(0.5, '#c58f58');
  baseGrad.addColorStop(1, '#b07d48');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Grain and sediment strata
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle horizontal strata lines
  ctx.fillStyle = 'rgba(120, 75, 35, 0.08)';
  for (let y = 0; y < height; y += 8 + Math.random() * 12) {
    ctx.fillRect(0, y, width, 2 + Math.random() * 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 2. Procedural White Makrana Marble Texture
export function createMarbleTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Pearlescent off-white base
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, width, height);

  // Soft translucent marble veins
  ctx.lineWidth = 1.5;
  for (let v = 0; v < 14; v++) {
    ctx.strokeStyle = `rgba(160, 150, 140, ${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    let x = Math.random() * width;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < height) {
      x += (Math.random() - 0.48) * 25;
      y += 10 + Math.random() * 15;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Very fine grain
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Jawai Granite Boulder Texture
export function createGraniteTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark weathered granite base
  ctx.fillStyle = '#7a7066';
  ctx.fillRect(0, 0, width, height);

  // Mineral specks (feldspar, mica, quartz)
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 2.5;
    const type = Math.random();
    if (type < 0.4) {
      ctx.fillStyle = 'rgba(230, 215, 195, 0.4)'; // Light quartz
    } else if (type < 0.7) {
      ctx.fillStyle = 'rgba(40, 35, 30, 0.5)'; // Dark mica
    } else {
      ctx.fillStyle = 'rgba(180, 130, 100, 0.35)'; // Feldspar pink
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 4. Rajasthani Jaali (Lattice Carving) Alpha/Normal Pattern
export function createJaaliTexture(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Solid dark background for alpha cutout
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, width, height);

  // Geometric 8-point Mughal/Rajasthani star pattern
  ctx.fillStyle = '#ffffff';
  const size = 32;
  for (let x = 0; x < width; x += size) {
    for (let y = 0; y < height; y += size) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      
      // Diamond cut
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.35);
      ctx.lineTo(cx + size * 0.35, cy);
      ctx.lineTo(cx, cy + size * 0.35);
      ctx.lineTo(cx - size * 0.35, cy);
      ctx.closePath();
      ctx.fill();

      // Mini corner circles
      ctx.beginPath();
      ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x + size, y, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x, y + size, size * 0.12, 0, Math.PI * 2);
      ctx.arc(x + size, y + size, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 5. Starfield & Nebula Canvas
export function createStarfieldTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep twilight indigo gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#040714');
  grad.addColorStop(0.6, '#0b132b');
  grad.addColorStop(1, '#1c2541');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Stars
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.8; // mostly in upper sky
    const radius = Math.random() * 1.5;
    const brightness = 0.3 + Math.random() * 0.7;
    ctx.fillStyle = `rgba(255, 250, 240, ${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
