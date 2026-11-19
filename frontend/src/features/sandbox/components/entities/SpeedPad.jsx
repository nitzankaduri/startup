import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { soundEngine } from '../../../../shared/audio/soundEngine';

export function SpeedPad({ entity }) {
  const streaksRef = useRef(null);
  const { position, scale, color = '#3F3F46', direction = [0, 0, -1] } = entity;
  const [sx, sy, sz] = scale;

  const dir = useMemo(() => {
    const [dx = 0, , dz = -1] = direction || [0, 0, -1];
    const len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len, yaw: Math.atan2(-dx, -dz) };
  }, [direction]);

  useFrame(({ clock }) => {
    if (!streaksRef.current) return;
    streaksRef.current.children.forEach((child, idx) => {
      const t = (clock.elapsedTime * 2.2 + idx * 0.33) % 1;
      child.position.z = sz * 0.35 - t * sz * 0.7;
      child.position.y = sy / 2 + 0.12 + t * 0.22;
      child.scale.z = 0.6 + Math.sin(t * Math.PI) * 0.7;
    });
  });

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name !== 'player' || !other.rigidBody) return;
    const v = other.rigidBody.linvel();
    other.rigidBody.setLinvel(
      { x: dir.x * 17, y: Math.max(v.y, 2.2), z: dir.z * 17 },
      true
    );
    soundEngine.playDash();
  };

  return (
    <RigidBody
      type="fixed"
      sensor
      colliders={false}
      position={position}
      rotation={[0, dir.yaw, 0]}
      onIntersectionEnter={handleEnter}
    >
      <CuboidCollider args={[sx / 2, Math.max(0.28, sy), sz / 2]} sensor />
      <RoundedBox args={[sx, sy, sz]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {[-0.26, 0, 0.26].map((zOff, i) => (
        <mesh key={i} position={[0, sy / 2 + 0.015, zOff * sz]}>
          <boxGeometry args={[sx * 0.55, 0.02, 0.1]} />
          <meshStandardMaterial color="#D4D4D8" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      <group ref={streaksRef}>
        {[-0.25, 0, 0.25].map((xOff, i) => (
          <mesh key={i} position={[xOff * sx, sy / 2 + 0.15, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.45]} />
            <meshStandardMaterial color="#FAFAFA" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
