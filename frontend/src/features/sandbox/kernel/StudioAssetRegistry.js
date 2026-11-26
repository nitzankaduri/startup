import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export const STUDIO_PACK_URLS = {
  hero_stylized: '/models/Xbot.glb',
  hero_soldier: '/models/Soldier.glb',
  enemy_guard: '/models/RobotExpressive.glb',
  enemy_monster: '/models/RobotExpressive.glb',
  fox: '/models/Fox.glb',
  flamingo: '/models/Flamingo.glb',
  sports_car: '/models/ferrari.glb',
  police_cruiser: '/models/car_police.glb',
  starfighter: '/models/Flamingo.glb',
  city_building_a: '/models/building_tower.glb',
  city_building_b: '/models/city_building.glb',
  stylized_tree: '/models/tree_stylized.glb',
  gold_coin: '/models/coin.glb',
};

export const STUDIO_CATEGORY_BOUNDS = {
  character: { targetHeight: 1.75, rotationY: Math.PI },
  vehicle: { targetHeight: 1.45, targetLength: 4.2, rotationY: 0 },
  train: { targetHeight: 2.65, targetLength: 10.8, rotationY: Math.PI },
  starfighter: { targetHeight: 1.45, targetLength: 2.6, rotationY: Math.PI },
  building: { targetHeight: 12.0, rotationY: 0 },
  tree: { targetHeight: 4.8, rotationY: 0 },
  coin: { targetHeight: 0.9, rotationY: 0 },
};

const TRIM_RX = /glass|window|windshield|wheel|tire|rim|chrome|metal|visor|black|joint/;
const GLOW_RX = /headlight|taillight|lights|leds|beacon|lamp|bulb|siren|neon|laser/;

function tuneSingleMaterial(src, tint, isCoin) {
  if (!src) return src;
  const n = (src.name || '').toLowerCase();
  const isTrim = TRIM_RX.test(n);
  const isGlow = GLOW_RX.test(n);
  if (src.map) src.map.colorSpace = THREE.SRGBColorSpace;
  const col = src.color ? src.color.clone() : new THREE.Color('#FFFFFF');
  if (tint && !isTrim && !isGlow && (src.metalness ?? 0) < 0.75) {
    col.lerp(tint, src.map ? 0.25 : 0.42);
  }
  const mat = new THREE.MeshStandardMaterial({
    color: col,
    map: src.map || null,
    normalMap: src.normalMap || null,
    roughness: isCoin ? 0.16 : isTrim ? 0.18 : (src.roughness ?? 0.36),
    metalness: isCoin ? 0.9 : isTrim ? 0.78 : Math.max(0.12, src.metalness ?? 0.18),
    envMapIntensity: isCoin || isTrim ? 1.4 : 1.1,
  });
  if (isGlow) {
    mat.emissive.copy(col);
    mat.emissiveIntensity = 1.75;
  } else if (isCoin) {
    mat.emissive.set('#F59E0B');
    mat.emissiveIntensity = 0.32;
  }
  return mat;
}

/** Preserves multi-material slots on RobotExpressive, Xbot & Ferrari while boosting PBR reflections. */
export function enhanceStudioMaterials(root, { tintHex = null, isCoin = false } = {}) {
  const tint = tintHex ? new THREE.Color(tintHex) : null;
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m) => tuneSingleMaterial(m, tint, isCoin));
    } else {
      obj.material = tuneSingleMaterial(obj.material, tint, isCoin);
    }
  });
}

/** Normalizes any local GLB using Three.js Box3.setFromObject (skeleton-aware, grounded y=0, facing -Z). */
export function normalizeStudioAsset(scene, options = {}) {
  const cat = STUDIO_CATEGORY_BOUNDS[options.category] || {};
  const targetHeight = options.targetHeight ?? cat.targetHeight ?? 1.75;
  const targetLength = options.targetLength ?? cat.targetLength ?? 0;
  const rotationY = options.rotationY ?? cat.rotationY ?? Math.PI;

  const wrapper = new THREE.Group();
  const cloned = SkeletonUtils.clone(scene);
  if (rotationY) cloned.rotation.y = rotationY;
  enhanceStudioMaterials(cloned, options);
  wrapper.add(cloned);
  wrapper.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(wrapper);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const spanLength = Math.max(size.z, size.x);
  const denom = targetLength > 0 ? Math.max(0.05, spanLength) : Math.max(0.05, size.y);
  const desired = targetLength > 0 ? targetLength : targetHeight;
  const scale = THREE.MathUtils.clamp(desired / denom, 0.001, 25);

  cloned.scale.multiplyScalar(scale);
  wrapper.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(wrapper);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  cloned.position.set(
    cloned.position.x - scaledCenter.x,
    cloned.position.y - scaledBox.min.y,
    cloned.position.z - scaledCenter.z
  );
  wrapper.updateMatrixWorld(true);
  return wrapper;
}
