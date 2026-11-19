import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeTerrain } from './BiomeTerrain';
import { createRng, getAtmospherePalette } from './sceneryHelpers';
import { WorldTrackDressing } from './WorldTrackDressing';

const BLDG_COUNT = 26;
const CLOUD_COUNT = 26;

export function WorldScenery({ title = '', environment = {} }) {
  const bldgRef = useRef(null);
  const roofRef = useRef(null);
  const balconyRef = useRef(null);
  const awningRef = useRef(null);
  const tankRef = useRef(null);
  const cloudRef = useRef(null);

  const palette = useMemo(() => getAtmospherePalette(title, environment), [title, environment]);

  const data = useMemo(() => {
    const rng = createRng(1337);
    const bldgs = Array.from({ length: BLDG_COUNT }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (18.5 + rng() * 11);
      const z = 8 - Math.floor(i / 2) * 10 + (rng() - 0.5) * 1.5;
      const h = 8 + rng() * 10;
      const w = 4.0 + rng() * 2.4;
      return { x, y: -6 + h * 0.5, z, w, h, d: 4.0 + rng() * 2.4, side };
    });
    const clouds = Array.from({ length: CLOUD_COUNT }, () => ({
      x: (rng() - 0.5) * 160, y: 23 + rng() * 18, z: 20 - rng() * 140,
      sx: 5 + rng() * 7, sy: 1.4 + rng() * 1.4, sz: 3.5 + rng() * 4.5, speed: 0.4 + rng() * 0.65,
    }));
    return { bldgs, clouds };
  }, []);

  useEffect(() => {
    const d = new THREE.Object3D();
    data.bldgs.forEach((b, i) => {
      d.position.set(b.x, b.y, b.z); d.rotation.set(0, 0, 0); d.scale.set(b.w, b.h, b.d); d.updateMatrix();
      bldgRef.current?.setMatrixAt(i, d.matrix);

      d.position.set(b.x, b.y + b.h * 0.5 + 1.0, b.z); d.rotation.set(0, Math.PI / 4, 0); d.scale.set(b.w * 0.78, 2.0, b.d * 0.78); d.updateMatrix();
      roofRef.current?.setMatrixAt(i, d.matrix);

      const faceX = b.x - b.side * (b.w * 0.5 + 0.35);
      d.position.set(faceX, b.y + 1.4, b.z); d.rotation.set(0, 0, 0); d.scale.set(0.8, 0.25, b.d * 0.7); d.updateMatrix();
      balconyRef.current?.setMatrixAt(i, d.matrix);

      d.position.set(faceX, -1.8, b.z); d.rotation.set(0, 0, b.side * 0.35); d.scale.set(1.2, 0.16, b.d * 0.85); d.updateMatrix();
      awningRef.current?.setMatrixAt(i, d.matrix);

      d.position.set(b.x + b.side * 0.5, b.y + b.h * 0.5 + 1.2, b.z + 0.5); d.rotation.set(0, 0, 0); d.scale.set(0.9, 1.4, 0.9); d.updateMatrix();
      tankRef.current?.setMatrixAt(i, d.matrix);
    });
    [bldgRef, roofRef, balconyRef, awningRef, tankRef].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true; });
  }, [data]);

  const cloudDummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!cloudRef.current) return;
    const t = clock.elapsedTime;
    data.clouds.forEach((c, i) => {
      cloudDummy.position.set(((c.x + t * c.speed + 90) % 180) - 90, c.y, c.z);
      cloudDummy.scale.set(c.sx, c.sy, c.sz);
      cloudDummy.updateMatrix();
      cloudRef.current.setMatrixAt(i, cloudDummy.matrix);
    });
    cloudRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <BiomeTerrain palette={palette} />
      <WorldTrackDressing title={title} environment={environment} />
      <instancedMesh ref={bldgRef} args={[null, null, BLDG_COUNT]} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={palette.building} roughness={0.82} /></instancedMesh>
      <instancedMesh ref={roofRef} args={[null, null, BLDG_COUNT]} castShadow><coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color={palette.roof} roughness={0.76} flatShading /></instancedMesh>
      <instancedMesh ref={balconyRef} args={[null, null, BLDG_COUNT]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#2E2C28" roughness={0.7} /></instancedMesh>
      <instancedMesh ref={awningRef} args={[null, null, BLDG_COUNT]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#D96B27" roughness={0.75} /></instancedMesh>
      <instancedMesh ref={tankRef} args={[null, null, BLDG_COUNT]}><cylinderGeometry args={[0.5, 0.5, 1, 10]} /><meshStandardMaterial color="#71717A" roughness={0.5} metalness={0.45} /></instancedMesh>
      <instancedMesh ref={cloudRef} args={[null, null, CLOUD_COUNT]}><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color={palette.cloud} roughness={0.95} transparent opacity={0.88} flatShading /></instancedMesh>
    </group>
  );
}
