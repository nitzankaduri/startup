import * as THREE from 'three';
import { buildFromParts } from './CompositionalMeshBuilder';
import { STUDIO_MODELS, attachNormalizedGlb } from './ModelAssetLoader';
import { buildSculptedActor, buildSculptedBarrel, buildSculptedBoss, buildSculptedStarfighter, buildSculptedTrain, buildSculptedVehicle } from './SculptedFallbacks';
import { getStudioMatcapMaterial } from './StudioShaderPool';

const TRAIN_PAINTS = [['#0EA5E9', '#F59E0B'], ['#E11D48', '#FFFBEB'], ['#F59E0B', '#1E1B4B'], ['#10B981', '#E11D48']];

export function buildObstacleMesh(type = 'subway_train', pal = {}, parts = null, isRamp = false, variantIdx = 0) {
  if (isRamp) {
    const rg = new THREE.Group();
    const shape = new THREE.Shape([new THREE.Vector2(-1.1, 0), new THREE.Vector2(1.1, 0), new THREE.Vector2(1.1, 0.25), new THREE.Vector2(-1.1, 0.25)]);
    const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 5.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }), getStudioMatcapMaterial('#D97706', 'toon_vibrant'));
    deck.geometry.center(); deck.position.set(0, 1.32, 0); deck.rotation.x = -0.45;
    rg.add(deck);
    return rg;
  }
  const custom = buildFromParts(parts, pal.primary || '#D96B27');
  if (custom) return custom;

  if (type === 'subway_train') {
    const [coat, stripe] = TRAIN_PAINTS[Math.abs(variantIdx) % TRAIN_PAINTS.length];
    const g = buildSculptedTrain(coat, stripe);
    const url = variantIdx % 2 === 0 ? STUDIO_MODELS.train_car : STUDIO_MODELS.train_carriage;
    attachNormalizedGlb(url, g, { targetLength: 10.8, rotationY: 0 });
    return g;
  }
  if (type === 'police_car') {
    const g = buildSculptedVehicle('#1E293B', true);
    attachNormalizedGlb(STUDIO_MODELS.car_police, g, { targetLength: 3.9, rotationY: Math.PI });
    return g;
  }
  if (type === 'milk_truck') {
    const g = buildSculptedVehicle('#FFFBEB', false);
    attachNormalizedGlb(STUDIO_MODELS.milk_truck, g, { targetLength: 4.2, rotationY: Math.PI / 2 });
    return g;
  }
  if (type === 'pirate_barrel') {
    const g = buildSculptedBarrel();
    attachNormalizedGlb(STUDIO_MODELS.crate, g, { targetHeight: 1.4 });
    return g;
  }
  if (type === 'asteroid') {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), getStudioMatcapMaterial('#64748B', 'toon_soft'));
    rock.position.y = 1.15; g.add(rock);
    attachNormalizedGlb(STUDIO_MODELS.rock, g, { targetHeight: 2.2 });
    return g;
  }
  if (type === 'street_barrier') {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.4, 6, 10), getStudioMatcapMaterial('#D96B27', 'toon_vibrant'));
    bar.rotation.z = Math.PI / 2; bar.position.y = 0.7; g.add(bar);
    attachNormalizedGlb(STUDIO_MODELS.street_barrier, g, { targetHeight: 1.2 });
    return g;
  }
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 2.2, 12), getStudioMatcapMaterial('#57534E', 'toon_soft'));
  col.position.y = 1.1; g.add(col);
  attachNormalizedGlb(STUDIO_MODELS.crate, g, { targetHeight: 2.0 });
  return g;
}

export function buildPlayerMesh(type = 'runner_kid', pal = {}, parts = null, onRig = null) {
  const custom = buildFromParts(parts, pal.primary || '#10B981');
  if (custom) return custom;
  const cPri = pal.primary || '#10B981';
  const cAcc = pal.accent || '#D96B27';
  if (type === 'starfighter') {
    const g = buildSculptedStarfighter(cPri, cAcc);
    attachNormalizedGlb(STUDIO_MODELS.starfighter, g, { targetLength: 2.6, rotationY: Math.PI, tintHex: cPri }, onRig);
    return g;
  }
  if (type === 'sports_car') {
    const g = buildSculptedVehicle(cPri, false);
    attachNormalizedGlb(STUDIO_MODELS.sports_car, g, { targetLength: 4.1, rotationY: Math.PI, tintHex: cPri }, onRig);
    return g;
  }
  if (type === 'knight' || type === 'cyber') {
    const g = buildSculptedActor(cPri, cAcc, pal.secondary || '#D96B27');
    attachNormalizedGlb(STUDIO_MODELS.cyber_hero, g, { targetHeight: 1.7, tintHex: cPri, outline: true }, onRig);
    return g;
  }
  if (type === 'fox') {
    const g = buildSculptedActor(cPri, cAcc, pal.secondary || '#D96B27');
    attachNormalizedGlb(STUDIO_MODELS.fox, g, { targetHeight: 1.45, tintHex: cPri, outline: true }, onRig);
    return g;
  }
  const g = buildSculptedActor(cPri, cAcc, pal.secondary || '#D96B27');
  attachNormalizedGlb(STUDIO_MODELS.hero_runner, g, { targetHeight: 1.7, tintHex: cPri, outline: true }, onRig);
  return g;
}

export function buildEnemyMesh(type = 'chaser_guard', pal = {}, parts = null, onRig = null) {
  const custom = buildFromParts(parts, pal.accent || '#E11D48');
  if (custom) return custom;
  if (type === 'alien_ufo' || type === 'bird' || type === 'dragon') {
    const g = buildSculptedStarfighter('#6366F1', '#38BDF8');
    attachNormalizedGlb(type === 'alien_ufo' ? STUDIO_MODELS.drone : STUDIO_MODELS.flying_creature, g, { targetHeight: 1.7, tintHex: pal.accent, outline: true }, onRig);
    return g;
  }
  if (type === 'rival_car') {
    const g = buildSculptedVehicle(pal.accent || '#EF4444', false);
    attachNormalizedGlb(STUDIO_MODELS.car_sports, g, { targetLength: 4.0, rotationY: Math.PI, tintHex: pal.accent }, onRig);
    return g;
  }
  if (type === 'shark' || type === 'fox') {
    const g = buildSculptedActor('#0284C7', '#F59E0B');
    attachNormalizedGlb(STUDIO_MODELS.fox, g, { targetHeight: 1.35, outline: true }, onRig);
    return g;
  }
  const g = buildSculptedActor(pal.accent || '#1E3A8A', '#FBBF24', '#334155');
  attachNormalizedGlb(STUDIO_MODELS.enemy_bot, g, { targetHeight: 1.7, tintHex: pal.accent || '#E11D48', outline: true }, onRig);
  return g;
}

export function buildCollectibleMesh(type = 'gold_coin', pal = {}, parts = null) {
  const custom = buildFromParts(parts, pal.secondary || '#FBBF24');
  if (custom) return custom;
  const g = new THREE.Group();
  const col = pal.secondary || '#FBBF24';
  if (type === 'energy_orb' || type === 'gem' || type === 'star') {
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), getStudioMatcapMaterial(type === 'energy_orb' ? '#38BDF8' : col, 'toon_metallic')));
    return g;
  }
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 8, 18), getStudioMatcapMaterial(col, 'toon_metallic')));
  attachNormalizedGlb(STUDIO_MODELS.coin, g, { targetHeight: 0.9 });
  return g;
}

export function buildBossMesh(bossCfg = null, pal = {}) {
  const custom = buildFromParts(bossCfg?.parts, pal.accent || '#E11D48');
  if (custom) return custom;
  const g = buildSculptedBoss(pal.accent || '#E11D48');
  attachNormalizedGlb(STUDIO_MODELS.enemy_bot, g, { targetHeight: 4.4, tintHex: pal.accent || '#E11D48' });
  return g;
}

export function buildPowerupMesh() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), getStudioMatcapMaterial('#D96B27', 'toon_metallic')), new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 6, 16), getStudioMatcapMaterial('#FBBF24', 'toon_metallic')));
  return g;
}
