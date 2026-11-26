import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createBillboardTexture, createBuildingAwningTexture } from '../kernel/CorridorDecals';
import { getBallastTrackTexture, getBuildingFacadeTexture } from '../kernel/ProceduralTextureAtlas';
import { motionBus } from '../sdk/motionBus';

const RAILS_X = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0];
const TIES_COUNT = 160;
const BLDG_ROWS = 14;
const TREE_ROWS = 12;

const THEME_URBAN = {
  sunny_city: { walk: '#CBD5E1', road: '#1E293B', trim: '#0284C7', signBg: '#1E3A8A', wA: '#E2E8F0', wB: '#F8FAFC', wC: '#93C5FD' },
  tropical_beach: { walk: '#E2E8F0', road: '#0F172A', trim: '#0EA5E9', signBg: '#0369A1', wA: '#FEF9C3', wB: '#BAE6FD', wC: '#A7F3D0' },
  candy_sky: { walk: '#F1F5F9', road: '#312E81', trim: '#EC4899', signBg: '#9D174D', wA: '#FCE7F3', wB: '#E0E7FF', wC: '#F3E8FF' },
  tokyo_festival: { walk: '#94A3B8', road: '#0F172A', trim: '#E11D48', signBg: '#7F1D1D', wA: '#1E293B', wB: '#334155', wC: '#475569' },
  desert_canyon: { walk: '#D6D3D1', road: '#292524', trim: '#D97706', signBg: '#78350F', wA: '#E7E5E4', wB: '#F5F5F4', wC: '#D6D3D1' },
  wild_west: { walk: '#D6D3D1', road: '#292524', trim: '#B45309', signBg: '#7C2D12', wA: '#E7E5E4', wB: '#D6D3D1', wC: '#A8A29E' },
};

/** Endless streaming 3-track urban metro corridor with multi-story illuminated buildings, sidewalks, trees & overhead bridges. */
export function SubwayCorridorScene({ theme = 'sunny_city', signLabel = 'METRO' }) {
  const trackWrapRef = useRef(null);
  const tiesRef = useRef(null);
  const pal = THEME_URBAN[theme] || THEME_URBAN.sunny_city;
  const ballastMap = useMemo(() => getBallastTrackTexture(1, 28), []);
  const facades = useMemo(() => [
    getBuildingFacadeTexture(pal.wA, '#FEF08A'),
    getBuildingFacadeTexture(pal.wB, '#FDE68A'),
    getBuildingFacadeTexture(pal.wC, '#BAE6FD'),
  ], [pal.wA, pal.wB, pal.wC]);
  const signTex = useMemo(() => createBillboardTexture(pal.signBg, (signLabel || 'METRO').slice(0, 10)), [pal.signBg, signLabel]);
  const awningTex = useMemo(() => createBuildingAwningTexture('#D96B27'), []);

  useEffect(() => {
    if (!tiesRef.current) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < TIES_COUNT; i += 1) {
      const z = 40 - i * 1.65;
      [-3.2, 0, 3.2].forEach((lx, k) => {
        d.position.set(lx, 0.03, z); d.rotation.set(0, 0, 0); d.scale.set(2.25, 0.08, 0.34); d.updateMatrix();
        tiesRef.current.setMatrixAt(i * 3 + k, d.matrix);
      });
    }
    tiesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!trackWrapRef.current) return;
    const pz = motionBus.pos?.z || 0;
    trackWrapRef.current.position.z = Math.round(pz / 48) * 48;
  });

  return (
    <group ref={trackWrapRef}>
      <mesh position={[0, -0.02, -75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 260]} />
        <meshStandardMaterial map={ballastMap} roughness={0.62} metalness={0.12} />
      </mesh>
      {[-9.2, 9.2].map((sx) => (
        <mesh key={`sw${sx}`} position={[sx, 0.12, -75]} receiveShadow>
          <boxGeometry args={[6.4, 0.28, 260]} />
          <meshStandardMaterial color={pal.walk} roughness={0.75} metalness={0.08} />
        </mesh>
      ))}
      {[-22, 22].map((rx) => (
        <mesh key={`rd${rx}`} position={[rx, -0.04, -75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 260]} />
          <meshStandardMaterial color={pal.road} roughness={0.85} />
        </mesh>
      ))}
      {[-5.9, 5.9].map((cx) => (
        <mesh key={`cb${cx}`} position={[cx, 0.22, -75]} receiveShadow>
          <boxGeometry args={[0.45, 0.44, 260]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
      ))}
      {RAILS_X.map((rx) => (
        <mesh key={`rl${rx}`} position={[rx, 0.08, -75]} receiveShadow>
          <boxGeometry args={[0.1, 0.08, 260]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.88} roughness={0.16} />
        </mesh>
      ))}
      <instancedMesh ref={tiesRef} args={[null, null, TIES_COUNT * 3]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#5C3A21" roughness={0.88} />
      </instancedMesh>

      {Array.from({ length: BLDG_ROWS }, (_, i) => {
        const bz = 28 - i * 16; const hL = 13 + (i % 4) * 3.5; const hR = 15 + ((i + 2) % 4) * 3.5;
        return (
          <group key={`row${i}`} position={[0, 0, bz]}>
            {[[-13.8, hL, i % 3, 1], [13.8, hR, (i + 1) % 3, -1]].map(([bx, h, fIdx, dir]) => (
              <group key={bx} position={[bx, 0, 0]}>
                <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow><boxGeometry args={[6.8, h, 12.6]} /><meshStandardMaterial map={facades[fIdx]} roughness={0.42} metalness={0.18} /></mesh>
                <mesh position={[0, h + 0.35, 0]} castShadow><boxGeometry args={[7.2, 0.7, 13.0]} /><meshStandardMaterial color="#1E293B" roughness={0.5} metalness={0.4} /></mesh>
                <mesh position={[dir * 3.6, 2.6, 0]} rotation={[0, dir * Math.PI * 0.5, 0]}><boxGeometry args={[10.4, 0.18, 1.35]} /><meshStandardMaterial map={awningTex} roughness={0.5} /></mesh>
              </group>
            ))}
          </group>
        );
      })}

      {Array.from({ length: TREE_ROWS }, (_, i) => (
        <group key={`tr${i}`} position={[0, 0, 24 - i * 18]}>
          {[-7.6, 7.6].map((tx) => (
            <group key={tx} position={[tx, 0.26, 0]}>
              <mesh position={[0, 1.1, 0]} castShadow><cylinderGeometry args={[0.18, 0.24, 2.2, 8]} /><meshStandardMaterial color="#5C3A21" roughness={0.85} /></mesh>
              <mesh position={[0, 2.7, 0]} castShadow><sphereGeometry args={[1.15, 12, 10]} /><meshStandardMaterial color="#15803D" roughness={0.65} /></mesh>
              <mesh position={[0, 3.6, 0]} castShadow><sphereGeometry args={[0.82, 10, 8]} /><meshStandardMaterial color="#16A34A" roughness={0.6} /></mesh>
              <mesh position={[tx < 0 ? 0.9 : -0.9, 2.5, 4.5]} castShadow><cylinderGeometry args={[0.08, 0.11, 5.0, 8]} /><meshStandardMaterial color="#1E293B" metalness={0.75} roughness={0.25} /></mesh>
              <mesh position={[tx < 0 ? 1.4 : -1.4, 4.9, 4.5]}><sphereGeometry args={[0.24, 10, 8]} /><meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={2.0} /></mesh>
            </group>
          ))}
        </group>
      ))}

      {[-28, -84, -140].map((gz) => (
        <group key={`br${gz}`} position={[0, 0, gz]}>
          {[-6.3, 6.3].map((ax) => (
            <RoundedBox key={ax} args={[1.2, 7.6, 1.4]} radius={0.08} position={[ax, 3.8, 0]} castShadow><meshStandardMaterial color={pal.trim} roughness={0.35} metalness={0.45} /></RoundedBox>
          ))}
          <RoundedBox args={[15.4, 1.4, 2.6]} radius={0.1} position={[0, 6.9, 0]} castShadow receiveShadow><meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} /></RoundedBox>
          <RoundedBox args={[11.6, 1.55, 0.45]} radius={0.08} position={[0, 7.1, 1.35]} castShadow><meshStandardMaterial map={signTex} roughness={0.3} /></RoundedBox>
          {[-3.2, 0, 3.2].map((lx) => (
            <mesh key={lx} position={[lx, 6.1, 1.32]}><sphereGeometry args={[0.16, 8, 8]} /><meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={1.9} /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
