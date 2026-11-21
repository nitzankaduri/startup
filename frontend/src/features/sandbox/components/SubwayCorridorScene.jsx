import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { createBillboardTexture, createBuildingAwningTexture } from '../assets/cartoonDecals';
import { StaticPhysicsBody } from '../physics/WorldPhysicsProvider';
import { motionBus } from '../sdk/motionBus';
import { createBallastTrackTextures } from '../sdk/proceduralTextures';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';

const RAILS_X = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0];
const CLIFF_OFFSETS = [-1, 1];
const TIES_COUNT = 160;
const CLIFF_COUNT = 32;

const THEME_CORRIDOR = {
  sunny_city: { side: '#4ADE80', cliff: '#FDBA74', trim: '#0EA5E9', signBg: '#1E3A8A' },
  tropical_beach: { side: '#FDE68A', cliff: '#FB923C', trim: '#10B981', signBg: '#0369A1' },
  candy_sky: { side: '#F9A8D4', cliff: '#C4B5FD', trim: '#EC4899', signBg: '#9D174D' },
  tokyo_festival: { side: '#60A5FA', cliff: '#FDA4AF', trim: '#E11D48', signBg: '#7F1D1D' },
  desert_canyon: { side: '#FDBA74', cliff: '#EA580C', trim: '#92400E', signBg: '#78350F' },
  wild_west: { side: '#FDBA74', cliff: '#E07A5F', trim: '#92400E', signBg: '#7C2D12' },
};

/** Endless streaming Subway Surfers 3-track corridor with sleepers, rails, named gateway arches, shops & canyon cliffs. */
export function SubwayCorridorScene({ theme = 'sunny_city', signLabel = 'METRO' }) {
  const trackWrapRef = useRef(null);
  const tiesRef = useRef(null);
  const cliffsRef = useRef(null);
  const pal = THEME_CORRIDOR[theme] || THEME_CORRIDOR.sunny_city;
  const ballast = useMemo(() => createBallastTrackTextures(3, 42), []);
  const signTex = useMemo(() => createBillboardTexture(pal.signBg, (signLabel || 'METRO').slice(0, 10)), [pal.signBg, signLabel]);
  const awningTex = useMemo(() => createBuildingAwningTexture('#E11D48'), []);

  useEffect(() => {
    const d = new THREE.Object3D();
    if (tiesRef.current) {
      for (let i = 0; i < TIES_COUNT; i += 1) {
        const z = 40 - i * 1.65;
        [-3.2, 0, 3.2].forEach((lx, k) => {
          d.position.set(lx, 0.03, z); d.rotation.set(0, 0, 0); d.scale.set(2.25, 0.08, 0.34); d.updateMatrix();
          tiesRef.current.setMatrixAt(i * 3 + k, d.matrix);
        });
      }
      tiesRef.current.instanceMatrix.needsUpdate = true;
    }
    if (cliffsRef.current) {
      for (let i = 0; i < CLIFF_COUNT; i += 1) {
        const side = CLIFF_OFFSETS[i % 2];
        const z = 25 - Math.floor(i / 2) * 14.5;
        const h = 14 + (i % 4) * 5.5;
        d.position.set(side * (20 + (i % 3) * 4.5), h * 0.42, z);
        d.rotation.set(0, (i % 5) * 0.4, side * 0.08);
        d.scale.set(8 + (i % 3) * 2.5, h, 9.5);
        d.updateMatrix();
        cliffsRef.current.setMatrixAt(i, d.matrix);
      }
      cliffsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (!trackWrapRef.current) return;
    const pz = motionBus.pos?.z || 0;
    trackWrapRef.current.position.z = Math.round(pz / 48) * 48;
  });

  return (
    <group>
      <StaticPhysicsBody colliders={false} friction={0.85}>
        <CuboidCollider args={[18, 0.5, 900]} position={[0, -0.5, -400]} />
      </StaticPhysicsBody>

      <group ref={trackWrapRef}>
        <mesh position={[0, -0.02, -75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[11.6, 260]} />
          <meshStandardMaterial {...ballast} />
        </mesh>
        {[-15.5, 15.5].map((sx) => (
          <mesh key={sx} position={[sx, -0.04, -75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[19, 260]} />
            <meshStandardMaterial color={pal.side} roughness={0.9} />
          </mesh>
        ))}
        {[-5.9, 5.9].map((cx) => (
          <mesh key={cx} position={[cx, 0.14, -75]} receiveShadow>
            <boxGeometry args={[0.55, 0.32, 260]} />
            <meshStandardMaterial color="#FFFBEB" />
          </mesh>
        ))}
        {RAILS_X.map((rx) => (
          <mesh key={rx} position={[rx, 0.08, -75]} receiveShadow>
            <boxGeometry args={[0.1, 0.08, 260]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.22} />
          </mesh>
        ))}
        <instancedMesh ref={tiesRef} args={[null, null, TIES_COUNT * 3]} receiveShadow>
          <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#78350F" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={cliffsRef} args={[null, null, CLIFF_COUNT]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={pal.cliff} roughness={0.85} flatShading />
        </instancedMesh>

        {[-32, -96].map((gz) => (
          <SubwayToonGroup key={gz} outline thickness={0.03} color="#1E1B4B">
            <group position={[0, 0, gz]}>
              {[-6.2, 6.2].map((ax) => (
                <RoundedBox key={ax} args={[1.1, 7.2, 1.1]} radius={0.08} position={[ax, 3.6, 0]} castShadow>
                  <meshStandardMaterial color={pal.trim} />
                </RoundedBox>
              ))}
              <RoundedBox args={[14.2, 1.85, 0.9]} radius={0.12} position={[0, 6.6, 0]} castShadow>
                <meshStandardMaterial map={signTex} />
              </RoundedBox>
              {[-10.2, 10.2].map((bx, k) => (
                <group key={bx} position={[bx, 0, -4]}>
                  <mesh position={[0, 3.6, 0]} castShadow><boxGeometry args={[5.8, 7.2, 5.2]} /><meshStandardMaterial color={k === 0 ? '#FDE68A' : '#FCA5A5'} /></mesh>
                  <mesh position={[k === 0 ? 3.1 : -3.1, 2.3, 0]} rotation={[0, k === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}><boxGeometry args={[4.4, 0.15, 1.2]} /><meshStandardMaterial map={awningTex} /></mesh>
                </group>
              ))}
            </group>
          </SubwayToonGroup>
        ))}
      </group>
    </group>
  );
}
