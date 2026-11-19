import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { soundEngine } from '../../../../shared/audio/soundEngine';

export function BouncyPad({ entity }) {
  const { position, scale, color = '#52525B' } = entity;
  const [sx, sy, sz] = scale;
  const radius = Math.min(0.08, sx * 0.15, sy * 0.25, sz * 0.15);

  const handleCollision = ({ other }) => {
    if (other.rigidBodyObject?.name !== 'player' || !other.rigidBody) return;
    const currentVel = other.rigidBody.linvel();
    other.rigidBody.setLinvel({ x: currentVel.x, y: 0, z: currentVel.z }, true);
    other.rigidBody.applyImpulse({ x: 0, y: 15.5, z: 0 }, true);
    soundEngine.playBounce();
  };

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      onCollisionEnter={handleCollision}
    >
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <RoundedBox args={[sx, sy, sz]} radius={radius} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#27272A" roughness={0.75} metalness={0.1} />
      </RoundedBox>
      <RoundedBox
        args={[sx * 0.86, 0.12, sz * 0.86]}
        radius={0.04}
        smoothness={3}
        position={[0, sy / 2 + 0.04, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.22} />
      </RoundedBox>
    </RigidBody>
  );
}
