import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { triggerJumpMotion } from '../sdk/motionBus';
import { castGroundRay } from './rigHelpers';

const TMP_FWD = new THREE.Vector3();
const TMP_RIGHT = new THREE.Vector3();
const TMP_EULER = new THREE.Euler(0, 0, 0, 'YXZ');
const TMP_QUAT = new THREE.Quaternion();

/** Bind keyboard + left-click listeners once for PlayerRigController. */
export function bindRigInputs(keysRef, mouseDownRef, clickQueuedRef) {
  const kd = (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') e.preventDefault();
    keysRef.current[e.code] = true;
  };
  const ku = (e) => { keysRef.current[e.code] = false; };
  const md = (e) => { if (e.button === 0) { mouseDownRef.current = true; clickQueuedRef.current = true; } };
  const mu = (e) => { if (e.button === 0) mouseDownRef.current = false; };
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('mousedown', md);
  window.addEventListener('mouseup', mu);
  return () => {
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    window.removeEventListener('mousedown', md);
    window.removeEventListener('mouseup', mu);
  };
}

/** Step 3: Rapier third-person character with camera-relative WASD, double-jump, Shift dash & attack. */
export function stepThirdPersonRig({ body, world, rapier, s, keys, clicked, camera, dt, now, speed, jumpForce, onAttack }) {
  const pos = body.translation();
  const vel = body.linvel();
  const hitDist = castGroundRay(world, rapier, pos, body, 1.5);
  const grounded = hitDist !== null && hitDist <= 0.96;
  if (grounded) { s.lastGround = now; if (vel.y <= 0.5) s.jumpsLeft = 2; }

  camera.getWorldDirection(TMP_FWD);
  TMP_FWD.y = 0;
  if (TMP_FWD.lengthSq() < 0.001) TMP_FWD.set(0, 0, -1);
  TMP_FWD.normalize();
  TMP_RIGHT.set(-TMP_FWD.z, 0, TMP_FWD.x);

  const inF = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const inR = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let mx = TMP_FWD.x * inF + TMP_RIGHT.x * inR;
  let mz = TMP_FWD.z * inF + TMP_RIGHT.z * inR;
  const mLen = Math.hypot(mx, mz);
  if (mLen > 0.01) { mx /= mLen; mz /= mLen; s.yaw = Math.atan2(mx, mz); }

  const wantJump = Boolean(keys.Space);
  if (wantJump && !s.prevJump) s.jumpBuf = now;
  s.prevJump = wantJump;

  const wantDash = Boolean(keys.ShiftLeft || keys.ShiftRight);
  if (wantDash && !s.prevDash && now - s.lastDash > 900) {
    s.lastDash = now; s.dashUntil = now + 170;
    s.dashVx = Math.sin(s.yaw) * speed * 2.5;
    s.dashVz = Math.cos(s.yaw) * speed * 2.5;
    soundEngine.playDash();
  }
  s.prevDash = wantDash;

  const isDashing = now < s.dashUntil;
  const vx = isDashing ? s.dashVx : mLen > 0.01 ? mx * speed : vel.x * Math.exp(-14 * dt);
  const vz = isDashing ? s.dashVz : mLen > 0.01 ? mz * speed : vel.z * Math.exp(-14 * dt);
  let vy = isDashing ? 0 : vel.y;

  if (now - s.jumpBuf <= 130 && s.jumpsLeft > 0 && now - s.lastJump > 180) {
    vy = s.jumpsLeft === 2 ? jumpForce : jumpForce * 0.92;
    s.jumpsLeft = grounded ? 1 : 0;
    s.jumpBuf = 0; s.lastJump = now;
    triggerJumpMotion(); soundEngine.playJump();
  }

  let attacked = false;
  if (clicked && now - s.lastAttack > 260) {
    s.lastAttack = now; s.attackUntil = now + 220; attacked = true;
    soundEngine.playDash();
    onAttack?.({ position: [pos.x, pos.y + 0.6, pos.z], direction: [Math.sin(s.yaw), 0, Math.cos(s.yaw)], yaw: s.yaw });
  }

  body.setLinvel({ x: vx, y: vy, z: vz }, true);
  return { pos, vx, vy, vz, yaw: s.yaw, roll: 0, steer: inR, grounded, boosting: isDashing, attacking: now < s.attackUntil, attacked };
}

/** Step 4: Rapier 6-DOF flight combat rig with pitch/yaw/roll banking, Shift boost & twin lasers. */
export function stepFlightCombatRig({ body, s, keys, mouseDown, dt, now, baseSpeed, boostSpeed, onFire }) {
  const pos = body.translation();
  const pitchIn = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const yawIn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  const boosting = Boolean(keys.ShiftLeft || keys.ShiftRight);
  const firing = Boolean(keys.Space || mouseDown);

  s.pitch = THREE.MathUtils.clamp(s.pitch + pitchIn * 1.75 * dt, -0.72, 0.72);
  if (pitchIn === 0) s.pitch *= Math.exp(-1.8 * dt);
  s.yaw += yawIn * 2.15 * dt;
  s.roll = THREE.MathUtils.lerp(s.roll, yawIn * 0.68, 1 - Math.exp(-7.5 * dt));

  const targetSpd = boosting ? boostSpeed : baseSpeed;
  s.spd = THREE.MathUtils.lerp(s.spd || baseSpeed, targetSpd, 1 - Math.exp(-4.5 * dt));

  TMP_EULER.set(s.pitch, s.yaw, s.roll, 'YXZ');
  TMP_QUAT.setFromEuler(TMP_EULER);
  TMP_FWD.set(0, 0, -1).applyQuaternion(TMP_QUAT).normalize();

  const vx = TMP_FWD.x * s.spd, vy = TMP_FWD.y * s.spd, vz = TMP_FWD.z * s.spd;
  body.setLinvel({ x: vx, y: vy, z: vz }, true);

  let fired = false;
  if (firing && now - s.lastFire > 135) {
    s.lastFire = now; fired = true;
    onFire?.({ position: [pos.x, pos.y, pos.z], direction: [TMP_FWD.x, TMP_FWD.y, TMP_FWD.z], quat: TMP_QUAT.clone() });
  }
  return { pos, vx, vy, vz, yaw: s.yaw, pitch: s.pitch, roll: s.roll, steer: -yawIn, grounded: false, boosting, fired, quat: TMP_QUAT, fwd: TMP_FWD };
}
