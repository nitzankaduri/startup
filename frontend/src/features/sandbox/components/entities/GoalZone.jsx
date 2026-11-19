import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';

export function GoalZone({ position }) {
  const beaconRef = useRef(null);
  const ringARef = useRef(null);
  const ringBRef = useRef(null);
  const triggerWin = useGameStore((state) => state.triggerWin);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beaconRef.current) {
      beaconRef.current.rotation.y = t * 0.85;
      beaconRef.current.position.y = 1.45 + Math.sin(t * 2) * 0.14;
    }
    if (ringARef.current) ringARef.current.rotation.z = t * 0.65;
    if (ringBRef.current) ringBRef.current.rotation.x = t * 0.55;
  });

  const handleEnter = ({ other }) => {
    if (other.rigidBodyObject?.name === 'player') triggerWin();
  };

  return (
    <RigidBody type="fixed" sensor colliders={false} position={position} onIntersectionEnter={handleEnter}>
      <CuboidCollider args={[1.3, 1.8, 1.3]} sensor />
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.45, 1.55, 0.12, 32]} />
        <meshStandardMaterial color="#3F3F46" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh receiveShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[1.1, 1.18, 0.1, 32]} />
        <meshStandardMaterial color="#E5B869" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh ref={beaconRef} castShadow position={[0, 1.45, 0]}>
        <octahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color="#FFF3E0" roughness={0.28} metalness={0.48} />
      </mesh>
      <mesh ref={ringARef} position={[0, 1.45, 0]}>
        <torusGeometry args={[0.98, 0.045, 12, 40]} />
        <meshStandardMaterial color="#E5B869" roughness={0.32} metalness={0.55} />
      </mesh>
      <mesh ref={ringBRef} position={[0, 1.45, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.22, 0.03, 12, 40]} />
        <meshStandardMaterial color="#D96B27" roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh position={[0, 5.0, 0]}>
        <cylinderGeometry args={[0.55, 1.05, 10, 24, 1, true]} />
        <meshBasicMaterial color="#F5D08A" transparent opacity={0.15} depthWrite={false} side={2} />
      </mesh>
    </RigidBody>
  );
}
