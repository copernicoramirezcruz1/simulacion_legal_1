import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { getDarkWoodTexture } from '../utils/textures';

const IMAGE_ASPECT = 853 / 1000;

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Removes the white JPEG background via flood-fill from the image edges.
 * Interior whites (the llama, condor neck, flag highlights) are NOT
 * connected to the border, so they survive untouched.
 */
function makeEscudoTexture(img: HTMLImageElement): THREE.CanvasTexture {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const WHITE_THRESHOLD = 232;

  const isBackground = (i: number): boolean => {
    const p = i * 4;
    return (
      data[p] >= WHITE_THRESHOLD &&
      data[p + 1] >= WHITE_THRESHOLD &&
      data[p + 2] >= WHITE_THRESHOLD
    );
  };

  const removed = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) stack.push(y * w, y * w + w - 1);

  while (stack.length > 0) {
    const i = stack.pop()!;
    if (removed[i] || !isBackground(i)) continue;
    removed[i] = 1;
    data[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  // Feather: fade white halo on pixels adjacent to the removed background
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (removed[i]) continue;
      if (!(removed[i - 1] || removed[i + 1] || removed[i - w] || removed[i + w])) continue;
      const p = i * 4;
      const whiteness = Math.min(data[p], data[p + 1], data[p + 2]);
      if (whiteness > 200) {
        data[p + 3] = Math.max(0, Math.min(255, ((235 - whiteness) / 35) * 255));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function EscudoBolivia({ position }: { position: [number, number, number] }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const woodTex = getDarkWoodTexture();

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = '/escudo-bolivia.jpg';
    img.onload = () => {
      if (!cancelled) setTexture(makeEscudoTexture(img));
    };
    return () => {
      cancelled = true;
    };
  }, []);

  const W = 1.5;
  const H = W * IMAGE_ASPECT;

  return (
    <group position={position}>
      {/* Wooden plaque with real depth */}
      <mesh position={[0, 0, -0.085]}>
        <extrudeGeometry
          args={[roundedRectShape(1.82, 1.58, 0.12), { depth: 0.06, bevelEnabled: false }]}
        />
        <meshStandardMaterial map={woodTex} roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Gold mat — shows through the transparent background of the escudo */}
      <mesh position={[0, 0, -0.02]}>
        <shapeGeometry args={[roundedRectShape(1.66, 1.42, 0.08)]} />
        <meshStandardMaterial color="#b8860b" roughness={0.28} metalness={0.75} />
      </mesh>

      {/* Escudo (self-lit so it stays readable in the dim courtroom) */}
      {texture && (
        <mesh>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
        </mesh>
      )}
    </group>
  );
}
