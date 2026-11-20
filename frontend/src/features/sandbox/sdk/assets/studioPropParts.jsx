import { RoundedBox } from '@react-three/drei';
import { ExtrudedShape, LatheObject } from '../MeshBuilder';
import { usePbrMaterial } from '../pbrMaterials';

const TOWER_PROFILE = [[1.55, 0], [1.45, 0.5], [1.22, 1.2], [1.18, 4.4], [1.42, 4.75], [1.42, 5.2]];
const CONE_ROOF_PROFILE = [[1.55, 0], [1.1, 0.9], [0.45, 1.85], [0.02, 2.55]];
const WING_SHAPE = [[0, 0], [1.65, -0.35], [1.85, -0.95], [0.35, -0.65]];

/** Sculpted medieval stone keep tower with chamfered buttresses, battlements, oak gate & spiral roof. */
export function CastleTowerMesh({ color = '#9A8F80' }) {
  const stone = usePbrMaterial({ surface: 'cracked_concrete', repeat: [2, 3], color });
  const roof = usePbrMaterial({ surface: 'aged_timber', color: '#7A3E2C' });
  const steel = usePbrMaterial({ surface: 'brushed_steel', color: '#475569' });
  return (
    <group>
      <LatheObject points={TOWER_PROFILE} segments={18} surface="cracked_concrete" color={color} />
      <LatheObject points={CONE_ROOF_PROFILE} segments={18} surface="aged_timber" color="#7A3E2C" position={[0, 5.15, 0]} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <RoundedBox key={i} args={[0.42, 0.52, 0.34]} radius={0.04} position={[Math.cos(a) * 1.26, 5.38, Math.sin(a) * 1.26]} rotation={[0, -a, 0]} castShadow>
            <meshPhysicalMaterial {...stone} />
          </RoundedBox>
        );
      })}
      <RoundedBox args={[0.92, 1.45, 0.35]} radius={0.06} position={[0, 0.72, 1.24]} castShadow><meshPhysicalMaterial {...roof} color="#5C3B24" /></RoundedBox>
      <mesh position={[0, 7.75, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.85, 8]} /><meshPhysicalMaterial {...steel} /></mesh>
      <mesh position={[0.25, 7.98, 0]}><boxGeometry args={[0.5, 0.28, 0.04]} /><meshStandardMaterial color="#D96B27" roughness={0.65} /></mesh>
    </group>
  );
}

/** Heavy multi-axis defense turret with armored pedestal, swivel housing, sensor eye & dual cooling barrels. */
export function ScifiTurretMesh({ color = '#5B6472' }) {
  const steel = usePbrMaterial({ surface: 'brushed_steel', color });
  const trim = usePbrMaterial({ surface: 'automotive_paint', color: '#D96B27' });
  return (
    <group>
      <RoundedBox args={[1.65, 0.38, 1.65]} radius={0.08} position={[0, 0.19, 0]} castShadow receiveShadow><meshPhysicalMaterial {...steel} color="#2B313B" /></RoundedBox>
      <mesh position={[0, 0.72, 0]} castShadow><cylinderGeometry args={[0.52, 0.68, 0.75, 14]} /><meshPhysicalMaterial {...steel} /></mesh>
      <group position={[0, 1.38, 0]}>
        <RoundedBox args={[1.05, 0.68, 1.28]} radius={0.12} castShadow><meshPhysicalMaterial {...steel} /></RoundedBox>
        <RoundedBox args={[0.92, 0.14, 0.85]} radius={0.03} position={[0, 0.36, -0.05]} castShadow><meshPhysicalMaterial {...trim} /></RoundedBox>
        {[-0.24, 0.24].map((x) => (
          <group key={x} position={[x, 0.02, -0.92]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.085, 0.1, 1.15, 12]} /><meshPhysicalMaterial {...steel} color="#1E232B" /></mesh>
            <mesh position={[0, 0, -0.58]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.14, 12]} /><meshPhysicalMaterial {...trim} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.1, -0.66]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.5} toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

/** Clearcoat GT sports coupe with aerodynamic nose, tinted glass cabin, twin spoilers, LED lights & 5-spoke alloys. */
export function SportsCarMesh({ color = '#C84B31' }) {
  const paint = usePbrMaterial({ surface: 'automotive_paint', color });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color: '#DCE8F0' });
  const alloy = usePbrMaterial({ surface: 'brushed_steel', color: '#D4D8DF' });
  return (
    <group>
      <RoundedBox args={[1.76, 0.44, 3.65]} radius={0.14} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow><meshPhysicalMaterial {...paint} /></RoundedBox>
      <RoundedBox args={[1.44, 0.4, 1.65]} radius={0.12} smoothness={4} position={[0, 0.88, 0.15]} castShadow><meshPhysicalMaterial {...glass} /></RoundedBox>
      <RoundedBox args={[1.66, 0.12, 0.34]} radius={0.03} position={[0, 0.94, 1.56]} castShadow><meshPhysicalMaterial {...paint} color="#1F242C" /></RoundedBox>
      {[-0.58, 0.58].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.52, -1.82]}><boxGeometry args={[0.3, 0.12, 0.04]} /><meshStandardMaterial color="#FFF6E0" emissive="#FFF0C2" emissiveIntensity={1.7} toneMapped={false} /></mesh>
          <mesh position={[x, 0.54, 1.82]}><boxGeometry args={[0.32, 0.11, 0.04]} /><meshStandardMaterial color="#DC2626" emissive="#EF4444" emissiveIntensity={1.6} toneMapped={false} /></mesh>
        </group>
      ))}
      {[[-0.9, -1.08], [0.9, -1.08], [-0.9, 1.08], [0.9, 1.08]].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.34, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.34, 0.34, 0.25, 18]} /><meshStandardMaterial color="#181715" roughness={0.85} /></mesh>
          <mesh><cylinderGeometry args={[0.21, 0.21, 0.26, 12]} /><meshPhysicalMaterial {...alloy} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Multi-hull interceptor starfighter with extruded swept wings, cockpit canopy, twin turbines & thruster nozzles. */
export function SpaceshipMesh({ color = '#E5DED3' }) {
  const hull = usePbrMaterial({ surface: 'brushed_steel', color });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color: '#64748B' });
  const trim = usePbrMaterial({ surface: 'automotive_paint', color: '#D96B27' });
  return (
    <group position={[0, 0.65, 0]}>
      <RoundedBox args={[0.92, 0.56, 3.35]} radius={0.18} smoothness={4} castShadow receiveShadow><meshPhysicalMaterial {...hull} /></RoundedBox>
      <RoundedBox args={[0.62, 0.42, 1.2]} radius={0.14} position={[0, 0.32, -0.35]} castShadow><meshPhysicalMaterial {...glass} /></RoundedBox>
      <ExtrudedShape points={WING_SHAPE} depth={0.09} bevel={0.02} position={[0.4, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]} surface="brushed_steel" color="#475569" />
      <ExtrudedShape points={WING_SHAPE} depth={0.09} bevel={0.02} position={[-0.4, 0, 0.55]} rotation={[Math.PI / 2, Math.PI, 0]} surface="brushed_steel" color="#475569" />
      {[-0.38, 0.38].map((tx) => (
        <group key={tx} position={[tx, 0.04, 1.55]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.2, 0.26, 0.65, 12]} /><meshPhysicalMaterial {...trim} /></mesh>
          <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.17, 12]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.8} toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  );
}
