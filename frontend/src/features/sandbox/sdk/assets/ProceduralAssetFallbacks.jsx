import { RoundedBox } from '@react-three/drei';
import { usePbrMaterial } from '../pbrMaterials';
import { StudioProp } from './StudioProps';

export function ProceduralAssetFallback({ kind = 'crate', scale = 1, color }) {
  const moss = usePbrMaterial({ surface: 'foliage_leaf', color: '#385247' });
  const rock = usePbrMaterial({ surface: 'volcanic_rock', color: '#27303A' });

  if (kind === 'character' || kind === 'fox') {
    return (
      <group scale={scale}>
        <RoundedBox args={[0.52, 0.72, 0.3]} radius={0.08} smoothness={2} position={[0, 1.02, 0]} castShadow><meshPhysicalMaterial {...moss} /></RoundedBox>
        <mesh position={[0, 1.56, 0]} castShadow><sphereGeometry args={[0.21, 14, 14]} /><meshStandardMaterial color="#E6C79C" roughness={0.55} /></mesh>
        <mesh position={[-0.14, 0.42, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 6, 8]} /><meshPhysicalMaterial {...rock} /></mesh>
        <mesh position={[0.14, 0.42, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 6, 8]} /><meshPhysicalMaterial {...rock} /></mesh>
      </group>
    );
  }

  return <StudioProp type={kind} scale={scale} color={color} solid={false} />;
}
