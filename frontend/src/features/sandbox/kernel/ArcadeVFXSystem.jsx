import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { emitPopup, motionBus } from '../sdk/motionBus';

const POOL = 150;
const STREAKS = 12;
const DUMMY = new THREE.Object3D();
const COL = new THREE.Color();
const PARTICLES = Array.from({ length: POOL }, () => ({ alive: false, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, s: 0.2, life: 0, maxLife: 0.5, r: 1, g: 0.8, b: 0.2 }));
let CURSOR = 0;

/** Zero-allocation particle burst emitter for coins (+10), dust puffs & metallic sparks. */
export function emitArcadeVfx(kind, x, y, z, count = 8) {
  const hex = kind === 'coin' ? '#FBBF24' : kind === 'spark' ? '#D96B27' : '#FFFBEB';
  COL.set(hex);
  if (kind === 'coin') emitPopup('+10');
  for (let n = 0; n < count; n += 1) {
    const p = PARTICLES[CURSOR];
    CURSOR = (CURSOR + 1) % POOL;
    p.alive = true; p.x = x; p.y = y; p.z = z;
    p.maxLife = kind === 'dust' ? 0.38 : 0.52; p.life = p.maxLife;
    p.s = kind === 'dust' ? 0.34 : 0.22;
    p.vx = (Math.random() - 0.5) * (kind === 'dust' ? 4 : 9);
    p.vy = (kind === 'dust' ? 1.5 : 3.5) + Math.random() * 5;
    p.vz = (Math.random() - 0.5) * (kind === 'dust' ? 4 : 9);
    p.r = COL.r; p.g = COL.g; p.b = COL.b;
  }
}

/** GPU-instanced 150-particle pool + 3D sprint speed streaks (zero per-frame allocations). */
export function ArcadeVFXSystem({ boosting = false }) {
  const meshRef = useRef(null);
  const streakRef = useRef(null);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), []);
  const sGeo = useMemo(() => new THREE.BoxGeometry(0.05, 0.05, 3.6), []);
  const sMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFBEB', transparent: true, opacity: 0.45 }), []);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const im = meshRef.current;
    if (im) {
      for (let i = 0; i < POOL; i += 1) {
        const p = PARTICLES[i];
        if (!p.alive) {
          DUMMY.position.set(0, -99, 0); DUMMY.scale.setScalar(0.001); DUMMY.updateMatrix();
          im.setMatrixAt(i, DUMMY.matrix); continue;
        }
        p.life -= dt;
        if (p.life <= 0) { p.alive = false; continue; }
        p.vy -= 14 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const k = p.life / p.maxLife;
        DUMMY.position.set(p.x, p.y, p.z);
        DUMMY.rotation.set(p.life * 6, p.life * 4, 0);
        DUMMY.scale.setScalar(p.s * k);
        DUMMY.updateMatrix();
        im.setMatrixAt(i, DUMMY.matrix);
        COL.setRGB(p.r, p.g, p.b);
        im.setColorAt(i, COL);
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }

    const sm = streakRef.current;
    if (sm) {
      const pos = motionBus.pos;
      const spd = Math.abs(motionBus.vel?.z || 0);
      const show = boosting || spd >= 14.5;
      sm.visible = show;
      if (show && pos) {
        const t = clock.elapsedTime;
        for (let i = 0; i < STREAKS; i += 1) {
          const ang = (i / STREAKS) * Math.PI * 2;
          const rad = 4.2 + (i % 3) * 1.1;
          const zOff = ((t * 36 + i * 3.1) % 24) - 14;
          DUMMY.position.set(pos.x + Math.cos(ang) * rad, pos.y + 1.4 + Math.sin(ang) * 2.2, pos.z + zOff);
          DUMMY.rotation.set(0, 0, 0); DUMMY.scale.setScalar(1); DUMMY.updateMatrix();
          sm.setMatrixAt(i, DUMMY.matrix);
        }
        sm.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geo, mat, POOL]} frustumCulled={false} />
      <instancedMesh ref={streakRef} args={[sGeo, sMat, STREAKS]} frustumCulled={false} visible={false} />
    </group>
  );
}
