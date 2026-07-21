import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ROLE_LABELS } from '../types';
import type { CharacterRole } from '../types';

interface CharacterGLBProps {
  role: CharacterRole;
  position: [number, number, number];
  rotation?: [number, number, number];
  isSpeaking: boolean;
  visible?: boolean;
}

const ROLE_SUIT_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#4a5a8a',
  VOCAL: '#5a7a9a',
  SECRETARIA: '#2e4a2e',
  ACCIONANTE: '#1a3a6e',
  ACCIONADA: '#6e1a1a',
  TERCERO: '#3e1a5e',
};

const MODEL_MAP: Record<CharacterRole, string> = {
  PRESIDENTE: '/models/persona.glb',
  VOCAL: '/models/persona.glb',
  SECRETARIA: '/models/mujer.glb',
  ACCIONANTE: '/models/persona.glb',
  ACCIONADA: '/models/mujer.glb',
  TERCERO: '/models/persona.glb',
};

const TARGET_HEIGHT = 2.0;

const SCALE_MULTIPLIER: Record<string, number> = {
  '/models/mujer.glb': 1.0,
};

const MODEL_ROTATION_FIX: Record<string, [number, number, number]> = {
  '/models/mujer.glb': [0, -Math.PI / 2, 0],
};

const MODEL_Y_OFFSET: Record<string, number> = {
  '/models/mujer.glb': 0.9,
};

const scaleCache = new Map<string, number>();

function getModelScale(scene: THREE.Group): number {
  const key = scene.uuid;
  if (scaleCache.has(key)) return scaleCache.get(key)!;
  const box = new THREE.Box3().setFromObject(scene);
  const h = box.max.y - box.min.y;
  const scale = TARGET_HEIGHT / h;
  scaleCache.set(key, scale);
  return scale;
}

function cloneAndCustomize(scene: THREE.Group, role: CharacterRole): THREE.Group {
  const clone = scene.clone(true);
  const suitColor = new THREE.Color(ROLE_SUIT_COLORS[role]);

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (child.name.includes('floor')) {
      child.visible = false;
      return;
    }

    if (child.name.includes('suit')) {
      const mat = child.material;
      if (Array.isArray(mat)) {
        child.material = mat.map((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const nm = m.clone();
            nm.color.copy(suitColor);
            return nm;
          }
          return m;
        });
      } else if (mat instanceof THREE.MeshStandardMaterial) {
        const nm = mat.clone();
        nm.color.copy(suitColor);
        child.material = nm;
      }
    }
  });

  return clone;
}

export function CharacterGLB({
  role,
  position,
  rotation = [0, 0, 0],
  isSpeaking,
  visible = true,
}: CharacterGLBProps) {
  const label = ROLE_LABELS[role];
  const modelPath = MODEL_MAP[role];
  const { scene } = useGLTF(modelPath);
  const scale = useMemo(() => {
    const base = getModelScale(scene);
    return base * (SCALE_MULTIPLIER[modelPath] ?? 1);
  }, [scene, modelPath]);

  const modelRotation = MODEL_ROTATION_FIX[modelPath] ?? [0, 0, 0];
  const modelY = -1.5 + (MODEL_Y_OFFSET[modelPath] ?? 0);
  const clonedScene = useMemo(() => cloneAndCustomize(scene, role), [scene, role]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(
      state.camera.position.x,
      groupRef.current.position.y,
      state.camera.position.z
    );
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={clonedScene} scale={scale} position={[0, modelY, 0]} rotation={modelRotation as [number, number, number]} />

      <Text
        position={[0, 1.8, 0]}
        fontSize={0.11}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000"
      >
        {label}
      </Text>

      {isSpeaking && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 32]} />
          <meshBasicMaterial color="#b8860b" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
