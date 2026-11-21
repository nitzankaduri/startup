import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { combatBus } from '../modes/combatBus';
import { motionBus, triggerCameraShake } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { bindRigInputs, stepFlightCombatRig, stepThirdPersonRig } from './actionFlightRigs';
import { createRigState, stepArcadeCarRig, stepThreeLaneRunnerRig } from './rigHelpers';
import { RigProjectilePool, RigVisuals, pushRigShot } from './RigVisuals';

const TMP_OFFSET = new THREE.Vector3();
const TMP_QUAT = new THREE.Quaternion();
const TMP_EUL = new THREE.Euler();

/**
 * Universal Rapier physics player controller supporting 4 game rigs:
 * 'arcade_car', 'three_lane_runner', 'third_person_action', 'flight_combat'.
 */
export function PlayerRigController({
  rig = 'third_person_action', position = [0, 2.2, 0], color = '#D96B27',
  speed = 10, maxSpeed = 26, boostSpeed = 42, jumpForce = 11.5, laneWidth = 3.2,
  onAttack, onCollide, onTelemetry, children,
}) {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const bodyRef = useRef(null);
  const visualGroupRef = useRef(null);
  const keysRef = useRef({});
  const mouseDownRef = useRef(false);
  const clickQueuedRef = useRef(false);
  const carFxRef = useRef({ speed: 0, steer: 0, isDrifting: false, yaw: 0 });
  const nitroRef = useRef(false);
  const smokeRef = useRef(false);
  const actionFxRef = useRef({ sliding: false, attacking: false });
  const shotsRef = useRef([]);
  const shotCursorRef = useRef(0);
  const stRef = useRef(createRigState(speed));

  const gameState = useGameStore((s) => s.gameState);
  const hasStarted = useGameStore((s) => s.hasStarted);

  useEffect(() => bindRigInputs(keysRef, mouseDownRef, clickQueuedRef), []);

  useFrame((_, rawDelta) => {
    const body = bodyRef.current;
    if (!body) return;
    if (!hasStarted || gameState !== 'playing') {
      const p = body.translation();
      motionBus.pos = { x: p.x, y: p.y, z: p.z };
      motionBus.vel = { x: 0, y: 0, z: 0 };
      body.setLinvel({ x: 0, y: rig === 'flight_combat' ? 0 : body.linvel().y, z: 0 }, true);
      clickQueuedRef.current = false;
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const now = performance.now();
    const s = stRef.current;
    const keys = keysRef.current;
    const clicked = clickQueuedRef.current;
    clickQueuedRef.current = false;

    let res;
    if (rig === 'arcade_car') {
      res = stepArcadeCarRig({ body, world, rapier, s, keys, dt, maxSpeed, speed });
      nitroRef.current = res.nitro;
      smokeRef.current = res.nitro || res.drifting;
      carFxRef.current = { speed: res.speed, steer: res.steer, isDrifting: res.drifting, yaw: res.yaw };
      visualGroupRef.current?.rotation.set(0, res.yaw, res.roll);
    } else if (rig === 'three_lane_runner') {
      res = stepThreeLaneRunnerRig({ body, world, rapier, s, keys, dt, now, laneWidth, speed, jumpForce });
      actionFxRef.current.sliding = res.isSliding;
      smokeRef.current = res.isSliding;
      visualGroupRef.current?.rotation.set(0, 0, res.roll);
    } else if (rig === 'flight_combat') {
      res = stepFlightCombatRig({ body, s, keys, mouseDown: mouseDownRef.current, dt, now, baseSpeed: Math.max(14, speed), boostSpeed, onFire: onAttack });
      smokeRef.current = res.boosting;
      visualGroupRef.current?.quaternion.copy(res.quat);
      if (res.fired) {
        [-1.1, 1.1].forEach((side) => {
          TMP_OFFSET.set(side, 0, -1.4).applyQuaternion(res.quat);
          pushRigShot(shotsRef, shotCursorRef, [res.pos.x + TMP_OFFSET.x, res.pos.y + TMP_OFFSET.y, res.pos.z + TMP_OFFSET.z], [res.fwd.x, res.fwd.y, res.fwd.z], res.quat, 86, 1.2);
        });
      }
    } else {
      res = stepThirdPersonRig({ body, world, rapier, s, keys, clicked, camera, dt, now, speed, jumpForce, onAttack });
      actionFxRef.current.attacking = res.attacking;
      smokeRef.current = res.boosting;
      visualGroupRef.current?.rotation.set(0, res.yaw, 0);
      if (res.attacked) {
        const dir = [Math.sin(res.yaw), 0, Math.cos(res.yaw)];
        TMP_QUAT.setFromEuler(TMP_EUL.set(0, res.yaw, 0));
        pushRigShot(shotsRef, shotCursorRef, [res.pos.x + dir[0] * 0.9, res.pos.y + 0.55, res.pos.z + dir[2] * 0.9], dir, TMP_QUAT, 42, 0.7);
      }
    }

    motionBus.pos = { x: res.pos.x, y: res.pos.y, z: res.pos.z };
    motionBus.vel = { x: res.vx, y: res.vy, z: res.vz };
    motionBus.yaw = res.yaw;
    motionBus.steer = res.steer || 0;
    motionBus.isGrounded = res.grounded;
    motionBus.isBoosting = res.boosting;
    combatBus.playerPos = { x: res.pos.x, y: res.pos.y, z: res.pos.z };
    combatBus.playerFacing = { x: -Math.sin(res.yaw), z: -Math.cos(res.yaw) };
    onTelemetry?.({ speed: Math.hypot(res.vx, res.vz), nitro: s.nitro, grounded: res.grounded, rig });
  });

  const spawnPos = rig === 'flight_combat' ? [position[0], Math.max(8, position[1]), position[2]] : position;
  return (
    <>
      <RigidBody
        ref={bodyRef} name="player" type="dynamic" colliders={false} position={spawnPos}
        gravityScale={rig === 'flight_combat' ? 0 : 1} enabledRotations={[false, false, false]}
        linearDamping={rig === 'flight_combat' ? 1.1 : 0.22} friction={0.05} restitution={0}
        onCollisionEnter={(payload) => {
          const v = bodyRef.current?.linvel();
          const spd = v ? Math.hypot(v.x, v.y, v.z) : 0;
          if (spd > 6.5) triggerCameraShake(Math.min(0.6, spd * 0.03));
          onCollide?.(payload);
        }}
      >
        {rig === 'arcade_car' && <CuboidCollider args={[0.92, 0.48, 1.82]} position={[0, 0.48, 0]} />}
        {rig === 'flight_combat' && <CuboidCollider args={[1.45, 0.44, 1.65]} />}
        {(rig === 'three_lane_runner' || rig === 'third_person_action') && <CapsuleCollider args={[0.45, 0.4]} />}
        <RigVisuals rig={rig} color={color} carFxRef={carFxRef} nitroRef={nitroRef} smokeRef={smokeRef} actionFxRef={actionFxRef} visualGroupRef={visualGroupRef} />
        {children}
      </RigidBody>
      <RigProjectilePool shotsRef={shotsRef} />
    </>
  );
}
