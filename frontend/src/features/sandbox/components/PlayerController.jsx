import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { touchInput } from '../hooks/touchInputState';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { combatBus } from '../modes/combatBus';
import { addImpactTrauma, isPowerupActive, motionBus, triggerJumpMotion, triggerLandMotion } from '../sdk/spawnSdk';
import { DASH_COOLDOWN_MS, useGameStore } from '../store/useGameStore';
import { DashTrail } from './DashTrail';
import { MotionRig } from './MotionRig';
import { PlayerMesh } from './PlayerMesh';

export function PlayerController({ playerConfig }) {
  const bodyRef = useRef(null);
  const squashRef = useRef(new THREE.Vector3(1, 1, 1));
  const velRef = useRef({ vx: 0, vz: 0 });
  const facingRef = useRef({ x: 0, z: -1 });
  const groundDistRef = useRef(0.7);
  const trailRef = useRef([]);
  const timers = useRef({
    wasAirborne: false, lastGrounded: 0, jumpBuffered: 0, lastJump: 0,
    prevJump: false, prevDash: false, dashUntil: 0, dashVx: 0, dashVz: 0, lastTrailAt: 0,
  });
  const keysRef = useKeyboardInput();
  const { world, rapier } = useRapier();

  const gameState = useGameStore((s) => s.gameState);
  const lastDashAt = useGameStore((s) => s.lastDashAt);
  const triggerDash = useGameStore((s) => s.triggerDash);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);

  const speed = playerConfig?.speed ?? 8.0;
  const jumpForce = playerConfig?.jump_force ?? 9.5;
  const color = playerConfig?.color ?? '#FAFAFA';

  useFrame((state) => {
    const body = bodyRef.current;
    if (!body) return;

    const nowMs = performance.now();
    const pos = body.translation();
    const vel = body.linvel();
    const t = timers.current;

    const ray = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, { x: 0, y: -1, z: 0 });
    const shadowHit = world.castRay(ray, 9.0, true, undefined, undefined, undefined, body, (c) => !c.isSensor());
    const hitDist = shadowHit ? shadowHit.timeOfImpact : null;
    groundDistRef.current = hitDist;
    const isGrounded = hitDist !== null && hitDist <= 0.88;

    if (isGrounded) t.lastGrounded = nowMs;
    if (t.wasAirborne && isGrounded && vel.y <= 0.5) {
      triggerLandMotion(pos.x, pos.y, pos.z);
      t.wasAirborne = false;
    } else if (!isGrounded && Math.abs(vel.y) > 1.8) {
      t.wasAirborne = true;
    }

    if (gameState !== 'playing') {
      velRef.current = { vx: 0, vz: 0 };
      motionBus.vel = { x: 0, y: 0, z: 0 };
      motionBus.steer = 0;
      motionBus.isBoosting = false;
      body.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
    } else {
      const keys = keysRef.current;
      const mx = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) || touchInput.moveX;
      const mz = ((keys.backward ? 1 : 0) - (keys.forward ? 1 : 0)) || touchInput.moveZ;
      const len = Math.hypot(mx, mz) || 1;
      if (Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05) facingRef.current = { x: mx / len, z: mz / len };

      const wantJump = keys.jump || touchInput.jump;
      if (wantJump && !t.prevJump) t.jumpBuffered = nowMs;
      t.prevJump = wantJump;

      const wantDash = keys.dash || touchInput.dash;
      if (wantDash && !t.prevDash && nowMs - lastDashAt >= DASH_COOLDOWN_MS) {
        t.dashUntil = nowMs + 165;
        t.dashVx = facingRef.current.x * speed * 2.55;
        t.dashVz = facingRef.current.z * speed * 2.55;
        soundEngine.playDash();
        triggerDash();
      }
      t.prevDash = wantDash;

      const isDashing = nowMs < t.dashUntil;
      const vx = isDashing ? t.dashVx : Math.abs(mx) > 0.05 ? (mx / len) * speed : 0;
      const vz = isDashing ? t.dashVz : Math.abs(mz) > 0.05 ? (mz / len) * speed : 0;
      let vy = isDashing ? 0 : vel.y;

      const canCoyote = nowMs - t.lastGrounded <= 120;
      const hasBufferedJump = nowMs - t.jumpBuffered <= 120;
      if (hasBufferedJump && canCoyote && nowMs - t.lastJump > 220 && Math.abs(vel.y) < 3.5) {
        vy = jumpForce * (isPowerupActive('sneakers') ? 1.45 : 1);
        t.lastJump = nowMs;
        t.jumpBuffered = 0;
        t.lastGrounded = 0;
        triggerJumpMotion();
        soundEngine.playJump();
      }

      if (isDashing && nowMs - t.lastTrailAt > 34) {
        t.lastTrailAt = nowMs;
        trailRef.current.push({ x: pos.x, y: pos.y, z: pos.z, at: nowMs });
      }

      velRef.current = { vx, vz };
      combatBus.playerPos = { x: pos.x, y: pos.y, z: pos.z };
      combatBus.playerFacing = { ...facingRef.current };
      motionBus.pos = { x: pos.x, y: pos.y, z: pos.z };
      motionBus.vel = { x: vx, y: vy, z: vz };
      motionBus.steer = THREE.MathUtils.clamp(mx, -1, 1);
      motionBus.isGrounded = isGrounded;
      motionBus.isBoosting = isDashing || Math.hypot(vx, vz) > speed * 1.25;

      body.setLinvel({ x: vx, y: vy, z: vz }, true);
      if (pos.y < -15) triggerGameOver(false);
    }
  });

  return (
    <>
      <RigidBody ref={bodyRef} name="player" colliders={false} position={[0, 2.2, 0]} enabledRotations={[false, false, false]} linearDamping={0.35} friction={0.2} restitution={0}>
        <CapsuleCollider args={[0.35, 0.35]} />
        <MotionRig>
          <PlayerMesh color={color} squashRef={squashRef} velRef={velRef} groundDistRef={groundDistRef} />
        </MotionRig>
      </RigidBody>
      <DashTrail trailRef={trailRef} color={color} />
    </>
  );
}
