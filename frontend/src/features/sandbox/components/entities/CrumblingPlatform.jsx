import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { soundEngine } from '../../../../shared/audio/soundEngine';

function FallingVisual({ position, scale, color }) {
  const groupRef = useRef(null);
  const vyRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    vyRef.current += 22 * delta;
    groupRef.current.position.y -= vyRef.current * delta;
    groupRef.current.rotation.x += delta * 0.8;
  });

  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={scale} radius={0.08} smoothness={3} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </RoundedBox>
    </group>
  );
}

export function CrumblingPlatform({ entity }) {
  const [phase, setPhase] = useState('idle');
  const visualRef = useRef(null);
  const timersRef = useRef([]);
  const { position, scale, color = '#3F3F46' } = entity;
  const [sx, sy, sz] = scale;

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  useFrame(({ clock }) => {
    if (!visualRef.current) return;
    if (phase === 'shaking') {
      visualRef.current.position.x = Math.sin(clock.elapsedTime * 58) * 0.07;
      visualRef.current.position.z = Math.cos(clock.elapsedTime * 49) * 0.05;
    } else {
      visualRef.current.position.set(0, 0, 0);
    }
  });

  const handleStep = ({ other }) => {
    if (phase !== 'idle' || other.rigidBodyObject?.name !== 'player') return;
    setPhase('shaking');
    soundEngine.playCrumble();
    timersRef.current.push(
      setTimeout(() => setPhase('fallen'), 800),
      setTimeout(() => setPhase('idle'), 3800)
    );
  };

  if (phase === 'fallen') {
    return <FallingVisual position={position} scale={scale} color={color} />;
  }

  return (
    <RigidBody type="fixed" colliders={false} position={position} onCollisionEnter={handleStep}>
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <group ref={visualRef}>
        <RoundedBox args={[sx, sy, sz]} radius={0.08} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color={phase === 'shaking' ? '#52525B' : color} roughness={0.82} metalness={0.06} />
        </RoundedBox>
        <RoundedBox args={[sx * 0.88, 0.05, sz * 0.88]} radius={0.02} position={[0, sy / 2 + 0.01, 0]} receiveShadow>
          <meshStandardMaterial color="#71717A" roughness={0.6} />
        </RoundedBox>
      </group>
    </RigidBody>
  );
}
