import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';

export function CheckpointGate({ entity }) {
  const ringRef = useRef(null);
  const passedIds = useGameStore((s) => s.passedCheckpointIds);
  const passCheckpoint = useGameStore((s) => s.passCheckpoint);

  const isPassed = passedIds.includes(entity.id);
  const { position, scale } = entity;
  const [sx, sy, sz] = scale;
  const goldAccent = isPassed ? '#FAFAFA' : '#E5B869';

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * (isPassed ? 0.5 : 1.3);
    }
  });

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') passCheckpoint(entity.id);
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[sx / 2, sy / 2, Math.max(0.7, sz / 2)]} sensor />
      <RoundedBox args={[0.45, sy, 0.55]} radius={0.07} position={[-sx / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#2E2C28" roughness={0.7} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.45, sy, 0.55]} radius={0.07} position={[sx / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#2E2C28" roughness={0.7} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[sx + 0.5, 0.34, 0.55]} radius={0.07} position={[0, sy / 2, 0]} castShadow>
        <meshStandardMaterial color={goldAccent} roughness={0.35} metalness={0.45} />
      </RoundedBox>
      <mesh ref={ringRef} position={[0, sy / 2 + 0.75, 0]}>
        <torusGeometry args={[0.55, 0.05, 12, 32]} />
        <meshStandardMaterial color={goldAccent} roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[sx * 0.36, sx * 0.42, sy + 2.4, 24, 1, true]} />
        <meshBasicMaterial color={goldAccent} transparent opacity={isPassed ? 0.06 : 0.14} depthWrite={false} side={2} />
      </mesh>
    </RigidBody>
  );
}
