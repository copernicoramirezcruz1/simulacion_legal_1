import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFileSync } from 'fs';

class NodeFileReader {
  constructor() {
    this.onload = null;
    this.onloadend = null;
    this.onerror = null;
    this._listeners = {};
    this.result = null;
  }
  addEventListener(type, handler) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
  }
  removeEventListener(type, handler) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter((h) => h !== handler);
    }
  }
  _fire(type) {
    if ((type === 'load' || type === 'loadend') && this.onload) this.onload({ target: this });
    if (type === 'loadend' && this.onloadend) this.onloadend({ target: this });
    if (this._listeners[type]) {
      this._listeners[type].forEach((h) => h({ target: this }));
    }
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this._fire('load');
      this._fire('loadend');
    }).catch((err) => {
      if (this.onerror) this.onerror(err);
      if (this._listeners['error']) {
        this._listeners['error'].forEach((h) => h(err));
      }
    });
  }
}
globalThis.FileReader = NodeFileReader;

console.log('Polyfills ready');

function mat(color, { roughness = 0.7, metalness = 0 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function buildBody(group, app) {
  const w = app.body === 'stocky' ? 0.22 : app.body === 'slim' ? 0.16 : 0.19;
  const dw = w + 0.08;

  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10), mat('#1a1a2e', { roughness: 0.8 })).translateX(-0.07).translateY(-0.55));
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10), mat('#1a1a2e', { roughness: 0.8 })).translateX(0.07).translateY(-0.55));

  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), mat('#111', { roughness: 0.9 })).translateX(-0.07).translateY(-0.8).translateZ(0.03));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), mat('#111', { roughness: 0.9 })).translateX(0.07).translateY(-0.8).translateZ(0.03));

  group.add(new THREE.Mesh(new THREE.CylinderGeometry(w, dw, 0.85, 16), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateY(-0.1));
  group.add(new THREE.Mesh(new THREE.TorusGeometry(dw, 0.015, 4, 16), mat(app.robe, { roughness: 0.4, metalness: 0.15 })).translateY(-0.22).translateZ(0.16));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.22, 0.03), mat('#f5f0e8', { roughness: 0.5 })).translateY(0.15).translateZ(0.1));
  group.add(new THREE.Mesh(new THREE.TorusGeometry(w * 0.6, 0.02, 6, 10, Math.PI), mat('#f5f0e8', { roughness: 0.4 })).translateY(0.28).translateZ(0.12));

  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(-w * 0.85).translateY(0.32));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(w * 0.85).translateY(0.32));

  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(-w - 0.02).translateY(0.05).rotateZ(0.25));
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(w + 0.02).translateY(0.05).rotateZ(-0.25));

  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(-w - 0.09).translateY(-0.3).translateZ(-0.02).rotateX(0.3).rotateZ(0.1));
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 8), mat(app.robe, { roughness: 0.45, metalness: 0.08 })).translateX(w + 0.09).translateY(-0.3).translateZ(-0.02).rotateX(0.3).rotateZ(-0.1));

  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.055), mat('#d4a574', { roughness: 0.6 })).translateX(-w - 0.1).translateY(-0.52).translateZ(-0.04));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.055), mat('#d4a574', { roughness: 0.6 })).translateX(w + 0.1).translateY(-0.52).translateZ(-0.04));

  if (app.gender === 'male') {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), mat('#b8860b', { roughness: 0.2, metalness: 0.8 })).translateY(-0.08).translateZ(0.17));
  }
}

function buildHead(group, { skin, hair, gender }) {
  const h = new THREE.Group();

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), mat(skin, { roughness: 0.5 })));
  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 4), mat(skin, { roughness: 0.5 })).translateY(-0.07).translateZ(0.06));

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), mat('#fff', { roughness: 0.2 })).translateX(-0.05).translateY(0.03).translateZ(0.12));
  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), mat('#fff', { roughness: 0.2 })).translateX(0.05).translateY(0.03).translateZ(0.12));

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mat('#2d1b0e', { roughness: 0.1 })).translateX(-0.05).translateY(0.03).translateZ(0.138));
  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mat('#2d1b0e', { roughness: 0.1 })).translateX(0.05).translateY(0.03).translateZ(0.138));

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), mat('#000', { roughness: 0 })).translateX(-0.05).translateY(0.03).translateZ(0.145));
  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), mat('#000', { roughness: 0 })).translateX(0.05).translateY(0.03).translateZ(0.145));

  h.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.012), mat(hair, { roughness: 0.7 })).translateX(-0.05).translateY(0.055).translateZ(0.12).rotateZ(-0.1));
  h.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.012), mat(hair, { roughness: 0.7 })).translateX(0.05).translateY(0.055).translateZ(0.12).rotateZ(0.1));

  h.add(new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 8, 8), mat(skin, { roughness: 0.5 })).translateY(-0.01).translateZ(0.13).rotateX(0.2));
  h.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.008), mat('#c47a6a', { roughness: 0.5 })).translateY(-0.055).translateZ(0.13));

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(skin, { roughness: 0.5 })).translateX(-0.13).translateY(0.01).rotateY(0.4));
  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(skin, { roughness: 0.5 })).translateX(0.13).translateY(0.01).rotateY(-0.4));

  h.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(hair, { roughness: 0.6 })).translateY(0.04).translateZ(-0.05));

  if (gender === 'female') {
    h.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.03), mat(hair, { roughness: 0.5 })).translateX(-0.12).translateY(-0.08).translateZ(-0.04).rotateX(-0.15));
    h.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.03), mat(hair, { roughness: 0.5 })).translateX(0.12).translateY(-0.08).translateZ(-0.04).rotateX(-0.15));
    h.add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), mat(hair, { roughness: 0.5 })).translateY(0.16).translateZ(-0.06));
  } else {
    h.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(hair, { roughness: 0.6 })).translateX(-0.1).translateY(-0.01).translateZ(-0.02));
    h.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(hair, { roughness: 0.6 })).translateX(0.1).translateY(-0.01).translateZ(-0.02));
  }

  group.add(h);
}

function buildCharacter(name, app) {
  const root = new THREE.Group();
  root.name = name;

  const bodyGroup = new THREE.Group();
  buildBody(bodyGroup, app);
  root.add(bodyGroup);

  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), mat(app.skin, { roughness: 0.6 })).translateY(0.45));

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.6, 0);
  buildHead(headGroup, app);
  root.add(headGroup);

  return root;
}

const chars = {
  PRESIDENTE: { robe: '#1a1a2e', skin: '#d4a574', hair: '#888888', body: 'stocky', gender: 'male' },
  VOCAL:     { robe: '#1a1a2e', skin: '#c4956a', hair: '#3a2510', body: 'average', gender: 'male' },
  SECRETARIA:{ robe: '#1a3a2e', skin: '#f0d5b8', hair: '#1a0a00', body: 'slim', gender: 'female' },
  ACCIONANTE:{ robe: '#1a2a4e', skin: '#e8c9a0', hair: '#1a0a00', body: 'average', gender: 'male' },
  ACCIONADA: { robe: '#4a1a1a', skin: '#c49a6c', hair: '#2a1500', body: 'average', gender: 'male' },
  TERCERO:   { robe: '#2a1a3e', skin: '#deb887', hair: '#3a2010', body: 'slim', gender: 'male' },
};

async function exportAll() {
  const exporter = new GLTFExporter();
  console.log('Starting exports...');

  for (const [name, app] of Object.entries(chars)) {
    console.log(`Building ${name}...`);
    const model = buildCharacter(name, app);
    const scene = new THREE.Scene();
    scene.add(model);

    console.log(`Exporting ${name}...`);
    const glb = await new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (data) => {
          console.log(`  ${name} callback received, byteLength:`, data.byteLength);
          resolve(data);
        },
        (err) => {
          console.error(`  ${name} error:`, err);
          reject(err);
        },
        { binary: true, onlyVisible: true, truncateDrawRange: true }
      );
    }).catch(err => {
      console.error(`Failed for ${name}:`, err);
      return null;
    });

    if (glb) {
      const path = `public/models/${name.toLowerCase()}.glb`;
      writeFileSync(path, new Uint8Array(glb));
      console.log(`  Saved: ${path} (${glb.byteLength} bytes)`);
    } else {
      console.log(`  SKIPPED: ${name}`);
    }
  }
  console.log('Done!');
}

exportAll().catch(err => console.error('Fatal:', err));
