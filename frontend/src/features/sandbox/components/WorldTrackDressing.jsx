import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createRng, getAtmospherePalette } from './sceneryHelpers';

const GANTRY_Z = [-16, -42, -68, -94];
const FENCE_COUNT = 34;
const LAMP_COUNT = 18;
const TREE_COUNT = 36;
const BILLBOARD_COUNT = 6;

export function WorldTrackDressing({ title = '', environment = {} }) {
  const trunkRef = useRef(null);
  const canopyLowRef = useRef(null);
  const canopyTopRef = useRef(null);
  const fenceRef = useRef(null);
  const lampPostRef = useRef(null);
  const lampGlowRef = useRef(null);
  const boardRef = useRef(null);

  const palette = useMemo(() => getAtmospherePalette(title, environment), [title, environment]);

  const layout = useMemo(() => {
    const rng = createRng(9001);
    const trees = Array.from({ length: TREE_COUNT }, () => ({
      x: (rng() > 0.5 ? 1 : -1) * (14.5 + rng() * 28), y: -5 - rng() * 4, z: 14 - rng() * 130, s: 1.1 + rng() * 1.4,
    }));
    const fences = Array.from({ length: FENCE_COUNT }, (_, i) => ({ x: i % 2 === 0 ? -12.5 : 12.5, z: 8 - Math.floor(i / 2) * 7 }));
    const lamps = Array.from({ length: LAMP_COUNT }, (_, i) => ({ x: i % 2 === 0 ? -13.2 : 13.2, z: 6 - Math.floor(i / 2) * 14 }));
    const boards = Array.from({ length: BILLBOARD_COUNT }, (_, i) => ({ x: i % 2 === 0 ? -15.5 : 15.5, z: -12 - i * 19 }));
    return { trees, fences, lamps, boards };
  }, []);

  useEffect(() => {
    const d = new THREE.Object3D();
    layout.trees.forEach((t, i) => {
      d.position.set(t.x, t.y + t.s * 0.8, t.z); d.scale.set(t.s * 0.28, t.s * 1.6, t.s * 0.28); d.updateMatrix();
      trunkRef.current?.setMatrixAt(i, d.matrix);
      d.position.set(t.x, t.y + t.s * 2.1, t.z); d.scale.set(t.s * 1.2, t.s * 1.8, t.s * 1.2); d.updateMatrix();
      canopyLowRef.current?.setMatrixAt(i, d.matrix);
      d.position.set(t.x, t.y + t.s * 3.1, t.z); d.scale.set(t.s * 0.82, t.s * 1.4, t.s * 0.82); d.updateMatrix();
      canopyTopRef.current?.setMatrixAt(i, d.matrix);
    });
    layout.fences.forEach((f, i) => { d.position.set(f.x, -1.2, f.z); d.scale.set(0.22, 1.3, 6.2); d.updateMatrix(); fenceRef.current?.setMatrixAt(i, d.matrix); });
    layout.lamps.forEach((l, i) => {
      d.position.set(l.x, 0.8, l.z); d.scale.set(0.16, 4.4, 0.16); d.updateMatrix(); lampPostRef.current?.setMatrixAt(i, d.matrix);
      d.position.set(l.x, 3.1, l.z); d.scale.setScalar(0.32); d.updateMatrix(); lampGlowRef.current?.setMatrixAt(i, d.matrix);
    });
    layout.boards.forEach((b, i) => {
      d.position.set(b.x, 4.6, b.z); d.rotation.set(0, b.x < 0 ? 0.35 : -0.35, 0); d.scale.set(0.25, 2.4, 4.2); d.updateMatrix();
      boardRef.current?.setMatrixAt(i, d.matrix);
    });
    [trunkRef, canopyLowRef, canopyTopRef, fenceRef, lampPostRef, lampGlowRef, boardRef].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  }, [layout]);

  return (
    <group>
      {GANTRY_Z.map((z) => (
        <group key={z} position={[0, 8.8, z]}>
          <mesh position={[-13.5, -5.8, 0]} castShadow><boxGeometry args={[0.85, 14, 0.85]} /><meshStandardMaterial color="#2E2C28" roughness={0.6} metalness={0.45} /></mesh>
          <mesh position={[13.5, -5.8, 0]} castShadow><boxGeometry args={[0.85, 14, 0.85]} /><meshStandardMaterial color="#2E2C28" roughness={0.6} metalness={0.45} /></mesh>
          <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[28, 0.4, 1.1]} /><meshStandardMaterial color="#3F3F46" roughness={0.5} metalness={0.55} /></mesh>
          <mesh position={[0, 2.35, 0]} castShadow><boxGeometry args={[28, 0.3, 1.1]} /><meshStandardMaterial color={palette.roof} roughness={0.65} /></mesh>
        </group>
      ))}
      <instancedMesh ref={trunkRef} args={[null, null, TREE_COUNT]}><cylinderGeometry args={[1, 1.2, 1, 6]} /><meshStandardMaterial color={palette.wood} roughness={0.9} /></instancedMesh>
      <instancedMesh ref={canopyLowRef} args={[null, null, TREE_COUNT]} castShadow><coneGeometry args={[1, 1, 6]} /><meshStandardMaterial color={palette.foliage} roughness={0.85} flatShading /></instancedMesh>
      <instancedMesh ref={canopyTopRef} args={[null, null, TREE_COUNT]} castShadow><coneGeometry args={[1, 1, 6]} /><meshStandardMaterial color="#5E7D6C" roughness={0.82} flatShading /></instancedMesh>
      <instancedMesh ref={fenceRef} args={[null, null, FENCE_COUNT]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={palette.wood} roughness={0.88} /></instancedMesh>
      <instancedMesh ref={lampPostRef} args={[null, null, LAMP_COUNT]}><cylinderGeometry args={[1, 1, 1, 8]} /><meshStandardMaterial color="#2E2C28" roughness={0.6} metalness={0.3} /></instancedMesh>
      <instancedMesh ref={lampGlowRef} args={[null, null, LAMP_COUNT]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#FFF3E0" roughness={0.25} /></instancedMesh>
      <instancedMesh ref={boardRef} args={[null, null, BILLBOARD_COUNT]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#F6F4EF" roughness={0.5} /></instancedMesh>
    </group>
  );
}
