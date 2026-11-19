import { RoundedBox } from '@react-three/drei';
import { usePbrMaterial } from '../pbrMaterials';

export function ProceduralAssetFallback({ kind = 'crate', scale = 1 }) {
  const timber = usePbrMaterial({ surface: 'aged_timber', color: '#8C6239' });
  const steel = usePbrMaterial({ surface: 'brushed_steel', color: '#94A3B8' });
  const rock = usePbrMaterial({ surface: 'volcanic_rock', color: '#6E655B' });
  const moss = usePbrMaterial({ surface: 'foliage_leaf', color: '#4C6658' });

  if (kind === 'tree') {
    return (
      <group scale={scale}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow><cylinderGeometry args={[0.18, 0.28, 1.8, 10]} /><meshStandardMaterial {...timber} /></mesh>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow><coneGeometry args={[1.15, 1.8, 9]} /><meshPhysicalMaterial {...moss} /></mesh>
        <mesh position={[0, 3.0, 0]} castShadow receiveShadow><coneGeometry args={[0.85, 1.5, 9]} /><meshPhysicalMaterial {...moss} /></mesh>
      </group>
    );
  }

  if (kind === 'rock') {
    return (
      <mesh position={[0, 0.45 * scale, 0]} scale={[scale * 1.15, scale * 0.78, scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial {...rock} flatShading />
      </mesh>
    );
  }

  if (kind === 'vehicle') {
    return (
      <group scale={scale}>
        <RoundedBox args={[1.6, 0.55, 2.8]} radius={0.1} smoothness={3} position={[0, 0.55, 0]} castShadow receiveShadow><meshStandardMaterial {...steel} color="#64748B" /></RoundedBox>
        <RoundedBox args={[1.3, 0.5, 1.4]} radius={0.08} smoothness={3} position={[0, 1.05, 0.15]} castShadow><meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.7} /></RoundedBox>
        {[[-0.82, -0.85], [0.82, -0.85], [-0.82, 0.85], [0.82, 0.85]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.34, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.34, 0.34, 0.24, 16]} /><meshStandardMaterial color="#181715" roughness={0.85} /></mesh>
        ))}
      </group>
    );
  }

  if (kind === 'character' || kind === 'fox') {
    return (
      <group scale={scale}>
        <RoundedBox args={[0.52, 0.72, 0.3]} radius={0.08} smoothness={2} position={[0, 1.02, 0]} castShadow><meshStandardMaterial {...moss} color="#385247" /></RoundedBox>
        <mesh position={[0, 1.56, 0]} castShadow><sphereGeometry args={[0.21, 14, 14]} /><meshStandardMaterial color="#E6C79C" roughness={0.55} /></mesh>
        <mesh position={[-0.14, 0.42, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 6, 8]} /><meshStandardMaterial {...rock} color="#27303A" /></mesh>
        <mesh position={[0.14, 0.42, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 6, 8]} /><meshStandardMaterial {...rock} color="#27303A" /></mesh>
      </group>
    );
  }

  return (
    <group scale={scale}>
      <RoundedBox args={[1, 1, 1]} radius={0.05} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow><meshStandardMaterial {...timber} /></RoundedBox>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.03, 0.14, 1.03]} /><meshStandardMaterial {...steel} /></mesh>
    </group>
  );
}
