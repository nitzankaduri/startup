import { useGLTF } from '@react-three/drei';

export const GLB_ASSETS = {
  hero: {
    url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf/Soldier.glb',
    targetHeight: 1.8,
    rotationY: Math.PI,
    fallbackKind: 'character',
    clips: { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Walk' },
  },
  soldier: {
    url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf/Soldier.glb',
    targetHeight: 1.8,
    rotationY: Math.PI,
    fallbackKind: 'character',
    clips: { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Walk' },
  },
  robot: {
    url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    targetHeight: 1.8,
    rotationY: 0,
    fallbackKind: 'character',
    clips: { Idle: 'Idle', Walk: 'Walking', Run: 'Running', Jump: 'Jump', Attack: 'Punch' },
  },
  cesium_man: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CesiumMan/glTF-Binary/CesiumMan.glb',
    targetHeight: 1.8,
    rotationY: 0,
    fallbackKind: 'character',
    clips: { Idle: 'default', Walk: 'default', Run: 'default', Jump: 'default', Attack: 'default' },
  },
  truck: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    targetHeight: 1.6,
    rotationY: Math.PI / 2,
    fallbackKind: 'vehicle',
  },
  buggy: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Buggy/glTF-Binary/Buggy.glb',
    targetHeight: 1.6,
    rotationY: 0,
    fallbackKind: 'vehicle',
  },
  helmet: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    targetHeight: 1.1,
    rotationY: 0,
    fallbackKind: 'helmet',
  },
  fox: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Fox/glTF-Binary/Fox.glb',
    targetHeight: 0.95,
    rotationY: 0,
    fallbackKind: 'fox',
    clips: { Idle: 'Survey', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Run' },
  },
  tree: { url: null, targetHeight: 4.5, rotationY: 0, fallbackKind: 'tree' },
  rock: { url: null, targetHeight: 1.3, rotationY: 0, fallbackKind: 'rock' },
  crate: { url: null, targetHeight: 1.1, rotationY: 0, fallbackKind: 'crate' },
};

export function resolveModelAsset(model = 'hero') {
  if (typeof model === 'string' && /^https?:\/\//i.test(model)) {
    return { url: model, targetHeight: 1.8, rotationY: 0, fallbackKind: 'crate', clips: {} };
  }
  return GLB_ASSETS[model] || GLB_ASSETS.hero;
}

let preloaded = false;
export function preloadAllRegistryModels() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  const urls = new Set(Object.values(GLB_ASSETS).map((a) => a.url).filter(Boolean));
  urls.forEach((url) => {
    try { useGLTF.preload(url); } catch { /* Ignore offline preload errors */ }
  });
}
