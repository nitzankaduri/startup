import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { SmokeTrail } from './SmokeTrail';
import { motionBus, stepSpring } from './motionBus';

/** Integrates weighty 3D body motion with mass, torque falloff, ground friction, and air drag. */
export function stepInertiaBody(body, input = {}, dt = 0.016) {
  const mass = Math.max(0.2, body.mass ?? 1.4);
  const maxSpeed = body.maxSpeed ?? 16;
  const thrust = (body.thrust ?? 28) / mass;
  const friction = body.isGrounded ? (body.groundFriction ?? 5.5) : (body.airDrag ?? 0.65);

  const curSpeed = Math.hypot(body.vx, body.vz);
  const torqueScale = Math.max(0.15, 1 - Math.pow(Math.min(1, curSpeed / maxSpeed), 1.6));
  body.vx += (input.ax || 0) * thrust * torqueScale * dt;
  body.vz += (input.az || 0) * thrust * torqueScale * dt;

  const drag = Math.exp(-friction * dt);
  body.vx *= drag;
  body.vz *= drag;
  body.x += body.vx * dt;
  body.z += body.vz * dt;
  return body;
}

/** Weighty simulation rig: suspension compression, braking dive, throttle squat, turn roll, and smoke plumes. */
export function RealisticPhysicsRig({
  children,
  isVehicle = false,
  mass = 1.4,
  suspensionStiffness = 220,
  suspensionDamping = 21,
  smokeColor = '#DDD6CA',
}) {
  const rigRef = useRef(null);
  const lastLandRef = useRef(0);
  const prevSpeedRef = useRef(0);
  const rollSpinRef = useRef(0);
  const susp = useRef({ value: 0, velocity: 0 });
  const pitch = useRef({ value: 0, velocity: 0 });
  const roll = useRef({ value: 0, velocity: 0 });

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const horizSpeed = Math.hypot(motionBus.vel.x, motionBus.vel.z);
    soundEngine.updateMotionAudio(horizSpeed, motionBus.isGrounded, isVehicle);
    const accel = (horizSpeed - prevSpeedRef.current) / dt;
    prevSpeedRef.current = horizSpeed;

    if (motionBus.landAt > lastLandRef.current) {
      lastLandRef.current = motionBus.landAt;
      susp.current.velocity -= Math.min(4.2, 2.1 * mass);
    }

    const crouchTarget = motionBus.isRolling ? -0.26 : 0;
    const suspY = THREE.MathUtils.clamp(
      stepSpring(susp.current, crouchTarget, suspensionStiffness, suspensionDamping, dt),
      -0.36,
      0.18
    );

    let targetPitch = 0;
    if (motionBus.isRolling) {
      rollSpinRef.current -= dt * 10.5;
      targetPitch = rollSpinRef.current;
    } else {
      rollSpinRef.current = THREE.MathUtils.lerp(rollSpinRef.current, 0, Math.min(1, dt * 12));
      const accelTransfer = THREE.MathUtils.clamp(-accel * (isVehicle ? 0.0085 : 0.0045), -0.14, 0.16);
      const speedLean = THREE.MathUtils.clamp(-horizSpeed * (isVehicle ? 0.003 : 0.009), -0.14, 0);
      targetPitch = accelTransfer + speedLean;
    }

    const targetRoll = THREE.MathUtils.clamp(-motionBus.steer * (isVehicle ? 0.22 : 0.18), -0.26, 0.26);
    const rx = motionBus.isRolling ? targetPitch : stepSpring(pitch.current, targetPitch, 140 / Math.sqrt(mass), 14, dt);
    const rz = stepSpring(roll.current, targetRoll, 155 / Math.sqrt(mass), 14, dt);

    if (rigRef.current) {
      rigRef.current.scale.set(1, 1, 1);
      rigRef.current.position.set(0, suspY, 0);
      rigRef.current.rotation.set(rx, 0, rz);
    }
  });

  return (
    <>
      <group ref={rigRef}>{children}</group>
      <SmokeTrail color={smokeColor} />
    </>
  );
}
