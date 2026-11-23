import * as THREE from 'three';
import { buildFromParts } from './CompositionalMeshBuilder';
import { getTrainLiveryTexture } from './ProceduralTextureAtlas';
import { getStudioMatcapMaterial } from './StudioShaderPool';

const TRAIN_PAINTS = [['#0EA5E9', '#F59E0B'], ['#E11D48', '#FFFBEB'], ['#F59E0B', '#1E1B4B'], ['#10B981', '#E11D48']];

function addBox(grp, w, h, d, x, y, z, color, kind = 'toon_vibrant') {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), getStudioMatcapMaterial(color, kind));
  m.position.set(x, y, z); grp.add(m); return m;
}
function addWheels(g, rx = 0.95, ry = 0.42, rz = 1.15) {
  [-rx, rx].forEach((x) => [-rz, rz].forEach((z) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(ry, ry, 0.32, 12), getStudioMatcapMaterial('#1E1B4B'));
    w.rotation.z = Math.PI / 2; w.position.set(x, ry, z); g.add(w);
  }));
}
export function buildObstacleMesh(type = 'subway_train', pal = {}, parts = null, isRamp = false, variantIdx = 0) {
  if (isRamp) {
    const rg = new THREE.Group();
    const deck = addBox(rg, 2.3, 0.34, 5.8, 0, 1.32, 0, '#D97706');
    deck.rotation.x = -0.45;
    addBox(rg, 2.1, 1.4, 0.9, 0, 0.7, -2.2, '#78350F');
    return rg;
  }
  const custom = buildFromParts(parts, pal.primary || '#D96B27');
  if (custom) return custom;
  const g = new THREE.Group();
  const cSec = pal.secondary || '#F59E0B';

  if (type === 'subway_train') {
    const [coat, stripe] = TRAIN_PAINTS[Math.abs(variantIdx) % TRAIN_PAINTS.length];
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 11.0), new THREE.MeshStandardMaterial({ map: getTrainLiveryTexture(coat, stripe), roughness: 0.45, metalness: 0.1 }));
    body.position.set(0, 1.3, 0); g.add(body);
    addBox(g, 2.0, 0.38, 10.6, 0, 2.52, 0, coat, 'toon_metallic');
    [-1, 1].forEach((end) => {
      addBox(g, 1.7, 0.85, 0.14, 0, 1.75, end * 5.52, '#0F172A', 'toon_metallic');
      addBox(g, 2.25, 0.34, 0.28, 0, 0.32, end * 5.55, '#334155', 'toon_metallic');
      [-0.65, 0.65].forEach((hx) => addBox(g, 0.28, 0.22, 0.12, hx, 0.75, end * 5.54, '#FFFBEB'));
    });
    [-3.2, 0, 3.2].forEach((az) => addBox(g, 1.15, 0.24, 1.3, 0, 2.78, az, '#475569'));
    return g;
  }
  if (type === 'police_car') {
    addBox(g, 1.85, 0.6, 3.8, 0, 0.6, 0, '#1E293B'); addBox(g, 1.88, 0.52, 1.4, 0, 0.62, 0, '#FFFBEB');
    addBox(g, 1.45, 0.5, 1.85, 0, 1.1, 0.1, '#0F172A', 'toon_metallic');
    addBox(g, 0.45, 0.16, 0.26, -0.25, 1.42, 0.1, '#EF4444'); addBox(g, 0.45, 0.16, 0.26, 0.25, 1.42, 0.1, '#0EA5E9');
    addWheels(g); return g;
  }
  if (type === 'pirate_barrel') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.4, 12), getStudioMatcapMaterial('#92400E'));
    body.position.y = 0.7; g.add(body);
    [-0.35, 0.35].forEach((hy) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 12), getStudioMatcapMaterial('#1E1B4B', 'toon_metallic')); h.position.y = 0.7 + hy; g.add(h); });
    return g;
  }
  if (type === 'asteroid') {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), getStudioMatcapMaterial('#64748B', 'toon_soft'));
    rock.position.y = 1.15; g.add(rock); return g;
  }
  addBox(g, 1.6, 2.2, 1.6, 0, 1.1, 0, '#451A03'); addBox(g, 1.3, 0.45, 1.3, 0, 2.3, 0, '#F59E0B'); return g;
}

function buildHumanRig(cBody, cCap, capeColor = '#D96B27') {
  const g = new THREE.Group();
  const torso = new THREE.Group(); torso.position.set(0, 0.92, 0); g.add(torso);
  addBox(torso, 0.56, 0.66, 0.36, 0, 0, 0, cBody);
  addBox(torso, 0.44, 0.44, 0.44, 0, 0.58, 0, '#FDE68A');
  addBox(torso, 0.48, 0.18, 0.48, 0, 0.84, 0, cCap);
  const cape = addBox(torso, 0.46, 0.6, 0.06, 0, 0, -0.22, capeColor);
  const lArm = addBox(torso, 0.18, 0.5, 0.18, -0.38, -0.05, 0, cBody);
  const rArm = addBox(torso, 0.18, 0.5, 0.18, 0.38, -0.05, 0, cBody);
  const lLeg = addBox(g, 0.2, 0.55, 0.2, -0.16, 0.32, 0, '#1E1B4B');
  const rLeg = addBox(g, 0.2, 0.55, 0.2, 0.16, 0.32, 0, '#1E1B4B');
  g.userData.joints = { torso, cape, lArm, rArm, lLeg, rLeg };
  return g;
}

export function buildPlayerMesh(type = 'runner_kid', pal = {}, parts = null) {
  const custom = buildFromParts(parts, pal.primary || '#10B981');
  if (custom) return custom;
  const g = new THREE.Group();
  const cPri = pal.primary || '#10B981';
  const cAcc = pal.accent || '#D96B27';
  if (type === 'starfighter') {
    const fuse = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 8), getStudioMatcapMaterial(cPri, 'toon_metallic'));
    fuse.rotation.x = -Math.PI / 2; fuse.position.y = 0.9; g.add(fuse);
    addBox(g, 2.6, 0.12, 0.85, 0, 0.85, 0.25, cAcc, 'toon_metallic');
    addBox(g, 0.55, 0.35, 0.9, 0, 1.15, -0.1, '#38BDF8', 'toon_metallic');
    [-0.45, 0.45].forEach((x) => addBox(g, 0.24, 0.24, 0.55, x, 0.85, 1.1, '#FBBF24'));
    return g;
  }
  if (type === 'sports_car') {
    addBox(g, 1.85, 0.58, 3.7, 0, 0.55, 0, cPri, 'toon_metallic');
    addBox(g, 1.4, 0.45, 1.75, 0, 1.0, 0.1, '#0F172A', 'toon_metallic');
    addBox(g, 1.75, 0.1, 0.38, 0, 1.0, 1.65, '#1E1B4B');
    addWheels(g, 0.95, 0.4, 1.1); return g;
  }
  return buildHumanRig(cPri, cAcc, pal.secondary || '#D96B27');
}

export function buildEnemyMesh(type = 'chaser_guard', pal = {}, parts = null) {
  const custom = buildFromParts(parts, pal.accent || '#E11D48');
  if (custom) return custom;
  const g = new THREE.Group();
  if (type === 'alien_ufo') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.38, 12), getStudioMatcapMaterial('#6366F1', 'toon_metallic'));
    disc.position.y = 1.2; g.add(disc);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), getStudioMatcapMaterial('#38BDF8', 'toon_metallic'));
    dome.position.y = 1.45; g.add(dome);
    return g;
  }
  if (type === 'shark') {
    addBox(g, 0.85, 0.7, 2.2, 0, 0.8, 0, '#0284C7');
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 5), getStudioMatcapMaterial('#0369A1'));
    fin.position.set(0, 1.4, 0); g.add(fin);
    return g;
  }
  return buildHumanRig(pal.accent || '#1E3A8A', '#FBBF24', '#334155');
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
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 14), getStudioMatcapMaterial(col, 'toon_metallic'));
  disc.rotation.x = Math.PI / 2;
  g.add(disc, new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), getStudioMatcapMaterial('#FFFBEB', 'toon_metallic')));
  return g;
}

export function buildBossMesh(bossCfg = null, pal = {}) {
  const custom = buildFromParts(bossCfg?.parts, pal.accent || '#E11D48');
  if (custom) return custom;
  const g = new THREE.Group();
  addBox(g, 2.8, 2.8, 2.2, 0, 1.5, 0, pal.accent || '#E11D48'); addBox(g, 1.8, 1.2, 1.4, 0, 3.2, 0, '#1E1B4B'); addBox(g, 3.8, 0.55, 0.55, 0, 2.2, 0, '#F59E0B');
  return g;
}

export function buildPowerupMesh() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), getStudioMatcapMaterial('#D96B27', 'toon_metallic')), new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 6, 16), getStudioMatcapMaterial('#FBBF24', 'toon_metallic')));
  return g;
}
