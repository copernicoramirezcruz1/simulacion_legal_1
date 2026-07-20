import { Text, SpotLight } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { CharacterRole } from '../types';
import { CharacterGLB } from './CharacterGLB';
import { EscudoBolivia } from './EscudoBolivia';
import {
  getWoodTexture,
  getDarkWoodTexture,
  getMarbleTexture,
  getPanelTexture,
  getFloorTexture,
  getCarpetTexture,
  getFabricTexture,
} from '../utils/textures';

interface CharacterConfig {
  role: CharacterRole;
  position: [number, number, number];
  rotation?: [number, number, number];
  spotlightTarget: [number, number, number];
}

interface CourtroomProps {
  speakingRole: CharacterRole | null;
  activeRoles: CharacterRole[];
}

const CHARACTER_SPOT_OFFSET: [number, number, number] = [0, 4.5, 1.5];

const ALL_CHARACTERS: CharacterConfig[] = [
  { role: 'PRESIDENTE', position: [-0.7, 0, -6.3], rotation: [0, 0.1, 0], spotlightTarget: [-0.7, 1.0, -6.0] },
  { role: 'VOCAL', position: [0.7, 0, -6.3], rotation: [0, -0.1, 0], spotlightTarget: [0.7, 1.0, -6.0] },
  { role: 'SECRETARIA', position: [-3.2, 0, -5.3], rotation: [0, 0.4, 0], spotlightTarget: [-3.2, 1.0, -5.0] },
  { role: 'ACCIONANTE', position: [-2.8, 0, -0.45], rotation: [0, 0.6, 0], spotlightTarget: [-2.8, 1.0, -0.15] },
  { role: 'ACCIONADA', position: [2.8, 0, -0.45], rotation: [0, -0.6, 0], spotlightTarget: [2.8, 1.0, -0.15] },
  { role: 'TERCERO', position: [0, 0, -1.2], rotation: [0, 0, 0], spotlightTarget: [0, 1.0, -0.9] },
];

function Chair({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const woodTex = getWoodTexture();
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial map={woodTex} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.25, -0.23]} castShadow>
        <boxGeometry args={[0.48, 0.55, 0.06]} />
        <meshStandardMaterial map={woodTex} roughness={0.5} metalness={0.1} />
      </mesh>
      {[[-0.18, -0.2, -0.18], [0.18, -0.2, -0.18], [-0.18, -0.2, 0.18], [0.18, -0.2, 0.18]].map(([lx, ly, lz], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SpeakingSpotlight({ char }: { char: CharacterConfig }) {
  const targetObj = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(...char.spotlightTarget);
    return obj;
  }, [char.spotlightTarget]);

  return (
    <>
      <primitive object={targetObj} />
      <SpotLight
        position={[
          char.position[0] + CHARACTER_SPOT_OFFSET[0],
          char.position[1] + CHARACTER_SPOT_OFFSET[1],
          char.position[2] + CHARACTER_SPOT_OFFSET[2],
        ]}
        target={targetObj}
        angle={0.35}
        penumbra={0.5}
        intensity={10}
        distance={12}
        decay={2}
        color="#ffffff"
        castShadow
        shadow-bias={-0.0001}
      />
    </>
  );
}

function DeskBody({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  const woodTex = getWoodTexture();
  return (
    <>
      <mesh position={position} receiveShadow castShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial map={woodTex} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[position[0], position[1] + args[1] / 2 - 0.05, position[2]]} receiveShadow castShadow>
        <boxGeometry args={[args[0] - 0.15, 0.12, args[2] - 0.1]} />
        <meshStandardMaterial map={woodTex} roughness={0.35} metalness={0.15} />
      </mesh>
    </>
  );
}

export function Courtroom({ speakingRole, activeRoles }: CourtroomProps) {
  const activeSet = new Set(activeRoles);
  const floorTex = getFloorTexture();
  const darkWoodTex = getDarkWoodTexture();
  const marbleTex = getMarbleTexture();
  const panelTex = getPanelTexture();
  const carpetTex = getCarpetTexture();
  const fabricTex = getFabricTexture();

  return (
    <group>
      {/* Floor with tiles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Carpet runner in center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, 0]} receiveShadow>
        <planeGeometry args={[4, 10]} />
        <meshStandardMaterial map={carpetTex} roughness={0.8} />
      </mesh>

      {/* Judge Bench - elevated platform */}
      <mesh position={[0, -0.8, -5.5]} receiveShadow castShadow>
        <boxGeometry args={[7, 0.5, 4]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Judge Bench step */}
      <mesh position={[0, -1.05, -4]} receiveShadow castShadow>
        <boxGeometry args={[5, 0.15, 1]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Judge Desk surface */}
      <mesh position={[0, -0.2, -5.5]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.12, 1]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Judge Desk front panel */}
      <mesh position={[0, -0.5, -5]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.6, 0.15]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Side desks - Accionante */}
      <DeskBody position={[-2.8, -0.7, 0]} args={[1.2, 0.9, 0.5]} />

      {/* Side desks - Accionada */}
      <DeskBody position={[2.8, -0.7, 0]} args={[1.2, 0.9, 0.5]} />

      {/* Secretary desk */}
      <DeskBody position={[-3.2, -0.7, -4.2]} args={[1.5, 0.9, 1.8]} />

      {/* Tercero desk */}
      {activeSet.has('TERCERO') && (
        <DeskBody position={[0, -0.7, -0.8]} args={[1.2, 0.9, 0.5]} />
      )}

      {/* Back wall with paneling */}
      <mesh position={[0, 2, -7.5]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial map={panelTex} roughness={0.8} />
      </mesh>

      {/* Wall panels */}
      <mesh position={[-4, 1.5, -7.45]} receiveShadow>
        <boxGeometry args={[3, 5, 0.1]} />
        <meshStandardMaterial map={panelTex} roughness={0.7} />
      </mesh>
      <mesh position={[4, 1.5, -7.45]} receiveShadow>
        <boxGeometry args={[3, 5, 0.1]} />
        <meshStandardMaterial map={panelTex} roughness={0.7} />
      </mesh>

      {/* Draped fabric behind bench */}
      <mesh position={[0, 0.5, -7.2]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial map={fabricTex} roughness={0.9} />
      </mesh>

      {/* Escudo de Bolivia */}
      <EscudoBolivia position={[0, 3.5, -7.35]} />

      {/* Escudo frame */}
      <mesh position={[0, 3.5, -7.3]}>
        <ringGeometry args={[0.55, 0.6, 32]} />
        <meshStandardMaterial color="#b8860b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Columns with marble texture */}
      {[-4.5, -2.5, 2.5, 4.5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.5, -7.2]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 5, 8]} />
            <meshStandardMaterial map={marbleTex} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[x, -1.3, -7.2]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.2, 8]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[x, 3.1, -7.2]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.2, 8]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Tribunal sign */}
      <Text
        position={[0, 5.0, -7.35]}
        fontSize={0.3}
        color="#b8860b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        TRIBUNAL DE GARANTIAS CONSTITUCIONALES
      </Text>

      {/* Character spotlights */}
      {ALL_CHARACTERS.map((cfg) =>
        speakingRole === cfg.role ? (
          <SpeakingSpotlight key={`spot-${cfg.role}`} char={cfg} />
        ) : null
      )}

      {/* Characters */}
      {ALL_CHARACTERS.map((cfg) =>
        activeSet.has(cfg.role) ? (
          <CharacterGLB
            key={cfg.role}
            role={cfg.role}
            position={cfg.position}
            rotation={cfg.rotation}
            isSpeaking={speakingRole === cfg.role}
            visible={true}
          />
        ) : null
      )}
    </group>
  );
}
