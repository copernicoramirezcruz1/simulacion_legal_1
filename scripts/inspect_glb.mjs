import { readFileSync } from 'fs';

const buf = readFileSync('persona.glb');
const magic = buf.slice(0, 4).toString();
console.log('Magic:', magic);

// GLB structure: header (12 bytes) + chunks
// Header: magic(4) + version(4) + length(4)
const version = buf.readUInt32LE(4);
const totalLength = buf.readUInt32LE(8);
console.log('Version:', version, 'Total length:', totalLength);

// Parse JSON chunk
let offset = 12;
const chunkLength = buf.readUInt32LE(offset);
offset += 4;
const chunkType = buf.readUInt32LE(offset);
offset += 4;
console.log('Chunk 1: type', '0x' + chunkType.toString(16), 'length', chunkLength);

const jsonData = buf.slice(offset, offset + chunkLength);
const json = JSON.parse(jsonData.toString());

console.log('\n--- GLTF JSON Structure ---');
console.log('Nodes:', json.nodes?.length || 0);
console.log('Meshes:', json.meshes?.length || 0);
console.log('Skins:', json.skins?.length || 0);
console.log('Animations:', json.animations?.length || 0);
console.log('Accessors:', json.accessors?.length || 0);
console.log('Materials:', json.materials?.length || 0);

// Check if any mesh has skinning (weights/joints attributes)
if (json.meshes) {
  json.meshes.forEach((mesh, i) => {
    const prims = mesh.primitives || [];
    prims.forEach((prim, j) => {
      const attrs = prim.attributes || {};
      const hasWeights = 'WEIGHTS_0' in attrs;
      const hasJoints = 'JOINTS_0' in attrs;
      console.log(`  Mesh[${i}].prim[${j}]: ${hasWeights ? 'HAS_WEIGHTS' : ''} ${hasJoints ? 'HAS_JOINTS' : ''} mode=${prim.mode}`);
    });
  });
}

// Check nodes for skin references
if (json.nodes) {
  let skinNodes = 0;
  json.nodes.forEach((node, i) => {
    if (node.skin !== undefined) {
      skinNodes++;
      console.log(`  Node[${i}] name="${node.name}" has SKIN ref=${node.skin}`);
    }
    if (node.mesh !== undefined && node.skin === undefined) {
      console.log(`  Node[${i}] name="${node.name}" mesh=${node.mesh} (NO SKIN - static mesh)`);
    }
  });
  console.log(`  Total nodes with skin: ${skinNodes}`);
}

// Check for armatures/bones
if (json.nodes) {
  const boneNodes = json.nodes.filter(n => n.name && (n.name.toLowerCase().includes('bone') || n.name.toLowerCase().includes('joint') || n.name.toLowerCase().includes('arm') || n.name.toLowerCase().includes('mixamo')));
  console.log(`  Bone-like nodes: ${boneNodes.length}`);
  if (boneNodes.length > 0) {
    boneNodes.slice(0, 5).forEach(n => console.log(`    - ${n.name}`));
  }
}

// Summary
const isSkinned = (json.skins?.length || 0) > 0;
const hasAnimations = (json.animations?.length || 0) > 0;
console.log('\n--- VERDICT ---');
if (isSkinned) {
  console.log('SKINNED MESH - tiene esqueleto/armature');
  console.log('Requiere SkeletonUtils.clone() en vez de scene.clone(true)');
} else {
  console.log('STATIC MESH - sin esqueleto');
  console.log('Compatible con scene.clone(true) directamente');
}
console.log('Animaciones:', hasAnimations ? 'SI tiene animaciones' : 'NO tiene animaciones');
