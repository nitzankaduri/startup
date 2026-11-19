import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export function LockedGate({ entity }) {
  const doorRef = useRef(null);
  const currentYRef = useRef(entity.position[1]);
  const collectedKeys = useGameStore((s) => s.collectedKeys);

  const { position, scale, color = '#27272A', key_id } = entity;
  const [bx, by, bz] = position;
  const [sx, sy, sz] = scale;

  const isUnlocked = key_id
    ? collectedKeys.includes(key_id)
    : collectedKeys.length > 0;

  useFrame((_, delta) => {
    if (!doorRef.current) return;
    const targetY = isUnlocked ? by + sy + 0.9 : by;
    currentYRef.current = THREE.MathUtils.lerp(currentYRef.current, targetY, Math.min(1, delta * 5));
    doorRef.current.setNextKinematicTranslation({ x: bx, y: currentYRef.current, z: bz });
  });

  return (
    <group>
      <RoundedBox args={[0.38, sy + 0.4, sz + 0.25]} radius={0.06} position={[bx - sx / 2 - 0.15, by, bz]} castShadow receiveShadow>
        <meshStandardMaterial color="#18181B" roughness={0.7} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.38, sy + 0.4, sz + 0.25]} radius={0.06} position={[bx + sx / 2 + 0.15, by, bz]} castShadow receiveShadow>
        <meshStandardMaterial color="#18181B" roughness={0.7} metalness={0.15} />
      </RoundedBox>

      <RigidBody ref={doorRef} type="kinematicPosition" colliders={false} position={position}>
        <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
        <RoundedBox args={[sx, sy, sz]} radius={0.08} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={0.65} metalness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.45, 0.45, sz + 0.08]} radius={0.06} position={[0, 0, 0]}>
          <meshStandardMaterial color={isUnlocked ? '#FAFAFA' : '#7F1D1D'} roughness={0.45} metalness={0.25} />
        </RoundedBox>
      </RigidBody>
    </group>
  );
}
