import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const origRead = globalThis.FileReader;
class NodeFileReader {
  constructor() {
    console.log('FileReader constructed');
    this.onload = null;
    this.onerror = null;
  }
  readAsArrayBuffer(blob) {
    console.log('readAsArrayBuffer, blob size:', blob.size);
    blob.arrayBuffer().then((buf) => {
      console.log('arrayBuffer resolved, size:', buf.byteLength);
      this.result = buf;
      if (this.onload) {
        console.log('calling onload');
        this.onload({ target: this });
      } else {
        console.log('NO onload handler set!');
      }
    });
  }
}
globalThis.FileReader = NodeFileReader;

const scene = new THREE.Scene();
scene.add(new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'red' })
));

console.log('--- Starting export ---');
const exporter = new GLTFExporter();
exporter.parse(scene, 
  (result) => {
    console.log('CALLBACK FIRED! Result size:', result?.byteLength);
  },
  (err) => {
    console.error('ERROR:', err);
  },
  { binary: true }
);

setTimeout(() => {
  console.log('--- 5s timeout, exiting ---');
  process.exit(0);
}, 5000);
