import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { bindArcadeUnlock, sfxCoinDing, sfxComboChime, sfxCrashStars } from './cartoonSfx';

const POOL = 180;
const RINGS = 12;
const DUMMY = new THREE.Object3D();
const COL = new THREE.Color();
const QUEUE = [];

/** Emit stylized cartoon VFX bursts: 'coin' | 'dust' | 'speed' | 'crash'. */
export function emitCartoonVfx({ kind = 'dust', position = [0, 0, 0], velocity = [0, 0, 0], count = 10, audio = true }) {
  QUEUE.push({ kind, position, velocity, count });
  if (!audio) return;
  if (kind === 'coin') sfxCoinDing();
  else if (kind === 'crash') sfxCrashStars();
}

const FX_PRESETS = {
  coin: { colors: ['#FBBF24', '#FFFBEB', '#F59E0B'], spd: 5.8, g: 5.5, life: 0.56, sc: 0.16, grow: -0.5, ring: true },
  dust: { colors: ['#FFFDF7', '#F3F4F6', '#FEF3C7'], spd: 2.8, g: -1.6, life: 0.58, sc: 0.26, grow: 1.5, ring: false },
  speed: { colors: ['#FFFBEB', '#FEF3C7', '#FDE68A'], spd: 0.8, g: 0, life: 0.22, sc: 0.07, grow: 0.2, ring: false },
  crash: { colors: ['#FBBF24', '#D96B27', '#FFFDF7'], spd: 11.0, g: 10.5, life: 0.65, sc: 0.24, grow: -0.4, ring: true },
};

/**
 * Stylized cartoon particle & ring VFX system (golden stars/rings on coins,
 * puffy white jump/land/drift dust, speed lines, and comical crash impact stars).
 */
export function CartoonVFX() {
  const starRef = useRef(null);
  const ringRefs = useRef([]);
  const cursors = useRef({ p: 0, r: 0, collected: 0, combo: 1, lastShake: 0, lastLand: 0 });
  const parts = useMemo(() => Array.from({ length: POOL }, () => ({ alive: false, age: 0, life: 0.5, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, g: 0, sc: 0.1, grow: 0, spin: 0, speedLine: false, c: '#FBBF24' })), []);
  const rings = useMemo(() => Array.from({ length: RINGS }, () => ({ alive: false, age: 0, life: 0.36, x: 0, y: -99, z: 0, sc: 1.8, c: '#FBBF24' })), []);

  useEffect(() => bindArcadeUnlock(), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const st = useGameStore.getState();
    const cur = cursors.current;
    const p = motionBus.pos || { x: 0, y: 0, z: 0 };

    if (st.collectedIds.length > cur.collected) {
      cur.collected = st.collectedIds.length;
      emitCartoonVfx({ kind: 'coin', position: [p.x, p.y + 0.7, p.z], count: 12 });
    }
    if (st.combo > cur.combo) { sfxComboChime(); motionBus.comboBounceAt = performance.now(); }
    cur.combo = st.combo;

    if (motionBus.landAt > cur.lastLand) {
      cur.lastLand = motionBus.landAt;
      emitCartoonVfx({ kind: 'dust', position: [p.x, p.y - 0.5, p.z], count: 10, audio: false });
    }
    if (st.shakeAt > cur.lastShake) {
      cur.lastShake = st.shakeAt;
      emitCartoonVfx({ kind: 'crash', position: [p.x, p.y + 0.8, p.z], count: 16 });
    }

    const v = motionBus.vel || { x: 0, y: 0, z: 0 };
    const spd = Math.hypot(v.x, v.z);
    if (st.hasStarted && st.gameState === 'playing' && (motionBus.isBoosting || spd > 15)) {
      emitCartoonVfx({ kind: 'speed', position: [p.x + (Math.random() - 0.5) * 6, p.y + Math.random() * 2.4, p.z - 6], velocity: [0, 0, Math.max(24, spd * 1.4)], count: 2, audio: false });
    }

    while (QUEUE.length) {
      const req = QUEUE.shift();
      const cfg = FX_PRESETS[req.kind] || FX_PRESETS.dust;
      if (cfg.ring) {
        const rg = rings[cur.r % RINGS]; cur.r += 1;
        rg.alive = true; rg.age = 0; rg.x = req.position[0]; rg.y = req.position[1]; rg.z = req.position[2];
        rg.c = cfg.colors[0]; rg.sc = req.kind === 'crash' ? 2.8 : 1.7;
      }
      for (let i = 0; i < req.count; i += 1) {
        const pt = parts[cur.p % POOL]; cur.p += 1;
        pt.alive = true; pt.age = 0; pt.life = cfg.life * (0.75 + Math.random() * 0.45);
        pt.x = req.position[0] + (Math.random() - 0.5) * 0.4;
        pt.y = req.position[1] + Math.random() * 0.25;
        pt.z = req.position[2] + (Math.random() - 0.5) * 0.4;
        pt.vx = (req.velocity?.[0] || 0) + (Math.random() - 0.5) * cfg.spd;
        pt.vy = (req.velocity?.[1] || 0) + (req.kind === 'speed' ? 0 : (0.3 + Math.random() * 0.8) * cfg.spd * 0.6);
        pt.vz = (req.velocity?.[2] || 0) + (Math.random() - 0.5) * cfg.spd;
        pt.g = cfg.g; pt.sc = cfg.sc; pt.grow = cfg.grow; pt.spin = (Math.random() - 0.5) * 9;
        pt.speedLine = req.kind === 'speed'; pt.c = cfg.colors[i % cfg.colors.length];
      }
    }

    const im = starRef.current;
    if (im) {
      for (let i = 0; i < POOL; i += 1) {
        const pt = parts[i];
        if (!pt.alive) { DUMMY.position.set(0, -500, 0); DUMMY.scale.setScalar(0.0001); DUMMY.updateMatrix(); im.setMatrixAt(i, DUMMY.matrix); continue; }
        pt.age += dt;
        if (pt.age >= pt.life) { pt.alive = false; continue; }
        pt.vy -= pt.g * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
        const k = pt.age / pt.life;
        const s = Math.max(0.01, pt.sc * (1 + pt.grow * k) * (1 - k * 0.35));
        DUMMY.position.set(pt.x, pt.y, pt.z);
        DUMMY.rotation.set(pt.speedLine ? 0 : pt.age * pt.spin, pt.age * 4, 0);
        DUMMY.scale.set(s, s, pt.speedLine ? s * 22 : s);
        DUMMY.updateMatrix(); im.setMatrixAt(i, DUMMY.matrix); im.setColorAt(i, COL.set(pt.c));
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < RINGS; i += 1) {
      const m = ringRefs.current[i]; const rg = rings[i];
      if (!m || !rg) continue;
      if (!rg.alive) { m.visible = false; continue; }
      rg.age += dt;
      if (rg.age >= rg.life) { rg.alive = false; m.visible = false; continue; }
      const k = rg.age / rg.life;
      m.visible = true; m.position.set(rg.x, rg.y, rg.z);
      m.scale.setScalar(0.35 + k * rg.sc);
      if (m.material) { m.material.color.set(rg.c); m.material.opacity = 0.85 * (1 - k); }
    }
  });

  return (
    <group>
      <instancedMesh ref={starRef} args={[null, null, POOL]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {rings.map((_, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.85, 20]} />
          <meshBasicMaterial color="#FBBF24" transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
