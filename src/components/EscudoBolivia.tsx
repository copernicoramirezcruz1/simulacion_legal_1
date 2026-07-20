import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

function drawShield(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;

  // Background
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  grad.addColorStop(0, '#2a2a4e');
  grad.addColorStop(1, '#0a0a20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Oval
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.02, size * 0.14, size * 0.18, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#2a5a8c';
  ctx.fill();

  // Tricolor
  ctx.fillStyle = '#E83020';
  ctx.fillRect(cx - size * 0.13, cy - size * 0.14, size * 0.26, size * 0.04);
  ctx.fillStyle = '#FFE033';
  ctx.fillRect(cx - size * 0.13, cy - size * 0.10, size * 0.26, size * 0.04);
  ctx.fillStyle = '#1EAA44';
  ctx.fillRect(cx - size * 0.13, cy - size * 0.06, size * 0.26, size * 0.04);

  // Mountain
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.09, cy + size * 0.06);
  ctx.lineTo(cx - size * 0.04, cy - size * 0.02);
  ctx.lineTo(cx + size * 0.01, cy + size * 0.02);
  ctx.lineTo(cx + size * 0.08, cy - size * 0.04);
  ctx.lineTo(cx + size * 0.12, cy + size * 0.06);
  ctx.closePath();
  ctx.fillStyle = '#b8956a';
  ctx.fill();
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Snow
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.05, cy - size * 0.03);
  ctx.lineTo(cx + size * 0.08, cy - size * 0.04);
  ctx.lineTo(cx + size * 0.11, cy);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Condor
  const condorCy = cy - size * 0.17;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.12, condorCy + size * 0.03);
  ctx.quadraticCurveTo(cx - size * 0.14, condorCy - size * 0.05, cx - size * 0.06, condorCy - size * 0.03);
  ctx.lineTo(cx - size * 0.03, condorCy - size * 0.01);
  ctx.lineTo(cx + size * 0.03, condorCy - size * 0.01);
  ctx.lineTo(cx + size * 0.06, condorCy - size * 0.03);
  ctx.quadraticCurveTo(cx + size * 0.14, condorCy - size * 0.05, cx + size * 0.12, condorCy + size * 0.03);
  ctx.closePath();
  ctx.fillStyle = '#4a3020';
  ctx.fill();
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Condor head
  ctx.beginPath();
  ctx.arc(cx, condorCy - size * 0.02, size * 0.025, 0, Math.PI * 2);
  ctx.fillStyle = '#4a3020';
  ctx.fill();

  // Sun
  const sg = ctx.createRadialGradient(cx, cy + size * 0.15, 0, cx, cy + size * 0.15, size * 0.05);
  sg.addColorStop(0, '#fff8e0');
  sg.addColorStop(0.5, '#FFE033');
  sg.addColorStop(1, '#daa520');
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.15, size * 0.04, 0, Math.PI);
  ctx.fillStyle = sg;
  ctx.fill();

  // Stars
  ctx.fillStyle = '#FFE033';
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 0.6 - Math.PI / 2 - Math.PI * 0.3 * side + Math.PI / 2;
      const r = size * 0.16;
      const sx = cx + Math.cos(a) * r * side * -1;
      const sy = cy + size * 0.01 + Math.sin(a) * r;
      ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const pr = j % 2 === 0 ? size * 0.013 : size * 0.005;
        const pa = (j * Math.PI) / 5 - Math.PI / 2;
        const px = sx + Math.cos(pa) * pr;
        const py = sy + Math.sin(pa) * pr;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  // Branches
  for (let side = -1; side <= 1; side += 2) {
    const sc = side === -1 ? '#3a8a2e' : '#4aaa3e';
    ctx.strokeStyle = sc;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + side * size * 0.09, cy + size * 0.17);
    ctx.quadraticCurveTo(cx + side * size * 0.15, cy + size * 0.12, cx + side * size * 0.17, cy + size * 0.02);
    ctx.stroke();
    ctx.fillStyle = sc;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const lx = cx + side * size * 0.09 + t * side * (size * 0.17 - size * 0.09);
      const ly = cy + size * 0.17 + t * (cy + size * 0.02 - cy - size * 0.17);
      ctx.beginPath();
      ctx.ellipse(lx - side * size * 0.02, ly, size * 0.018, size * 0.008, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(lx + side * size * 0.02, ly, size * 0.018, size * 0.008, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function EscudoBolivia({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawShield(ctx, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.map = texture;
      mat.needsUpdate = true;
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1.4, 1.7]} />
      <meshBasicMaterial transparent opacity={0.95} />
    </mesh>
  );
}
