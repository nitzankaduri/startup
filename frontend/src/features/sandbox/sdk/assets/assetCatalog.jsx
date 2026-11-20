import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { AutoNormalizeMesh } from './AutoNormalizeMesh';
import { StudioProp } from './StudioProps';

const THREE_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf';
const KHRONOS_ASSETS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models';
const KHRONOS_MODELS = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0';

export const ASSET_MANIFEST = {
  characters: ['robot', 'soldier', 'hero', 'cesium_man', 'knight_hero', 'goblin_enemy', 'skeleton_enemy', 'fox', 'horse', 'flamingo', 'parrot'],
  scifi_space: ['starfighter', 'planetary_rover', 'laser_turret', 'cryo_pod', 'orbital_ring_gate', 'asteroid_cluster', 'helmet', 'crate'],
  fantasy_medieval: ['castle_keep', 'timber_tavern', 'crystal_shrine', 'catapult', 'treasure_chest', 'ruins_pillar'],
  modern_racing: ['supercar', 'offroad_buggy', 'buggy', 'police_cruiser', 'truck', 'streetlamp', 'concrete_barrier', 'suspension_bridge', 'skyscraper_block', 'tokyo'],
  nature_survival: ['pine_tree', 'palm_tree', 'stylized_oak', 'boulder', 'wooden_dock', 'campfire', 'ruins_pillar'],
};

const propEntry = (fallbackKind, targetHeight = 2.0) => ({ url: null, targetHeight, rotationY: 0, fallbackKind });

export const GLB_ASSETS = {
  robot: { url: `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`, targetHeight: 1.8, rotationY: 0, fallbackKind: 'turret', clips: { Idle: 'Idle', Walk: 'Walking', Run: 'Running', Jump: 'Jump', Attack: 'Punch' } },
  soldier: { url: `${THREE_CDN}/Soldier.glb`, targetHeight: 1.8, rotationY: Math.PI, fallbackKind: 'knight_hero', clips: { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Walk' } },
  hero: { url: `${THREE_CDN}/Soldier.glb`, targetHeight: 1.8, rotationY: Math.PI, fallbackKind: 'knight_hero', clips: { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Walk' } },
  cesium_man: { url: `${KHRONOS_ASSETS}/CesiumMan/glTF-Binary/CesiumMan.glb`, targetHeight: 1.8, rotationY: 0, fallbackKind: 'knight_hero', clips: { Idle: 'default', Walk: 'default', Run: 'default', Jump: 'default', Attack: 'default' } },
  fox: { url: `${KHRONOS_ASSETS}/Fox/glTF-Binary/Fox.glb`, targetHeight: 0.95, rotationY: 0, fallbackKind: 'boulder', clips: { Idle: 'Survey', Walk: 'Walk', Run: 'Run', Jump: 'Run', Attack: 'Run' } },
  flamingo: { url: `${THREE_CDN}/Flamingo.glb`, targetHeight: 1.4, rotationY: 0, fallbackKind: 'starfighter', clips: { Idle: 'flamingo_flyA_', Walk: 'flamingo_flyA_', Run: 'flamingo_flyA_' } },
  parrot: { url: `${THREE_CDN}/Parrot.glb`, targetHeight: 1.1, rotationY: 0, fallbackKind: 'starfighter', clips: { Idle: 'parrot_A_', Walk: 'parrot_A_', Run: 'parrot_A_' } },
  horse: { url: `${THREE_CDN}/Horse.glb`, targetHeight: 1.85, rotationY: 0, fallbackKind: 'knight_hero', clips: { Idle: 'horse_A_', Walk: 'horse_A_', Run: 'horse_A_' } },
  tokyo: { url: `${THREE_CDN}/LittlestTokyo.glb`, targetHeight: 12.0, rotationY: 0, fallbackKind: 'skyscraper_block', clips: { Idle: 'Take 001' } },
  truck: { url: `${KHRONOS_ASSETS}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`, targetHeight: 1.8, rotationY: Math.PI / 2, fallbackKind: 'supercar' },
  buggy: { url: `${KHRONOS_MODELS}/Buggy/glTF-Binary/Buggy.glb`, targetHeight: 1.6, rotationY: 0, fallbackKind: 'offroad_buggy' },
  helmet: { url: `${KHRONOS_ASSETS}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`, targetHeight: 1.15, rotationY: 0, fallbackKind: 'laser_turret' },
  // Sci-Fi & Space
  starfighter: propEntry('starfighter', 1.9), spaceship: propEntry('starfighter', 1.9),
  planetary_rover: propEntry('planetary_rover', 1.9), laser_turret: propEntry('laser_turret', 2.6),
  turret: propEntry('laser_turret', 2.6), cryo_pod: propEntry('cryo_pod', 2.8),
  orbital_ring_gate: propEntry('orbital_ring_gate', 7.5), asteroid_cluster: propEntry('asteroid_cluster', 2.2), crate: propEntry('crate', 1.1),
  // Fantasy & Medieval
  knight_hero: propEntry('knight_hero', 2.1), goblin_enemy: propEntry('goblin_enemy', 1.7), skeleton_enemy: propEntry('skeleton_enemy', 1.7),
  castle_keep: propEntry('castle_keep', 8.2), tower: propEntry('castle_keep', 8.2),
  timber_tavern: propEntry('timber_tavern', 4.6), crystal_shrine: propEntry('crystal_shrine', 2.4),
  catapult: propEntry('catapult', 2.2), treasure_chest: propEntry('treasure_chest', 1.1),
  // Modern & Racing
  supercar: propEntry('supercar', 1.4), sports_car: propEntry('supercar', 1.4), offroad_buggy: propEntry('offroad_buggy', 1.5),
  police_cruiser: propEntry('police_cruiser', 1.45), streetlamp: propEntry('streetlamp', 4.9),
  concrete_barrier: propEntry('concrete_barrier', 0.9), suspension_bridge: propEntry('suspension_bridge', 6.2), skyscraper_block: propEntry('skyscraper_block', 16.5),
  // Nature & Survival
  pine_tree: propEntry('pine_tree', 4.8), palm_tree: propEntry('palm_tree', 4.9), stylized_oak: propEntry('stylized_oak', 4.6),
  boulder: propEntry('boulder', 1.5), wooden_dock: propEntry('wooden_dock', 1.3), campfire: propEntry('campfire', 1.0), ruins_pillar: propEntry('ruins_pillar', 3.4),
};

const ALIAS_MAP = {
  robotexpressive: 'robot', littlesttokyo: 'tokyo', cesiummilktruck: 'truck', damagedhelmet: 'helmet',
  castle_tower: 'castle_keep', keep: 'castle_keep', scifi_turret: 'laser_turret', car: 'supercar', coupe: 'supercar',
  ship: 'starfighter', jet: 'starfighter', rover: 'planetary_rover', orbital_gate: 'orbital_ring_gate', asteroid: 'asteroid_cluster',
  knight: 'knight_hero', goblin: 'goblin_enemy', skeleton: 'skeleton_enemy', tavern: 'timber_tavern', shrine: 'crystal_shrine',
  chest: 'treasure_chest', jersey_barrier: 'concrete_barrier', bridge: 'suspension_bridge', skyscraper: 'skyscraper_block',
  tree: 'pine_tree', oak_tree: 'stylized_oak', rock: 'boulder', dock: 'wooden_dock', pillar: 'ruins_pillar',
};

export function resolveModelAsset(name = 'hero') {
  if (typeof name === 'string' && /^https?:\/\//i.test(name)) {
    return { url: name, targetHeight: 1.8, rotationY: 0, fallbackKind: 'crate', clips: {} };
  }
  const clean = String(name || 'hero').toLowerCase().replace(/\.glb$/i, '').replace(/[\s-]+/g, '_');
  const key = ALIAS_MAP[clean] || clean;
  return GLB_ASSETS[key] || { url: null, targetHeight: 1.6, rotationY: 0, fallbackKind: key };
}

let preloaded = false;
export function preloadAllRegistryModels() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  ['robot', 'soldier', 'fox', 'truck', 'helmet'].forEach((k) => {
    try { if (GLB_ASSETS[k]?.url) useGLTF.preload(GLB_ASSETS[k].url); } catch { /* Ignore */ }
  });
}

/** Unified 40+ genre-categorized asset renderer (.glb auto-normalized via Box3 + multi-mesh PBR StudioProps). */
export function AssetCatalog({
  name = 'crate',
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  targetHeight,
  animationState = 'Idle',
  color,
  solid = true,
  colliderPadding = 0,
  onCollide,
}) {
  const assetKey = model || name;
  const spec = useMemo(() => resolveModelAsset(assetKey), [assetKey]);
  const fallback = <StudioProp type={spec.fallbackKind || assetKey} scale={scale} color={color} solid={false} />;
  if (!spec.url) {
    return <StudioProp type={spec.fallbackKind || assetKey} position={position} rotation={rotation} scale={scale} color={color} solid={solid} colliderPadding={colliderPadding} onCollide={onCollide} />;
  }
  return (
    <AutoNormalizeMesh
      url={spec.url}
      targetHeight={targetHeight ?? spec.targetHeight ?? 1.8}
      scale={scale}
      position={position}
      rotation={rotation}
      rotationY={spec.rotationY || 0}
      animationState={animationState}
      clips={spec.clips || {}}
      fallback={fallback}
      solid={solid}
      colliderPadding={colliderPadding}
      onCollide={onCollide}
    />
  );
}
