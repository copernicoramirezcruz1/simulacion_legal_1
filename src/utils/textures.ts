import * as THREE from 'three';

function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function permute(seed: number) {
  return ((seed * 16807) % 2147483647) / 2147483647;
}

export function createWoodTexture(
  baseColor = '#3d2314',
  grainColor = '#5c3620',
  size = 512
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y++) {
      const shade = permute(y * 7 + 13) * 20 - 10;
      const r = parseInt(baseColor.slice(1, 3), 16) + shade;
      const g = parseInt(baseColor.slice(3, 5), 16) + shade - 3;
      const b = parseInt(baseColor.slice(5, 7), 16) + shade - 6;
      const c = `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const offset = Math.sin(y * 0.02 + permute(y) * 10) * 3;
      ctx.moveTo(offset, y);
      ctx.lineTo(w + offset, y);
      ctx.stroke();
    }

    // Grain knots
    for (let i = 0; i < 8; i++) {
      const kx = permute(i * 101 + 7) * w;
      const ky = permute(i * 211 + 13) * h;
      const kr = 4 + permute(i * 307) * 8;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr, kr * 1.6, permute(i * 401), 0, Math.PI * 2);
      ctx.strokeStyle = grainColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Subtle vertical grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x + permute(x) * 2, 0);
      ctx.lineTo(x + permute(x + 100) * 2, h);
      ctx.stroke();
    }
  });
}

export function createMarbleTexture(
  baseColor = '#d4d0c8',
  veinColor = '#b8b0a0',
  size = 512
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle noise
    const imageData = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const noise = (permute(x * 13 + y * 7) - 0.5) * 15;
        imageData.data[idx] = Math.min(255, Math.max(0, imageData.data[idx] + noise));
        imageData.data[idx + 1] = Math.min(255, Math.max(0, imageData.data[idx + 1] + noise));
        imageData.data[idx + 2] = Math.min(255, Math.max(0, imageData.data[idx + 2] + noise));
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Veins
    ctx.strokeStyle = veinColor;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const startX = permute(i * 73) * w;
      const startY = permute(i * 137) * h;
      ctx.moveTo(startX, startY);
      for (let t = 0; t < 1; t += 0.02) {
        const tx = startX + t * w * 0.7 + Math.sin(t * 10 + i) * 30;
        const ty = startY + t * h * 0.6 + Math.cos(t * 8 + i) * 20;
        ctx.lineTo(tx, ty);
      }
      ctx.lineWidth = 1.5 + permute(i * 211) * 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

export function createPanelTexture(
  baseColor = '#1a1a2e',
  accentColor = '#252545',
  panelWidth = 64,
  size = 256
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Vertical panels
    for (let x = 0; x < w; x += panelWidth) {
      // Panel inner
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + 3, 4, panelWidth - 6, h - 8);

      // Panel border
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, 4, panelWidth - 6, h - 8);

      // Highlight on left edge
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(x + 4, 5);
      ctx.lineTo(x + 4, h - 5);
      ctx.stroke();
    }

    // Horizontal seam line
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  });
}

export function createTileFloorTexture(
  baseColor = '#2a2a40',
  lineColor = '#1a1a30',
  tileSize = 64,
  size = 512
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Subtle variation per tile
    for (let tx = 0; tx < w; tx += tileSize) {
      for (let ty = 0; ty < h; ty += tileSize) {
        const brightness = (permute(tx * 13 + ty * 7) - 0.5) * 15;
        ctx.fillStyle = `rgba(${Math.round(255 + brightness * 3)},${Math.round(255 + brightness * 3)},${Math.round(255 + brightness * 3)},0.08)`;
        ctx.fillRect(tx + 1, ty + 1, tileSize - 2, tileSize - 2);
      }
    }

    // Highlight on tiles
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x + 2, 0);
      ctx.lineTo(x + 2, h);
      ctx.stroke();
    }
  });
}

export function createCarpetTexture(
  baseColor = '#3a1a1a',
  patternColor = '#4a2a2a',
  size = 512
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Diamond pattern
    const diamondW = 32;
    const diamondH = 24;
    ctx.fillStyle = patternColor;
    ctx.globalAlpha = 0.4;
    for (let x = -diamondW; x < w + diamondW; x += diamondW) {
      for (let y = -diamondH; y < h + diamondH; y += diamondH * 2) {
        const offsetX = ((y / diamondH) % 2) * (diamondW / 2);
        ctx.beginPath();
        ctx.moveTo(x + offsetX + diamondW / 2, y);
        ctx.lineTo(x + offsetX + diamondW, y + diamondH);
        ctx.lineTo(x + offsetX + diamondW / 2, y + diamondH * 2);
        ctx.lineTo(x + offsetX, y + diamondH);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Border pattern
    ctx.strokeStyle = '#5a2a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.strokeStyle = '#2a1010';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  });
}

export function createFabricTexture(
  baseColor = '#2a2a3e',
  size = 256
): THREE.CanvasTexture {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Woven pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 4) {
        ctx.lineTo(x, y + (x % 8 === 0 ? -1 : 1));
      }
      ctx.stroke();
    }

    // Subtle noise
    const imageData = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const idx = (y * w + x) * 4;
        const noise = (permute(x * 31 + y * 17) - 0.5) * 8;
        imageData.data[idx] = Math.min(255, Math.max(0, imageData.data[idx] + noise));
        imageData.data[idx + 1] = Math.min(255, Math.max(0, imageData.data[idx + 1] + noise));
        imageData.data[idx + 2] = Math.min(255, Math.max(0, imageData.data[idx + 2] + noise));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  });
}

// Cached textures (created once)
let _woodTex: THREE.CanvasTexture | null = null;
let _darkWoodTex: THREE.CanvasTexture | null = null;
let _marbleTex: THREE.CanvasTexture | null = null;
let _panelTex: THREE.CanvasTexture | null = null;
let _floorTex: THREE.CanvasTexture | null = null;
let _carpetTex: THREE.CanvasTexture | null = null;
let _fabricTex: THREE.CanvasTexture | null = null;

export function getWoodTexture(): THREE.CanvasTexture {
  if (!_woodTex) {
    _woodTex = createWoodTexture('#3d2314', '#5c3620');
    _woodTex.repeat.set(2, 2);
  }
  return _woodTex;
}

export function getDarkWoodTexture(): THREE.CanvasTexture {
  if (!_darkWoodTex) {
    _darkWoodTex = createWoodTexture('#2a1508', '#3d2010');
    _darkWoodTex.repeat.set(1.5, 1.5);
  }
  return _darkWoodTex;
}

export function getMarbleTexture(): THREE.CanvasTexture {
  if (!_marbleTex) {
    _marbleTex = createMarbleTexture('#d4d0c8', '#b8b0a0');
    _marbleTex.repeat.set(2, 2);
  }
  return _marbleTex;
}

export function getPanelTexture(): THREE.CanvasTexture {
  if (!_panelTex) {
    _panelTex = createPanelTexture('#1a1a2e', '#252545');
    _panelTex.repeat.set(3, 2);
  }
  return _panelTex;
}

export function getFloorTexture(): THREE.CanvasTexture {
  if (!_floorTex) {
    _floorTex = createTileFloorTexture('#2a2a40', '#1a1a30');
    _floorTex.repeat.set(6, 6);
  }
  return _floorTex;
}

export function getCarpetTexture(): THREE.CanvasTexture {
  if (!_carpetTex) {
    _carpetTex = createCarpetTexture();
    _carpetTex.repeat.set(4, 4);
  }
  return _carpetTex;
}

export function getFabricTexture(): THREE.CanvasTexture {
  if (!_fabricTex) {
    _fabricTex = createFabricTexture('#2a2a3e');
    _fabricTex.repeat.set(2, 2);
  }
  return _fabricTex;
}
