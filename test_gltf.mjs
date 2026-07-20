import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

class NodeFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  readAsArrayBuffer(blob) {
    console.log('FileReader.readAsArrayBuffer, blob size:', blob.size);
    blob.arrayBuffer().then((buf) => {
      console.log('FileReader resolved, size:', buf.byteLength);
      this.result = buf;
      if (this.onload) this.onload({ target: this });
    }).catch((err) => {
      console.error('FileReader error:', err);
      if (this.onerror) this.onerror(err);
    });
  }
}
globalThis.FileReader = NodeFileReader;

console.log('Creating scene...');
const scene = new THREE.Scene();
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'red' })
);
scene.add(mesh);

console.log('Exporting...');
const exporter = new GLTFExporter();
exporter.parse(scene, 
  (glb) => {
    console.log('Export success! Size:', glb?.byteLength, 'Type:', glb?.constructor?.name);
    process.exit(0);
  },
  (err) => {
    console.error('Export error:', err);
    process.exit(1);
  },
  { binary: true }
);

console.log('parse() called');
