import { useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { useGameStore } from '../../store/useGameStore';

export function HealPickup({ entity }) {
  const groupRef = useRef(null);
  const [taken, setTaken] = useState(false);
  const healPlayer = useGameStore((s) => s.healPlayer);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || taken) return;
    groupRef.current.rotation.y += delta * 1.4;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 2.5) * 0.1;
  });

  if (taken) return null;

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') {
      setTaken(true);
      healPlayer(25);
      soundEngine.playCollect();
    }
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={entity.position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[0.6, 0.6, 0.6]} sensor />
      <group ref={groupRef}>
        <RoundedBox args={[0.52, 0.18, 0.18]} radius={0.04} castShadow>
          <meshStandardMaterial color="#FAFAFA" roughness={0.35} metalness={0.25} />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.52, 0.18]} radius={0.04} castShadow>
          <meshStandardMaterial color="#FAFAFA" roughness={0.35} metalness={0.25} />
        </RoundedBox>
      </group>
    </RigidBody>
  );
}
