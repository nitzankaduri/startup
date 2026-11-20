import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { getFeelDelta, triggerHitStop } from '../gameFeel';
import { addImpactTrauma } from '../motionBus';

const DEBRIS_COUNT = 10;
const SMOKE_COUNT = 8;

/** Expanding shockwave ring, gravity debris chunks, dark smoke puffs, light flash, and micro camera shake. */
export function ExplosionBurst({ position = [0, 0, 0], trigger = 0, active = false, color = '#D96B27', scale = 1 }) {
  const ringRef = useRef(null);
  const lightRef = useRef(null);
  const debrisRef = useRef([]);
  const smokeRef = useRef([]);
  const stateRef = useRef({ age: 99, debris: [], smoke: [] });

  useEffect(() => {
    if (!active && trigger === 0) return;
    addImpactTrauma(0.38);
    triggerHitStop(55, 0.08);
    soundEngine.playExplosionBoom();
    stateRef.current = {
      age: 0,
      debris: Array.from({ length: DEBRIS_COUNT }, (_, i) => {
        const a = (i / DEBRIS_COUNT) * Math.PI * 2 + Math.random() * 0.5;
        const spd = (4 + Math.random() * 6) * scale;
        return { vx: Math.cos(a) * spd, vy: (4.5 + Math.random() * 4.5) * scale, vz: Math.sin(a) * spd };
      }),
      smoke: Array.from({ length: SMOKE_COUNT }, (_, i) => {
        const a = (i / SMOKE_COUNT) * Math.PI * 2;
        return { vx: Math.cos(a) * 1.4, vy: 1.5 + Math.random() * 1.4, vz: Math.sin(a) * 1.4 };
      }),
    };
  }, [active, trigger, scale]);

  useFrame((_, rawDelta) => {
    const st = stateRef.current;
    st.age += getFeelDelta(rawDelta);
    const t = st.age / 0.95;
    const alive = t < 1 && st.debris.length > 0;
    if (ringRef.current) {
      ringRef.current.visible = t < 0.45;
      ringRef.current.scale.setScalar((0.4 + t * 10) * scale);
      ringRef.current.material.opacity = Math.max(0, 1 - t / 0.45);
    }
    if (lightRef.current) lightRef.current.intensity = t < 0.25 ? (1 - t / 0.25) * 6.5 : 0;

    debrisRef.current.forEach((m, i) => {
      const d = st.debris[i];
      if (!m || !d) return;
      m.visible = alive;
      if (!alive) return;
      m.position.set(d.vx * st.age, Math.max(0, d.vy * st.age - 6.5 * st.age * st.age), d.vz * st.age);
      m.scale.setScalar(Math.max(0.01, (1 - t) * 0.24 * scale));
    });
    smokeRef.current.forEach((m, i) => {
      const s = st.smoke[i];
      if (!m || !s) return;
      m.visible = alive;
      if (!alive) return;
      m.position.set(s.vx * st.age, s.vy * st.age, s.vz * st.age);
      m.scale.setScalar((0.35 + t * 1.55) * scale);
      m.material.opacity = (1 - t) * 0.42;
    });
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color={color} distance={14} decay={2} intensity={0} />
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.7, 1, 24]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: DEBRIS_COUNT }).map((_, i) => (
        <mesh key={`d-${i}`} ref={(el) => { debrisRef.current[i] = el; }} visible={false}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: SMOKE_COUNT }).map((_, i) => (
        <mesh key={`s-${i}`} ref={(el) => { smokeRef.current[i] = el; }} visible={false}>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#27272A" roughness={0.95} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
