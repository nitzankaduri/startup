import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { usePbrMaterial } from '../pbrMaterials';
import { SmokeTrail } from '../SmokeTrail';
import { motionBus, stepSpring } from '../spawnSdk';
import { useGameInput } from '../useGameInput';

/** 6-DOF flight & hover rig with banking roll coupled to yaw turns, pitch climb/dive, thruster boost, and lead reticle. */
export function FlyableCraft({
  position = [0, 8, 0],
  color = '#64748B',
  cruiseSpeed = 16,
  boostSpeed = 30,
  minAltitude = 2.0,
  maxAltitude = 38.0,
  onTelemetry,
  children,
}) {
  const { isPressed } = useGameInput();
  const rootRef = useRef(null);
  const flameRef = useRef(null);
  const boostRef = useRef(false);

  const sim = useRef({ x: position[0], y: position[1], z: position[2], vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, speed: cruiseSpeed * 0.6 });
  const roll = useRef({ value: 0, velocity: 0 });
  const hullMat = usePbrMaterial({ surface: 'brushed_steel', color });

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const s = sim.current;
    const pitchIn = (isPressed('KeyS') || isPressed('ArrowDown') ? 1 : 0) - (isPressed('KeyW') || isPressed('ArrowUp') ? 1 : 0);
    const yawIn = (isPressed('KeyA') || isPressed('ArrowLeft') ? 1 : 0) - (isPressed('KeyD') || isPressed('ArrowRight') ? 1 : 0);
    const hoverIn = (isPressed('Space') || isPressed('KeyE') ? 1 : 0) - (isPressed('KeyQ') || isPressed('ControlLeft') ? 1 : 0);
    const isBoost = Boolean(isPressed('ShiftLeft') || isPressed('ShiftRight'));

    s.yaw += yawIn * 1.85 * dt;
    const targetPitch = THREE.MathUtils.clamp(s.pitch + pitchIn * 1.45 * dt, -0.68, 0.68);
    s.pitch = pitchIn === 0 ? THREE.MathUtils.lerp(s.pitch, 0, Math.min(1, dt * 2.2)) : targetPitch;

    const targetSpd = isBoost ? boostSpeed : cruiseSpeed;
    s.speed = THREE.MathUtils.lerp(s.speed, targetSpd, Math.min(1, dt * (isBoost ? 4.5 : 2.0)));

    const cosP = Math.cos(s.pitch);
    s.vx = -Math.sin(s.yaw) * cosP * s.speed;
    s.vz = -Math.cos(s.yaw) * cosP * s.speed;
    s.vy = Math.sin(s.pitch) * s.speed + hoverIn * 8.5;

    if (s.y < minAltitude && s.vy < 0) s.vy *= 0.2;
    if (s.y > maxAltitude && s.vy > 0) s.vy *= 0.2;
    s.x += s.vx * dt;
    s.y = THREE.MathUtils.clamp(s.y + s.vy * dt, minAltitude, maxAltitude);
    s.z += s.vz * dt;

    const bank = stepSpring(roll.current, yawIn * 0.58, 130, 14, dt);
    soundEngine.updateMotionAudio(s.speed, true, true, s.y);

    if (rootRef.current) {
      rootRef.current.position.set(s.x, s.y, s.z);
      rootRef.current.rotation.set(s.pitch, s.yaw, bank, 'YXZ');
    }
    if (flameRef.current) {
      const fScale = isBoost ? 1.8 : 0.85;
      flameRef.current.scale.set(1, 1, fScale);
    }

    motionBus.pos = { x: s.x, y: s.y, z: s.z };
    motionBus.vel = { x: s.vx, y: s.vy, z: s.vz };
    motionBus.yaw = s.yaw;
    motionBus.steer = yawIn;
    motionBus.isGrounded = false;
    motionBus.isBoosting = isBoost;
    boostRef.current = isBoost;
    onTelemetry?.({ speedKmh: Math.round(s.speed * 5.2), altitude: Math.round(s.y), isBoosting: isBoost, x: s.x, y: s.y, z: s.z, yaw: s.yaw });
  });

  return (
    <>
      <group ref={rootRef} position={position}>
        {children || (
          <>
            <RoundedBox args={[0.9, 0.55, 2.8]} radius={0.12} smoothness={3} castShadow><meshStandardMaterial {...hullMat} /></RoundedBox>
            <mesh position={[0, 0.1, 0.25]} castShadow><boxGeometry args={[3.4, 0.08, 0.95]} /><meshStandardMaterial {...hullMat} color="#475569" /></mesh>
            <mesh position={[0, 0.35, -0.35]}><sphereGeometry args={[0.36, 14, 14]} /><meshStandardMaterial color="#1E293B" roughness={0.15} metalness={0.85} /></mesh>
            <mesh ref={flameRef} position={[0, 0.02, 1.55]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.24, 0.9, 10]} />
              <meshStandardMaterial color="#D96B27" emissive="#F59E0B" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </>
        )}
        <group position={[0, 0, -22]}>
          <mesh>
            <ringGeometry args={[0.45, 0.56, 24]} />
            <meshBasicMaterial color="#D96B27" transparent opacity={0.75} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.08, 0.14, 16]} />
            <meshBasicMaterial color="#FFF3E0" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <SmokeTrail activeRef={boostRef} color="#E6DDD0" baseSize={0.35} maxSize={1.8} life={0.65} />
    </>
  );
}
