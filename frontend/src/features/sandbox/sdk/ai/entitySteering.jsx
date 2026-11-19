import * as THREE from 'three';

const RAY_ORIGIN = new THREE.Vector3();
const RAY_DIR = new THREE.Vector3();

export const BEHAVIOR_DEFAULTS = {
  patrol_chase: { speed: 3.4, chaseSpeed: 6.2, detect: 15, attack: 2.3, windup: 0.45, cooldown: 1.4, scale: 1.0 },
  ranged_turret: { speed: 0, chaseSpeed: 0, detect: 18, attack: 14, windup: 0.55, cooldown: 1.8, scale: 1.05 },
  swarm: { speed: 5.5, chaseSpeed: 7.4, detect: 22, attack: 2.0, windup: 0.28, cooldown: 0.95, scale: 0.88 },
  boss: { speed: 2.6, chaseSpeed: 4.8, detect: 20, attack: 3.5, windup: 0.78, cooldown: 2.1, scale: 1.45 },
};

/** Computes obstacle-avoiding 2D steering direction toward a target world position. */
export function computeAvoidanceSteer(raycaster, scene, selfGroup, curPos, targetX, targetZ, flankSign = 0, camera = null) {
  let dx = targetX - curPos.x;
  let dz = targetZ - curPos.z;
  const dist = Math.hypot(dx, dz) || 1;
  dx /= dist;
  dz /= dist;

  if (flankSign !== 0 && dist > 3.2 && dist < 12) {
    dx += -dz * 0.42 * flankSign;
    dz += dx * 0.42 * flankSign;
    const n = Math.hypot(dx, dz) || 1;
    dx /= n;
    dz /= n;
  }

  RAY_ORIGIN.set(curPos.x, curPos.y + 0.85, curPos.z);
  RAY_DIR.set(dx, 0, dz);
  if (camera) raycaster.camera = camera;
  raycaster.set(RAY_ORIGIN, RAY_DIR);
  raycaster.near = 0.3;
  raycaster.far = 2.0;

  const hits = raycaster.intersectObjects(scene.children, true);
  const blocker = hits.find((h) => {
    if (!h.object?.isMesh) return false;
    let p = h.object;
    while (p) { if (p === selfGroup) return false; p = p.parent; }
    return h.object.visible && h.face && Math.abs(h.face.normal.y) < 0.5;
  });

  if (blocker) {
    const side = flankSign || 1;
    const avoidX = dx * 0.35 - dz * 0.92 * side;
    const avoidZ = dz * 0.35 + dx * 0.92 * side;
    const len = Math.hypot(avoidX, avoidZ) || 1;
    return { dx: avoidX / len, dz: avoidZ / len, dist };
  }
  return { dx, dz, dist };
}

export function triggerAncestorDamage(obj, amount, dirVec) {
  let cur = obj;
  while (cur) {
    if (typeof cur.userData?.takeDamage === 'function') {
      cur.userData.takeDamage(amount, dirVec);
      return true;
    }
    cur = cur.parent;
  }
  return false;
}
