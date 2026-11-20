import { RoundedBox } from '@react-three/drei';
import { usePbrMaterial } from '../pbrMaterials';

/** Articulated armored knight hero figurine with T-visor helm, plume, kite shield, cloak & broadsword. */
export function KnightHeroMesh({ color = '#94A3B8' }) {
  const plate = usePbrMaterial({ surface: 'brushed_steel', color });
  const cloth = usePbrMaterial({ surface: 'matte_stone', color: '#991B1B' });
  const gold = usePbrMaterial({ surface: 'brushed_steel', color: '#E5B869' });
  return (
    <group>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]} castShadow><capsuleGeometry args={[0.11, 0.52, 6, 8]} /><meshPhysicalMaterial {...plate} color="#475569" /></mesh>
      ))}
      <RoundedBox args={[0.62, 0.74, 0.36]} radius={0.08} position={[0, 1.15, 0]} castShadow><meshPhysicalMaterial {...plate} /></RoundedBox>
      <RoundedBox args={[0.56, 0.65, 0.08]} radius={0.03} position={[0, 1.05, 0.24]} rotation={[0.14, 0, 0]} castShadow><meshPhysicalMaterial {...cloth} /></RoundedBox>
      <mesh position={[0, 1.74, 0]} castShadow><cylinderGeometry args={[0.2, 0.22, 0.36, 12]} /><meshPhysicalMaterial {...plate} /></mesh>
      <RoundedBox args={[0.08, 0.18, 0.36]} radius={0.02} position={[0, 1.98, 0.05]} castShadow><meshPhysicalMaterial {...cloth} /></RoundedBox>
      <RoundedBox args={[0.1, 0.58, 0.48]} radius={0.04} position={[-0.45, 1.12, -0.15]} castShadow><meshPhysicalMaterial {...gold} /></RoundedBox>
      <group position={[0.46, 1.05, -0.32]} rotation={[-0.85, 0, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.06, 0.85, 0.1]} /><meshPhysicalMaterial {...plate} color="#E2E8F0" /></mesh>
        <RoundedBox args={[0.26, 0.06, 0.1]} radius={0.02} position={[0, 0, 0]}><meshPhysicalMaterial {...gold} /></RoundedBox>
      </group>
    </group>
  );
}

/** Hunched fantasy goblin/skeleton raider with horned leather hood, rib-plate armor & notched blade. */
export function GoblinEnemyMesh({ color = '#6B7E52' }) {
  const skin = usePbrMaterial({ surface: 'matte_stone', color });
  const leather = usePbrMaterial({ surface: 'aged_timber', color: '#4B3621' });
  const bone = usePbrMaterial({ surface: 'matte_stone', color: '#E7E0D3' });
  return (
    <group>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.34, 0]} castShadow><capsuleGeometry args={[0.09, 0.42, 6, 8]} /><meshPhysicalMaterial {...skin} /></mesh>
      ))}
      <RoundedBox args={[0.52, 0.62, 0.32]} radius={0.08} position={[0, 0.96, 0]} castShadow><meshPhysicalMaterial {...leather} /></RoundedBox>
      <mesh position={[0, 1.46, -0.05]} castShadow><sphereGeometry args={[0.22, 12, 12]} /><meshPhysicalMaterial {...skin} /></mesh>
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 1.56, 0]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]} castShadow><coneGeometry args={[0.06, 0.28, 6]} /><meshPhysicalMaterial {...bone} /></mesh>
      ))}
      <mesh position={[0.4, 0.88, -0.3]} rotation={[-0.9, 0, 0]} castShadow><cylinderGeometry args={[0.05, 0.09, 0.72, 8]} /><meshPhysicalMaterial {...leather} /></mesh>
    </group>
  );
}

/** Half-timbered medieval stone & plaster tavern with steeply pitched shingle roof, chimney & lantern sign. */
export function TimberTavernMesh({ color = '#D6CEBF' }) {
  const wall = usePbrMaterial({ surface: 'matte_stone', color });
  const timber = usePbrMaterial({ surface: 'aged_timber', color: '#5C3A21' });
  const roof = usePbrMaterial({ surface: 'aged_timber', color: '#7A3E2C' });
  return (
    <group>
      <RoundedBox args={[4.6, 2.7, 3.8]} radius={0.04} position={[0, 1.35, 0]} castShadow receiveShadow><meshPhysicalMaterial {...wall} /></RoundedBox>
      <mesh position={[0, 3.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[3.45, 2.15, 4]} /><meshPhysicalMaterial {...roof} /></mesh>
      <RoundedBox args={[0.62, 2.1, 0.62]} radius={0.04} position={[1.45, 3.7, -1.1]} castShadow><meshPhysicalMaterial {...timber} color="#4B4642" /></RoundedBox>
      <RoundedBox args={[1.05, 1.75, 0.2]} radius={0.04} position={[0, 0.88, 1.88]} castShadow><meshPhysicalMaterial {...timber} /></RoundedBox>
      <mesh position={[1.15, 1.85, 2.02]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.6} toneMapped={false} /></mesh>
    </group>
  );
}

/** Ancient crystal shrine plinth crowned by clustered amber-gold faceted quartz spires. */
export function CrystalShrineMesh({ color = '#D97706' }) {
  const stone = usePbrMaterial({ surface: 'mossy_stone', color: '#6E706A' });
  const crystal = usePbrMaterial({ surface: 'architectural_glass', color });
  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow><cylinderGeometry args={[1.45, 1.65, 0.48, 8]} /><meshPhysicalMaterial {...stone} /></mesh>
      <mesh position={[0, 0.66, 0]} castShadow receiveShadow><cylinderGeometry args={[0.98, 1.15, 0.42, 8]} /><meshPhysicalMaterial {...stone} /></mesh>
      <mesh position={[0, 1.55, 0]} castShadow><octahedronGeometry args={[0.58, 0]} /><meshPhysicalMaterial {...crystal} emissive="#B45309" emissiveIntensity={0.65} /></mesh>
      {[[-0.48, 0.24], [0.48, -0.22], [0.12, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.15, z]} rotation={[0.25 * (i - 1), i, 0.2 * (1 - i)]} castShadow>
          <octahedronGeometry args={[0.28, 0]} /><meshPhysicalMaterial {...crystal} emissive="#D96B27" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Heavy siege catapult with oak wheeled chassis, torsion beam, swinging spoon arm & ammo boulder. */
export function CatapultMesh({ color = '#7C4F2B' }) {
  const wood = usePbrMaterial({ surface: 'aged_timber', color });
  const iron = usePbrMaterial({ surface: 'brushed_steel', color: '#334155' });
  return (
    <group>
      {[-0.78, 0.78].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.28, 2.8]} radius={0.03} position={[x, 0.46, 0]} castShadow><meshPhysicalMaterial {...wood} /></RoundedBox>
      ))}
      <RoundedBox args={[1.76, 0.2, 0.3]} radius={0.03} position={[0, 0.56, -0.75]} castShadow><meshPhysicalMaterial {...wood} /></RoundedBox>
      {[-0.98, 0.98].map((wx) => [-0.95, 0.95].map((wz) => (
        <mesh key={`${wx}-${wz}`} position={[wx, 0.36, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.16, 14]} /><meshPhysicalMaterial {...wood} color="#4A2E1B" />
        </mesh>
      )))}
      <group position={[0, 0.62, -0.45]} rotation={[-0.68, 0, 0]}>
        <RoundedBox args={[0.16, 0.16, 2.25]} radius={0.03} position={[0, 0.1, 0.95]} castShadow><meshPhysicalMaterial {...wood} /></RoundedBox>
        <mesh position={[0, 0.26, 2.02]} castShadow><cylinderGeometry args={[0.32, 0.24, 0.18, 12]} /><meshPhysicalMaterial {...iron} /></mesh>
      </group>
    </group>
  );
}
