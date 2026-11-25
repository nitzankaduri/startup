import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const LOADER = typeof GLTFLoader === 'function' ? new GLTFLoader() : null;
if (LOADER && typeof DRACOLoader === 'function') {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  LOADER.setDRACOLoader(draco);
}
const CACHE = new Map();
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: '#1E1B4B', side: THREE.BackSide });
OUTLINE_MAT.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(objectNormal) * 0.03;');
};

export const STUDIO_MODELS = {
  hero_runner: '/models/kenney/character_player.glb',
  cyber_hero: '/models/kenney/character_player.glb',
  enemy_bot: '/models/kenney/character_enemy.glb',
  flying_creature: '/models/flying_creature.glb',
  sports_car: '/models/kenney/car_sports.glb',
  car_police: '/models/kenney/car_police.glb',
  milk_truck: '/models/kenney/car_police.glb',
  helmet_boss: '/models/DamagedHelmet.glb',
  fox: '/models/Fox.glb',
  starfighter: '/models/kenney/spaceship.glb',
  train_car: '/models/kenney/train_front.glb',
  train_carriage: '/models/kenney/train_carriage.glb',
  building_tower: '/models/kenney/building_city.glb',
  tree_stylized: '/models/kenney/tree_pine.glb',
  street_barrier: '/models/street_barrier.glb',
  crate: '/models/kenney/crate.glb',
  rock: '/models/rock.glb',
  drone: '/models/kenney/spaceship.glb',
  coin: '/models/kenney/coin_gold.glb',
};

function measureExactBounds(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const corner = new THREE.Vector3();
  root.traverse((obj) => {
    if (obj.isSkinnedMesh && obj.skeleton) obj.skeleton.update();
    if (!obj.isMesh || !obj.geometry || obj.userData._isOutline) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    const gb = obj.geometry.boundingBox;
    if (!gb) return;
    for (let x = 0; x < 2; x += 1) for (let y = 0; y < 2; y += 1) for (let z = 0; z < 2; z += 1) {
      corner.set(x ? gb.max.x : gb.min.x, y ? gb.max.y : gb.min.y, z ? gb.max.z : gb.min.z).applyMatrix4(obj.matrixWorld);
      box.expandByPoint(corner);
    }
  });
  return box;
}

function applyStylizedToonShading(root, tintHex, addOutline = false) {
  const tint = tintHex ? new THREE.Color(tintHex) : null;
  const targets = [];
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material || obj.userData._isOutline) return;
    obj.castShadow = true; obj.receiveShadow = false;
    const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const n = `${obj.name} ${src.name || ''}`.toLowerCase();
    const isTrim = /glass|window|windshield|wheel|tire|rim|chrome|light|eye|visor/.test(n);
    const col = src.color ? src.color.clone() : new THREE.Color('#FFFFFF');
    if (tint && !isTrim && (src.metalness ?? 0) < 0.78) col.lerp(tint, src.map ? 0.35 : 0.72);
    obj.material = new THREE.MeshStandardMaterial({
      color: col, map: src.map || null, roughness: isTrim ? 0.2 : 0.35, metalness: isTrim ? 0.45 : 0.05,
    });
    if (addOutline && !isTrim) targets.push(obj);
  });
  if (addOutline) {
    targets.forEach((obj) => {
      const hull = obj.isSkinnedMesh
        ? new THREE.SkinnedMesh(obj.geometry, OUTLINE_MAT)
        : new THREE.Mesh(obj.geometry, OUTLINE_MAT);
      hull.userData._isOutline = true;
      if (obj.isSkinnedMesh && obj.skeleton) hull.bind(obj.skeleton, obj.bindMatrix);
      else hull.scale.setScalar(1.03);
      obj.parent?.add(hull);
    });
  }
}

export function normalizeGlbClone(scene, options = {}) {
  const { targetHeight = 1.75, targetLength = 0, rotationY = 0, tintHex = null, outline = false } = options;
  const wrapper = new THREE.Group();
  const cloned = SkeletonUtils.clone(scene);
  if (rotationY) cloned.rotation.y = rotationY;
  applyStylizedToonShading(cloned, tintHex, outline);
  wrapper.add(cloned);

  const box = measureExactBounds(wrapper);
  const size = new THREE.Vector3(); const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const denom = targetLength > 0 ? Math.max(0.05, size.z) : Math.max(0.05, size.y);
  const scale = THREE.MathUtils.clamp((targetLength > 0 ? targetLength : targetHeight) / denom, 0.002, 25);
  cloned.scale.multiplyScalar(scale);
  cloned.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  wrapper.updateMatrixWorld(true);
  return wrapper;
}

export function createMixerController(root, animations = []) {
  if (!animations?.length) return null;
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  const mapClip = (target, keys) => {
    const clip = animations.find((a) => keys.some((k) => a.name.toLowerCase().includes(k)));
    if (clip) actions[target] = mixer.clipAction(clip);
  };
  mapClip('run', ['running', 'run', 'sprint', 'walk', 'gallop', 'fly']);
  mapClip('idle', ['idle', 'survey', 'standing']);
  mapClip('jump', ['jump', 'fall']);
  mapClip('attack', ['attack', 'punch', 'shoot']);
  const cur = actions.run || actions.idle || mixer.clipAction(animations[0]);
  cur?.play();
  return { root, mixer, actions, activeAction: cur, currentState: 'run' };
}

export function loadStudioGlb(url, onLoad) {
  if (!url || !LOADER) return;
  if (CACHE.has(url)) {
    const rec = CACHE.get(url);
    if (rec.gltf) onLoad(rec.gltf); else if (!rec.failed) rec.waiters.push(onLoad);
    return;
  }
  const rec = { gltf: null, failed: false, waiters: [onLoad] }; CACHE.set(url, rec);
  LOADER.load(url, (gltf) => { rec.gltf = gltf; rec.waiters.forEach((fn) => fn(gltf)); rec.waiters.length = 0; }, undefined, () => { rec.failed = true; rec.waiters.length = 0; });
}

export function attachNormalizedGlb(url, containerGroup, options = {}, onReady = null) {
  if (!url || !containerGroup) return;
  loadStudioGlb(url, (gltf) => {
    const normalized = normalizeGlbClone(gltf.scene, options);
    containerGroup.clear();
    containerGroup.add(normalized);
    containerGroup.userData.glbReady = true;
    containerGroup.userData.joints = null;
    const rigCtrl = createMixerController(normalized, gltf.animations || []);
    onReady?.(rigCtrl, normalized, gltf);
  });
}

export function preloadStudioModels() {
  Object.values(STUDIO_MODELS).forEach((url) => loadStudioGlb(url, () => {}));
}
