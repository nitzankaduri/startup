import { useCallback, useEffect } from 'react';
import * as THREE from 'three';

const fbm2D = (x, z) => (Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.5 + 0.5);

const COLLIDERS = new Map();
const TERRAIN_CFG = { amplitude: 0, frequency: 0.028, flatRadius: 18, floorY: 0, bounds: 110 };
const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
let _hardImpactCb = null;
let _lastImpactAt = 0;

export function setHardCollisionHandler(fn) { _hardImpactCb = fn; }

export function resetArenaPhysics() {
  COLLIDERS.clear();
  _lastImpactAt = 0;
  Object.assign(TERRAIN_CFG, { amplitude: 0, frequency: 0.028, flatRadius: 18, floorY: 0, bounds: 110 });
}

export function setTerrainConfig(patch = {}) { Object.assign(TERRAIN_CFG, patch); }

/** Deterministic terrain elevation matching RealisticTerrain & BiomeStage geometry at world (x, z). */
export function getTerrainHeight(x = 0, z = 0) {
  const { amplitude, frequency, flatRadius, floorY } = TERRAIN_CFG;
  if (!amplitude) return floorY;
  const plateau = THREE.MathUtils.smoothstep(Math.hypot(x, z), flatRadius * 0.65, flatRadius * 1.8);
  const ridge = fbm2D(x * frequency + 12.4, z * frequency - 8.1, 5, 42);
  const detail = fbm2D(x * frequency * 3.1, z * frequency * 3.1, 3, 99) * 0.25;
  return floorY + (Math.pow(ridge, 1.35) * amplitude + detail * 2.5) * plateau;
}

/** Registers a sphere or AABB spatial collider into the deterministic arena physics registry. */
export function registerCollider(id, spec = {}, type = 'box') {
  if (!id || spec.solid === false) { COLLIDERS.delete(id); return; }
  const pos = spec.position || spec.center || [spec.x ?? 0, spec.y ?? 0, spec.z ?? 0];
  const size = spec.size || spec.args || [spec.w ?? 2, spec.h ?? 2, spec.d ?? 2];
  const pad = Number(spec.padding) || 0;
  const isSphere = spec.radius !== undefined && spec.radius !== null || type === 'sphere' || type === 'cylinder';
  const h = Number(size[1]) || 3;
  COLLIDERS.set(id, {
    id, type, isSphere, isTrigger: type === 'trigger',
    x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0,
    radius: (Number(spec.radius) || Math.max(Number(size[0]) || 1, Number(size[2]) || 1) * 0.5) + pad,
    halfW: (Number(size[0]) || 2) * 0.5 + pad, halfD: (Number(size[2]) || 2) * 0.5 + pad,
    minY: spec.minY ?? ((Number(pos[1]) || 0) - 0.5),
    maxY: spec.maxY ?? ((Number(pos[1]) || 0) + h),
    onCollide: spec.onCollide,
  });
}

/** Measures an Object3D world-space Box3 and registers its XZ AABB collider automatically. */
export function registerObjectCollider(id, object3D, { padding = 0, solid = true, type = 'box', onCollide } = {}) {
  if (!id || !solid || !object3D) { unregisterCollider(id); return; }
  object3D.updateWorldMatrix(true, true);
  _box.setFromObject(object3D);
  if (_box.isEmpty()) return;
  _box.getCenter(_center);
  _box.getSize(_size);
  if (_size.x > 60 && _size.z > 60) return;
  registerCollider(id, {
    position: [_center.x, _box.min.y, _center.z],
    size: [_size.x, Math.max(0.5, _size.y), _size.z],
    minY: _box.min.y, maxY: _box.max.y, padding, onCollide,
  }, type);
}

export function unregisterCollider(id) { COLLIDERS.delete(id); }

function solveSinglePass(out, vel, radius, hits, notified, onCollide) {
  let maxImpact = 0;
  COLLIDERS.forEach((c) => {
    if (out.y > c.maxY - 0.1 || out.y + 1.8 < (c.minY ?? -999)) return;
    let nx = 0; let nz = 0; let overlap = 0;
    if (c.isSphere) {
      const dx = out.x - c.x; const dz = out.z - c.z; const dist = Math.hypot(dx, dz);
      const minD = radius + c.radius;
      if (dist >= minD) return;
      overlap = minD - dist;
      nx = dist > 0.0001 ? dx / dist : 0; nz = dist > 0.0001 ? dz / dist : 1;
    } else {
      const minX = c.x - c.halfW; const maxX = c.x + c.halfW; const minZ = c.z - c.halfD; const maxZ = c.z + c.halfD;
      const cx = THREE.MathUtils.clamp(out.x, minX, maxX); const cz = THREE.MathUtils.clamp(out.z, minZ, maxZ);
      const dx = out.x - cx; const dz = out.z - cz; const dist = Math.hypot(dx, dz);
      if (dist >= radius) return;
      if (dist > 0.0001) {
        overlap = radius - dist; nx = dx / dist; nz = dz / dist;
      } else {
        const dl = out.x - minX; const dr = maxX - out.x; const dt = out.z - minZ; const db = maxZ - out.z;
        const m = Math.min(dl, dr, dt, db);
        overlap = m + radius;
        if (m === dl) nx = -1; else if (m === dr) nx = 1; else if (m === dt) nz = -1; else nz = 1;
      }
    }
    if (!notified.has(c.id)) hits.push(c.id);
    if (c.isTrigger) { if (!notified.has(c.id)) { notified.add(c.id); c.onCollide?.(c, 0); onCollide?.(c, 0); } return; }
    out.x += nx * overlap; out.z += nz * overlap;
    const vn = vel.x * nx + vel.z * nz;
    const imp = vn < 0 ? -vn : 0;
    if (vn < 0) {
      vel.x -= vn * nx; vel.z -= vn * nz;
      if (imp > 3.5) { vel.x *= 0.85; vel.z *= 0.85; }
    }
    if (imp > maxImpact) maxImpact = imp;
    if (!notified.has(c.id)) { notified.add(c.id); c.onCollide?.(c, imp); onCollide?.(c, imp); }
  });
  return maxImpact;
}

/** Resolves 2-pass wall-sliding push-out, impact velocity damping, bounds & terrain clamping. */
export function resolveMovement(pos, radius = 0.65, velocity = null, onCollide = null) {
  const out = Array.isArray(pos)
    ? { x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0 }
    : { x: Number(pos?.x) || 0, y: Number(pos?.y) || 0, z: Number(pos?.z) || 0 };
  const vel = velocity
    ? { x: Number(velocity.x ?? velocity[0]) || 0, y: Number(velocity.y ?? velocity[1]) || 0, z: Number(velocity.z ?? velocity[2]) || 0 }
    : { x: 0, y: 0, z: 0 };
  const hits = []; const notified = new Set();
  const maxImpact = Math.max(solveSinglePass(out, vel, radius, hits, notified, onCollide), solveSinglePass(out, vel, radius, hits, notified, onCollide));
  if (maxImpact >= 5.5 && performance.now() - _lastImpactAt > 240) {
    _lastImpactAt = performance.now();
    _hardImpactCb?.(out.x, out.y, out.z, maxImpact);
  }
  const lim = TERRAIN_CFG.bounds || 110;
  out.x = THREE.MathUtils.clamp(out.x, -lim, lim); out.z = THREE.MathUtils.clamp(out.z, -lim, lim);
  const groundY = getTerrainHeight(out.x, out.z);
  const grounded = out.y <= groundY + 0.02;
  if (grounded) { out.y = groundY; if (vel.y < 0) vel.y = 0; }
  return { x: out.x, y: out.y, z: out.z, vx: vel.x, vy: vel.y, vz: vel.z, groundY, grounded, collidedWith: hits, impactSpeed: maxImpact };
}

/** Deterministic spatial physics hook providing collider registration, terrain elevation & slide resolution. */
export function useArenaPhysics(terrainPatch = null) {
  useEffect(() => { if (terrainPatch) setTerrainConfig(terrainPatch); }, [terrainPatch?.amplitude, terrainPatch?.frequency, terrainPatch?.flatRadius, terrainPatch?.floorY, terrainPatch?.bounds]);
  const reg = useCallback((id, spec, type) => registerCollider(id, spec, type), []);
  const regObj = useCallback((id, obj, opts) => registerObjectCollider(id, obj, opts), []);
  const unreg = useCallback((id) => unregisterCollider(id), []);
  return { registerCollider: reg, registerObjectCollider: regObj, unregisterCollider: unreg, resolveMovement, getTerrainHeight, setTerrainConfig };
}
