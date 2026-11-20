import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { registerCollider, unregisterCollider } from '../runtime/useArenaPhysics';
import { AmbientTraffic } from './cityTraffic';
import { createBuildingFacadeTextures, createCityRoadTextures } from './worldTextures';

const CITY_PALETTES = [
  { wall: '#D9CBB8', trim: '#F4ECE1', glass: '#263B4D', cols: 4, rows: 8, arched: false },
  { wall: '#B87A5C', trim: '#E8D5C4', glass: '#1E2D3B', cols: 4, rows: 6, arched: false },
  { wall: '#8B98A6', trim: '#D6DEE6', glass: '#1C3042', cols: 5, rows: 10, arched: false },
  { wall: '#DFB68C', trim: '#FAF0E2', glass: '#2E4052', cols: 3, rows: 5, arched: true },
];
const STREET_LINES = [-44, 0, 44];

/** Sunlit GTA-style open-world city grid with asphalt avenues, crosswalks, textured towers, trees, lamps & AI traffic. */
export function CityBlockWorld({ size = 180, trafficCount = 10 }) {
  const roadNS = useMemo(() => createCityRoadTextures(1, 14), []);
  const roadEW = useMemo(() => createCityRoadTextures(1, 14), []);
  const facadeMats = useMemo(
    () => CITY_PALETTES.map((p, idx) => createBuildingFacadeTextures({ ...p, seed: idx + 10 })),
    []
  );

  const blocks = useMemo(() => {
    const centers = [-66, -22, 22, 66];
    const items = [];
    let idx = 0;
    centers.forEach((bx) => {
      centers.forEach((bz) => {
        const subOffsets = [[-6.8, -6.8], [6.8, -6.8], [-6.8, 6.8], [6.8, 6.8]];
        const buildings = subOffsets.map(([ox, oz], si) => {
          const seed = idx * 5 + si * 3;
          const h = 10 + (seed % 5) * 5.2;
          const w = 9.2 + (seed % 3) * 1.1;
          const d = 9.2 + ((seed + 1) % 3) * 1.1;
          return { x: bx + ox, z: bz + oz, w, h, d, styleIdx: seed % CITY_PALETTES.length };
        });
        items.push({ bx, bz, buildings });
        idx += 1;
      });
    });
    return items;
  }, []);

  useEffect(() => {
    const ids = [];
    blocks.forEach((blk, bi) => {
      blk.buildings.forEach((b, i) => {
        const id = `city-bldg-${bi}-${i}`;
        ids.push(id);
        registerCollider(id, { position: [b.x, 0.22, b.z], size: [b.w, b.h, b.d], maxY: b.h + 1 }, 'box');
      });
    });
    return () => ids.forEach(unregisterCollider);
  }, [blocks]);

  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[size, 1, size]} />
        <meshStandardMaterial color="#3A3D44" roughness={0.86} />
      </mesh>
      {STREET_LINES.map((pos) => (
        <group key={pos}>
          <mesh position={[pos, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[12.5, size]} />
            <meshStandardMaterial {...roadNS} />
          </mesh>
          <mesh position={[0, 0.025, pos]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[12.5, size]} />
            <meshStandardMaterial {...roadEW} />
          </mesh>
        </group>
      ))}
      {blocks.map((blk, bi) => (
        <group key={bi}>
          <mesh position={[blk.bx, 0.11, blk.bz]} receiveShadow>
            <boxGeometry args={[30.5, 0.22, 30.5]} />
            <meshStandardMaterial color="#D8D2C7" roughness={0.86} />
          </mesh>
          {blk.buildings.map((b, i) => (
            <group key={i} position={[b.x, 0.22, b.z]}>
              <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[b.w, b.h, b.d]} />
                <meshStandardMaterial {...facadeMats[b.styleIdx]} />
              </mesh>
              <RoundedBox args={[b.w + 0.4, 0.5, b.d + 0.4]} radius={0.06} position={[0, b.h + 0.22, 0]} castShadow>
                <meshStandardMaterial color="#E6DFD3" roughness={0.72} />
              </RoundedBox>
              <mesh position={[b.w * 0.2, b.h + 0.9, b.d * 0.18]} castShadow>
                <boxGeometry args={[2.2, 1.0, 2.2]} />
                <meshStandardMaterial color="#5E6670" roughness={0.6} metalness={0.35} />
              </mesh>
            </group>
          ))}
          <group position={[blk.bx - 14.2, 0.22, blk.bz - 14.2]}>
            <mesh position={[0, 2.8, 0]} castShadow><cylinderGeometry args={[0.1, 0.14, 5.6, 8]} /><meshStandardMaterial color="#2C3038" metalness={0.6} roughness={0.4} /></mesh>
            <mesh position={[0.45, 5.5, 0]}><sphereGeometry args={[0.24, 10, 10]} /><meshStandardMaterial color="#FFF3D6" emissive="#FFF3D6" emissiveIntensity={1.2} toneMapped={false} /></mesh>
          </group>
          <group position={[blk.bx + 13.8, 0.22, blk.bz + 13.8]}>
            <mesh position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[0.22, 0.3, 2.6, 8]} /><meshStandardMaterial color="#6D4E38" roughness={0.9} /></mesh>
            <mesh position={[0, 3.3, 0]} castShadow><dodecahedronGeometry args={[1.65, 1]} /><meshStandardMaterial color="#4D7A56" roughness={0.8} flatShading /></mesh>
          </group>
        </group>
      ))}
      <AmbientTraffic count={trafficCount} />
    </group>
  );
}
