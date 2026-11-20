import * as THREE from 'three';

const TMP_DIR = new THREE.Vector3();
const TMP_WORLD = new THREE.Vector3();

/** Resolves any camera target (function, React ref, THREE.Object3D, [x,y,z], or {x,y,z}) into finite {x,y,z}. */
export function resolveCameraTarget(raw, fallback) {
  let t = typeof raw === 'function' ? raw() : raw;
  if (t && typeof t === 'object' && 'current' in t) t = t.current;
  if (!t) return { pos: fallback, hasCustom: false };
  if (t.isObject3D && typeof t.getWorldPosition === 'function') {
    t.getWorldPosition(TMP_WORLD);
    if (Number.isFinite(TMP_WORLD.x) && Number.isFinite(TMP_WORLD.y) && Number.isFinite(TMP_WORLD.z)) {
      return { pos: { x: TMP_WORLD.x, y: TMP_WORLD.y, z: TMP_WORLD.z }, hasCustom: true };
    }
  }
  if (t.position && Number.isFinite(t.position.x)) {
    return { pos: { x: t.position.x, y: t.position.y, z: t.position.z }, hasCustom: true };
  }
  if (Array.isArray(t) && t.length >= 3 && Number.isFinite(t[0]) && Number.isFinite(t[1]) && Number.isFinite(t[2])) {
    return { pos: { x: t[0], y: t[1], z: t[2] }, hasCustom: true };
  }
  if (typeof t === 'object' && Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.z)) {
    return { pos: { x: t.x, y: t.y, z: t.z }, hasCustom: true };
  }
  return { pos: fallback, hasCustom: false };
}

/** Critically-damped spring interpolation (smoothDamp) returning updated scalar value. */
export function smoothDamp(current, target, velObj, key, smoothTime, dt, maxSpeed = 80) {
  const st = Math.max(0.0001, smoothTime);
  const omega = 2 / st;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const maxChange = maxSpeed * st;
  change = THREE.MathUtils.clamp(change, -maxChange, maxChange);
  const clampedTarget = current - change;
  const temp = (velObj[key] + omega * change) * dt;
  velObj[key] = (velObj[key] - omega * temp) * exp;
  let output = clampedTarget + (change + temp) * exp;
  if ((target - current > 0) === (output > target)) {
    output = target;
    velObj[key] = (output - target) / dt;
  }
  return output;
}

/** Critically-damped Vector3 spring update in place. */
export function dampVec3(cur, tx, ty, tz, vel, sx, sy, sz, dt) {
  cur.set(
    smoothDamp(cur.x, tx, vel, 'x', sx, dt),
    smoothDamp(cur.y, ty, vel, 'y', sy, dt),
    smoothDamp(cur.z, tz, vel, 'z', sz, dt)
  );
}

/** Raycasts from look target toward desired camera position to prevent terrain/wall clipping. */
export function avoidCameraCollision(raycaster, scene, origin, desiredPos, minFloorY = 0.75, camera = null) {
  TMP_DIR.subVectors(desiredPos, origin);
  const dist = TMP_DIR.length();
  if (dist > 0.25) {
    TMP_DIR.divideScalar(dist);
    if (camera) raycaster.camera = camera;
    raycaster.set(origin, TMP_DIR);
    raycaster.near = 0.2;
    raycaster.far = dist;
    const targets = camera ? scene.children : scene.children.filter((c) => !c.isSprite);
    const hits = raycaster.intersectObjects(targets, true);
    const blocker = hits.find((h) => h.object?.isMesh && !h.object.isInstancedMesh && h.object.visible && h.object.material?.transparent !== true && h.distance > 0.6);
    if (blocker && blocker.distance < dist) {
      const safeDist = Math.max(1.2, blocker.distance - 0.35);
      desiredPos.copy(origin).addScaledVector(TMP_DIR, safeDist);
      return { blocked: true, desiredPos };
    }
  }
  if (desiredPos.y < minFloorY) desiredPos.y = minFloorY;
  return { blocked: false, desiredPos };
}

/** Binds keyboard pan, wheel zoom, and first-person look listeners; returns cleanup function. */
export function attachCameraInputs(el, { mode, minZoom, maxZoom, pointerLock, sensitivity = 1, keysRef, panRef, lookRef, motionBus }) {
  const onKey = (down) => (e) => { keysRef.current[e.code] = down; };
  const kd = onKey(true);
  const ku = onKey(false);
  const onWheel = (e) => { if (mode === 'isometric') panRef.current.zoom = THREE.MathUtils.clamp(panRef.current.zoom + e.deltaY * 0.012, minZoom, maxZoom); };
  const onDown = (e) => {
    lookRef.current.drag = true; lookRef.current.lx = e.clientX; lookRef.current.ly = e.clientY;
    if (mode === 'first_person' && pointerLock) el.requestPointerLock?.();
  };
  const onMove = (e) => {
    if (mode !== 'first_person') return;
    const locked = document.pointerLockElement === el;
    if (!locked && !lookRef.current.drag) return;
    const dx = locked ? e.movementX : e.clientX - lookRef.current.lx;
    const dy = locked ? e.movementY : e.clientY - lookRef.current.ly;
    lookRef.current.lx = e.clientX; lookRef.current.ly = e.clientY;
    lookRef.current.yaw -= dx * 0.0035 * sensitivity;
    lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch - dy * 0.0035 * sensitivity, -1.3, 1.3);
    motionBus.yaw = lookRef.current.yaw;
  };
  const onUp = () => { lookRef.current.drag = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  el.addEventListener('wheel', onWheel, { passive: true }); el.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  return () => {
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    el.removeEventListener('wheel', onWheel); el.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
  };
}
