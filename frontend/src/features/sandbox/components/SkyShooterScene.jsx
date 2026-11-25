import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/motionBus';

const STAR_COUNT = 320;
const CLOUD_COUNT = 26;

/** Deep-space / high-altitude starfield + volumetric clouds & orbital rings for sky_shooter (zero ground track). */
export function SkyShooterScene({ palette }) {
  const wrapRef = useRef(null);
  const starsRef = useRef(null);
  const cloudsRef = useRef(null);
  const accent = palette?.primary || '#38BDF8';
  const starGeo = useMemo(() => new THREE.OctahedronGeometry(0.18, 0), []);
  const starMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#F8FAFC' }), []);
  const cloudGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const cloudMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.9, flatShading: true }), []);

  useEffect(() => {
    const d = new THREE.Object3D();
    if (starsRef.current) {
      for (let i = 0; i < STAR_COUNT; i += 1) {
        const ang = i * 2.399;
        const rad = 18 + (i % 7) * 9.5;
        d.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.75 + 8, 30 - (i * 1.1) % 240);
        d.scale.setScalar(0.5 + (i % 4) * 0.45);
        d.updateMatrix();
        starsRef.current.setMatrixAt(i, d.matrix);
      }
      starsRef.current.instanceMatrix.needsUpdate = true;
    }
    if (cloudsRef.current) {
      for (let i = 0; i < CLOUD_COUNT; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        d.position.set(side * (24 + (i % 4) * 9), ((i * 7) % 34) - 10, 20 - i * 9.5);
        d.rotation.set(i * 0.3, i * 0.5, 0);
        d.scale.set(4.5 + (i % 3) * 2.2, 2.2 + (i % 2) * 1.4, 4.5 + (i % 4) * 1.8);
        d.updateMatrix();
        cloudsRef.current.setMatrixAt(i, d.matrix);
      }
      cloudsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (!wrapRef.current) return;
    const pz = motionBus.pos?.z || 0;
    wrapRef.current.position.z = Math.round(pz / 60) * 60;
  });

  return (
    <group ref={wrapRef}>
      <instancedMesh ref={starsRef} args={[starGeo, starMat, STAR_COUNT]} frustumCulled={false} />
      <instancedMesh ref={cloudsRef} args={[cloudGeo, cloudMat, CLOUD_COUNT]} frustumCulled={false} />
      {[-45, -110, -175].map((rz) => (
        <mesh key={rz} position={[0, 8, rz]}>
          <torusGeometry args={[24, 0.45, 8, 40]} />
          <meshBasicMaterial color={accent} transparent opacity={0.32} />
        </mesh>
      ))}
    </group>
  );
}
