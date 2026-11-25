import * as THREE from 'three';
import { playArcadeSfx } from './ArcadeSoundEngine';
import { CITY_HALF, STREET_LINES, resolveBuildingCollisions } from './OpenWorldBuilder';

export function buildOpenWorldVehicles() {
  const specs = [
    [0, -14, 0, 'sports_car', false],
    [20, -4, Math.PI / 2, 'sports_car', true],
    [-20, 18, 0, 'police_car', true],
    [60, -34, Math.PI, 'sports_car', true],
    [-60, 42, -Math.PI / 2, 'sports_car', true],
    [14, 20, Math.PI / 2, 'police_car', false],
    [-42, -60, 0, 'sports_car', true],
    [40, 60, -Math.PI / 2, 'police_car', true],
  ];
  return specs.map(([x, z, yaw, kind, roaming], idx) => ({
    id: `veh-${idx}`,
    alive: true,
    x, y: 1.0, z, yaw,
    kind, roaming,
    speed: roaming ? 9.5 + (idx % 3) * 2.0 : 0,
    occupied: false,
  }));
}

export function findNearestVehicle(st, maxDist = 4.6) {
  let bestIdx = -1;
  let bestDist = maxDist;
  for (let i = 0; i < st.vehicles.length; i += 1) {
    const v = st.vehicles[i];
    if (!v.alive) continue;
    const d = Math.hypot(v.x - st.px, v.z - st.pz);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

export function toggleEnterExitVehicle(st, now, onHijack) {
  if (st.inVehicleIdx >= 0) {
    const v = st.vehicles[st.inVehicleIdx];
    if (v) {
      v.x = st.px; v.z = st.pz; v.yaw = st.yaw; v.occupied = false; v.roaming = false;
    }
    st.px += Math.cos(st.yaw) * 2.4;
    st.pz -= Math.sin(st.yaw) * 2.4;
    st.inVehicleIdx = -1;
    st.curSpeed = 0;
    playArcadeSfx('jump');
    return false;
  }
  const idx = findNearestVehicle(st);
  if (idx < 0) return false;
  const v = st.vehicles[idx];
  v.occupied = true;
  st.inVehicleIdx = idx;
  st.px = v.x; st.pz = v.z; st.yaw = v.yaw;
  st.curSpeed = 0;
  playArcadeSfx('powerup');
  onHijack?.(st, now);
  return true;
}

export function stepSandboxDriving({ st, feel, keys, dt }) {
  const k = keys;
  const throttle = ((k.KeyW || k.ArrowUp) ? 1 : 0) - ((k.KeyS || k.ArrowDown) ? 1 : 0);
  const steer = ((k.KeyA || k.ArrowLeft) ? 1 : 0) - ((k.KeyD || k.ArrowRight) ? 1 : 0);
  const handbrake = Boolean(k.Space);
  const nitro = Boolean(k.ShiftLeft || k.ShiftRight);

  const maxSpd = st.baseSpeed * (nitro ? 2.25 : 1.75);
  const targetSpd = handbrake ? st.curSpeed * 0.86 : throttle > 0 ? maxSpd : throttle < 0 ? -9.5 : st.curSpeed * 0.96;
  st.curSpeed = THREE.MathUtils.lerp(st.curSpeed, targetSpd, 1 - Math.exp(-(throttle !== 0 ? 4.2 : 2.5) * dt));

  const steerFactor = Math.min(1, Math.abs(st.curSpeed) / 5.5) * (st.curSpeed >= 0 ? 1 : -1);
  const turnRate = (handbrake ? 3.4 : 2.35) * steerFactor;
  st.yaw += steer * turnRate * dt;

  const fx = -Math.sin(st.yaw);
  const fz = -Math.cos(st.yaw);
  const pos = { x: st.px + fx * st.curSpeed * dt, z: st.pz + fz * st.curSpeed * dt, curSpeed: st.curSpeed };
  resolveBuildingCollisions(pos, 1.45, st.buildings, 'curSpeed');
  st.px = pos.x; st.pz = pos.z; st.curSpeed = pos.curSpeed;
  st.py = 1.0;

  const v = st.vehicles[st.inVehicleIdx];
  if (v) { v.x = st.px; v.z = st.pz; v.yaw = st.yaw; }
  feel.bankRoll = THREE.MathUtils.lerp(feel.bankRoll, -steer * steerFactor * (handbrake ? 0.16 : 0.08), 1 - Math.exp(-10 * dt));
}

export function stepSandboxOnFoot(st, mx, mz, dt, boosting) {
  const len = Math.hypot(mx, mz) || 1;
  const nx = mx / len; const nz = mz / len;
  const spd = st.baseSpeed * (boosting ? 1.45 : 1.0);
  st.vx = THREE.MathUtils.lerp(st.vx, nx * spd, 1 - Math.exp(-14 * dt));
  st.vz = THREE.MathUtils.lerp(st.vz, nz * spd, 1 - Math.exp(-14 * dt));
  const pos = { x: st.px + st.vx * dt, z: st.pz + st.vz * dt, vx: st.vx, vz: st.vz };
  resolveBuildingCollisions(pos, 0.55, st.buildings);
  st.px = pos.x; st.pz = pos.z; st.vx = pos.vx; st.vz = pos.vz;
  st.curSpeed = Math.hypot(st.vx, st.vz);
  if (Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05) {
    const targetYaw = Math.atan2(-nx, -nz);
    st.yaw += Math.atan2(Math.sin(targetYaw - st.yaw), Math.cos(targetYaw - st.yaw)) * (1 - Math.exp(-14 * dt));
  }
  st.vy -= 28 * dt; st.py += st.vy * dt;
}

export function stepRoamingVehicles(st, dt) {
  for (let i = 0; i < st.vehicles.length; i += 1) {
    const v = st.vehicles[i];
    if (!v.alive || v.occupied || !v.roaming) continue;
    v.x += -Math.sin(v.yaw) * v.speed * dt;
    v.z += -Math.cos(v.yaw) * v.speed * dt;
    if (Math.abs(v.x) > CITY_HALF - 4 || Math.abs(v.z) > CITY_HALF - 4) {
      v.yaw += Math.PI;
      v.x = THREE.MathUtils.clamp(v.x, -CITY_HALF + 5, CITY_HALF - 5);
      v.z = THREE.MathUtils.clamp(v.z, -CITY_HALF + 5, CITY_HALF - 5);
    } else if (Math.abs((v.x % 40)) < 0.35 && Math.abs((v.z % 40)) < 0.35 && STREET_LINES.includes(Math.round(v.x))) {
      if ((i + Math.floor(v.x)) % 3 === 0) v.yaw += Math.PI / 2;
    }
  }
}
