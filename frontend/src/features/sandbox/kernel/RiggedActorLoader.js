import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createAnimatedRig } from './AnimatedCharacterRig';

const LOADER = new GLTFLoader();
const CACHE = new Map();

/** Non-blocking GLB loader returning cached { scene, animations } or invoking onReady asynchronously. */
export function attachRiggedGlbAsync(url, containerGroup, options, onRigCreated) {
  if (!url || !containerGroup) return;
  const mount = (gltf) => {
    const rig = createAnimatedRig(gltf.scene, gltf.animations || [], options);
    containerGroup.clear();
    containerGroup.add(rig.root);
    onRigCreated(rig);
  };
  if (CACHE.has(url)) {
    const entry = CACHE.get(url);
    if (entry.gltf) mount(entry.gltf);
    else entry.waiters.push(mount);
    return;
  }
  const rec = { gltf: null, waiters: [mount] };
  CACHE.set(url, rec);
  LOADER.load(url, (gltf) => {
    rec.gltf = gltf;
    rec.waiters.forEach((fn) => fn(gltf));
    rec.waiters.length = 0;
  }, undefined, () => { /* Keep instant procedural articulated fallback */ });
}
