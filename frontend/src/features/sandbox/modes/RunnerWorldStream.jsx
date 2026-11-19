import { useEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerupPickupProp } from '../components/PowerupSystem';
import { createBallastTrackTextures } from '../sdk/proceduralTextures';
import { HighBarrierProp, LowHurdleProp, StylizedCoinProp } from '../sdk/props/StylizedObstacles';
import { StylizedRampTrain, StylizedTrain } from '../sdk/props/StylizedTrain';

const TIE_COUNT = 180;
const RAIL_XS = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0];

export function RunnerWorldStream({ chunksRef }) {
  const trackGroupRef = useRef(null);
  const tiesRef = useRef(null);
  const chunkGroupsRef = useRef([]);
  const ballast = useMemo(() => createBallastTrackTextures(3, 40), []);

  useEffect(() => {
    if (!tiesRef.current) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < TIE_COUNT; i += 1) {
      const z = -138 + i * 1.55;
      [-3.2, 0, 3.2].forEach((lx, laneIdx) => {
        d.position.set(lx, 0.03, z);
        d.scale.set(2.25, 0.07, 0.34);
        d.updateMatrix();
        tiesRef.current.setMatrixAt(i * 3 + laneIdx, d.matrix);
      });
    }
    tiesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const chunks = chunksRef.current;
    if (trackGroupRef.current && chunks.length) {
      trackGroupRef.current.position.z = (Math.min(...chunks.map((c) => c.zCenter)) + Math.max(...chunks.map((c) => c.zCenter))) * 0.5;
    }

    chunks.forEach((chunk, ci) => {
      const grp = chunkGroupsRef.current[ci];
      if (!grp) return;
      grp.position.z = chunk.zCenter;
      chunk.obstacles.forEach((o, oi) => {
        const node = grp.children[oi];
        if (!node) return;
        node.visible = !o.blasted;
        if (o.moving) { o.x = Math.sin(clock.elapsedTime * 2.6 + ci) * 3.2; node.position.x = o.x; }
      });
      const coinOff = chunk.obstacles.length;
      chunk.coins.forEach((c, ki) => {
        const node = grp.children[coinOff + ki];
        if (!node) return;
        node.visible = !c.collected;
        if (!c.collected) {
          node.position.set(c.x, c.y, c.z - chunk.zCenter);
          node.rotation.y = clock.elapsedTime * 2.6 + ki * 0.5;
        }
      });
      const pwOff = coinOff + chunk.coins.length;
      chunk.powerups.forEach((p, pi) => {
        const node = grp.children[pwOff + pi];
        if (!node) return;
        node.visible = !p.collected;
        if (!p.collected) {
          node.rotation.y = clock.elapsedTime * 2.2;
          node.position.y = p.y + Math.sin(clock.elapsedTime * 3 + pi) * 0.14;
        }
      });
    });
  });

  return (
    <group>
      <group ref={trackGroupRef}>
        <mesh position={[0, -0.5, 0]} receiveShadow><boxGeometry args={[10.8, 1, 280]} /><meshStandardMaterial map={ballast.map} bumpMap={ballast.bumpMap} bumpScale={0.05} roughness={0.9} /></mesh>
        <instancedMesh ref={tiesRef} args={[null, null, TIE_COUNT * 3]} receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#5C432D" roughness={0.88} /></instancedMesh>
        {RAIL_XS.map((rx) => <mesh key={rx} position={[rx, 0.085, 0]} receiveShadow><boxGeometry args={[0.1, 0.07, 280]} /><meshStandardMaterial color="#D4D4D8" metalness={0.85} roughness={0.22} /></mesh>)}
        {[-5.25, 5.25].map((cx) => <mesh key={cx} position={[cx, 0.08, 0]} receiveShadow><boxGeometry args={[0.45, 0.16, 280]} /><meshStandardMaterial color="#9A3412" roughness={0.75} /></mesh>)}
      </group>

      {chunksRef.current.map((chunk, ci) => (
        <group key={chunk.id} ref={(el) => { chunkGroupsRef.current[ci] = el; }} position={[0, 0, chunk.zCenter]}>
          {chunk.obstacles.map((o) => (
            <group key={o.id} position={[o.x, o.y, o.z - chunk.zCenter]}>
              {o.kind === 'train' && <StylizedTrain w={o.w} h={o.h} d={o.d} />}
              {o.kind === 'ramp' && <StylizedRampTrain w={o.w} h={o.h} d={o.d} />}
              {o.kind === 'low_hurdle' && <LowHurdleProp w={o.w} h={o.h} d={o.d} />}
              {o.kind === 'high_barrier' && <HighBarrierProp w={o.w} h={o.h} d={o.d} />}
              {(o.kind === 'moving_hazard' || o.kind === 'bridge') && (
                <RoundedBox args={[o.w, o.h, o.d]} radius={0.08} smoothness={3} castShadow receiveShadow>
                  <meshStandardMaterial color={o.kind === 'bridge' ? '#6B5B3E' : '#7F1D1D'} roughness={0.65} metalness={0.18} />
                </RoundedBox>
              )}
            </group>
          ))}
          {chunk.coins.map((c) => <group key={c.id} position={[c.x, c.y, c.z - chunk.zCenter]}><StylizedCoinProp size={0.34} shadowY={-(c.y - 0.06)} /></group>)}
          {chunk.powerups.map((p) => <group key={p.id} position={[p.x, p.y, p.z - chunk.zCenter]}><PowerupPickupProp type={p.type} /></group>)}
        </group>
      ))}
    </group>
  );
}
