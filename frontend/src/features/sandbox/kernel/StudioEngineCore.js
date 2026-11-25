import * as THREE from 'three';
import { stepActionCamera } from './ActionCameraRig';
import { createDirectorState } from './DirectorSetup';
import { attachNormalizedGlb, loadStudioGlb, normalizeGlbClone } from './ModelAssetLoader';
import { GENRE_PROFILES, buildGenreCoins, buildGenreObstacles, buildGenreWorldConfig, resolveGenreProfile } from './WorldGenreDirector';

export { GENRE_PROFILES, buildGenreCoins, buildGenreObstacles, buildGenreWorldConfig, resolveGenreProfile };

export const KENNEY_MODELS = {
  character_player: '/models/kenney/character_player.glb',
  character_enemy: '/models/kenney/character_enemy.glb',
  train_front: '/models/kenney/train_front.glb',
  train_carriage: '/models/kenney/train_carriage.glb',
  car_sports: '/models/kenney/car_sports.glb',
  car_police: '/models/kenney/car_police.glb',
  spaceship: '/models/kenney/spaceship.glb',
  building_city: '/models/kenney/building_city.glb',
  tree_pine: '/models/kenney/tree_pine.glb',
  crate: '/models/kenney/crate.glb',
  coin_gold: '/models/kenney/coin_gold.glb',
};

/** Normalizes any Kenney GLB cleanly to targetHeight (default 1.7), grounded at y = 0, facing -Z. */
export function normalizeKenneyModel(scene, { targetHeight = 1.7, targetLength = 0, rotationY = Math.PI, tintHex = null, outline = false } = {}) {
  return normalizeGlbClone(scene, { targetHeight, targetLength, rotationY, tintHex, outline });
}

export function attachKenneyModel(key, containerGroup, options = {}, onReady = null) {
  attachNormalizedGlb(KENNEY_MODELS[key] || key, containerGroup, { targetHeight: 1.7, ...options }, onReady);
}

export function preloadKenneyStudio() {
  Object.values(KENNEY_MODELS).forEach((url) => loadStudioGlb(url, () => {}));
}

/** Instantiates a complete 5-genre StudioEngineCore runtime state from any GameSpec. */
export function createStudioWorldRuntime(world) {
  const genreConfig = buildGenreWorldConfig(world);
  const state = createDirectorState(world);
  return { state, genreConfig };
}

/** Studio third-person camera rig: offset [0, 4.5, 9.5], lookAt [0, 1.5, -10] relative to runner. */
export function stepStudioCamera(camera, playerPos, opts, dt) {
  if (!camera || !playerPos) return 0;
  return stepActionCamera(camera, playerPos, opts, dt);
}

export function configureStudioShadows(gl) {
  if (!gl) return;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}
