import { RoundedBox } from '@react-three/drei';
import { usePbrMaterial } from '../pbrMaterials';

/** 6-wheel planetary rover with articulated bogie struts, solar array deck, mast camera & sample arm. */
export function PlanetaryRoverMesh({ color = '#D6D1C8' }) {
  const hull = usePbrMaterial({ surface: 'brushed_steel', color });
  const trim = usePbrMaterial({ surface: 'automotive_paint', color: '#D96B27' });
  const solar = usePbrMaterial({ surface: 'architectural_glass', color: '#27364A' });
  return (
    <group>
      <RoundedBox args={[1.4, 0.42, 2.05]} radius={0.08} position={[0, 0.72, 0]} castShadow receiveShadow><meshPhysicalMaterial {...hull} /></RoundedBox>
      <RoundedBox args={[1.62, 0.08, 1.35]} radius={0.02} position={[0, 0.96, 0.2]} castShadow><meshPhysicalMaterial {...solar} /></RoundedBox>
      <mesh position={[0.42, 1.32, -0.72]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.85, 8]} /><meshPhysicalMaterial {...trim} /></mesh>
      <RoundedBox args={[0.38, 0.2, 0.28]} radius={0.04} position={[0.42, 1.76, -0.76]} castShadow><meshPhysicalMaterial {...hull} /></RoundedBox>
      <mesh position={[0.42, 1.76, -0.92]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.5} toneMapped={false} /></mesh>
      {[-0.86, 0.86].map((wx) => [-0.82, 0, 0.82].map((wz) => (
        <group key={`${wx}-${wz}`} position={[wx, 0.3, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.3, 0.3, 0.24, 14]} /><meshStandardMaterial color="#27272A" roughness={0.88} /></mesh>
          <mesh><cylinderGeometry args={[0.14, 0.14, 0.26, 8]} /><meshPhysicalMaterial {...trim} /></mesh>
        </group>
      )))}
    </group>
  );
}

/** Stasis cryo-pod chamber with brushed titanium collar bases, glass cylinder & warm amber core monitor. */
export function CryoPodMesh({ color = '#475569' }) {
  const metal = usePbrMaterial({ surface: 'brushed_steel', color });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color: '#CBD5E1' });
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow><cylinderGeometry args={[0.88, 1.0, 0.44, 16]} /><meshPhysicalMaterial {...metal} /></mesh>
      <mesh position={[0, 1.45, 0]} castShadow><cylinderGeometry args={[0.68, 0.68, 2.05, 16]} /><meshPhysicalMaterial {...glass} /></mesh>
      <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[0.26, 0.26, 1.65, 10]} /><meshStandardMaterial color="#FDE68A" emissive="#D96B27" emissiveIntensity={0.85} roughness={0.3} /></mesh>
      <mesh position={[0, 2.58, 0]} castShadow><cylinderGeometry args={[0.82, 0.92, 0.38, 16]} /><meshPhysicalMaterial {...metal} /></mesh>
      {[-0.78, 0.78].map((x) => (
        <RoundedBox key={x} args={[0.16, 2.4, 0.22]} radius={0.03} position={[x, 1.38, 0]} castShadow><meshPhysicalMaterial {...metal} color="#27303F" /></RoundedBox>
      ))}
    </group>
  );
}

/** Monumental aerospace orbital ring gate with docked pylons, copper trim & amber beacon pods. */
export function OrbitalRingGateMesh({ color = '#64748B' }) {
  const steel = usePbrMaterial({ surface: 'brushed_steel', color });
  const copper = usePbrMaterial({ surface: 'brushed_steel', color: '#B45309' });
  return (
    <group>
      <RoundedBox args={[7.4, 0.48, 2.4]} radius={0.08} position={[0, 0.24, 0]} castShadow receiveShadow><meshPhysicalMaterial {...steel} color="#1E293B" /></RoundedBox>
      <mesh position={[0, 4.1, 0]} castShadow><torusGeometry args={[3.45, 0.32, 12, 32]} /><meshPhysicalMaterial {...steel} /></mesh>
      <mesh position={[0, 4.1, 0]}><torusGeometry args={[2.98, 0.08, 8, 32]} /><meshPhysicalMaterial {...copper} /></mesh>
      {[-3.45, 3.45].map((x) => (
        <group key={x} position={[x, 4.1, 0]}>
          <RoundedBox args={[0.85, 1.45, 0.95]} radius={0.08} castShadow><meshPhysicalMaterial {...copper} /></RoundedBox>
          <mesh position={[0, 0, 0.5]}><sphereGeometry args={[0.14, 8, 8]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.7} toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Multi-stone metallic chondrite asteroid cluster with mineral ore veins. */
export function AsteroidClusterMesh({ color = '#57534E' }) {
  const rock = usePbrMaterial({ surface: 'volcanic_rock', color });
  const ore = usePbrMaterial({ surface: 'brushed_steel', color: '#D97706' });
  return (
    <group>
      <mesh position={[0, 1.05, 0]} scale={[1.2, 0.95, 1.05]} rotation={[0.4, 0.8, 0.2]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.98, 1]} /><meshPhysicalMaterial {...rock} flatShading />
      </mesh>
      <mesh position={[-0.78, 0.55, 0.42]} scale={[0.75, 0.65, 0.7]} rotation={[0.9, 0.2, 0.6]} castShadow>
        <dodecahedronGeometry args={[0.62, 0]} /><meshPhysicalMaterial {...rock} flatShading />
      </mesh>
      <mesh position={[0.62, 0.85, 0.55]} rotation={[0.3, 0.6, 0.2]} castShadow>
        <octahedronGeometry args={[0.32, 0]} /><meshPhysicalMaterial {...ore} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}
