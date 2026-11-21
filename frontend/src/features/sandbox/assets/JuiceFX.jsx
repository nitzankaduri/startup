import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { bindAudioUnlockOnKeypress, sfxCoinChime, sfxCrashThud, sfxDriftScreech, sfxEngineHum } from './juiceAudio';

const MAX_P = 240;
const DUMMY = new THREE.Object3D();
const COLOR = new THREE.Color();
const QUEUE = [];

const STYLES = {
  spark: { colors: ['#F59E0B', '#FDE68A', '#D96B27'], speed: 9.5, gravity: 18, life: 0.48, scale: 0.11, grow: -0.7 },
  smoke: { colors: ['#E6E2D8', '#D6D0C4', '#94A3B8'], speed: 2.2, gravity: -1.8, life: 0.78, scale: 0.28, grow: 1.9 },
  nitro: { colors: ['#D96B27', '#F59E0B', '#FFF3D6'], speed: 5.5, gravity: -0.8, life: 0.26, scale: 0.2, grow: -0.8 },
  coin: { colors: ['#E5B869', '#FFF3D6', '#F59E0B'], speed: 5.2, gravity: 6.5, life: 0.62, scale: 0.14, grow: -0.4 },
  explosion: { colors: ['#D96B27', '#F59E0B', '#3F3A34'], speed: 12.5, gravity: 9.5, life: 0.72, scale: 0.34, grow: 0.8 },
};

/** Queue instanced GPU particle bursts + spatial audio from anywhere in the sandbox. */
export function emitJuice({ kind = 'spark', position = [0, 0, 0], velocity = [0, 0, 0], count = 14, audio = true }) {
  QUEUE.push({ kind, position, velocity, count });
  if (!audio) return;
  if (kind === 'coin') sfxCoinChime(position);
  else if (kind === 'spark' || kind === 'explosion') sfxCrashThud(kind === 'explosion' ? 18 : 11, position);
  else if (kind === 'smoke') sfxDriftScreech(0.7, position);
}

/** Instanced GPU particle bursts (sparks, drift smoke, nitro flames, coin sparkles, explosions) + spatial SFX. */
export function JuiceFX({ vehicle = false }) {
  const meshRef = useRef(null);
  const cursorRef = useRef(0);
  const trackerRef = useRef({ lastBurstId: null, collected: 0, kills: 0 });
  const pool = useMemo(
    () => Array.from({ length: MAX_P }, () => ({ alive: false, age: 0, life: 0.5, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, g: 0, s: 0.1, grow: 0, color: '#F59E0B' })),
    []
  );

  useEffect(() => bindAudioUnlockOnKeypress(), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const store = useGameStore.getState();
    const tr = trackerRef.current;

    if (store.collectedIds.length > tr.collected) {
      tr.collected = store.collectedIds.length;
      const p = motionBus.pos;
      emitJuice({ kind: 'coin', position: [p.x, p.y + 0.6, p.z], count: 16 });
    }
    if (store.kills > tr.kills) {
      tr.kills = store.kills;
      const p = motionBus.pos;
      emitJuice({ kind: 'explosion', position: [p.x, p.y + 0.9, p.z - 2.5], count: 24 });
    }
    const lastB = store.bursts[store.bursts.length - 1];
    if (lastB && lastB.id !== tr.lastBurstId) {
      tr.lastBurstId = lastB.id;
      emitJuice({ kind: 'spark', position: lastB.position || [motionBus.pos.x, motionBus.pos.y, motionBus.pos.z], count: 16 });
    }

    const v = motionBus.vel || { x: 0, y: 0, z: 0 };
    const spd = Math.hypot(v.x, v.z);
    if (store.hasStarted && store.gameState === 'playing') {
      if (vehicle || motionBus.isBoosting) sfxEngineHum(spd, motionBus.isBoosting);
      const mp = motionBus.pos;
      if (motionBus.isBoosting) {
        emitJuice({ kind: 'nitro', position: [mp.x + Math.sin(motionBus.yaw) * 1.4, mp.y + 0.35, mp.z + Math.cos(motionBus.yaw) * 1.4], velocity: [-v.x * 0.25, 0.5, -v.z * 0.25], count: 2, audio: false });
      }
      if (motionBus.isGrounded && Math.abs(motionBus.steer || 0) > 0.55 && spd > 9) {
        emitJuice({ kind: 'smoke', position: [mp.x, mp.y + 0.15, mp.z], count: 1, audio: true });
      }
    }

    while (QUEUE.length) {
      const req = QUEUE.shift();
      const cfg = STYLES[req.kind] || STYLES.spark;
      for (let i = 0; i < req.count; i += 1) {
        const pt = pool[cursorRef.current % MAX_P];
        cursorRef.current += 1;
        pt.alive = true; pt.age = 0; pt.life = cfg.life * (0.75 + Math.random() * 0.5);
        pt.x = req.position[0] + (Math.random() - 0.5) * 0.35;
        pt.y = req.position[1] + Math.random() * 0.3;
        pt.z = req.position[2] + (Math.random() - 0.5) * 0.35;
        pt.vx = (req.velocity?.[0] || 0) + (Math.random() - 0.5) * cfg.speed;
        pt.vy = (req.velocity?.[1] || 0) + (0.25 + Math.random() * 0.8) * cfg.speed * 0.65;
        pt.vz = (req.velocity?.[2] || 0) + (Math.random() - 0.5) * cfg.speed;
        pt.g = cfg.gravity; pt.s = cfg.scale; pt.grow = cfg.grow;
        pt.color = cfg.colors[i % cfg.colors.length];
      }
    }

    const im = meshRef.current;
    if (!im) return;
    for (let i = 0; i < MAX_P; i += 1) {
      const pt = pool[i];
      if (!pt.alive) {
        DUMMY.position.set(0, -500, 0); DUMMY.scale.setScalar(0.0001); DUMMY.updateMatrix();
        im.setMatrixAt(i, DUMMY.matrix);
        continue;
      }
      pt.age += dt;
      if (pt.age >= pt.life) { pt.alive = false; continue; }
      pt.vy -= pt.g * dt;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
      if (pt.y < 0.05 && pt.vy < 0) { pt.y = 0.05; pt.vy *= -0.35; }
      const prog = pt.age / pt.life;
      const sc = Math.max(0.01, pt.s * (1 + pt.grow * prog) * (1 - prog * 0.35));
      DUMMY.position.set(pt.x, pt.y, pt.z);
      DUMMY.rotation.set(pt.age * 5, pt.age * 3, 0);
      DUMMY.scale.setScalar(sc);
      DUMMY.updateMatrix();
      im.setMatrixAt(i, DUMMY.matrix);
      im.setColorAt(i, COLOR.set(pt.color));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_P]} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.35} metalness={0.25} emissive="#D96B27" emissiveIntensity={0.35} />
    </instancedMesh>
  );
}
