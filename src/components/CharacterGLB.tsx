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
  SENTENCIA_FINAL: '#4a5a8a',
};

const ROLE_HAIR_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#b0b0b0',
  VOCAL: '#3a2010',
  SECRETARIA: '#2a1a0a',
  ACCIONANTE: '#1a1a1a',
  ACCIONADA: '#2a1a0a',
  TERCERO: '#4a3520',
  SENTENCIA_FINAL: '#b0b0b0',
};

const ROLE_SKIN_TONES: Record<CharacterRole, string> = {
  PRESIDENTE: '#d4b896',
  VOCAL: '#c49a6c',
  SECRETARIA: '#d4a574',
  ACCIONANTE: '#c49a6c',
  ACCIONADA: '#d4a574',
  TERCERO: '#b8845a',
  SENTENCIA_FINAL: '#d4b896',
};

const ROLE_TIE_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#8b1a1a',
  VOCAL: '#1a3a6e',
  SECRETARIA: '#1a5a1a',
  ACCIONANTE: '#1a3a6e',
  ACCIONADA: '#6e1a1a',
  TERCERO: '#4a1a6e',
  SENTENCIA_FINAL: '#8b1a1a',
};

const ROLE_SHIRT_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#f5f0e8',
  VOCAL: '#eef0f5',
  SECRETARIA: '#f5f0e8',
  ACCIONANTE: '#eef0f5',
  ACCIONADA: '#f5f0e8',
  TERCERO: '#f0f0ee',
  SENTENCIA_FINAL: '#f5f0e8',
};

const ROLE_LIPS_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#b88a7a',
  VOCAL: '#c47a6a',
  SECRETARIA: '#c47a6a',
  ACCIONANTE: '#c47a6a',
  ACCIONADA: '#c47a6a',
  TERCERO: '#c47a6a',
  SENTENCIA_FINAL: '#b88a7a',
};

const MODEL_MAP: Record<CharacterRole, string> = {
  PRESIDENTE: '/models/persona.glb',
  VOCAL: '/models/persona.glb',
  SECRETARIA: '/models/mujer.glb',
  ACCIONANTE: '/models/persona.glb',
  ACCIONADA: '/models/mujer.glb',
  TERCERO: '/models/persona.glb',
  SENTENCIA_FINAL: '/models/persona.glb',
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

function tintMeshMaterial(
  material: THREE.Material | THREE.Material[],
  color: THREE.Color,
  mode: 'replace' | 'multiply'
): THREE.Material | THREE.Material[] {
  if (Array.isArray(material)) {
    return material.map((m) => tintSingleMaterial(m, color, mode));
  }
  return tintSingleMaterial(material, color, mode);
}

function tintSingleMaterial(
  m: THREE.Material,
  color: THREE.Color,
  mode: 'replace' | 'multiply'
): THREE.Material {
  if (!(m instanceof THREE.MeshStandardMaterial)) return m;
  const nm = m.clone();
  if (mode === 'replace') {
    nm.color.copy(color);
  } else {
    nm.color.multiply(color);
  }
  return nm;
}

function cloneAndCustomize(scene: THREE.Group, role: CharacterRole): THREE.Group {
  const clone = scene.clone(true);
  const isMujer = MODEL_MAP[role] === '/models/mujer.glb';

  if (isMujer) {
    const tint = new THREE.Color(ROLE_SUIT_COLORS[role]);
    // Lighten the dark role color so the multiply tint stays visible
    // without turning the model black.
    tint.lerp(new THREE.Color('#ffffff'), 0.35);

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material;
      child.material = tintMeshMaterial(mat, tint, 'multiply');
    });
    return clone;
  }

  const suitColor = new THREE.Color(ROLE_SUIT_COLORS[role]);
  const hairColor = new THREE.Color(ROLE_HAIR_COLORS[role]);
  const skinColor = new THREE.Color(ROLE_SKIN_TONES[role]);
  const tieColor = new THREE.Color(ROLE_TIE_COLORS[role]);
  const shirtColor = new THREE.Color(ROLE_SHIRT_COLORS[role]);
  const lipsColor = new THREE.Color(ROLE_LIPS_COLORS[role]);

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const name = child.name.toLowerCase();

    if (name.includes('floor')) {
      child.visible = false;
      return;
    }

    // All mesh names start with the model prefix "man_in_suit_".
    // Strip it so "hair", "skin", "tie"... are matched correctly
    // ("man_in_suit_hair_0" also contains "suit", so a naive includes() fails).
    const part = name.replace(/^man_in_suit_/, '').replace(/_\d+$/, '');

    if (part === 'suit') {
      child.material = tintMeshMaterial(child.material, suitColor, 'replace');
    } else if (part === 'hair') {
      child.material = tintMeshMaterial(child.material, hairColor, 'replace');
    } else if (part === 'skin') {
      child.material = tintMeshMaterial(child.material, skinColor, 'replace');
    } else if (part === 'tie') {
      child.material = tintMeshMaterial(child.material, tieColor, 'replace');
    } else if (part === 'shirt') {
      child.material = tintMeshMaterial(child.material, shirtColor, 'replace');
    } else if (part === 'lips') {
      child.material = tintMeshMaterial(child.material, lipsColor, 'replace');
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
  const modelGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.lookAt(
        state.camera.position.x,
        groupRef.current.position.y,
        state.camera.position.z
      );
    }

    if (!modelGroupRef.current) return;

    if (isSpeaking) {
      modelGroupRef.current.position.y = modelY + Math.sin(t * 8) * 0.04;
      modelGroupRef.current.rotation.x = 0.06 + Math.sin(t * 8) * 0.035;
      modelGroupRef.current.rotation.z = Math.sin(t * 3.7) * 0.015;
    } else {
      modelGroupRef.current.position.y = modelY + Math.sin(t * 1.5) * 0.006;
      modelGroupRef.current.rotation.x = Math.sin(t * 3) * 0.005;
      modelGroupRef.current.rotation.z = 0;
    }

    if (ringRef.current) {
      const ringScale = isSpeaking ? 1 + Math.sin(t * 6) * 0.15 : 1;
      ringRef.current.scale.setScalar(ringScale);
      ringRef.current.position.y = modelGroupRef.current.position.y - modelY + 0.12;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <group ref={modelGroupRef} position={[0, modelY, 0]} scale={scale} rotation={modelRotation as [number, number, number]}>
        <primitive object={clonedScene} />
      </group>

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

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.4, 32]} />
        <meshBasicMaterial color="#b8860b" transparent opacity={isSpeaking ? 0.8 : 0.25} />
      </mesh>
    </group>
  );
}
