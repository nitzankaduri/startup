import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';

export function KeyItem({ entity }) {
  const groupRef = useRef(null);
  const collectedIds = useGameStore((s) => s.collectedIds);
  const collectKey = useGameStore((s) => s.collectKey);

  const isCollected = collectedIds.includes(entity.id);
  const { position, scale, color = '#E4E4E7', key_id } = entity;
  const [sx, sy, sz] = scale;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || isCollected) return;
    groupRef.current.rotation.y += delta * 1.4;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 2.2) * 0.1;
  });

  if (isCollected) return null;

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') {
      collectKey(entity.id, key_id, position, color);
    }
  };

  return (
    <RigidBody
      type="fixed"
      sensor
      colliders={false}
      position={position}
      onIntersectionEnter={handleEnter}
    >
      <CuboidCollider args={[sx * 0.7, sy * 0.7, sz * 0.7]} sensor />
      <group ref={groupRef}>
        <mesh position={[0, 0.24, 0]} castShadow>
          <torusGeometry args={[0.2, 0.055, 10, 24]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.55} />
        </mesh>
        <RoundedBox args={[0.1, 0.45, 0.1]} radius={0.03} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.55} />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.08, 0.08]} radius={0.02} position={[0.1, -0.24, 0]} castShadow>
          <meshStandardMaterial color="#A1A1AA" roughness={0.35} metalness={0.5} />
        </RoundedBox>
      </group>
    </RigidBody>
  );
}
