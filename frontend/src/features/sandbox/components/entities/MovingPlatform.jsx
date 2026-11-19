import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

export function MovingPlatform({ entity }) {
  const bodyRef = useRef(null);
  const {
    position,
    scale,
    color = '#3F3F46',
    move_axis = 'x',
    move_range = 3.0,
  } = entity;
  const [bx, by, bz] = position;
  const [sx, sy, sz] = scale;
  const radius = Math.min(0.1, sx * 0.15, sy * 0.25, sz * 0.15);

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const offset = Math.sin(clock.elapsedTime * 1.4) * (move_range || 3.0);
    bodyRef.current.setNextKinematicTranslation({
      x: bx + (move_axis === 'x' ? offset : 0),
      y: by + (move_axis === 'y' ? offset : 0),
      z: bz + (move_axis === 'z' ? offset : 0),
    });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={position}
      friction={0.8}
    >
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <RoundedBox args={[sx, sy, sz]} radius={radius} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.16} />
      </RoundedBox>
      <RoundedBox
        args={[sx * 0.88, 0.06, sz * 0.88]}
        radius={0.025}
        smoothness={2}
        position={[0, sy / 2 + 0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#71717A" roughness={0.4} metalness={0.28} />
      </RoundedBox>
    </RigidBody>
  );
}
