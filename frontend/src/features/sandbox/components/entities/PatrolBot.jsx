import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export function PatrolBot({ entity }) {
  const bodyRef = useRef(null);
  const visualRef = useRef(null);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);

  const { position, scale, color = '#7F1D1D', waypoints, move_range = 3.0 } = entity;
  const [sx, sy, sz] = scale;

  const [pA, pB] = useMemo(() => {
    if (waypoints?.length >= 2) return [waypoints[0], waypoints[1]];
    const [bx, by, bz] = position;
    return [[bx - move_range, by, bz], [bx + move_range, by, bz]];
  }, [position, waypoints, move_range]);

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const cycle = (clock.elapsedTime * 0.45) % 2;
    const rawT = cycle <= 1 ? cycle : 2 - cycle;
    const t = THREE.MathUtils.smoothstep(rawT, 0.08, 0.92);

    const nx = THREE.MathUtils.lerp(pA[0], pB[0], t);
    const ny = THREE.MathUtils.lerp(pA[1], pB[1], t);
    const nz = THREE.MathUtils.lerp(pA[2], pB[2], t);
    bodyRef.current.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

    const dir = cycle <= 1 ? 1 : -1;
    const yaw = Math.atan2(-(pB[0] - pA[0]) * dir, -(pB[2] - pA[2]) * dir);
    euler.set(0, yaw, 0);
    quat.setFromEuler(euler);
    bodyRef.current.setNextKinematicRotation(quat);

    if (visualRef.current) {
      visualRef.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.06;
    }
  });

  const handleHit = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') triggerGameOver(true);
  };

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={pA}
      onCollisionEnter={handleHit}
      onIntersectionEnter={handleHit}
    >
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <group ref={visualRef}>
        <RoundedBox args={[sx, sy, sz]} radius={0.12} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#18181B" roughness={0.6} metalness={0.25} />
        </RoundedBox>
        <RoundedBox args={[sx * 0.72, sy * 0.22, 0.14]} radius={0.04} position={[0, sy * 0.15, -sz / 2 - 0.02]}>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
        </RoundedBox>
      </group>
    </RigidBody>
  );
}
