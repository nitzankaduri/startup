import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { HighBarrierProp, LowHurdleProp } from '../../sdk/props/StylizedObstacles';
import { useGameStore } from '../../store/useGameStore';

export function HazardBlock({ entity }) {
  const triggerGameOver = useGameStore((state) => state.triggerGameOver);
  const { position, scale } = entity;
  const [sx, sy, sz] = scale;
  const isHigh = position[1] >= 1.6;

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') {
      triggerGameOver(true);
    }
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} sensor />
      {isHigh ? (
        <HighBarrierProp w={sx} h={sy} d={sz} />
      ) : (
        <LowHurdleProp w={sx} h={sy} d={sz} />
      )}
    </RigidBody>
  );
}
