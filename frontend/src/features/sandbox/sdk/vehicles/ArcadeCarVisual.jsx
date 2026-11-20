import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { usePbrMaterial } from '../pbrMaterials';
import { VehicleHeadlights } from './VehicleHeadlights';

const WHEEL_POS = [[-0.86, 0.34, -1.04], [0.86, 0.34, -1.04], [-0.86, 0.34, 1.04], [0.86, 0.34, 1.04]];

/** Production arcade vehicle rig visual: steering front wheels, dynamic brake lamps, twin SpotLights & nitro flames. */
export function ArcadeCarVisual({ color = '#D96B27', fxRef }) {
  const paint = usePbrMaterial({ surface: 'automotive_paint', color });
  const glass = usePbrMaterial({ surface: 'architectural_glass', color: '#DCE8F0' });
  const alloy = usePbrMaterial({ surface: 'brushed_alloy', color: '#D4D8DF' });
  const steerRefs = useRef([]);
  const wheelRefs = useRef([]);
  const brakeMatRef = useRef(null);
  const nitroFlag = useRef(false);
  const wheelSpin = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const fx = fxRef?.current || {};
    wheelSpin.current -= (fx.fwdSpeed || 0) * dt * 2.1;
    steerRefs.current.forEach((el) => { if (el) el.rotation.y = (fx.steer || 0) * 0.42; });
    wheelRefs.current.forEach((el) => { if (el) el.rotation.x = wheelSpin.current; });
    if (brakeMatRef.current) brakeMatRef.current.emissiveIntensity = fx.braking ? 2.5 : 0.45;
    nitroFlag.current = Boolean(fx.nitro);
  });

  return (
    <group>
      <RoundedBox args={[1.76, 0.44, 3.55]} radius={0.14} smoothness={3} position={[0, 0.52, 0]} castShadow receiveShadow><meshPhysicalMaterial {...paint} /></RoundedBox>
      <RoundedBox args={[1.4, 0.4, 1.58]} radius={0.11} smoothness={3} position={[0, 0.9, 0.14]} castShadow><meshPhysicalMaterial {...glass} /></RoundedBox>
      <RoundedBox args={[1.64, 0.1, 0.3]} radius={0.03} position={[0, 0.95, 1.5]} castShadow><meshPhysicalMaterial {...paint} color="#1F242C" /></RoundedBox>
      {[-0.56, 0.56].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 0.54, -1.78]}><boxGeometry args={[0.28, 0.12, 0.04]} /><meshStandardMaterial color="#FFF6E0" emissive="#FFF0C2" emissiveIntensity={1.8} toneMapped={false} /></mesh>
          <mesh position={[x, 0.56, 1.78]}><boxGeometry args={[0.32, 0.12, 0.04]} /><meshStandardMaterial ref={i === 0 ? brakeMatRef : undefined} color="#DC2626" emissive="#EF4444" emissiveIntensity={0.45} toneMapped={false} /></mesh>
        </group>
      ))}
      {WHEEL_POS.map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} ref={(el) => { if (i < 2) steerRefs.current[i] = el; }}>
          <group ref={(el) => { wheelRefs.current[i] = el; }} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow><cylinderGeometry args={[0.34, 0.34, 0.25, 16]} /><meshStandardMaterial color="#181715" roughness={0.86} /></mesh>
            <mesh><cylinderGeometry args={[0.21, 0.21, 0.26, 12]} /><meshPhysicalMaterial {...alloy} /></mesh>
          </group>
        </group>
      ))}
      <VehicleHeadlights nitroRef={nitroFlag} zFront={-1.78} zRear={1.76} />
    </group>
  );
}
