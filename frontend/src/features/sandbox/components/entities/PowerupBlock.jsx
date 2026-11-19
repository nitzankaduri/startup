import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import { PowerupPickupProp } from '../PowerupSystem';

const DURATIONS = { jetpack: 8000, magnet: 10000, sneakers: 10000, multiplier: 10000 };

export function PowerupBlock({ entity }) {
  const groupRef = useRef(null);
  const [taken, setTaken] = useState(false);
  const activatePowerup = useGameStore((s) => s.activatePowerup);

  const pType = entity.powerup_type || 'sneakers';

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || taken) return;
    groupRef.current.rotation.y += delta * 2.2;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 3) * 0.14;
  });

  if (taken) return null;

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') {
      setTaken(true);
      activatePowerup(pType, DURATIONS[pType] || 8000);
    }
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={entity.position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[0.65, 0.65, 0.65]} sensor />
      <group ref={groupRef}>
        <PowerupPickupProp type={pType} />
      </group>
    </RigidBody>
  );
}
