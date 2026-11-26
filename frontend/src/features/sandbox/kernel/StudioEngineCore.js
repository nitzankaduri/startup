import { stepActionCamera } from './ActionCameraRig';
import { createDirectorState } from './DirectorSetup';
import { attachNormalizedGlb, loadStudioGlb, normalizeGlbClone } from './ModelAssetLoader';
import { STUDIO_PACK_URLS } from './StudioAssetRegistry';
import { configureStudioRenderer } from './StudioRenderPipeline';
import { GENRE_PROFILES, buildGenreCoins, buildGenreObstacles, buildGenreWorldConfig, resolveGenreProfile } from './WorldGenreDirector';

export { GENRE_PROFILES, buildGenreCoins, buildGenreObstacles, buildGenreWorldConfig, resolveGenreProfile };

export const KENNEY_MODELS = {
  character_player: STUDIO_PACK_URLS.hero_stylized,
  character_enemy: STUDIO_PACK_URLS.enemy_guard,
  enemy_monster: STUDIO_PACK_URLS.enemy_monster,
  car_sports: STUDIO_PACK_URLS.sports_car,
  car_police: STUDIO_PACK_URLS.police_cruiser,
  spaceship: STUDIO_PACK_URLS.starfighter,
  building_city: STUDIO_PACK_URLS.city_building_a,
  building_alt: STUDIO_PACK_URLS.city_building_b,
  tree_pine: STUDIO_PACK_URLS.stylized_tree,
  coin_gold: STUDIO_PACK_URLS.gold_coin,
};

/** Normalizes any studio GLB cleanly to targetHeight (default 1.75), grounded at y = 0, facing -Z. */
export function normalizeKenneyModel(scene, opts = {}) {
  return normalizeGlbClone(scene, { targetHeight: 1.75, ...opts });
}

export function attachKenneyModel(key, containerGroup, options = {}, onReady = null) {
  attachNormalizedGlb(KENNEY_MODELS[key] || key, containerGroup, { targetHeight: 1.75, ...options }, onReady);
}

export function preloadKenneyStudio() {
  Object.values(STUDIO_PACK_URLS).forEach((url) => loadStudioGlb(url, () => {}));
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
  configureStudioRenderer(gl);
}
