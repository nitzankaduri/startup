import * as THREE from 'three';
import { getStudioMatcapMaterial } from './StudioShaderPool';

function beveledExtrude(pts, depth, bevel = 0.14) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
  geo.center();
  return geo;
}

export function buildSculptedActor(cBody = '#10B981', cAcc = '#D96B27', cCape = '#D96B27') {
  const g = new THREE.Group();
  const mBody = getStudioMatcapMaterial(cBody, 'toon_vibrant');
  const mSkin = getStudioMatcapMaterial('#FDE68A', 'toon_soft');
  const mCap = getStudioMatcapMaterial(cAcc, 'toon_metallic');
  const mLimb = getStudioMatcapMaterial('#1E293B', 'toon_vibrant');

  const torso = new THREE.Group(); torso.position.set(0, 0.94, 0); g.add(torso);
  torso.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.36, 6, 12), mBody));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), mSkin); head.position.y = 0.56; torso.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), mCap); helm.position.y = 0.58; torso.add(helm);
  const cape = new THREE.Mesh(beveledExtrude([[-0.22, -0.3], [0.22, -0.3], [0.16, 0.3], [-0.16, 0.3]], 0.04, 0.02), getStudioMatcapMaterial(cCape));
  cape.position.set(0, 0.02, -0.24); torso.add(cape);
  const armGeo = new THREE.CapsuleGeometry(0.085, 0.32, 4, 8);
  const lArm = new THREE.Mesh(armGeo, mBody); lArm.position.set(-0.37, 0.0, 0); torso.add(lArm);
  const rArm = new THREE.Mesh(armGeo, mBody); rArm.position.set(0.37, 0.0, 0); torso.add(rArm);
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.34, 4, 8);
  const lLeg = new THREE.Mesh(legGeo, mLimb); lLeg.position.set(-0.15, 0.32, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(legGeo, mLimb); rLeg.position.set(0.15, 0.32, 0); g.add(rLeg);
  g.userData.joints = { torso, cape, lArm, rArm, lLeg, rLeg };
  return g;
}

export function buildSculptedVehicle(color = '#EF4444', isPolice = false) {
  const g = new THREE.Group();
  const bodyGeo = beveledExtrude([[-1.65, -0.25], [1.65, -0.25], [1.55, 0.2], [0.7, 0.28], [0.35, 0.65], [-0.75, 0.65], [-1.25, 0.26], [-1.65, 0.16]], 1.55, 0.14);
  bodyGeo.rotateY(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, getStudioMatcapMaterial(isPolice ? '#1E293B' : color, 'toon_metallic'));
  body.position.y = 0.72; g.add(body);
  const glass = new THREE.Mesh(beveledExtrude([[-0.68, 0], [0.32, 0], [0.58, -0.28], [-0.95, -0.28]], 1.38, 0.06), getStudioMatcapMaterial('#0F172A', 'toon_metallic'));
  glass.rotation.y = Math.PI / 2; glass.position.set(0, 1.05, -0.1); g.add(glass);
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 16);
  const wMat = getStudioMatcapMaterial('#0F172A', 'toon_soft');
  [-0.92, 0.92].forEach((x) => [-1.1, 1.1].forEach((z) => {
    const w = new THREE.Mesh(wheelGeo, wMat); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); g.add(w);
  }));
  if (isPolice) {
    const lRed = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), getStudioMatcapMaterial('#EF4444'));
    lRed.rotation.z = Math.PI / 2; lRed.position.set(-0.24, 1.44, -0.05);
    const lBlu = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), getStudioMatcapMaterial('#0EA5E9'));
    lBlu.rotation.z = Math.PI / 2; lBlu.position.set(0.24, 1.44, -0.05);
    g.add(lRed, lBlu);
  }
  return g;
}

export function buildSculptedStarfighter(cPri = '#38BDF8', cAcc = '#F59E0B') {
  const g = new THREE.Group();
  const profile = [new THREE.Vector2(0, 1.35), new THREE.Vector2(0.28, 0.8), new THREE.Vector2(0.44, -0.2), new THREE.Vector2(0.36, -1.15), new THREE.Vector2(0.15, -1.25)];
  const fuse = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), getStudioMatcapMaterial(cPri, 'toon_metallic'));
  fuse.rotation.x = Math.PI / 2; fuse.position.y = 0.95; g.add(fuse);
  const wingGeo = beveledExtrude([[-1.45, -0.4], [1.45, -0.4], [0.45, 0.45], [-0.45, 0.45]], 0.08, 0.04);
  wingGeo.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wingGeo, getStudioMatcapMaterial(cAcc, 'toon_metallic')); wings.position.set(0, 0.9, 0.15); g.add(wings);
  const canopy = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 6, 12), getStudioMatcapMaterial('#0F172A', 'toon_metallic'));
  canopy.rotation.x = Math.PI / 2; canopy.position.set(0, 1.24, -0.1); g.add(canopy);
  return g;
}

export function buildSculptedTrain(coat = '#0EA5E9', stripe = '#F59E0B') {
  const g = new THREE.Group();
  const bodyGeo = beveledExtrude([[-1.0, -0.95], [1.0, -0.95], [1.05, 0.75], [0.75, 1.05], [-0.75, 1.05], [-1.05, 0.75]], 10.6, 0.14);
  const body = new THREE.Mesh(bodyGeo, getStudioMatcapMaterial(coat, 'toon_metallic'));
  body.position.y = 1.35; g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.25, 12), getStudioMatcapMaterial(stripe));
  band.rotation.x = Math.PI / 2; band.position.set(0, 1.5, 5.38); g.add(band);
  return g;
}

export function buildSculptedBarrel() {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(0.01, 0), new THREE.Vector2(0.58, 0), new THREE.Vector2(0.74, 0.7), new THREE.Vector2(0.58, 1.4), new THREE.Vector2(0.01, 1.4)];
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 16), getStudioMatcapMaterial('#92400E', 'toon_soft')));
  return g;
}

export function buildSculptedBoss(color = '#E11D48') {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CapsuleGeometry(1.05, 1.2, 8, 16), getStudioMatcapMaterial(color, 'toon_metallic'));
  core.position.y = 1.75; g.add(core);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.2, 8, 20), getStudioMatcapMaterial('#F59E0B', 'toon_metallic'));
  crown.rotation.x = Math.PI / 2; crown.position.y = 2.4; g.add(crown);
  return g;
}
