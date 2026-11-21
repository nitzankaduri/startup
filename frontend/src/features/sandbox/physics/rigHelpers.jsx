import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { triggerJumpMotion } from '../sdk/motionBus';

/** Downward Rapier raycast returning distance to non-sensor solid geometry. */
export function castGroundRay(world, rapier, pos, body, maxDist = 1.6) {
  const ray = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, { x: 0, y: -1, z: 0 });
  const hit = world.castRay(ray, maxDist, true, undefined, undefined, undefined, body, (c) => !c.isSensor());
  return hit ? hit.timeOfImpact : null;
}

/** Initial mutable physics state shared across rig controllers. */
export function createRigState(speed = 10) {
  return {
    yaw: 0, pitch: 0, roll: 0, nitro: 100, spd: speed, lane: 0, jumpsLeft: 2,
    lastGround: 0, jumpBuf: 0, lastJump: 0, dashUntil: 0, lastDash: 0, dashVx: 0, dashVz: 0,
    slideUntil: 0, attackUntil: 0, lastAttack: 0, lastFire: 0, prevL: false, prevR: false,
    prevUp: false, prevDown: false, prevJump: false, prevDash: false,
  };
}

/** Step 1: Dynamic Rapier arcade car with lateral tire grip, handbrake drift & Shift nitro. */
export function stepArcadeCarRig({ body, world, rapier, s, keys, dt, maxSpeed, speed }) {
  const pos = body.translation();
  const vel = body.linvel();
  const hitDist = castGroundRay(world, rapier, pos, body, 1.5);
  const grounded = (hitDist !== null && hitDist <= 0.85) || Math.abs(vel.y) < 0.4;

  const throttle = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  const handbrake = Boolean(keys.Space);
  const wantNitro = Boolean(keys.ShiftLeft || keys.ShiftRight);
  const nitroActive = wantNitro && s.nitro > 2 && throttle >= 0;
  s.nitro = nitroActive ? Math.max(0, s.nitro - dt * 28) : Math.min(100, s.nitro + dt * 16);

  const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw);
  const rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw);
  let fwd = vel.x * fx + vel.z * fz;
  let lat = vel.x * rx + vel.z * rz;

  const topSpd = nitroActive ? Math.max(maxSpeed * 1.4, speed * 1.6) : maxSpeed;
  if (handbrake) fwd *= Math.exp(-3.8 * dt);
  else if (throttle > 0) fwd = Math.min(topSpd, fwd + (nitroActive ? 38 : 24) * dt);
  else if (throttle < 0) fwd = Math.max(-maxSpeed * 0.45, fwd - 28 * dt);
  else fwd *= Math.exp(-2.2 * dt);

  const grip = handbrake ? 2.4 : Math.abs(steer) > 0 && Math.abs(fwd) > 6 ? 7.5 : 12.0;
  lat *= Math.exp(-grip * dt);

  const turnAuth = handbrake ? 2.85 : 2.05;
  if (Math.abs(fwd) > 0.65) s.yaw += steer * turnAuth * dt * (fwd >= 0 ? 1 : -1);
  s.roll = THREE.MathUtils.lerp(s.roll, steer * Math.min(1, Math.abs(fwd) / 14) * 0.08, 1 - Math.exp(-10 * dt));

  const nfx = -Math.sin(s.yaw), nfz = -Math.cos(s.yaw);
  const nrx = Math.cos(s.yaw), nrz = -Math.sin(s.yaw);
  const vx = nfx * fwd + nrx * lat, vz = nfz * fwd + nrz * lat;
  body.setLinvel({ x: vx, y: vel.y, z: vz }, true);

  return {
    pos, vx, vy: vel.y, vz, yaw: s.yaw, roll: s.roll, steer,
    grounded, boosting: nitroActive, drifting: handbrake || Math.abs(lat) > 2.2,
    nitro: nitroActive, handbrake, speed: fwd,
  };
}

/** Step 2: Rapier 3-lane runner with smooth lane snap, jump & slide crouch. */
export function stepThreeLaneRunnerRig({ body, world, rapier, s, keys, dt, now, laneWidth, speed, jumpForce }) {
  const pos = body.translation();
  const vel = body.linvel();
  const hitDist = castGroundRay(world, rapier, pos, body, 1.5);
  const grounded = hitDist !== null && hitDist <= 0.95;
  if (grounded) s.lastGround = now;

  const goL = Boolean(keys.KeyA || keys.ArrowLeft);
  const goR = Boolean(keys.KeyD || keys.ArrowRight);
  const goUp = Boolean(keys.KeyW || keys.ArrowUp || keys.Space);
  const goDown = Boolean(keys.KeyS || keys.ArrowDown);

  if (goL && !s.prevL && s.lane > -1) { s.lane -= 1; soundEngine.playLaneWhoosh(); }
  if (goR && !s.prevR && s.lane < 1) { s.lane += 1; soundEngine.playLaneWhoosh(); }
  if (goUp && !s.prevUp) s.jumpBuf = now;
  if (goDown && !s.prevDown) {
    s.slideUntil = now + 650;
    if (!grounded && vel.y > -20) body.setLinvel({ x: vel.x, y: -22, z: vel.z }, true);
    soundEngine.playDash();
  }
  s.prevL = goL; s.prevR = goR; s.prevUp = goUp; s.prevDown = goDown;

  const vx = THREE.MathUtils.clamp((s.lane * laneWidth - pos.x) * 14, -22, 22);
  let vy = goDown && !grounded ? -22 : vel.y;
  if (now - s.jumpBuf <= 130 && now - s.lastGround <= 130 && now - s.lastJump > 220) {
    vy = jumpForce;
    s.jumpBuf = 0; s.lastGround = 0; s.lastJump = now; s.slideUntil = 0;
    triggerJumpMotion(); soundEngine.playJump();
  }

  s.spd = Math.min(28, (s.spd || speed) + dt * 0.25);
  const vz = -s.spd;
  body.setLinvel({ x: vx, y: vy, z: vz }, true);
  const isSliding = now < s.slideUntil;
  s.roll = THREE.MathUtils.lerp(s.roll, -(vx / 14) * 0.24, 1 - Math.exp(-12 * dt));
  return { pos, vx, vy, vz, yaw: 0, roll: s.roll, steer: -vx / 14, grounded, boosting: false, isSliding };
}
