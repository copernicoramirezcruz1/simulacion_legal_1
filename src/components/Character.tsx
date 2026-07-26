import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ROLE_LABELS } from '../types';
import type { CharacterRole } from '../types';

interface CharacterProps {
  role: CharacterRole;
  position: [number, number, number];
  rotation?: [number, number, number];
  isSpeaking: boolean;
  visible?: boolean;
}

interface Appearance {
  skin: string;
  hairColor: string;
  hairStyle: 'short' | 'long' | 'bun' | 'balding' | 'greyShort';
  eyeColor: string;
  robeColor: string;
  accessory: 'medallion' | 'glasses' | 'none';
  bodyType: 'slim' | 'average' | 'stocky';
  age: 'young' | 'adult' | 'senior';
  gender: 'male' | 'female';
}

const APPEARANCES: Record<CharacterRole, Appearance> = {
  PRESIDENTE: {
    skin: '#d4a574',
    hairColor: '#888888',
    hairStyle: 'greyShort',
    eyeColor: '#2d1b0e',
    robeColor: '#1a1a2e',
    accessory: 'medallion',
    bodyType: 'stocky',
    age: 'senior',
    gender: 'male',
  },
  VOCAL: {
    skin: '#c4956a',
    hairColor: '#3a2510',
    hairStyle: 'short',
    eyeColor: '#1a0f05',
    robeColor: '#1a1a2e',
    accessory: 'glasses',
    bodyType: 'average',
    age: 'adult',
    gender: 'male',
  },
  SECRETARIA: {
    skin: '#f0d5b8',
    hairColor: '#1a0a00',
    hairStyle: 'bun',
    eyeColor: '#2d1b0e',
    robeColor: '#1a3a2e',
    accessory: 'none',
    bodyType: 'slim',
    age: 'adult',
    gender: 'female',
  },
  ACCIONANTE: {
    skin: '#e8c9a0',
    hairColor: '#1a0a00',
    hairStyle: 'short',
    eyeColor: '#2d1b0e',
    robeColor: '#1a2a4e',
    accessory: 'none',
    bodyType: 'average',
    age: 'young',
    gender: 'male',
  },
  ACCIONADA: {
    skin: '#c49a6c',
    hairColor: '#2a1500',
    hairStyle: 'short',
    eyeColor: '#1a0f05',
    robeColor: '#4a1a1a',
    accessory: 'none',
    bodyType: 'average',
    age: 'adult',
    gender: 'male',
  },
  TERCERO: {
    skin: '#deb887',
    hairColor: '#3a2010',
    hairStyle: 'short',
    eyeColor: '#2d1b0e',
    robeColor: '#2a1a3e',
    accessory: 'none',
    bodyType: 'slim',
    age: 'adult',
    gender: 'male',
  },
  SENTENCIA_FINAL: {
    skin: '#d4a574',
    hairColor: '#888888',
    hairStyle: 'greyShort',
    eyeColor: '#2d1b0e',
    robeColor: '#1a1a2e',
    accessory: 'medallion',
    bodyType: 'stocky',
    age: 'senior',
    gender: 'male',
  },
};

function Face({
  skin,
  eyeColor,
  hairColor,
  accessory,
  eyeOffset = 0.06,
}: {
  skin: string;
  eyeColor: string;
  hairColor: string;
  accessory: Appearance['accessory'];
  eyeOffset?: number;
}) {
  return (
    <group>
      {/* Head base */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Chin/jaw definition */}
      <mesh position={[0, -0.08, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 4]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Eye sockets - slight indentations */}
      <mesh position={[-eyeOffset, 0.03, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.5} transparent opacity={0.5} />
      </mesh>
      <mesh position={[eyeOffset, 0.03, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.5} transparent opacity={0.5} />
      </mesh>

      {/* Eyes - whites */}
      <mesh position={[-eyeOffset, 0.03, 0.14]} castShadow>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[eyeOffset, 0.03, 0.14]} castShadow>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Iris */}
      <mesh position={[-eyeOffset, 0.03, 0.16]} castShadow>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshStandardMaterial color={eyeColor} roughness={0.1} />
      </mesh>
      <mesh position={[eyeOffset, 0.03, 0.16]} castShadow>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshStandardMaterial color={eyeColor} roughness={0.1} />
      </mesh>

      {/* Pupils */}
      <mesh position={[-eyeOffset, 0.03, 0.168]} castShadow>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshStandardMaterial color="#000000" roughness={0} />
      </mesh>
      <mesh position={[eyeOffset, 0.03, 0.168]} castShadow>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshStandardMaterial color="#000000" roughness={0} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-eyeOffset, 0.06, 0.14]} rotation={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[0.04, 0.008, 0.015]} />
        <meshStandardMaterial color={hairColor} roughness={0.6} />
      </mesh>
      <mesh position={[eyeOffset, 0.06, 0.14]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.04, 0.008, 0.015]} />
        <meshStandardMaterial color={hairColor} roughness={0.6} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.01, 0.15]} rotation={[0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.02, 0.05, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, -0.06, 0.15]} castShadow>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <meshStandardMaterial color="#c47a6a" roughness={0.4} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.15, 0.01, 0]} rotation={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0.15, 0.01, 0]} rotation={[0, -0.4, 0]} castShadow>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Glasses */}
      {accessory === 'glasses' && (
        <group>
          {/* Frame left */}
          <mesh position={[-eyeOffset, 0.03, 0.17]}>
            <torusGeometry args={[0.035, 0.006, 4, 16]} />
            <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Frame right */}
          <mesh position={[eyeOffset, 0.03, 0.17]}>
            <torusGeometry args={[0.035, 0.006, 4, 16]} />
            <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 0.035, 0.17]}>
            <boxGeometry args={[eyeOffset * 1.6, 0.004, 0.004]} />
            <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Hair({ style, color }: { style: Appearance['hairStyle']; color: string }) {
  if (style === 'balding') {
    return (
      <group>
        <mesh position={[0, 0.08, -0.1]}>
          <sphereGeometry args={[0.17, 16, 8, 0, Math.PI * 2, Math.PI / 2.2, Math.PI / 2.2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[-0.14, 0.05, -0.02]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.14, 0.05, -0.02]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (style === 'greyShort') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.06]}>
          <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[-0.12, -0.02, -0.02]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.12, -0.02, -0.02]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (style === 'short') {
    return (
      <group>
        <mesh position={[0, 0.06, -0.06]}>
          <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[-0.12, 0.0, -0.02]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.12, 0.0, -0.02]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (style === 'long') {
    return (
      <group>
        <mesh position={[0, 0.04, -0.08]}>
          <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[-0.14, -0.1, -0.04]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.15, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[0.14, -0.1, -0.04]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.15, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  // Bun
  return (
    <group>
      <mesh position={[0, 0.04, -0.08]}>
        <sphereGeometry args={[0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.18, -0.08]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Body({
  robeColor,
  bodyType,
  gender,
}: {
  robeColor: string;
  bodyType: Appearance['bodyType'];
  gender: Appearance['gender'];
}) {
  const torsoWidth = bodyType === 'stocky' ? 0.3 : bodyType === 'slim' ? 0.2 : 0.25;
  const torsoDepth = 0.18;

  return (
    <group>
      {/* Legs */}
      <mesh position={[-0.1, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.55, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.55, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.1, -0.83, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.22]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, -0.83, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.22]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* Toga / Robe (wide at bottom, narrow at top) */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[torsoWidth, torsoWidth + 0.12, 0.9, 16]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Belt / waist band */}
      <mesh position={[0, -0.2, torsoDepth * 0.9]} castShadow>
        <torusGeometry args={[torsoWidth + 0.05, 0.02, 4, 16]} />
        <meshStandardMaterial color={robeColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Shirt collar */}
      <mesh position={[0, 0.28, torsoDepth * 0.7]}>
        <torusGeometry args={[torsoWidth * 0.7, 0.025, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.4} />
      </mesh>

      {/* Chest area */}
      <mesh position={[0, 0.15, torsoDepth * 0.6]}>
        <boxGeometry args={[torsoWidth * 0.7, 0.25, 0.03]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.4} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-torsoWidth * 0.9, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[torsoWidth * 0.9, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Arms - upper */}
      <mesh position={[-torsoWidth - 0.02, 0.05, 0]} rotation={[0, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.55, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[torsoWidth + 0.02, 0.05, 0]} rotation={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.55, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Forearms */}
      <mesh position={[-torsoWidth - 0.1, -0.35, -0.02]} rotation={[0.3, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.35, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[torsoWidth + 0.1, -0.35, -0.02]} rotation={[0.3, 0, -0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.35, 8]} />
        <meshStandardMaterial color={robeColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Hands */}
      <mesh position={[-torsoWidth - 0.12, -0.55, -0.04]} castShadow>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color="#d4a574" roughness={0.6} />
      </mesh>
      <mesh position={[torsoWidth + 0.12, -0.55, -0.04]} castShadow>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color="#d4a574" roughness={0.6} />
      </mesh>

      {/* Medallion */}
      {gender === 'male' && (
        <mesh position={[0, -0.05, torsoDepth * 0.95]} castShadow>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#b8860b" roughness={0.2} metalness={0.8} />
        </mesh>
      )}
    </group>
  );
}

export function Character({
  role,
  position,
  rotation = [0, 0, 0],
  isSpeaking,
  visible = true,
}: CharacterProps) {
  const app = APPEARANCES[role];
  const label = ROLE_LABELS[role];
  const headRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (headRef.current && isSpeaking) {
      headRef.current.position.y = 1.72 + Math.sin(state.clock.elapsedTime * 8) * 0.03;
    }
    if (groupRef.current) {
      groupRef.current.lookAt(
        state.camera.position.x,
        groupRef.current.position.y,
        state.camera.position.z
      );
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Shadow */}
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#111" transparent opacity={0.3} />
      </mesh>

      <Body robeColor={app.robeColor} bodyType={app.bodyType} gender={app.gender} />

      {/* Neck */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={app.skin} roughness={0.6} />
      </mesh>

      {/* Head group */}
      <group ref={headRef} position={[0, 0.7, 0]}>
        <Face
          skin={app.skin}
          eyeColor={app.eyeColor}
          hairColor={app.hairColor}
          accessory={app.accessory}
        />
        <Hair style={app.hairStyle} color={app.hairColor} />
      </group>

      {/* Name tag */}
      <Text
        position={[0, -1.15, 0]}
        fontSize={0.11}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000"
      >
        {label}
      </Text>

      {/* Speaking indicator */}
      {isSpeaking && (
        <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 32]} />
          <meshBasicMaterial color={app.robeColor} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
