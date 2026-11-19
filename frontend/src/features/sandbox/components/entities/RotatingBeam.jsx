import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { useGameStore } from '../../store/useGameStore';

export function RotatingBeam({ entity }) {
  const bodyRef = useRef(null);
  const triggerShake = useGameStore((s) => s.triggerShake);
  const euler = useMemo(() => new THREE.Euler(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  const {
    position,
    scale,
    color = '#7F1D1D',
    spin_speed = 1.4,
    spin_axis = 'y',
  } = entity;
  const [sx, sy, sz] = scale;

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const angle = clock.elapsedTime * (spin_speed || 1.4);
    euler.set(0, spin_axis === 'y' ? angle : 0, spin_axis === 'z' ? angle : 0);
    quat.setFromEuler(euler);
    bodyRef.current.setNextKinematicRotation(quat);
  });

  const handleHit = ({ other }) => {
    if (other.rigidBodyObject?.name !== 'player' || !other.rigidBody) return;
    const p = other.rigidBody.translation();
    const dx = p.x - position[0];
    const dz = p.z - position[2];
    const len = Math.hypot(dx, dz) || 1;
    other.rigidBody.setLinvel({ x: (dx / len) * 12, y: 6.5, z: (dz / len) * 12 }, true);
    soundEngine.playFail();
    triggerShake();
  };

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={position}
      onCollisionEnter={handleHit}
    >
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <RoundedBox args={[sx, sy, sz]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.58} metalness={0.18} />
      </RoundedBox>
      <mesh castShadow>
        <cylinderGeometry args={[Math.max(sy, sz) * 0.85, Math.max(sy, sz) * 0.85, sy * 1.4, 16]} />
        <meshStandardMaterial color="#52525B" roughness={0.45} metalness={0.35} />
      </mesh>
    </RigidBody>
  );
}
