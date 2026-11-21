import { useGLTF } from '@react-three/drei';

const THREE_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf';
const KHRONOS_ASSETS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models';
const KHRONOS_MODELS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0';

/** Local bundled & CC0 remote .glb asset catalog with normalized target heights and default bounds. */
export const MODEL_CATALOG = {
  sports_car: { url: '/models/sports_car.glb', targetHeight: 1.35, fallbackKind: 'sports_car', defaultBounds: [1.85, 1.35, 3.9] },
  police_cruiser: { url: '/models/police_cruiser.glb', targetHeight: 1.48, fallbackKind: 'police_cruiser', defaultBounds: [1.9, 1.48, 4.05] },
  skyscraper: { url: '/models/skyscraper.glb', targetHeight: 16.5, fallbackKind: 'skyscraper', defaultBounds: [6.2, 16.5, 6.2] },
  tree: { url: '/models/tree.glb', targetHeight: 4.8, fallbackKind: 'tree', defaultBounds: [2.8, 4.8, 2.8] },
  rock: { url: '/models/rock.glb', targetHeight: 1.5, fallbackKind: 'rock', defaultBounds: [2.2, 1.5, 2.2] },
  coin: { url: '/models/coin.glb', targetHeight: 1.0, fallbackKind: 'coin', defaultBounds: [1.0, 1.0, 0.35], sensor: true },
  drone: { url: '/models/drone.glb', targetHeight: 1.3, fallbackKind: 'drone', defaultBounds: [1.8, 1.3, 1.8] },
  spaceship: { url: '/models/spaceship.glb', targetHeight: 1.6, fallbackKind: 'spaceship', defaultBounds: [3.2, 1.6, 3.4] },
  scifi_crate: { url: '/models/scifi_crate.glb', targetHeight: 1.25, fallbackKind: 'scifi_crate', defaultBounds: [1.25, 1.25, 1.25] },
  robot: {
    url: `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`,
    targetHeight: 1.85,
    fallbackKind: 'drone',
    defaultBounds: [1.1, 1.85, 1.0],
    clips: { Idle: 'Idle', Walk: 'Walking', Run: 'Running', Jump: 'Jump', Attack: 'Punch' },
  },
  soldier: {
    url: `${THREE_CDN}/Soldier.glb`,
    targetHeight: 1.85,
    rotationY: Math.PI,
    fallbackKind: 'drone',
    defaultBounds: [0.95, 1.85, 0.95],
    clips: { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Walk' },
  },
  fox: {
    url: `${KHRONOS_ASSETS}/Fox/glTF-Binary/Fox.glb`,
    targetHeight: 0.95,
    fallbackKind: 'rock',
    defaultBounds: [0.9, 0.95, 1.4],
    clips: { Idle: 'Survey', Walk: 'Walk', Run: 'Run' },
  },
  truck: { url: `${KHRONOS_ASSETS}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`, targetHeight: 2.1, rotationY: Math.PI / 2, fallbackKind: 'police_cruiser', defaultBounds: [2.0, 2.1, 4.2] },
  buggy: { url: `${KHRONOS_MODELS}/Buggy/glTF-Binary/Buggy.glb`, targetHeight: 1.65, fallbackKind: 'sports_car', defaultBounds: [2.0, 1.65, 3.6] },
  helmet: { url: `${KHRONOS_ASSETS}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`, targetHeight: 1.2, fallbackKind: 'drone', defaultBounds: [1.1, 1.2, 1.1] },
};

const ALIASES = {
  car: 'sports_car', supercar: 'sports_car', coupe: 'sports_car', racer: 'sports_car',
  cruiser: 'police_cruiser', police: 'police_cruiser', cop_car: 'police_cruiser', patrol: 'police_cruiser',
  building: 'skyscraper', skyscraper_block: 'skyscraper', tower: 'skyscraper',
  pine: 'tree', pine_tree: 'tree', oak: 'tree', palm: 'tree',
  boulder: 'rock', stone: 'rock', gold_coin: 'coin', pickup: 'coin',
  enemy: 'drone', bot: 'drone', turret: 'drone', goblin_enemy: 'drone',
  ship: 'spaceship', starfighter: 'spaceship', jet: 'spaceship', fighter: 'spaceship',
  crate: 'scifi_crate', box: 'scifi_crate', cargo: 'scifi_crate', hero: 'soldier',
};

/** Resolve any catalog key, alias, or explicit .glb URL with fallback metadata. */
export function resolveCatalogModel(name = 'sports_car') {
  if (typeof name === 'string' && (/^https?:\/\//i.test(name) || name.startsWith('/'))) {
    return { url: name, targetHeight: 1.8, rotationY: 0, fallbackKind: 'scifi_crate', defaultBounds: [1.6, 1.8, 1.6], clips: {} };
  }
  const clean = String(name || 'sports_car').toLowerCase().replace(/\.glb$/i, '').replace(/[\s-]+/g, '_');
  const key = ALIASES[clean] || clean;
  return MODEL_CATALOG[key] || { ...MODEL_CATALOG.scifi_crate, fallbackKind: key };
}

let didPreload = false;
export function preloadCatalogModels() {
  if (didPreload || typeof window === 'undefined') return;
  didPreload = true;
  ['sports_car', 'police_cruiser', 'skyscraper', 'tree', 'rock', 'coin', 'drone', 'spaceship', 'scifi_crate'].forEach((k) => {
    try { useGLTF.preload(MODEL_CATALOG[k].url); } catch { /* Ignore offline preload errors */ }
  });
}
