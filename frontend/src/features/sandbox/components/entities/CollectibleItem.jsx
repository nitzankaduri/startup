import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { StylizedCoinProp } from '../../sdk/props/StylizedObstacles';
import { COLLECTIBLE_GOLD_MAT, computeMagneticPull, motionBus } from '../../sdk/spawnSdk';
import { useGameStore } from '../../store/useGameStore';

export function CollectibleItem({ entity }) {
  const groupRef = useRef(null);
  const offsetRef = useRef([0, 0, 0]);
  const collectedIds = useGameStore((state) => state.collectedIds);
  const collectItem = useGameStore((state) => state.collectItem);

  const isCollected = collectedIds.includes(entity.id);
  const { position, scale } = entity;
  const [sx, sy, sz] = scale;
  const size = Math.max(sx, sy, sz) * 0.55;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || isCollected) return;
    groupRef.current.rotation.y += delta * 2.4;

    const worldPos = [
      position[0] + offsetRef.current[0],
      position[1] + offsetRef.current[1],
      position[2] + offsetRef.current[2],
    ];
    const pull = computeMagneticPull(worldPos, motionBus.pos, 2.5);
    if (pull.active) {
      const rate = Math.min(1, delta * 11);
      offsetRef.current[0] += pull.dx * rate;
      offsetRef.current[1] += pull.dy * rate;
      offsetRef.current[2] += pull.dz * rate;
      groupRef.current.position.set(offsetRef.current[0], offsetRef.current[1], offsetRef.current[2]);
      const popScale = pull.dist < 1.1 ? 1 + (1.1 - pull.dist) * 0.35 : 1;
      groupRef.current.scale.setScalar(popScale);
      if (pull.dist < 0.85) {
        collectItem(entity.id, worldPos, COLLECTIBLE_GOLD_MAT.color);
      }
    } else {
      groupRef.current.position.set(0, Math.sin(clock.elapsedTime * 2.6) * 0.12, 0);
      groupRef.current.scale.setScalar(1);
    }
  });

  if (isCollected) return null;

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') {
      collectItem(entity.id, position, COLLECTIBLE_GOLD_MAT.color);
    }
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[sx * 0.7, sy * 0.7, sz * 0.7]} sensor />
      <group ref={groupRef}>
        <StylizedCoinProp size={size} shadowY={-0.65} />
      </group>
    </RigidBody>
  );
}
