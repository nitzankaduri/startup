import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { MotionRig } from '../components/MotionRig';
import { PlayerMesh } from '../components/PlayerMesh';
import { touchInput } from '../hooks/touchInputState';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { motionBus, triggerJumpMotion, triggerLandMotion } from '../sdk/spawnSdk';
import { useGameStore } from '../store/useGameStore';

export function RacerController({ playerConfig }) {
  const bodyRef = useRef(null);
  const keysRef = useKeyboardInput();
  const { world, rapier } = useRapier();
  const stateRef = useRef({
    yaw: 0, speed: 0, driftCharge: 0, lastHudSync: 0, timer: null, boostUntil: 0,
    wasAir: false, prevJump: false, lastGrounded: 0, jumpBuffered: 0, lastJump: 0,
  });
  const meshTelemetryRef = useRef({ speed: 0, steer: 0, isDrifting: false, yaw: 0 });

  const gameState = useGameStore((s) => s.gameState);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const setTelemetry = useGameStore((s) => s.setTelemetry);
  const registerDriftBoost = useGameStore((s) => s.registerDriftBoost);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);

  const maxSpeed = Math.max(14, (playerConfig?.speed ?? 12) * 1.45);
  const jumpForce = Math.max(10.5, (playerConfig?.jump_force ?? 9.5) * 1.15);
  const color = playerConfig?.color ?? '#FAFAFA';

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const s = stateRef.current;
    if (s.timer === null) s.timer = timeLeft;

    const pos = body.translation();
    const vel = body.linvel();
    const now = performance.now();

    const ray = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 1.4, true, undefined, undefined, undefined, body, (c) => !c.isSensor());
    const isGrounded = (hit !== null && hit.timeOfImpact <= 0.78) || Math.abs(vel.y) < 0.35;
    if (isGrounded) tUpdateGround(s, now);

    if (s.wasAir && isGrounded && vel.y <= 0.6) {
      triggerLandMotion(pos.x, pos.y, pos.z);
      s.wasAir = false;
    } else if (!isGrounded && Math.abs(vel.y) > 2.0) {
      s.wasAir = true;
    }

    if (gameState !== 'playing') {
      meshTelemetryRef.current = { speed: 0, steer: 0, isDrifting: false, yaw: s.yaw };
      motionBus.vel = { x: 0, y: 0, z: 0 };
      motionBus.isBoosting = false;
      body.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
      return;
    }

    const keys = keysRef.current;
    const throttle = ((keys.forward ? 1 : 0) - (keys.backward ? 1 : 0)) || -touchInput.moveZ;
    const steer = ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) || -touchInput.moveX;
    const wantJump = keys.jump || touchInput.jump;
    if (wantJump && !s.prevJump) s.jumpBuffered = now;
    s.prevJump = wantJump;

    const isDrifting = (keys.dash || touchInput.dash) && Math.abs(s.speed) > 4;
    if (throttle > 0) s.speed = Math.min(maxSpeed, s.speed + 18 * delta);
    else if (throttle < 0) s.speed = Math.max(-maxSpeed * 0.45, s.speed - 22 * delta);
    else s.speed *= Math.max(0, 1 - 2.6 * delta);

    const turnRate = isDrifting ? 2.6 : 1.75;
    if (Math.abs(s.speed) > 0.6) s.yaw += steer * turnRate * delta * (s.speed >= 0 ? 1 : -1);

    if (isDrifting && Math.abs(steer) > 0) {
      s.driftCharge = Math.min(1, s.driftCharge + delta * 0.9);
    } else if (!isDrifting && s.driftCharge > 0) {
      if (s.driftCharge >= 0.35) {
        s.speed = Math.min(maxSpeed * 1.45, s.speed + 10);
        s.boostUntil = now + 750;
        soundEngine.playBoost();
        registerDriftBoost();
      }
      s.driftCharge = 0;
    }

    let vy = vel.y;
    if (now - s.jumpBuffered <= 150 && now - s.lastGrounded <= 140 && now - s.lastJump > 240) {
      vy = jumpForce;
      s.lastJump = now;
      s.jumpBuffered = 0;
      s.lastGrounded = 0;
      s.wasAir = true;
      triggerJumpMotion();
      soundEngine.playJump();
    }

    const vx = -Math.sin(s.yaw) * s.speed;
    const vz = -Math.cos(s.yaw) * s.speed;
    body.setLinvel({ x: vx, y: vy, z: vz }, true);

    meshTelemetryRef.current = { speed: s.speed, steer, isDrifting, yaw: s.yaw };
    motionBus.pos = { x: pos.x, y: pos.y, z: pos.z };
    motionBus.vel = { x: vx, y: vy, z: vz };
    motionBus.yaw = s.yaw;
    motionBus.steer = steer;
    motionBus.isGrounded = isGrounded;
    motionBus.isBoosting = now < s.boostUntil || Math.abs(s.speed) > maxSpeed * 1.05;

    s.timer = Math.max(0, s.timer - delta);
    if (now - s.lastHudSync > 100) {
      s.lastHudSync = now;
      setTelemetry({ speedKmh: Math.round(Math.abs(s.speed) * 7.2), timeLeft: s.timer, driftCharge: s.driftCharge });
    }
    if (s.timer <= 0 || pos.y < -15) triggerGameOver(false);
  });

  return (
    <RigidBody ref={bodyRef} name="player" colliders={false} position={[0, 1.2, 0]} enabledRotations={[false, false, false]} friction={0.1}>
      <CuboidCollider args={[0.7, 0.45, 1.05]} />
      <MotionRig isVehicle>
        <PlayerMesh mode="time_trial_racer" color={color} telemetryRef={meshTelemetryRef} />
      </MotionRig>
    </RigidBody>
  );
}

function tUpdateGround(s, now) {
  s.lastGrounded = now;
}
