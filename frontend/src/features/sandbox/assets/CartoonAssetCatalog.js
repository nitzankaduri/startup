import { useGLTF } from '@react-three/drei';

const THREE_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf';
const KHRONOS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models';
const CHAR_CLIPS = { Idle: 'idle', Walk: 'walk', Run: 'sprint', Jump: 'jump' };

/** Curated Subway Surfers stylized cartoon prefabs + bundled CC0 Kenney .glb catalog. */
export const CARTOON_ASSET_CATALOG = {
  subway_train: { url: '/models/subway_train.glb', prefab: 'subway_train', targetHeight: 2.9, bounds: [2.4, 2.9, 5.2] },
  train_ramp: { url: null, prefab: 'train_ramp', targetHeight: 2.65, bounds: [2.65, 2.65, 5.8] },
  street_barrier: { url: '/models/street_barrier.glb', prefab: 'street_barrier', variant: 'low', targetHeight: 1.15, rotationY: Math.PI / 2, bounds: [2.3, 1.15, 0.9] },
  high_barrier: { url: null, prefab: 'street_barrier', variant: 'high', targetHeight: 2.9, bounds: [2.8, 2.9, 0.75] },
  cartoon_car: { url: '/models/sports_car.glb', prefab: 'cartoon_car', targetHeight: 1.45, bounds: [1.9, 1.45, 3.85] },
  police_cruiser: { url: '/models/police_cruiser.glb', prefab: 'police_cruiser', targetHeight: 1.55, bounds: [1.95, 1.55, 4.0] },
  city_building: { url: '/models/city_building.glb', prefab: 'city_building', targetHeight: 10.5, bounds: [5.4, 10.5, 5.4] },
  gold_coin: { url: '/models/coin.glb', prefab: 'gold_coin', targetHeight: 0.95, bounds: [0.95, 0.95, 0.45], sensor: true },
  powerup_magnet: { url: null, prefab: 'powerup_magnet', targetHeight: 1.15, bounds: [1.1, 1.15, 0.65], sensor: true },
  jetpack: { url: null, prefab: 'jetpack', targetHeight: 1.25, bounds: [1.0, 1.25, 0.75], sensor: true },
  cartoon_character: { url: '/models/cartoon_character.glb', prefab: 'cartoon_character', targetHeight: 1.85, bounds: [0.9, 1.85, 0.85], clips: CHAR_CLIPS },
  chaser_guard: { url: '/models/chaser_guard.glb', prefab: 'chaser_guard', targetHeight: 1.95, bounds: [0.98, 1.95, 0.9], clips: CHAR_CLIPS },

  sports_car: { url: '/models/sports_car.glb', prefab: 'cartoon_car', targetHeight: 1.4, bounds: [1.9, 1.4, 3.85] },
  skyscraper: { url: '/models/skyscraper.glb', prefab: 'city_building', targetHeight: 15.5, bounds: [6.0, 15.5, 6.0] },
  tree: { url: '/models/tree.glb', prefab: 'city_building', targetHeight: 4.8, bounds: [2.6, 4.8, 2.6] },
  palm_tree: { url: '/models/palm_tree.glb', prefab: 'city_building', targetHeight: 5.2, bounds: [2.8, 5.2, 2.8] },
  rock: { url: '/models/rock.glb', prefab: 'street_barrier', targetHeight: 1.5, bounds: [2.1, 1.5, 2.1] },
  coin: { url: '/models/coin.glb', prefab: 'gold_coin', targetHeight: 0.95, bounds: [0.95, 0.95, 0.45], sensor: true },
  drone: { url: '/models/drone.glb', prefab: 'chaser_guard', targetHeight: 1.35, bounds: [1.75, 1.35, 1.75] },
  spaceship: { url: '/models/spaceship.glb', prefab: 'jetpack', targetHeight: 1.65, bounds: [3.1, 1.65, 3.3] },
  scifi_crate: { url: '/models/scifi_crate.glb', prefab: 'street_barrier', targetHeight: 1.25, bounds: [1.25, 1.25, 1.25] },

  robot: { url: `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`, prefab: 'chaser_guard', targetHeight: 1.9, bounds: [1.0, 1.9, 1.0], clips: { Idle: 'Idle', Run: 'Running', Jump: 'Jump' } },
  soldier: { url: '/models/cartoon_character.glb', prefab: 'cartoon_character', targetHeight: 1.85, bounds: [0.9, 1.85, 0.85], clips: CHAR_CLIPS },
  fox: { url: `${KHRONOS}/Fox/glTF-Binary/Fox.glb`, prefab: 'cartoon_character', targetHeight: 0.95, bounds: [0.9, 0.95, 1.4], clips: { Idle: 'Survey', Run: 'Run' } },
  truck: { url: `${KHRONOS}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`, prefab: 'cartoon_car', targetHeight: 2.1, rotationY: Math.PI / 2, bounds: [2.0, 2.1, 4.2] },
};

const ALIASES = {
  train: 'subway_train', metro: 'subway_train', barrier: 'street_barrier', hurdle: 'street_barrier',
  low_barrier: 'street_barrier', high_hurdle: 'high_barrier', overhead_barrier: 'high_barrier', ramp: 'train_ramp', jump_ramp: 'train_ramp',
  car: 'cartoon_car', cruiser: 'police_cruiser', cop_car: 'police_cruiser', building: 'city_building',
  shop: 'city_building', saloon: 'city_building', store: 'city_building',
  magnet: 'powerup_magnet', powerup_jetpack: 'jetpack', jetpack_powerup: 'jetpack', star_coin: 'gold_coin', coin_star: 'gold_coin',
  runner: 'cartoon_character', guard: 'chaser_guard', enemy: 'chaser_guard',
};

export function resolveCartoonAsset(name = 'cartoon_character') {
  if (typeof name === 'string' && (/^https?:\/\//i.test(name) || name.startsWith('/'))) {
    return { url: name, prefab: 'cartoon_car', targetHeight: 1.8, rotationY: 0, bounds: [1.6, 1.8, 1.6] };
  }
  const clean = String(name || 'cartoon_character').toLowerCase().replace(/\.glb$/i, '').replace(/[\s-]+/g, '_');
  const key = ALIASES[clean] || clean;
  return CARTOON_ASSET_CATALOG[key] || CARTOON_ASSET_CATALOG.cartoon_character;
}

let preloaded = false;
export function preloadCartoonCatalog() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  ['subway_train', 'street_barrier', 'cartoon_car', 'police_cruiser', 'city_building', 'gold_coin', 'cartoon_character', 'chaser_guard'].forEach((k) => {
    try { if (CARTOON_ASSET_CATALOG[k]?.url) useGLTF.preload(CARTOON_ASSET_CATALOG[k].url); } catch { /* Ignore */ }
  });
}
