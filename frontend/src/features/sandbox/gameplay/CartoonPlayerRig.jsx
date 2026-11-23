import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { combatBus } from '../modes/combatBus';
import { bindRigInputs, stepFlightCombatRig, stepThirdPersonRig } from '../physics/actionFlightRigs';
import { castGroundRay, createRigState, stepArcadeCarRig, stepThreeLaneRunnerRig } from '../physics/rigHelpers';
import { RigProjectilePool, pushRigShot } from '../physics/RigVisuals';
import { motionBus, triggerCameraShake } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { PlayerSkinAttachment } from '../components/DynamicThemeStyler';
import { sfxLaneSwipe, sfxWhooshJump } from './cartoonSfx';
import { emitCartoonVfx } from './CartoonVFX';
import { CartoonVisualMesh, GroundedBlobShadow } from './CartoonVisualMesh';

const TMP_OFF = new THREE.Vector3();
const TMP_Q = new THREE.Quaternion();
const TMP_E = new THREE.Euler();

/** Expressive Rapier physics player rig supporting 4 modes, mechanics flags & grounded blob shadows. */
export function CartoonPlayerRig({
  rig = 'three_lane_runner', position = [0, 1.8, 0], color = '#D96B27', speed = 11, maxSpeed = 26, boostSpeed = 42, jumpForce = 13.5, laneWidth = 3.2,
  mechanics = {}, attachment = null, shotsRef: externalShotsRef, onAttack, onCollide, onTelemetry,
}) {
  const { camera } = useThree(); const { world, rapier } = useRapier();
  const bodyRef = useRef(null); const visualGroupRef = useRef(null); const blobShadowRef = useRef(null); const chaserRef = useRef(null);
  const keysRef = useRef({}); const mouseDownRef = useRef(false); const clickQueuedRef = useRef(false);
  const carFxRef = useRef({ speed: 0, steer: 0, isDrifting: false, yaw: 0 }); const nitroRef = useRef(false);
  const animRef = useRef({ grounded: true, sliding: false, prevLane: 0, prevJumpAt: 0 });
  const localShotsRef = useRef([]); const shotsRef = externalShotsRef || localShotsRef; const shotCursorRef = useRef(0); const stRef = useRef(createRigState(speed));
  const gameState = useGameStore((s) => s.gameState); const hasStarted = useGameStore((s) => s.hasStarted);
  useEffect(() => bindRigInputs(keysRef, mouseDownRef, clickQueuedRef), []);
  useFrame((_, rawDelta) => {
    const body = bodyRef.current;
    if (!body) return;
    const pNow = body.translation();

    const rayY = rig === 'arcade_car' ? pNow.y + 0.5 : pNow.y;
    const footOff = rig === 'arcade_car' ? 0.5 : 0.85;
    const groundDist = castGroundRay(world, rapier, { x: pNow.x, y: rayY, z: pNow.z }, body, 26.0);
    if (blobShadowRef.current) {
      const h = groundDist !== null ? Math.max(0, groundDist - footOff) : 0;
      const gY = groundDist !== null ? rayY - groundDist + 0.04 : 0.04;
      blobShadowRef.current.position.set(pNow.x, gY, pNow.z);
      blobShadowRef.current.scale.setScalar(THREE.MathUtils.clamp(1.12 - h * 0.13, 0.34, 1.12));
      if (blobShadowRef.current.material) blobShadowRef.current.material.opacity = THREE.MathUtils.clamp(0.42 - h * 0.045, 0.12, 0.42);
    }

    if (!hasStarted || gameState !== 'playing') {
      motionBus.pos = { x: pNow.x, y: pNow.y, z: pNow.z }; motionBus.vel = { x: 0, y: 0, z: 0 };
      body.setLinvel({ x: 0, y: rig === 'flight_combat' ? 0 : body.linvel().y, z: 0 }, true);
      clickQueuedRef.current = false;
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const now = performance.now();
    const s = stRef.current; const keys = keysRef.current;
    const clicked = clickQueuedRef.current; clickQueuedRef.current = false;

    let res;
    if (rig === 'three_lane_runner') {
      res = stepThreeLaneRunnerRig({ body, world, rapier, s, keys, dt, now, laneWidth, speed, jumpForce });
      if (s.lane !== animRef.current.prevLane) {
        sfxLaneSwipe(s.lane - animRef.current.prevLane);
        animRef.current.prevLane = s.lane;
        emitCartoonVfx({ kind: 'dust', position: [res.pos.x, res.pos.y - 0.5, res.pos.z], count: 5, audio: false });
      }
      animRef.current.sliding = res.isSliding;
      visualGroupRef.current?.rotation.set(0, 0, res.roll * 1.35);
      if (mechanics.canShoot && (clicked || keys.KeyF) && now - s.lastFire > 220) {
        s.lastFire = now;
        TMP_Q.set(0, 0, 0, 1);
        pushRigShot(shotsRef, shotCursorRef, [res.pos.x, res.pos.y + 0.6, res.pos.z - 1.0], [0, 0, -1], TMP_Q, 58, 1.0);
        onAttack?.();
      }
      if (chaserRef.current) chaserRef.current.position.set(THREE.MathUtils.lerp(chaserRef.current.position.x, res.pos.x, 1 - Math.exp(-4 * dt)), 0.9, res.pos.z + 4.8);
    } else if (rig === 'arcade_car') {
      res = stepArcadeCarRig({ body, world, rapier, s, keys, dt, maxSpeed, speed });
      nitroRef.current = res.nitro;
      carFxRef.current = { speed: res.speed, steer: res.steer, isDrifting: res.drifting, yaw: res.yaw };
      visualGroupRef.current?.rotation.set(0, res.yaw, res.roll * 1.45);
      if (res.drifting) emitCartoonVfx({ kind: 'dust', position: [res.pos.x, res.pos.y + 0.1, res.pos.z], count: 2, audio: false });
    } else if (rig === 'flight_combat') {
      res = stepFlightCombatRig({ body, s, keys, mouseDown: mouseDownRef.current, dt, now, baseSpeed: Math.max(14, speed), boostSpeed, onFire: onAttack });
      visualGroupRef.current?.quaternion.copy(res.quat);
      if (res.fired) {
        [-1.1, 1.1].forEach((side) => {
          TMP_OFF.set(side, 0, -1.4).applyQuaternion(res.quat);
          pushRigShot(shotsRef, shotCursorRef, [res.pos.x + TMP_OFF.x, res.pos.y + TMP_OFF.y, res.pos.z + TMP_OFF.z], [res.fwd.x, res.fwd.y, res.fwd.z], res.quat, 86, 1.2);
        });
      }
    } else {
      res = stepThirdPersonRig({ body, world, rapier, s, keys, clicked, camera, dt, now, speed, jumpForce, onAttack });
      visualGroupRef.current?.rotation.set(0, res.yaw, 0);
      if (res.attacked) {
        const d = [Math.sin(res.yaw), 0, Math.cos(res.yaw)];
        TMP_Q.setFromEuler(TMP_E.set(0, res.yaw, 0));
        pushRigShot(shotsRef, shotCursorRef, [res.pos.x + d[0] * 0.9, res.pos.y + 0.5, res.pos.z + d[2] * 0.9], d, TMP_Q, 42, 0.7);
      }
    }

    if (motionBus.jumpAt > animRef.current.prevJumpAt) {
      animRef.current.prevJumpAt = motionBus.jumpAt;
      sfxWhooshJump(); emitCartoonVfx({ kind: 'dust', position: [res.pos.x, res.pos.y - 0.5, res.pos.z], count: 8, audio: false });
    } else if (!animRef.current.grounded && res.grounded && res.vy <= 1.5) {
      motionBus.landAt = now;
    }
    animRef.current.grounded = res.grounded;

    motionBus.pos = { x: res.pos.x, y: res.pos.y, z: res.pos.z }; motionBus.vel = { x: res.vx, y: res.vy, z: res.vz };
    motionBus.yaw = res.yaw; motionBus.steer = res.steer || 0; motionBus.isGrounded = res.grounded; motionBus.isBoosting = res.boosting;
    combatBus.playerPos = { x: res.pos.x, y: res.pos.y, z: res.pos.z }; combatBus.playerFacing = { x: -Math.sin(res.yaw), z: -Math.cos(res.yaw) };
    onTelemetry?.({ speed: Math.hypot(res.vx, res.vz), nitro: s.nitro, grounded: res.grounded, rig });
  });

  const spawnPos = rig === 'flight_combat' ? [position[0], Math.max(8, position[1]), position[2]] : position;
  return (
    <>
      <RigidBody
        ref={bodyRef} name="player" type="dynamic" colliders={false} position={spawnPos}
        gravityScale={rig === 'flight_combat' ? 0 : 1} enabledRotations={[false, false, false]}
        linearDamping={rig === 'flight_combat' ? 1.1 : 0.2} friction={0.05} restitution={0}
        onCollisionEnter={(payload) => {
          const v = bodyRef.current?.linvel(); const spd = v ? Math.hypot(v.x, v.y, v.z) : 0;
          if (spd > 6) {
            const p = bodyRef.current.translation();
            triggerCameraShake(Math.min(0.65, spd * 0.035));
            emitCartoonVfx({ kind: 'crash', position: [p.x, p.y + 0.8, p.z], count: 10 });
          }
          onCollide?.(payload);
        }}
      >
        {rig === 'arcade_car' && <CuboidCollider args={[0.92, 0.48, 1.82]} position={[0, 0.48, 0]} />}
        {rig === 'flight_combat' && <CuboidCollider args={[1.45, 0.44, 1.65]} />}
        {(rig === 'three_lane_runner' || rig === 'third_person_action') && <CapsuleCollider args={[0.45, 0.4]} />}
        <CartoonVisualMesh rig={rig} color={color} animRef={animRef} carFxRef={carFxRef} nitroRef={nitroRef} visualGroupRef={visualGroupRef} />
        <PlayerSkinAttachment attachment={attachment} color={color} />
      </RigidBody>
      {mechanics.chaserEnemy && (
        <mesh ref={chaserRef} position={[position[0], 0.9, position[2] + 4.8]}><boxGeometry args={[0.9, 1.8, 0.8]} /><meshToonMaterial color="#1E3A8A" /></mesh>
      )}
      <GroundedBlobShadow shadowRef={blobShadowRef} />
      <RigProjectilePool shotsRef={shotsRef} />
    </>
  );
}
