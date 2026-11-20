import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createBallastTrackTextures } from '../proceduralTextures';
import { motionBus } from '../motionBus';
import { CorridorOverheadProps } from './corridorBanners';
import { createBuildingFacadeTextures } from './worldTextures';

const SEG_LEN = 120;
const TIE_ROWS = 80;
const LANE_XS = [-3.2, 0, 3.2];
const RAIL_XS = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0];

const FACADE_STYLES = [
  { wall: '#F0A87A', trim: '#FFF5E6', glass: '#3B2C35', litGlass: '#FFE4A3', cols: 3, rows: 5, arched: true, awning: '#E04F3E' },
  { wall: '#E46E5A', trim: '#FDECD8', glass: '#2B3E52', litGlass: '#FFDF91', cols: 4, rows: 6, arched: true, awning: '#2C7A8C' },
  { wall: '#F3CA8B', trim: '#FFF8EB', glass: '#3D3542', litGlass: '#FFE8A8', cols: 3, rows: 4, arched: true, awning: '#D94B38' },
  { wall: '#E8B8A2', trim: '#FFF4E8', glass: '#2A4054', litGlass: '#FFD984', cols: 4, rows: 5, arched: false, awning: '#2F8A63' },
];

function CorridorSegment({ zOffset, ballast, facadeMats, buildings }) {
  const tiesRef = useRef(null);

  useEffect(() => {
    if (!tiesRef.current) return;
    const d = new THREE.Object3D();
    for (let r = 0; r < TIE_ROWS; r += 1) {
      const z = -r * (SEG_LEN / TIE_ROWS);
      LANE_XS.forEach((lx, li) => {
        d.position.set(lx, 0.04, z);
        d.scale.set(2.35, 0.08, 0.34);
        d.updateMatrix();
        tiesRef.current.setMatrixAt(r * 3 + li, d.matrix);
      });
    }
    tiesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, 0, zOffset]}>
      <mesh position={[0, -0.5, -SEG_LEN / 2]} receiveShadow>
        <boxGeometry args={[12.6, 1, SEG_LEN]} />
        <meshStandardMaterial map={ballast.map} bumpMap={ballast.bumpMap} bumpScale={0.05} color="#EEACA0" roughness={0.84} />
      </mesh>
      <instancedMesh ref={tiesRef} args={[null, null, TIE_ROWS * 3]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B5E42" roughness={0.82} />
      </instancedMesh>
      {RAIL_XS.map((rx) => (
        <mesh key={rx} position={[rx, 0.1, -SEG_LEN / 2]} receiveShadow castShadow>
          <boxGeometry args={[0.12, 0.085, SEG_LEN]} />
          <meshPhysicalMaterial color="#E2E8F0" metalness={0.9} roughness={0.18} clearcoat={0.5} />
        </mesh>
      ))}
      {[-7.5, 7.5].map((sx) => (
        <group key={sx} position={[sx, 0, -SEG_LEN / 2]}>
          <mesh position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[3.5, 0.9, SEG_LEN]} />
            <meshStandardMaterial color="#F2C0A8" roughness={0.78} />
          </mesh>
          <mesh position={[sx < 0 ? 1.68 : -1.68, 0.26, 0]} receiveShadow>
            <boxGeometry args={[0.3, 0.18, SEG_LEN]} />
            <meshStandardMaterial color="#D97352" roughness={0.68} />
          </mesh>
        </group>
      ))}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial {...facadeMats[b.styleIdx]} />
          </mesh>
          <RoundedBox args={[b.w + 0.38, 0.48, b.d + 0.38]} radius={0.07} position={[0, b.h + 0.22, 0]} castShadow>
            <meshStandardMaterial color="#FFF3E0" roughness={0.7} />
          </RoundedBox>
          <mesh position={[b.side < 0 ? b.w / 2 + 0.58 : -b.w / 2 - 0.58, 3.2, 0]} rotation={[0, 0, b.side * 0.28]} castShadow>
            <boxGeometry args={[1.45, 0.16, b.d * 0.74]} />
            <meshStandardMaterial color={FACADE_STYLES[b.styleIdx].awning} roughness={0.65} />
          </mesh>
          <group position={[b.side < 0 ? b.w / 2 + 0.22 : -b.w / 2 - 0.22, 5.2, 1.5]}>
            <RoundedBox args={[0.46, 0.56, 0.74]} radius={0.04} castShadow><meshStandardMaterial color="#F4EFE6" roughness={0.55} /></RoundedBox>
            <mesh position={[b.side < 0 ? 0.24 : -0.24, 0, 0]} rotation={[0, b.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <circleGeometry args={[0.19, 14]} /><meshStandardMaterial color="#272A32" roughness={0.7} />
            </mesh>
          </group>
        </group>
      ))}
      <CorridorOverheadProps halfWidth={7.4} />
    </group>
  );
}

/** Sunlit Subway-Surfers style 3-lane track corridor with textured buildings, arches, festival banners & infinite scroll. */
export function SubwayCorridor({ followPlayer = true }) {
  const seg0Ref = useRef(null);
  const seg1Ref = useRef(null);
  const seg2Ref = useRef(null);
  const ballast = useMemo(() => createBallastTrackTextures(3, 38), []);
  const facadeMats = useMemo(
    () => FACADE_STYLES.map((s, idx) => createBuildingFacadeTextures({ ...s, seed: idx + 1 })),
    []
  );

  const buildings = useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i += 1) {
      const z = -5 - i * 10;
      [-1, 1].forEach((side, si) => {
        const idx = (i * 2 + si) % FACADE_STYLES.length;
        const h = 11 + ((i * 7 + si * 3) % 4) * 2.8;
        const w = 6.2;
        list.push({ x: side * (8.7 + w / 2), z, w, h, d: 9.4, side, styleIdx: idx });
      });
    }
    return list;
  }, []);

  useFrame(() => {
    if (!followPlayer) return;
    const baseZ = Math.floor(-motionBus.pos.z / SEG_LEN) * -SEG_LEN;
    if (seg0Ref.current) seg0Ref.current.position.z = baseZ + SEG_LEN;
    if (seg1Ref.current) seg1Ref.current.position.z = baseZ;
    if (seg2Ref.current) seg2Ref.current.position.z = baseZ - SEG_LEN;
  });

  return (
    <group>
      <group ref={seg0Ref} position={[0, 0, SEG_LEN]}><CorridorSegment zOffset={0} ballast={ballast} facadeMats={facadeMats} buildings={buildings} /></group>
      <group ref={seg1Ref} position={[0, 0, 0]}><CorridorSegment zOffset={0} ballast={ballast} facadeMats={facadeMats} buildings={buildings} /></group>
      <group ref={seg2Ref} position={[0, 0, -SEG_LEN]}><CorridorSegment zOffset={0} ballast={ballast} facadeMats={facadeMats} buildings={buildings} /></group>
    </group>
  );
}
