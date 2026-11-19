import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from './spawnSdk';

const POOL_SIZE = 24;

function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.45, 'rgba(244,239,232,0.52)');
  g.addColorStop(1, 'rgba(244,239,232,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Alpha-blended billboard smoke/dust plume emitter for vehicles, thrusters, and landing impacts. */
export function SmokeTrail({
  active = false,
  activeRef = null,
  followMotionBus = true,
  origin = [0, 0, 0],
  color = '#DDD6CA',
  baseSize = 0.42,
  maxSize = 1.9,
  life = 0.85,
  emitRate = 24,
}) {
  const spritesRef = useRef([]);
  const poolRef = useRef([]);
  const accRef = useRef(0);
  const lastLandRef = useRef(0);
  const idxRef = useRef(0);
  const texture = useMemo(() => createSmokeTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const pool = poolRef.current;
    if (!pool.length) {
      for (let i = 0; i < POOL_SIZE; i += 1) {
        pool.push({ age: life + 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: baseSize });
      }
    }

    const spawnPuff = (px, py, pz, vx, vy, vz, s0 = baseSize) => {
      const p = pool[idxRef.current % POOL_SIZE];
      idxRef.current += 1;
      p.age = 0;
      p.x = px + (Math.random() - 0.5) * 0.42;
      p.y = py + Math.random() * 0.14;
      p.z = pz + (Math.random() - 0.5) * 0.42;
      p.vx = vx; p.vy = vy; p.vz = vz; p.s0 = s0;
    };

    const src = followMotionBus ? motionBus.pos : { x: origin[0], y: origin[1], z: origin[2] };
    const vel = followMotionBus ? motionBus.vel : { x: 0, y: 0, z: 0 };
    const speed = Math.hypot(vel.x, vel.z);

    if (followMotionBus && motionBus.landAt > lastLandRef.current) {
      lastLandRef.current = motionBus.landAt;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        spawnPuff(src.x, src.y - 0.55, src.z, Math.cos(a) * 1.4, 0.75, Math.sin(a) * 1.4, baseSize * 1.15);
      }
    }

    const emitting = active || Boolean(activeRef?.current) || (followMotionBus && ((motionBus.isGrounded && speed > 4.2) || motionBus.isBoosting));
    if (emitting) {
      accRef.current += dt * (motionBus.isBoosting ? emitRate * 1.4 : emitRate);
      while (accRef.current >= 1) {
        accRef.current -= 1;
        spawnPuff(src.x, src.y - 0.52, src.z, -vel.x * 0.08 + (Math.random() - 0.5) * 0.6, 0.55 + Math.random() * 0.45, -vel.z * 0.08 + (Math.random() - 0.5) * 0.6);
      }
    }

    for (let i = 0; i < POOL_SIZE; i += 1) {
      const sp = spritesRef.current[i];
      const p = pool[i];
      if (!sp || !p) continue;
      p.age += dt;
      if (p.age >= life) {
        sp.visible = false;
        continue;
      }
      const t = p.age / life;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vx *= 1 - dt * 1.6;
      p.vz *= 1 - dt * 1.6;
      sp.visible = true;
      sp.position.set(p.x, p.y, p.z);
      sp.scale.setScalar(THREE.MathUtils.lerp(p.s0, maxSize, Math.pow(t, 0.7)));
      sp.material.opacity = (1 - t) * (1 - t) * 0.44;
    }
  });

  return (
    <group>
      {Array.from({ length: POOL_SIZE }).map((_, i) => (
        <sprite key={i} ref={(el) => { spritesRef.current[i] = el; }} visible={false}>
          <spriteMaterial map={texture} color={color} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}
