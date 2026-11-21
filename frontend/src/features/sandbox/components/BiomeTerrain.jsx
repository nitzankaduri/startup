import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { InstancedFoliage } from '../sdk/foliage/InstancedFoliage';
import { createTerrainSurfaceTextures } from '../sdk/ProceduralTextures';
import { RealisticTerrain } from '../sdk/RealisticTerrain';
import { createRng } from './sceneryHelpers';

const MTN_COUNT = 42;
const CLIFF_COUNT = 26;

function buildSculptedMountainGeo(isCap = false) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const n = Math.sin(x * 5.2 + z * 3.7) * 0.16 + Math.cos(z * 6.1 - x * 2.9) * 0.12;
    const taper = Math.max(0.18, 1 - (y + 1) * 0.36);
    x = x * taper * (1 + n);
    z = z * taper * (1 + n * 0.85);
    y = isCap ? (y > 0 ? y * 0.95 + n * 0.25 : y * 0.25) : (y + 1) * 0.62 + Math.abs(n) * 0.45;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function BiomeTerrain({ palette }) {
  const mtnRef = useRef(null);
  const capRef = useRef(null);
  const terrainTex = useMemo(
    () => createTerrainSurfaceTextures({ biome: palette.isTwilight ? 'sand' : 'grass', repeatX: 3, repeatY: 3 }),
    [palette.isTwilight]
  );
  const cliffRef = useRef(null);

  const mtnGeo = useMemo(() => buildSculptedMountainGeo(false), []);
  const capGeo = useMemo(() => buildSculptedMountainGeo(true), []);

  const layout = useMemo(() => {
    const rng = createRng(404);
    const mtns = Array.from({ length: MTN_COUNT }, (_, i) => {
      const ang = (i / MTN_COUNT) * Math.PI * 2 + (rng() - 0.5) * 0.12;
      const dist = 80 + rng() * 56;
      const h = 24 + rng() * 32;
      const w = 15 + rng() * 16;
      return { x: Math.cos(ang) * dist, y: -14, z: -28 + Math.sin(ang) * dist, h, w, ry: rng() * Math.PI };
    });
    const cliffs = Array.from({ length: CLIFF_COUNT }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const tier = i % 3;
      return {
        x: side * (26 + tier * 9 + rng() * 6),
        y: -12 + tier * 3.5,
        z: 10 - Math.floor(i / 2) * 10.5,
        sx: 10 + rng() * 6,
        sy: 6 + rng() * 5,
        sz: 9 + rng() * 5,
      };
    });
    return { mtns, cliffs };
  }, []);

  useEffect(() => {
    const d = new THREE.Object3D();
    layout.mtns.forEach((m, i) => {
      d.position.set(m.x, m.y, m.z);
      d.rotation.set(0, m.ry, 0);
      d.scale.set(m.w, m.h, m.w * 0.85);
      d.updateMatrix();
      mtnRef.current?.setMatrixAt(i, d.matrix);

      d.position.set(m.x, m.y + m.h * 0.98, m.z);
      d.scale.set(m.w * 0.48, m.h * 0.28, m.w * 0.42);
      d.updateMatrix();
      capRef.current?.setMatrixAt(i, d.matrix);
    });
    layout.cliffs.forEach((c, i) => {
      d.position.set(c.x, c.y, c.z);
      d.rotation.set(0, (i % 5) * 0.2, 0);
      d.scale.set(c.sx, c.sy, c.sz);
      d.updateMatrix();
      cliffRef.current?.setMatrixAt(i, d.matrix);
    });
    [mtnRef, capRef, cliffRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  }, [layout]);

  return (
    <group>
      <RealisticTerrain
        size={220}
        flatRadius={24}
        amplitude={palette.isTwilight ? 16 : 22}
        surface={palette.isTwilight ? 'volcanic_rock' : 'mossy_stone'}
        flatColor={palette.isTwilight ? '#1E2433' : palette.foliage}
        rockColor={palette.mountain}
        peakColor={palette.cap}
        position={[0, -14.2, -32]}
      />
      <InstancedFoliage
        count={800}
        biome={palette.isTwilight ? 'volcanic' : 'meadow'}
        position={[0, -14.2, -32]}
        radius={74}
        innerRadius={6}
        terrainAmplitude={palette.isTwilight ? 16 : 22}
        flatRadius={24}
      />
      <instancedMesh ref={mtnRef} args={[mtnGeo, null, MTN_COUNT]} receiveShadow>
        <meshStandardMaterial color={palette.mountain} map={terrainTex.map} bumpMap={terrainTex.bumpMap} bumpScale={0.08} roughnessMap={terrainTex.roughnessMap} roughness={0.88} flatShading />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[capGeo, null, MTN_COUNT]}>
        <meshStandardMaterial color={palette.cap} bumpMap={terrainTex.bumpMap} bumpScale={0.04} roughness={0.72} flatShading />
      </instancedMesh>
      <instancedMesh ref={cliffRef} args={[null, null, CLIFF_COUNT]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.mountain} map={terrainTex.map} bumpMap={terrainTex.bumpMap} bumpScale={0.06} roughness={0.86} flatShading />
      </instancedMesh>
    </group>
  );
}
