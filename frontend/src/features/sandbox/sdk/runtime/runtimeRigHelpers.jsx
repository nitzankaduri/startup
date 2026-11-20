import * as THREE from 'three';
import { getTerrainHeight, resolveMovement } from './useArenaPhysics';

const TMP_FWD = new THREE.Vector3();
const TMP_RIGHT = new THREE.Vector3();

/** Computes camera-yaw-relative XZ movement vector for responsive third-person controls. */
export function computeCameraMoveDir(camera, mx, mz) {
  camera.getWorldDirection(TMP_FWD);
  TMP_FWD.y = 0;
  if (TMP_FWD.lengthSq() < 0.0001) TMP_FWD.set(0, 0, -1);
  TMP_FWD.normalize();
  TMP_RIGHT.set(-TMP_FWD.z, 0, TMP_FWD.x);
  const wx = TMP_RIGHT.x * mx - TMP_FWD.x * mz;
  const wz = TMP_RIGHT.z * mx - TMP_FWD.z * mz;
  const len = Math.hypot(wx, wz);
  return len > 0.001 ? { x: wx / len, z: wz / len, active: true } : { x: 0, z: 0, active: false };
}

/** Smoothly integrates third-person action movement, coyote jump, dash & collider resolution. */
export function stepThirdPersonAction({ st, input, camera, speed, jumpForce, dt, now, onAttack, onCollide, syncMotionBus }) {
  const mx = (input.isPressed('KeyD') || input.isPressed('ArrowRight') ? 1 : 0) - (input.isPressed('KeyA') || input.isPressed('ArrowLeft') ? 1 : 0);
  const mz = (input.isPressed('KeyS') || input.isPressed('ArrowDown') ? 1 : 0) - (input.isPressed('KeyW') || input.isPressed('ArrowUp') ? 1 : 0);
  const dir = computeCameraMoveDir(camera, mx, mz);
  if (dir.active) st.yaw = THREE.MathUtils.lerp(st.yaw, Math.atan2(dir.x, dir.z), Math.min(1, dt * 14));

  const wantJump = input.isPressed('Space');
  if (wantJump && !st.prevJump) st.jumpBuf = now;
  st.prevJump = wantJump;

  const wantDash = input.isPressed('ShiftLeft') || input.isPressed('ShiftRight');
  if (wantDash && !st.prevDash && now - st.lastDash > 1150) {
    st.lastDash = now;
    st.dashUntil = now + 170;
    const dx = dir.active ? dir.x : Math.sin(st.yaw);
    const dz = dir.active ? dir.z : Math.cos(st.yaw);
    st.dashVx = dx * speed * 2.5; st.dashVz = dz * speed * 2.5;
  }
  st.prevDash = wantDash;

  const attacking = now < st.attackUntil;
  const wantAttack = input.pointer.current.isDown || input.isPressed('KeyF') || input.isPressed('KeyE');
  if (wantAttack && !st.prevAtk && now - st.lastAttack > 360) {
    st.lastAttack = now; st.attackUntil = now + 280;
    const fx = Math.sin(st.yaw); const fz = Math.cos(st.yaw);
    onAttack?.({ position: [st.x, st.y + 1, st.z], direction: [fx, 0, fz], origin: [st.x + fx * 0.9, st.y + 1.0, st.z + fz * 0.9] });
  }
  st.prevAtk = wantAttack;

  const dashing = now < st.dashUntil;
  const vx = dashing ? st.dashVx : (dir.active ? dir.x * speed : 0);
  const vz = dashing ? st.dashVz : (dir.active ? dir.z * speed : 0);
  if (!dashing) st.vy -= 30 * dt;
  else st.vy = 0;

  if (now - st.jumpBuf <= 130 && now - st.lastGround <= 130) {
    st.vy = jumpForce; st.jumpBuf = 0; st.lastGround = 0;
  }

  const next = resolveMovement({ x: st.x + vx * dt, y: st.y + st.vy * dt, z: st.z + vz * dt }, 0.65, { x: vx, y: st.vy, z: vz }, onCollide);
  st.x = next.x; st.y = next.y; st.z = next.z; st.vy = next.vy;
  if (next.grounded) st.lastGround = now;

  syncMotionBus(st, { x: vx, y: st.vy, z: vz }, next.grounded, dashing);
  return !next.grounded ? 'Jump' : attacking ? 'Attack' : dir.active ? (dashing ? 'Run' : 'Run') : 'Idle';
}

/** Integrates arcade car grip/drift/nitro physics with arena wall slide & auto-upright flip recovery. */
export function stepArcadeVehicle({ st, input, maxSpeed, accel, dt, now, onTelemetry, onCollide, syncMotionBus }) {
  const throttle = (input.isPressed('KeyW') || input.isPressed('ArrowUp') ? 1 : 0) - (input.isPressed('KeyS') || input.isPressed('ArrowDown') ? 1 : 0);
  const steerIn = (input.isPressed('KeyA') || input.isPressed('ArrowLeft') ? 1 : 0) - (input.isPressed('KeyD') || input.isPressed('ArrowRight') ? 1 : 0);
  const drifting = input.isPressed('Space');
  const nitro = (input.isPressed('ShiftLeft') || input.isPressed('ShiftRight')) && st.nitro > 4;
  st.nitro = nitro ? Math.max(0, st.nitro - dt * 36) : Math.min(100, st.nitro + dt * 18);

  const fx = -Math.sin(st.yaw); const fz = -Math.cos(st.yaw);
  const rx = Math.cos(st.yaw); const rz = -Math.sin(st.yaw);
  let fwdSpd = st.vx * fx + st.vz * fz;
  let latSpd = st.vx * rx + st.vz * rz;

  const top = maxSpeed * (nitro ? 1.48 : 1);
  fwdSpd = THREE.MathUtils.clamp((fwdSpd + throttle * accel * (nitro ? 1.45 : 1) * dt) * Math.exp(-(throttle === 0 ? 1.8 : 0.55) * dt), -top * 0.45, top);
  const sf = Math.max(0.45, THREE.MathUtils.clamp(Math.abs(fwdSpd) / 5, 0, 1));
  st.yaw += steerIn * (drifting ? 2.85 : 2.1) * sf * (fwdSpd >= -0.2 ? 1 : -1) * dt;
  latSpd *= Math.exp(-(drifting ? 2.2 : 9.4) * dt);

  const nfx = -Math.sin(st.yaw); const nfz = -Math.cos(st.yaw);
  const nrx = Math.cos(st.yaw); const nrz = -Math.sin(st.yaw);
  const nvx = nfx * fwdSpd + nrx * latSpd;
  const nvz = nfz * fwdSpd + nrz * latSpd;

  const res = resolveMovement({ x: st.x + nvx * dt, y: st.y, z: st.z + nvz * dt }, 1.25, { x: nvx, y: 0, z: nvz }, onCollide);
  st.x = res.x; st.y = res.groundY; st.z = res.z; st.vx = res.vx; st.vz = res.vz;

  // Auto-upright flip recovery & smooth suspension roll
  const targetRoll = -steerIn * sf * (drifting ? 0.16 : 0.09);
  st.roll = THREE.MathUtils.lerp(st.roll, targetRoll, Math.min(1, dt * 10));
  if (Math.abs(st.roll) > 0.55 && now - st.lastFlip > 600) { st.roll = 0; st.lastFlip = now; }
  syncMotionBus(st, { x: st.vx, y: 0, z: st.vz }, true, nitro || drifting);
  onTelemetry?.({ speedKmh: Math.round(Math.hypot(st.vx, st.vz) * 4.2), nitro: Math.round(st.nitro), isDrifting: drifting });
  return { drifting, nitro, fwdSpeed: res.vx * nfx + res.vz * nfz, steer: steerIn, braking: throttle < 0 || drifting, isSkid: (drifting && Math.abs(fwdSpd) > 4) || Math.abs(latSpd) > 3.0 };
}

/** Integrates 6-DOF arcade flight shooter movement with auto-leveling assist and terrain altitude clamp. */
export function stepFlightShooter({ st, input, speed, boostSpeed, dt, now, projRef, onFire, syncMotionBus }) {
  const pitchIn = (input.isPressed('KeyS') || input.isPressed('ArrowDown') ? 1 : 0) - (input.isPressed('KeyW') || input.isPressed('ArrowUp') ? 1 : 0);
  const yawIn = (input.isPressed('KeyA') || input.isPressed('ArrowLeft') ? 1 : 0) - (input.isPressed('KeyD') || input.isPressed('ArrowRight') ? 1 : 0);
  const climbIn = (input.isPressed('Space') || input.isPressed('KeyE') ? 1 : 0) - (input.isPressed('KeyQ') ? 1 : 0);
  const boosting = input.isPressed('ShiftLeft') || input.isPressed('ShiftRight');

  st.yaw += yawIn * 1.9 * dt;
  st.pitch = pitchIn === 0 ? THREE.MathUtils.lerp(st.pitch, 0, Math.min(1, dt * 3.0)) : THREE.MathUtils.clamp(st.pitch + pitchIn * 1.5 * dt, -0.65, 0.65);
  st.roll = THREE.MathUtils.lerp(st.roll, yawIn * 0.58, Math.min(1, dt * 8));
  const curSpd = THREE.MathUtils.lerp(st.spd || speed, boosting ? boostSpeed : speed, Math.min(1, dt * 4));
  st.spd = curSpd;

  const cosP = Math.cos(st.pitch);
  const vx = -Math.sin(st.yaw) * cosP * curSpd;
  const vz = -Math.cos(st.yaw) * cosP * curSpd;
  const vy = Math.sin(st.pitch) * curSpd + climbIn * 9.0;
  st.x += vx * dt; st.z += vz * dt;
  const minAlt = getTerrainHeight(st.x, st.z) + 2.2;
  st.y = THREE.MathUtils.clamp(st.y + vy * dt, minAlt, 42);

  if ((input.pointer.current.isDown || input.isPressed('KeyF')) && now - st.lastFire > 160) {
    st.lastFire = now;
    const fwd = [-Math.sin(st.yaw) * cosP, Math.sin(st.pitch), -Math.cos(st.yaw) * cosP];
    const rx = Math.cos(st.yaw) * 0.65; const rz = -Math.sin(st.yaw) * 0.65;
    projRef.current?.fire([st.x - rx, st.y, st.z - rz], fwd);
    projRef.current?.fire([st.x + rx, st.y, st.z + rz], fwd);
    onFire?.({ position: [st.x, st.y, st.z], direction: fwd });
  }
  syncMotionBus(st, { x: vx, y: vy, z: vz }, false, boosting);
}
