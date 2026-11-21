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

/** Hand-crafted Subway Surfers metro train with rounded roof, windshields, AC vents, bumper & graffiti decals. */
export function SubwayTrainPrefab({ color = '#10B981', w = 2.8, h = 2.9, d = 11.4 }) {
  const decal = useMemo(() => createTrainGraffitiDecal(color, '#E11D48'), [color]);
  return (
    <group>
      <RoundedBox args={[w, h * 0.72, d]} radius={0.22} position={[0, h * 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} map={decal} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[w * 0.92, 0.38, d * 0.98]} radius={0.16} position={[0, h * 0.82, 0]} castShadow>
        <meshStandardMaterial color="#34D399" roughness={0.42} />
      </RoundedBox>
      {[-3.2, 0, 3.2].map((z) => (
        <mesh key={z} position={[0, h * 0.96, z]} castShadow><boxGeometry args={[1.35, 0.24, 1.4]} /><meshStandardMaterial color="#475569" /></mesh>
      ))}
      {[-0.65, 0.65].map((wx) => (
        <RoundedBox key={wx} args={[1.05, 0.95, 0.08]} radius={0.05} position={[wx, h * 0.56, d * 0.5]}>
          <meshStandardMaterial color="#1E293B" />
        </RoundedBox>
      ))}
      {[-3.6, -1.2, 1.2, 3.6].map((wz) => (
        <mesh key={wz} position={[0, h * 0.56, wz]}>
          <boxGeometry args={[w + 0.04, 0.65, 1.45]} />
          <meshStandardMaterial color="#38BDF8" />
        </mesh>
      ))}
      <RoundedBox args={[w * 0.95, 0.32, 0.34]} radius={0.07} position={[0, 0.24, d * 0.5 + 0.05]} castShadow>
        <meshStandardMaterial color="#334155" />
      </RoundedBox>
      {[-0.85, 0.85].map((hx) => (
        <mesh key={hx} position={[hx, 0.64, d * 0.5 + 0.04]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#FFFBEB" emissive="#FBBF24" emissiveIntensity={1.9} toneMapped={false} /></mesh>
      ))}
    </group>
  );
}

/** Red-and-white striped wooden/metal street barrier with beacons (jumpable low or slide-under high). */
export function StreetBarrierPrefab({ variant = 'low', w = 2.65 }) {
  const chevron = useMemo(() => createChevronBarrierTexture(), []);
  const isHigh = variant === 'high';
  const boardY = isHigh ? 2.25 : 0.72;
  return (
    <group>
      {[-w * 0.42, w * 0.42].map((x) => (
        <mesh key={x} position={[x, isHigh ? 1.4 : 0.46, 0]} castShadow>
          <boxGeometry args={[0.18, isHigh ? 2.8 : 0.92, 0.22]} /><meshStandardMaterial color="#78350F" />
        </mesh>
      ))}
      <RoundedBox args={[w, 0.68, 0.34]} radius={0.05} position={[0, boardY, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...chevron} />
      </RoundedBox>
      {[-w * 0.42, w * 0.42].map((bx) => (
        <mesh key={bx} position={[bx, boardY + 0.44, 0]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={1.9} toneMapped={false} /></mesh>
      ))}
    </group>
  );
}

/** Colorful pastel city building/saloon shopfront with framed windows, striped awnings, trim & rooftop sign. */
export function CartoonCityBuildingPrefab({ color, w = 5.4, h = 10.2, d = 5.4 }) {
  const col = PASTELS.includes(color) ? color : PASTELS[Math.abs(Math.round(w * 7 + h)) % PASTELS.length];
  const awning = useMemo(() => createBuildingAwningTexture('#E11D48'), []);
  const board = useMemo(() => createBillboardTexture('#14532D', 'TRADE'), []);
  return (
    <group>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={col} roughness={0.65} /></mesh>
      <mesh position={[0, h + 0.22, 0]} castShadow><boxGeometry args={[w + 0.55, 0.45, d + 0.55]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
      {[2.4, 5.0, 7.6].map((wy) => [-1.4, 0, 1.4].map((wx) => (
        <mesh key={`${wy}-${wx}`} position={[wx, wy, d * 0.5 + 0.04]}><boxGeometry args={[0.92, 1.35, 0.08]} /><meshStandardMaterial color="#A5B4FC" /></mesh>
      )))}
      <mesh position={[0, 1.85, d * 0.5 + 0.65]} rotation={[0.35, 0, 0]} castShadow><boxGeometry args={[w * 0.92, 0.14, 1.3]} /><meshStandardMaterial map={awning} /></mesh>
      <mesh position={[0, h + 1.25, 0]} castShadow><boxGeometry args={[w * 0.88, 1.6, 0.24]} /><meshStandardMaterial map={board} /></mesh>
    </group>
  );
}
