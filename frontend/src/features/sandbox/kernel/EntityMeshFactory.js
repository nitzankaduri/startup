import * as THREE from 'three';
import { STUDIO_MODELS, attachNormalizedGlb } from './ModelAssetLoader';
import { buildSculptedActor, buildSculptedBarrier, buildSculptedBoss, buildSculptedStarfighter, buildSculptedTrain, buildSculptedVehicle } from './SculptedFallbacks';

const TRAIN_PAINTS = [
  ['#0284C7', '#F59E0B'],
  ['#E11D48', '#FFFBEB'],
  ['#D97706', '#1E293B'],
  ['#059669', '#FBBF24'],
];

export function buildObstacleMesh(type = 'subway_train', pal = {}, _parts = null, isRamp = false, variantIdx = 0) {
  if (isRamp) {
    const rg = new THREE.Group();
    const shape = new THREE.Shape([new THREE.Vector2(-1.12, 0), new THREE.Vector2(1.12, 0), new THREE.Vector2(1.12, 0.26), new THREE.Vector2(-1.12, 0.26)]);
    const deck = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 5.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.28, metalness: 0.55 })
    );
    deck.geometry.center(); deck.position.set(0, 1.32, 0); deck.rotation.x = -0.45; deck.castShadow = true;
    rg.add(deck);
    return rg;
  }

  if (type === 'police_car') {
    const g = buildSculptedVehicle('#0F172A', true);
    attachNormalizedGlb(STUDIO_MODELS.car_police, g, { category: 'vehicle', targetLength: 4.2, rotationY: Math.PI });
    return g;
  }
  if (type === 'milk_truck') {
    const g = buildSculptedVehicle('#FFFBEB', false);
    attachNormalizedGlb(STUDIO_MODELS.milk_truck, g, { category: 'vehicle', targetLength: 4.4, rotationY: Math.PI / 2 });
    return g;
  }
  if (type === 'asteroid') {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.25, 1),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.55, metalness: 0.35, emissive: '#EA580C', emissiveIntensity: 0.45 })
    );
    rock.position.y = 1.25; rock.castShadow = true; g.add(rock);
    return g;
  }
  if (type === 'street_barrier' || type === 'pirate_barrel' || type === 'lava_pillar') {
    return buildSculptedBarrier();
  }

  const [coat, stripe] = TRAIN_PAINTS[Math.abs(variantIdx) % TRAIN_PAINTS.length];
  return buildSculptedTrain(coat, stripe);
}

export function buildPlayerMesh(type = 'runner_kid', pal = {}, _parts = null, onRig = null) {
  const cPri = pal.primary || '#10B981';
  const cAcc = pal.accent || '#D96B27';
  if (type === 'starfighter') {
    const g = buildSculptedStarfighter(cPri, cAcc);
    attachNormalizedGlb(STUDIO_MODELS.flying_creature, g, { category: 'character', targetHeight: 1.75, rotationY: Math.PI, tintHex: cPri }, onRig);
    return g;
  }
  if (type === 'sports_car') {
    const g = buildSculptedVehicle(cPri, false);
    attachNormalizedGlb(STUDIO_MODELS.sports_car, g, { category: 'vehicle', targetLength: 4.2, rotationY: 0, tintHex: cPri }, onRig);
    return g;
  }
  if (type === 'fox') {
    const g = buildSculptedActor(cPri, cAcc, pal.secondary || '#D96B27');
    attachNormalizedGlb(STUDIO_MODELS.fox, g, { category: 'character', targetHeight: 1.5, rotationY: Math.PI, tintHex: cPri }, onRig);
    return g;
  }
  const g = buildSculptedActor(cPri, cAcc, pal.secondary || '#D96B27');
  const url = type === 'knight' || type === 'cyber' ? STUDIO_MODELS.cyber_hero : STUDIO_MODELS.hero_runner;
  const rotY = url === STUDIO_MODELS.cyber_hero ? 0 : Math.PI;
  attachNormalizedGlb(url, g, { category: 'character', targetHeight: 1.75, rotationY: rotY, tintHex: cPri }, onRig);
  return g;
}

export function buildEnemyMesh(type = 'chaser_guard', pal = {}, _parts = null, onRig = null) {
  if (type === 'alien_ufo' || type === 'bird' || type === 'dragon') {
    const g = buildSculptedStarfighter('#6366F1', '#38BDF8');
    attachNormalizedGlb(STUDIO_MODELS.flying_creature, g, { category: 'character', targetHeight: 1.75, rotationY: Math.PI, tintHex: pal.accent }, onRig);
    return g;
  }
  if (type === 'rival_car') {
    const g = buildSculptedVehicle(pal.accent || '#EF4444', false);
    attachNormalizedGlb(STUDIO_MODELS.sports_car, g, { category: 'vehicle', targetLength: 4.2, rotationY: 0, tintHex: pal.accent }, onRig);
    return g;
  }
  if (type === 'shark' || type === 'fox') {
    const g = buildSculptedActor('#0284C7', '#F59E0B');
    attachNormalizedGlb(STUDIO_MODELS.fox, g, { category: 'character', targetHeight: 1.5, rotationY: Math.PI }, onRig);
    return g;
  }
  const g = buildSculptedActor(pal.accent || '#1E3A8A', '#FBBF24', '#334155');
  attachNormalizedGlb(STUDIO_MODELS.enemy_bot, g, { category: 'character', targetHeight: 1.75, rotationY: Math.PI, tintHex: pal.accent || '#E11D48' }, onRig);
  return g;
}

export function buildCollectibleMesh(type = 'gold_coin', pal = {}) {
  const g = new THREE.Group();
  const col = pal.secondary || '#FBBF24';
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.16, metalness: 0.9, emissive: col, emissiveIntensity: 0.55 });
  if (type === 'energy_orb' || type === 'gem' || type === 'star') {
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), mat));
    return g;
  }
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 8, 18), mat));
  attachNormalizedGlb(STUDIO_MODELS.coin, g, { category: 'coin', targetHeight: 0.9, isCoin: true });
  return g;
}

export function buildBossMesh(bossCfg = null, pal = {}) {
  const g = buildSculptedBoss(pal.accent || '#E11D48');
  attachNormalizedGlb(STUDIO_MODELS.enemy_bot, g, { category: 'character', targetHeight: 4.4, rotationY: Math.PI, tintHex: pal.accent || '#E11D48' });
  return g;
}

export function buildPowerupMesh() {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({ color: '#D96B27', roughness: 0.16, metalness: 0.85, emissive: '#D96B27', emissiveIntensity: 1.25 });
  const ringMat = new THREE.MeshStandardMaterial({ color: '#FBBF24', roughness: 0.16, metalness: 0.9, emissive: '#FBBF24', emissiveIntensity: 0.85 });
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), coreMat), new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 6, 16), ringMat));
  return g;
}
