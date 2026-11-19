import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { StylizedRampTrain, StylizedTrain } from '../../sdk/props/StylizedTrain';

export function TrainBlock({ entity }) {
  const { position, scale, type } = entity;
  const [sx, sy, sz] = scale;
  const isRamp = type === 'ramp_train';

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={isRamp ? [-0.28, 0, 0] : [0, 0, 0]}
      friction={0.7}
    >
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      {isRamp ? <StylizedRampTrain w={sx} h={sy} d={sz} /> : <StylizedTrain w={sx} h={sy} d={sz} />}
    </RigidBody>
  );
}
