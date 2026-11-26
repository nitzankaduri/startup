import * as THREE from 'three';

function beveledExtrude(pts, depth, bevel = 0.12) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
  geo.center();
  return geo;
}

const pbr = (color, roughness = 0.32, metalness = 0.18, emissive = null, emissiveIntensity = 1.0) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  if (emissive) { m.emissive.set(emissive); m.emissiveIntensity = emissiveIntensity; }
  return m;
};

export function buildSculptedActor(cBody = '#10B981', cAcc = '#D96B27', cCape = '#D96B27') {
  const g = new THREE.Group();
  const mBody = pbr(cBody, 0.35, 0.2);
  const mSkin = pbr('#FDE68A', 0.45, 0.05);
  const mCap = pbr(cAcc, 0.22, 0.65);
  const mLimb = pbr('#1E293B', 0.38, 0.25);

  const torso = new THREE.Group(); torso.position.set(0, 0.94, 0); torso.rotation.y = Math.PI; g.add(torso);
  torso.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.36, 6, 12), mBody));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), mSkin); head.position.y = 0.56; torso.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), mCap); helm.position.y = 0.58; torso.add(helm);
  const cape = new THREE.Mesh(beveledExtrude([[-0.22, -0.3], [0.22, -0.3], [0.16, 0.3], [-0.16, 0.3]], 0.04, 0.02), pbr(cCape, 0.4, 0.1));
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
  const bodyGeo = beveledExtrude([[-1.85, -0.26], [1.85, -0.26], [1.72, 0.22], [0.75, 0.30], [0.35, 0.68], [-0.82, 0.68], [-1.35, 0.28], [-1.85, 0.18]], 1.68, 0.14);
  bodyGeo.rotateY(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, pbr(isPolice ? '#0F172A' : color, 0.18, 0.72));
  body.position.y = 0.72; body.castShadow = true; g.add(body);
  const glass = new THREE.Mesh(beveledExtrude([[-0.72, 0], [0.34, 0], [0.62, -0.3], [-1.0, -0.3]], 1.48, 0.06), pbr('#0F172A', 0.1, 0.92));
  glass.rotation.y = Math.PI / 2; glass.position.set(0, 1.08, -0.1); g.add(glass);
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 16);
  const wMat = pbr('#0F172A', 0.55, 0.2);
  [-0.95, 0.95].forEach((x) => [-1.22, 1.22].forEach((z) => {
    const w = new THREE.Mesh(wheelGeo, wMat); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); g.add(w);
  }));
  [-0.62, 0.62].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), pbr('#FEF08A', 0.1, 0.2, '#FEF08A', 2.0));
    hl.position.set(x, 0.7, -1.96); g.add(hl);
  });
  if (isPolice) {
    const lRed = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 4, 8), pbr('#EF4444', 0.15, 0.3, '#EF4444', 2.2));
    lRed.rotation.z = Math.PI / 2; lRed.position.set(-0.26, 1.48, -0.05);
    const lBlu = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 4, 8), pbr('#38BDF8', 0.15, 0.3, '#38BDF8', 2.2));
    lBlu.rotation.z = Math.PI / 2; lBlu.position.set(0.26, 1.48, -0.05);
    g.add(lRed, lBlu);
  }
  return g;
}

export function buildSculptedStarfighter(cPri = '#38BDF8', cAcc = '#F59E0B') {
  const g = new THREE.Group();
  const profile = [new THREE.Vector2(0, 1.35), new THREE.Vector2(0.28, 0.8), new THREE.Vector2(0.44, -0.2), new THREE.Vector2(0.36, -1.15), new THREE.Vector2(0.15, -1.25)];
  const fuse = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), pbr(cPri, 0.18, 0.78));
  fuse.rotation.x = -Math.PI / 2; fuse.position.y = 0.95; g.add(fuse);
  const wingGeo = beveledExtrude([[-1.45, -0.4], [1.45, -0.4], [0.45, 0.45], [-0.45, 0.45]], 0.08, 0.04);
  wingGeo.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wingGeo, pbr(cAcc, 0.22, 0.7)); wings.position.set(0, 0.9, 0.15); g.add(wings);
  const canopy = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 6, 12), pbr('#0F172A', 0.1, 0.92));
  canopy.rotation.x = Math.PI / 2; canopy.position.set(0, 1.24, -0.1); g.add(canopy);
  return g;
}

/** High-craft 11m multi-part Subway Train Car: rounded roof, headlights, side windows, roof AC vents & stripes. */
export function buildSculptedTrain(coat = '#0284C7', stripe = '#F59E0B') {
  const g = new THREE.Group();
  const mBody = pbr(coat, 0.22, 0.55); const mStripe = pbr(stripe, 0.25, 0.65); const mRoof = pbr('#E2E8F0', 0.28, 0.62);
  const mGlass = pbr('#0F172A', 0.1, 0.92, '#38BDF8', 0.18); const mSteel = pbr('#1E293B', 0.38, 0.75);
  const mHeadlight = pbr('#FEF08A', 0.1, 0.2, '#FEF08A', 2.4); const mTaillight = pbr('#EF4444', 0.1, 0.2, '#EF4444', 1.8);
  const hull = new THREE.Mesh(beveledExtrude([[-1.12, -0.92], [1.12, -0.92], [1.16, 0.68], [0.86, 1.05], [-0.86, 1.05], [-1.16, 0.68]], 10.75, 0.15), mBody);
  hull.position.y = 1.44; hull.castShadow = true; hull.receiveShadow = true; g.add(hull);
  const roof = new THREE.Mesh(new THREE.CapsuleGeometry(0.84, 9.2, 8, 16), mRoof);
  roof.rotation.x = Math.PI / 2; roof.scale.set(1.12, 1.0, 0.32); roof.position.y = 2.46; roof.castShadow = true; g.add(roof);
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.34, 10.6), mSteel); chassis.position.y = 0.42; g.add(chassis);
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14);
  [-4.1, -2.9, 2.9, 4.1].forEach((z) => [-0.96, 0.96].forEach((x) => {
    const w = new THREE.Mesh(wheelGeo, mSteel); w.rotation.z = Math.PI / 2; w.position.set(x, 0.28, z); g.add(w);
  }));
  [-1.18, 1.18].forEach((sx) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 10.72), mStripe); band.position.set(sx, 1.18, 0); g.add(band);
    for (let wz = -3.8; wz <= 3.8; wz += 1.9) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 1.32), mGlass); win.position.set(sx, 1.72, wz); g.add(win);
    }
  });
  [-5.44, 5.44].forEach((fz) => {
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.72, 0.1), mGlass); cabGlass.position.set(0, 1.78, fz); g.add(cabGlass);
    const dest = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.2, 0.11), pbr('#0EA5E9', 0.1, 0.3, '#38BDF8', 1.6)); dest.position.set(0, 2.32, fz); g.add(dest);
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.24, 0.24), mSteel); bumper.position.set(0, 0.62, fz); g.add(bumper);
    [-0.72, 0.72].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12), fz > 0 ? mHeadlight : mTaillight);
      lamp.rotation.x = Math.PI / 2; lamp.position.set(hx, 0.96, fz); g.add(lamp);
    });
  });
  [-3.2, 0, 3.2].forEach((vz) => {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.18, 1.45), mSteel); ac.position.set(0, 2.6, vz); ac.castShadow = true; g.add(ac);
  });
  return g;
}

export function buildSculptedBarrier() {
  const g = new THREE.Group();
  const mSteel = pbr('#334155', 0.35, 0.75); const mRail = pbr('#EA580C', 0.25, 0.35);
  const mStripe = pbr('#FFFBEB', 0.25, 0.2); const mBeacon = pbr('#F59E0B', 0.1, 0.2, '#FBBF24', 2.2);
  [-0.95, 0.95].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.15, 10), mSteel); post.position.set(x, 0.58, 0); g.add(post);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), mBeacon); beacon.position.set(x, 1.22, 0); g.add(beacon);
  });
  const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.9, 6, 12), mRail); bar.rotation.z = Math.PI / 2; bar.position.y = 0.82; bar.castShadow = true; g.add(bar);
  [-0.55, 0, 0.55].forEach((sx) => {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12), mStripe); st.rotation.z = Math.PI / 2; st.position.set(sx, 0.82, 0); g.add(st);
  });
  return g;
}

export function buildSculptedBoss(color = '#E11D48') {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CapsuleGeometry(1.05, 1.2, 8, 16), pbr(color, 0.22, 0.72));
  core.position.y = 1.75; g.add(core);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.2, 8, 20), pbr('#F59E0B', 0.18, 0.85, '#F59E0B', 1.4));
  crown.rotation.x = Math.PI / 2; crown.position.y = 2.4; g.add(crown);
  return g;
}
