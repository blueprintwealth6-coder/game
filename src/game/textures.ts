import * as THREE from 'three';

// Cache generated textures so we don't recreate them
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getRoadTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const key = 'road_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base with noise grain
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle asphalt speckle
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = Math.floor(25 + Math.random() * 25);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Sidewalk gutter curbs
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(0, 0, 32, 1024);
  ctx.fillRect(1024 - 32, 0, 32, 1024);

  // Double Yellow Center Lines
  ctx.fillStyle = '#f5c518';
  ctx.fillRect(506, 0, 4, 1024);
  ctx.fillRect(514, 0, 4, 1024);

  // Dashed White Lane Divider Lines (4 lanes total)
  ctx.fillStyle = '#ffffff';
  for (let y = 0; y < 1024; y += 64) {
    ctx.fillRect(268, y, 4, 36);
    ctx.fillRect(752, y, 4, 36);
  }

  // Crosswalk zebra markers at top edge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let x = 64; x < 960; x += 48) {
    ctx.fillRect(x, 20, 24, 90);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(key, texture);
  return texture;
}

export function getSidewalkTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const key = 'sidewalk_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Miami pinkish-beige concrete tiles
  ctx.fillStyle = '#d1c7bc';
  ctx.fillRect(0, 0, 512, 512);

  // Tile grid pattern
  ctx.strokeStyle = '#9c9287';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Curb edge
  ctx.fillStyle = '#7a7269';
  ctx.fillRect(0, 492, 512, 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(key, texture);
  return texture;
}

export function getSkyscraperFacadeTexture(styleIndex: number = 0, maxAnisotropy: number = 4): THREE.CanvasTexture {
  const key = `skyscraper_facade_${styleIndex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const baseHue = styleIndex === 0 ? '#0f172a' : styleIndex === 1 ? '#082f49' : '#1e1b4b';
  ctx.fillStyle = baseHue;
  ctx.fillRect(0, 0, 512, 1024);

  // Modern curtain wall window panels
  const rows = 32;
  const cols = 12;
  const cellW = 512 / cols;
  const cellH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.4;
      const x = c * cellW + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;

      if (isLit) {
        // High-end neon office glow: warm amber, cyan, or magenta
        const rand = Math.random();
        if (rand < 0.45) {
          ctx.fillStyle = 'rgba(255, 215, 120, 0.85)'; // warm light
        } else if (rand < 0.75) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)'; // cool cyan light
        } else {
          ctx.fillStyle = 'rgba(244, 114, 182, 0.8)'; // vice pink
        }
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      }
      ctx.fillRect(x, y, w, h);

      // Glass reflection streak
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y, w * 0.35, h);
    }
  }

  // Vertical structural mullions
  ctx.fillStyle = '#334155';
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * cellW - 1, 0, 3, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(key, texture);
  return texture;
}

export function getHotelNeonSignTexture(hotelName: string, subtext: string, accentColor: string = '#ff007f'): THREE.CanvasTexture {
  const key = `hotel_neon_${hotelName}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Art deco pastel backing
  ctx.fillStyle = '#1e1026';
  ctx.fillRect(0, 0, 1024, 256);

  // Outer neon border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, 992, 224);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, 972, 204);

  // Hotel Title Neon Glow
  ctx.font = '900 68px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow shadow
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(hotelName.toUpperCase(), 512, 100);

  // Subtitle
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 14;
  ctx.font = '700 28px "Montserrat", sans-serif';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText(subtext.toUpperCase(), 512, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function getSandTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const key = 'sand_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Golden Miami sand
  ctx.fillStyle = '#e8d2a6';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const tone = Math.random() > 0.5 ? '#d8be8d' : '#f4e0b8';
    ctx.fillStyle = tone;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(key, texture);
  return texture;
}
