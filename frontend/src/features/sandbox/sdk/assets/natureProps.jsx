import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { LatheObject } from '../MeshBuilder';
import { usePbrMaterial } from '../pbrMaterials';

const PALM_TRUNK = [[0.28, 0], [0.22, 1.2], [0.18, 2.8], [0.14, 4.4]];

/** Tropical leaning palm tree with curved segmented trunk, radial fronds & coconuts. */
export function PalmTreeMesh({ color = '#4D7C52' }) {
  const leaf = usePbrMaterial({ surface: 'foliage_leaf', color });
  return (
    <group>
      <group rotation={[0.08, 0, 0.07]}>
        <LatheObject points={PALM_TRUNK} segments={10} surface="aged_timber" color="#8C6239" />
        <group position={[0, 4.45, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <group key={i} rotation={[0, a, 0]}>
                <RoundedBox args={[0.55, 0.08, 2.15]} radius={0.03} position={[0, 0.05, 1.05]} rotation={[-0.36, 0, 0]} castShadow>
                  <meshPhysicalMaterial {...leaf} />
                </RoundedBox>
              </group>
            );
          })}
          {[[-0.2, 0.2], [0.22, 0.15], [0, -0.22]].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, -0.15, cz]} castShadow><sphereGeometry args={[0.16, 8, 8]} /><meshStandardMaterial color="#5C3A21" roughness={0.85} /></mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Lush broadleaf stylized oak tree with sturdy trunk & multi-sphere organic canopy clusters. */
export function StylizedOakMesh({ color = '#4C6B43' }) {
  const leaf = usePbrMaterial({ surface: 'foliage_leaf', color });
  const bark = usePbrMaterial({ surface: 'aged_timber', color: '#6E4B32' });
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow><cylinderGeometry args={[0.26, 0.44, 2.8, 10]} /><meshPhysicalMaterial {...bark} /></mesh>
      {[[0, 3.3, 0, 1.45], [-0.95, 2.95, 0.45, 1.05], [0.95, 3.05, -0.4, 1.1], [0.2, 3.65, 0.65, 0.95]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow><icosahedronGeometry args={[r, 1]} /><meshPhysicalMaterial {...leaf} /></mesh>
      ))}
    </group>
  );
}

/** Weathered coastal wooden dock pier with pilings, plank deck & twin mooring bollards. */
export function WoodenDockMesh({ color = '#8C6239' }) {
  const wood = usePbrMaterial({ surface: 'aged_timber', color });
  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <RoundedBox key={i} args={[2.6, 0.14, 0.72]} radius={0.02} position={[0, 0.85, -2.0 + i * 0.8]} castShadow receiveShadow>
          <meshPhysicalMaterial {...wood} />
        </RoundedBox>
      ))}
      {[-1.15, 1.15].map((x) => [-1.8, 0, 1.8].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.55, z]} castShadow><cylinderGeometry args={[0.14, 0.16, 1.3, 8]} /><meshPhysicalMaterial {...wood} color="#5C3A21" /></mesh>
      )))}
    </group>
  );
}

/** Stone-ringed campsite firepit with crossed firewood logs, animated flame cones & flickering warm pointLight. */
export function CampfireMesh() {
  const rock = usePbrMaterial({ surface: 'volcanic_rock', color: '#6E6860' });
  const wood = usePbrMaterial({ surface: 'aged_timber', color: '#4A2E1B' });
  const flameRef = useRef(null);
  const lightRef = useRef(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (flameRef.current) flameRef.current.scale.set(1, 0.85 + Math.sin(t * 9.5) * 0.22, 1);
    if (lightRef.current) lightRef.current.intensity = 9 + Math.sin(t * 7.8) * 2.2;
  });
  return (
    <group>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(a) * 0.68, 0.16, Math.sin(a) * 0.68]} castShadow><dodecahedronGeometry args={[0.2, 0]} /><meshPhysicalMaterial {...rock} /></mesh>;
      })}
      {[0, 1.05, 2.1].map((rot, i) => (
        <mesh key={i} position={[0, 0.2, 0]} rotation={[0.25, rot, Math.PI / 2 - 0.15]} castShadow><cylinderGeometry args={[0.09, 0.1, 1.15, 8]} /><meshPhysicalMaterial {...wood} /></mesh>
      ))}
      <group ref={flameRef} position={[0, 0.25, 0]}>
        <mesh position={[0, 0.35, 0]}><coneGeometry args={[0.32, 0.78, 7]} /><meshStandardMaterial color="#F97316" emissive="#F59E0B" emissiveIntensity={1.9} toneMapped={false} /></mesh>
        <mesh position={[0, 0.26, 0]}><coneGeometry args={[0.18, 0.52, 6]} /><meshStandardMaterial color="#FDE68A" emissive="#FFF3D6" emissiveIntensity={2.2} toneMapped={false} /></mesh>
      </group>
      <pointLight ref={lightRef} position={[0, 0.9, 0]} color="#FDBA74" intensity={9} distance={16} decay={2} />
    </group>
  );
}

/** Weathered classical temple ruins pillar with mossy stepped plinth & fractured fluted capital. */
export function RuinsPillarMesh({ color = '#B8B0A0' }) {
  const stone = usePbrMaterial({ surface: 'cracked_concrete', color });
  const moss = usePbrMaterial({ surface: 'mossy_stone', color: '#5D6E59' });
  return (
    <group>
      <RoundedBox args={[1.45, 0.42, 1.45]} radius={0.04} position={[0, 0.21, 0]} castShadow receiveShadow><meshPhysicalMaterial {...moss} /></RoundedBox>
      <mesh position={[0, 1.75, 0]} castShadow receiveShadow><cylinderGeometry args={[0.42, 0.48, 2.7, 12]} /><meshPhysicalMaterial {...stone} /></mesh>
      <RoundedBox args={[1.15, 0.32, 1.15]} radius={0.03} position={[0, 3.15, 0]} rotation={[0.06, 0.15, -0.04]} castShadow><meshPhysicalMaterial {...stone} /></RoundedBox>
      <mesh position={[0.95, 0.34, 0.55]} rotation={[Math.PI / 2, 0.4, 0.7]} castShadow><cylinderGeometry args={[0.38, 0.38, 0.72, 10]} /><meshPhysicalMaterial {...stone} /></mesh>
    </group>
  );
}
