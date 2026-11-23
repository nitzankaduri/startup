import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createChevronBarrierTexture } from '../sdk/props/propTextures';
import { createBillboardTexture, createBuildingAwningTexture, createTrainGraffitiDecal } from './cartoonDecals';

const PASTELS = ['#FDE68A', '#FCA5A5', '#93C5FD', '#A7F3D0', '#FDBA74'];

/** Wooden crate / steel-framed ramp sloping smoothly from ground track up to subway train rooftop. */
export function TrainRampPrefab({ w = 2.6, h = 2.65, d = 5.8 }) {
  return (
    <group>
      <group position={[0, h * 0.45, 0]} rotation={[-0.42, 0, 0]}>
        <RoundedBox args={[w, 0.36, d]} radius={0.06} castShadow receiveShadow>
          <meshStandardMaterial color="#D97706" roughness={0.75} />
        </RoundedBox>
        {[-0.32, 0, 0.32].map((zOff, i) => (
          <mesh key={i} position={[0, 0.19, zOff * d]}>
            <boxGeometry args={[w * 0.86, 0.08, 0.42]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#FBBF24' : '#92400E'} />
          </mesh>
        ))}
        {[-w * 0.46, w * 0.46].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]} castShadow><boxGeometry args={[0.16, 0.28, d]} /><meshStandardMaterial color="#78350F" /></mesh>
        ))}
      </group>
      <mesh position={[0, h * 0.25, -d * 0.35]} castShadow><boxGeometry args={[w * 0.9, h * 0.5, 0.85]} /><meshStandardMaterial color="#92400E" /></mesh>
    </group>
  );
}

/** Hand-crafted Subway Surfers metro train with rounded roof, windshields, framed windows, AC vents, bumpers & decals. */
export function SubwayTrainPrefab({ color = '#10B981', w = 2.8, h = 2.9, d = 11.4 }) {
  const decal = useMemo(() => createTrainGraffitiDecal(color, '#E11D48'), [color]);
  return (
    <group>
      <RoundedBox args={[w, h * 0.72, d]} radius={0.22} position={[0, h * 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} map={decal} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[w * 0.92, 0.4, d * 0.98]} radius={0.18} position={[0, h * 0.83, 0]} castShadow>
        <meshStandardMaterial color="#34D399" roughness={0.4} />
      </RoundedBox>
      {[-3.2, 0, 3.2].map((z) => (
        <group key={z} position={[0, h * 0.98, z]}>
          <mesh castShadow><boxGeometry args={[1.38, 0.24, 1.45]} /><meshStandardMaterial color="#475569" /></mesh>
          <mesh position={[0, 0.14, 0]}><boxGeometry args={[1.05, 0.06, 1.05]} /><meshStandardMaterial color="#94A3B8" /></mesh>
        </group>
      ))}
      {[-1, 1].flatMap((end) => [-0.65, 0.65].map((wx) => (
        <RoundedBox key={`${end}-${wx}`} args={[1.05, 0.92, 0.1]} radius={0.05} position={[wx, h * 0.58, end * (d * 0.5)]}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
      )))}
      {[-3.6, -1.2, 1.2, 3.6].map((wz) => (
        <group key={wz} position={[0, h * 0.56, wz]}>
          <mesh><boxGeometry args={[w + 0.04, 0.74, 1.56]} /><meshStandardMaterial color="#1E293B" /></mesh>
          <mesh><boxGeometry args={[w + 0.08, 0.56, 1.36]} /><meshStandardMaterial color="#38BDF8" /></mesh>
        </group>
      ))}
      {[-1, 1].map((end) => (
        <group key={end}>
          <RoundedBox args={[w * 0.95, 0.32, 0.34]} radius={0.07} position={[0, 0.24, end * (d * 0.5 + 0.05)]} castShadow>
            <meshStandardMaterial color="#334155" />
          </RoundedBox>
          {[-0.85, 0.85].map((hx) => (
            <mesh key={hx} position={[hx, 0.64, end * (d * 0.5 + 0.04)]}>
              <sphereGeometry args={[0.16, 10, 10]} />
              <meshStandardMaterial color="#FFFBEB" emissive={end > 0 ? '#FBBF24' : '#EF4444'} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Red-and-white striped wooden/metal street barrier with grounded feet plates & hazard beacons (jumpable or slide-under). */
export function StreetBarrierPrefab({ variant = 'low', w = 2.65 }) {
  const chevron = useMemo(() => createChevronBarrierTexture(), []);
  const isHigh = variant === 'high';
  const boardY = isHigh ? 2.02 : 0.72;
  return (
    <group>
      {[-w * 0.42, w * 0.42].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.06, 0]} castShadow><boxGeometry args={[0.42, 0.12, 0.68]} /><meshStandardMaterial color="#475569" /></mesh>
          <mesh position={[x, isHigh ? 1.25 : 0.48, 0]} castShadow>
            <boxGeometry args={[0.18, isHigh ? 2.5 : 0.92, 0.22]} /><meshStandardMaterial color="#78350F" />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[w, 0.68, 0.34]} radius={0.05} position={[0, boardY, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...chevron} />
      </RoundedBox>
      {[-w * 0.42, w * 0.42].map((bx) => (
        <mesh key={bx} position={[bx, boardY + 0.46, 0]}>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshStandardMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={1.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Colorful pastel city building/shopfront with framed windows, striped awnings, cornice trim & rooftop billboard. */
export function CartoonCityBuildingPrefab({ color, w = 5.4, h = 10.2, d = 5.4 }) {
  const col = PASTELS.includes(color) ? color : PASTELS[Math.abs(Math.round(w * 7 + h)) % PASTELS.length];
  const awning = useMemo(() => createBuildingAwningTexture('#E11D48'), []);
  const board = useMemo(() => createBillboardTexture('#14532D', 'TRADE'), []);
  return (
    <group>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={col} roughness={0.65} /></mesh>
      <mesh position={[0, h + 0.22, 0]} castShadow><boxGeometry args={[w + 0.58, 0.46, d + 0.58]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
      <mesh position={[0, 1.0, d * 0.5 + 0.04]}><boxGeometry args={[1.3, 2.0, 0.1]} /><meshStandardMaterial color="#78350F" /></mesh>
      {[3.1, 5.6, 8.1].map((wy) => [-1.45, 0, 1.45].map((wx) => (
        <group key={`${wy}-${wx}`} position={[wx, wy, d * 0.5 + 0.03]}>
          <mesh><boxGeometry args={[1.08, 1.48, 0.08]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
          <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.84, 1.22, 0.06]} /><meshStandardMaterial color="#A5B4FC" /></mesh>
        </group>
      )))}
      {[3.1, 5.6, 8.1].map((wy) => [-1.3, 1.3].map((wz) => (
        <group key={`s-${wy}-${wz}`} position={[w * 0.5 + 0.03, wy, wz]}>
          <mesh><boxGeometry args={[0.08, 1.48, 1.08]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
          <mesh position={[0.03, 0, 0]}><boxGeometry args={[0.06, 1.22, 0.84]} /><meshStandardMaterial color="#A5B4FC" /></mesh>
        </group>
      )))}
      <mesh position={[0, 2.1, d * 0.5 + 0.65]} rotation={[0.35, 0, 0]} castShadow><boxGeometry args={[w * 0.92, 0.14, 1.3]} /><meshStandardMaterial map={awning} /></mesh>
      <mesh position={[0, h + 1.28, 0]} castShadow><boxGeometry args={[w * 0.88, 1.65, 0.24]} /><meshStandardMaterial map={board} /></mesh>
    </group>
  );
}
