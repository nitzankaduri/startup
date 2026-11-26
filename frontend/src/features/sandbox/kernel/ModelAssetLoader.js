import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STUDIO_PACK_URLS, normalizeStudioAsset } from './StudioAssetRegistry';

const LOADER = typeof GLTFLoader === 'function' ? new GLTFLoader() : null;
if (LOADER && typeof DRACOLoader === 'function') {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  LOADER.setDRACOLoader(draco);
}
const CACHE = new Map();

export const STUDIO_MODELS = {
  hero_runner: '/models/Xbot.glb',
  cyber_hero: '/models/Soldier.glb',
  enemy_bot: '/models/RobotExpressive.glb',
  enemy_monster: '/models/RobotExpressive.glb',
  flying_creature: '/models/Flamingo.glb',
  sports_car: '/models/ferrari.glb',
  car_sports: '/models/ferrari.glb',
  car_police: '/models/car_police.glb',
  milk_truck: '/models/CesiumMilkTruck.glb',
  starfighter: '/models/Flamingo.glb',
  drone: '/models/Flamingo.glb',
  building_tower: '/models/building_tower.glb',
  building_alt: '/models/city_building.glb',
  tree_stylized: '/models/tree_stylized.glb',
  coin: '/models/coin.glb',
  fox: '/models/Fox.glb',
};

export function normalizeGlbClone(scene, options = {}) {
  return normalizeStudioAsset(scene, options);
}

export function createMixerController(root, animations = []) {
  if (!animations?.length) return null;
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  const mapClip = (target, keys) => {
    const clip = animations.find((a) => keys.some((k) => a.name.toLowerCase().includes(k)));
    if (clip) actions[target] = mixer.clipAction(clip);
  };
  mapClip('run', ['running', 'run', 'sprint', 'walk', 'gallop', 'fly', 'flamingo']);
  mapClip('idle', ['idle', 'survey', 'standing']);
  mapClip('jump', ['jump', 'walkjump', 'fall']);
  mapClip('attack', ['punch', 'attack', 'shoot', 'wave']);
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
    const normalized = normalizeStudioAsset(gltf.scene, options);
    containerGroup.clear();
    containerGroup.add(normalized);
    containerGroup.userData.glbReady = true;
    containerGroup.userData.joints = null;
    const rigCtrl = createMixerController(normalized, gltf.animations || []);
    onReady?.(rigCtrl, normalized, gltf);
  });
}

export function preloadStudioModels() {
  Object.values(STUDIO_PACK_URLS).forEach((url) => loadStudioGlb(url, () => {}));
}
