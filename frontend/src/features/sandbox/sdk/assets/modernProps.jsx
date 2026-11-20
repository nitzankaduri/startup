import { RoundedBox } from '@react-three/drei';
import { usePbrMaterial } from '../pbrMaterials';

/** Police interceptor cruiser with midnight-slate & ivory body, roof lightbar, push bumper & alloys. */
export function PoliceCruiserMesh({ color = '#1E293B' }) {
  const dark = usePbrMaterial({ surface: 'automotive_paint', color });
  const ivory = usePbrMaterial({ surface: 'automotive_paint', color: '#F1EFEA' });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color: '#94A3B8' });
  return (
    <group>
      <RoundedBox args={[1.82, 0.48, 3.85]} radius={0.14} position={[0, 0.52, 0]} castShadow receiveShadow><meshPhysicalMaterial {...dark} /></RoundedBox>
      <RoundedBox args={[1.84, 0.44, 1.35]} radius={0.08} position={[0, 0.53, 0]} castShadow><meshPhysicalMaterial {...ivory} /></RoundedBox>
      <RoundedBox args={[1.48, 0.44, 1.72]} radius={0.12} position={[0, 0.94, 0.08]} castShadow><meshPhysicalMaterial {...glass} /></RoundedBox>
      <RoundedBox args={[0.98, 0.12, 0.24]} radius={0.03} position={[0, 1.21, 0.08]}><meshStandardMaterial color="#D96B27" emissive="#F59E0B" emissiveIntensity={1.6} toneMapped={false} /></RoundedBox>
      {[[-0.92, -1.15], [0.92, -1.15], [-0.92, 1.15], [0.92, 1.15]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.35, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.24, 16]} /><meshStandardMaterial color="#181715" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** Tubular open-wheel offroad desert buggy with roll-cage, spare tire & roof spot lamps. */
export function OffroadBuggyMesh({ color = '#D96B27' }) {
  const paint = usePbrMaterial({ surface: 'automotive_paint', color });
  const cage = usePbrMaterial({ surface: 'brushed_steel', color: '#27272A' });
  return (
    <group>
      <RoundedBox args={[1.46, 0.38, 3.05]} radius={0.1} position={[0, 0.56, 0]} castShadow receiveShadow><meshPhysicalMaterial {...paint} /></RoundedBox>
      <RoundedBox args={[1.18, 0.56, 1.35]} radius={0.08} position={[0, 1.0, 0.08]} castShadow><meshPhysicalMaterial {...cage} wireframe={false} /></RoundedBox>
      <mesh position={[0, 1.34, -0.45]}><boxGeometry args={[0.78, 0.14, 0.12]} /><meshStandardMaterial color="#FFF3D6" emissive="#FDBA74" emissiveIntensity={1.5} toneMapped={false} /></mesh>
      {[[-0.94, -1.08], [0.94, -1.08], [-0.94, 1.08], [0.94, 1.08]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.44, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.44, 0.44, 0.34, 16]} /><meshStandardMaterial color="#1C1917" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

/** Cast-iron gooseneck urban streetlamp with warm amber luminaire dome. */
export function StreetlampMesh({ color = '#27303F' }) {
  const iron = usePbrMaterial({ surface: 'brushed_steel', color });
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.24, 0.32, 0.6, 10]} /><meshPhysicalMaterial {...iron} /></mesh>
      <mesh position={[0, 2.7, 0]} castShadow><cylinderGeometry args={[0.09, 0.14, 4.4, 10]} /><meshPhysicalMaterial {...iron} /></mesh>
      <RoundedBox args={[1.15, 0.1, 0.12]} radius={0.03} position={[0.52, 4.82, 0]} castShadow><meshPhysicalMaterial {...iron} /></RoundedBox>
      <mesh position={[0.98, 4.72, 0]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial color="#FFF3D6" emissive="#FDBA74" emissiveIntensity={1.8} toneMapped={false} /></mesh>
    </group>
  );
}

/** New-Jersey sloped concrete road barrier with steel interlock pins & high-vis amber hazard reflector. */
export function ConcreteBarrierMesh({ color = '#94938E' }) {
  const concrete = usePbrMaterial({ surface: 'cracked_concrete', color });
  return (
    <group>
      <RoundedBox args={[2.4, 0.34, 0.68]} radius={0.04} position={[0, 0.17, 0]} castShadow receiveShadow><meshPhysicalMaterial {...concrete} /></RoundedBox>
      <RoundedBox args={[2.38, 0.56, 0.34]} radius={0.04} position={[0, 0.58, 0]} castShadow receiveShadow><meshPhysicalMaterial {...concrete} /></RoundedBox>
      <mesh position={[0, 0.72, 0.18]}><boxGeometry args={[1.8, 0.1, 0.02]} /><meshStandardMaterial color="#D96B27" roughness={0.45} /></mesh>
    </group>
  );
}

/** Monumental twin-tower suspension bridge segment with roadway deck, pylons & steel cables. */
export function SuspensionBridgeMesh({ color = '#7C4D3B' }) {
  const steel = usePbrMaterial({ surface: 'brushed_steel', color });
  const deck = usePbrMaterial({ surface: 'wet_asphalt', color: '#334155' });
  return (
    <group>
      <RoundedBox args={[14, 0.45, 4.2]} radius={0.04} position={[0, 0.65, 0]} castShadow receiveShadow><meshPhysicalMaterial {...deck} /></RoundedBox>
      {[-4.2, 4.2].map((tx) => (
        <group key={tx} position={[tx, 0, 0]}>
          {[-1.9, 1.9].map((tz) => (
            <RoundedBox key={tz} args={[0.55, 6.2, 0.55]} radius={0.05} position={[0, 3.1, tz]} castShadow><meshPhysicalMaterial {...steel} /></RoundedBox>
          ))}
          <RoundedBox args={[0.45, 0.45, 4.2]} radius={0.04} position={[0, 5.4, 0]} castShadow><meshPhysicalMaterial {...steel} /></RoundedBox>
        </group>
      ))}
      <RoundedBox args={[14, 0.08, 0.08]} radius={0.02} position={[0, 5.6, -1.9]}><meshPhysicalMaterial {...steel} color="#94A3B8" /></RoundedBox>
      <RoundedBox args={[14, 0.08, 0.08]} radius={0.02} position={[0, 5.6, 1.9]}><meshPhysicalMaterial {...steel} color="#94A3B8" /></RoundedBox>
    </group>
  );
}

/** Modernist high-rise skyscraper block with granite lobby base, glazed curtain bays & rooftop crown spire. */
export function SkyscraperBlockMesh({ color = '#475569' }) {
  const stone = usePbrMaterial({ surface: 'cracked_concrete', color: '#78716C' });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color });
  return (
    <group>
      <RoundedBox args={[5.2, 1.8, 5.2]} radius={0.06} position={[0, 0.9, 0]} castShadow receiveShadow><meshPhysicalMaterial {...stone} /></RoundedBox>
      <RoundedBox args={[4.4, 11.5, 4.4]} radius={0.08} position={[0, 7.5, 0]} castShadow receiveShadow><meshPhysicalMaterial {...glass} /></RoundedBox>
      <RoundedBox args={[3.2, 1.6, 3.2]} radius={0.06} position={[0, 14.0, 0]} castShadow><meshPhysicalMaterial {...stone} /></RoundedBox>
      <mesh position={[0, 15.8, 0]} castShadow><cylinderGeometry args={[0.08, 0.18, 2.2, 8]} /><meshPhysicalMaterial {...glass} color="#CBD5E1" /></mesh>
    </group>
  );
}
