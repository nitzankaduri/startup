import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/motionBus';

const LANE_SEAMS = [-4.8, -1.6, 1.6, 4.8];
const DASH_COUNT = 75;
const LAMP_COUNT = 28;

function createAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect((i * 53) % 256, (i * 97) % 256, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Wide 5-lane streaming highway with dashed lane markings, concrete barriers & streetlamps for vehicle_pursuit. */
export function HighwayPursuitScene({ palette }) {
  const wrapRef = useRef(null);
  const dashRef = useRef(null);
  const lampRef = useRef(null);
  const roadTex = useMemo(() => createAsphaltTexture(), []);
  const trim = palette?.accent || '#D96B27';

  useEffect(() => {
    const d = new THREE.Object3D();
    if (dashRef.current) {
      let idx = 0;
      for (let row = 0; row < DASH_COUNT; row += 1) {
        const z = 40 - row * 3.4;
        for (let s = 0; s < LANE_SEAMS.length; s += 1) {
          d.position.set(LANE_SEAMS[s], 0.02, z);
          d.scale.set(0.18, 0.02, 1.5);
          d.updateMatrix();
          dashRef.current.setMatrixAt(idx, d.matrix);
          idx += 1;
        }
      }
      dashRef.current.instanceMatrix.needsUpdate = true;
    }
    if (lampRef.current) {
      for (let i = 0; i < LAMP_COUNT; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = 30 - Math.floor(i / 2) * 18;
        d.position.set(side * 10.6, 3.2, z);
        d.scale.set(0.35, 6.4, 0.35);
        d.updateMatrix();
        lampRef.current.setMatrixAt(i, d.matrix);
      }
      lampRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (!wrapRef.current) return;
    const pz = motionBus.pos?.z || 0;
    wrapRef.current.position.z = Math.round(pz / 48) * 48;
  });

  return (
    <group ref={wrapRef}>
      <mesh position={[0, -0.02, -80]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18.6, 280]} />
        <meshStandardMaterial map={roadTex} roughness={0.78} metalness={0.08} />
      </mesh>
      {[-19.5, 19.5].map((sx) => (
        <mesh key={sx} position={[sx, -0.06, -80]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[21, 280]} />
          <meshStandardMaterial color="#475569" roughness={0.92} />
        </mesh>
      ))}
      {[-9.3, 9.3].map((gx) => (
        <mesh key={gx} position={[gx, 0.42, -80]}>
          <boxGeometry args={[0.6, 0.85, 280]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
        </mesh>
      ))}
      {[-8.7, 8.7].map((ex) => (
        <mesh key={ex} position={[ex, 0.02, -80]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 280]} />
          <meshBasicMaterial color={trim} />
        </mesh>
      ))}
      <instancedMesh ref={dashRef} args={[null, null, DASH_COUNT * LANE_SEAMS.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#F8FAFC" />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[null, null, LAMP_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}
