import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STREET_LINES, buildOpenWorldData } from '../kernel/OpenWorldBuilder';
import { getBuildingFacadeTexture } from '../kernel/ProceduralTextureAtlas';

function createCityRoadTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 124, 256, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 18);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const DUMMY = new THREE.Object3D();
const COL = new THREE.Color();
const BLOCK_COORDS = [-40, 0, 40];

/** 180x180 360-degree instanced city grid with sidewalks, central plaza, buildings & glowing mission beacon. */
export function OpenWorldScene({ palette }) {
  const bldgRef = useRef(null);
  const beaconRef = useRef(null);
  const { buildings } = useMemo(() => buildOpenWorldData(), []);
  const roadTex = useMemo(() => createCityRoadTex(), []);
  const facadeTex = useMemo(() => getBuildingFacadeTexture('#E2E8F0'), []);
  const bGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({ map: facadeTex, color: '#FFFFFF', roughness: 0.65, metalness: 0.08 }), [facadeTex]);
  const accent = palette?.accent || '#D96B27';

  useEffect(() => {
    if (!bldgRef.current) return;
    for (let i = 0; i < buildings.length; i += 1) {
      const b = buildings[i];
      DUMMY.position.set(b.x, b.height * 0.5, b.z);
      DUMMY.rotation.set(0, 0, 0);
      DUMMY.scale.set(b.width, b.height, b.depth);
      DUMMY.updateMatrix();
      bldgRef.current.setMatrixAt(i, DUMMY.matrix);
      bldgRef.current.setColorAt(i, COL.set(b.color));
    }
    bldgRef.current.instanceMatrix.needsUpdate = true;
    if (bldgRef.current.instanceColor) bldgRef.current.instanceColor.needsUpdate = true;
  }, [buildings]);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.elapsedTime * 1.4;
    }
  });

  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[184, 184]} />
        <meshStandardMaterial map={roadTex} roughness={0.85} />
      </mesh>

      {STREET_LINES.map((s) => (
        <group key={s}>
          <mesh position={[s, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 180]} />
            <meshStandardMaterial color="#1E293B" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.01, s]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[180, 14]} />
            <meshStandardMaterial color="#1E293B" roughness={0.82} />
          </mesh>
        </group>
      ))}

      {BLOCK_COORDS.map((bx) => BLOCK_COORDS.map((bz) => (
        <mesh key={`${bx}-${bz}`} position={[bx, 0.08, bz]} receiveShadow>
          <boxGeometry args={[25.4, 0.16, 25.4]} />
          <meshStandardMaterial color={bx === 0 && bz === 0 ? '#E7E5E4' : '#CBD5E1'} roughness={0.9} />
        </mesh>
      )))}

      <mesh ref={beaconRef} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.7, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.45} />
      </mesh>

      <instancedMesh ref={bldgRef} args={[bGeo, bMat, buildings.length]} castShadow receiveShadow />

      {[
        [0, 1.4, -91, 184, 2.8, 2],
        [0, 1.4, 91, 184, 2.8, 2],
        [-91, 1.4, 0, 2, 2.8, 184],
        [91, 1.4, 0, 2, 2.8, 184],
      ].map(([x, y, z, w, h, d], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
