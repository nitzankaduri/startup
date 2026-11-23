import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { emitJuice } from '../assets/JuiceFX';
import { motionBus, triggerCameraShake } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';

const POOL_SIZE = 12;
const CHUNK_STEP = 14;
const LANES = [-3.2, 0, 3.2];

function makeInitialChunks() {
  return Array.from({ length: POOL_SIZE }, (_, i) => ({
    z: -24 - i * CHUNK_STEP,
    lane: LANES[i % 3],
    coinLane: LANES[(i + 1) % 3],
    obsKind: i % 4 === 2 ? 'ramp' : (i % 3 === 0 ? 'barrier' : 'crate'),
    obsAlive: true,
    coinsAlive: [true, true, true],
    speed: i % 5 === 0 ? 6.5 : 0,
  }));
}

/** Object-pooled endless 3-lane streaming spawner (140u ahead -> recycle 25u behind). */
export function EndlessChunkManager({ themeColor = '#D96B27', coinColor = '#FBBF24', propColor = '#10B981', shotsRef, onCollect, onHitPlayer, onDestroyObstacle }) {
  const chunksRef = useRef(null);
  if (!chunksRef.current) chunksRef.current = makeInitialChunks();
  const groupRefs = useRef([]);
  const obsRefs = useRef([]);
  const coinRefs = useRef([]);
  const furthestZRef = useRef(-24 - (POOL_SIZE - 1) * CHUNK_STEP);
  const seqRef = useRef(POOL_SIZE);
  const lastHurtRef = useRef(0);

  const gameState = useGameStore((s) => s.gameState);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const matColors = useMemo(() => ({ obs: themeColor, coin: coinColor, prop: propColor }), [themeColor, coinColor, propColor]);

  useFrame(({ clock }, rawDelta) => {
    if (!hasStarted || gameState !== 'playing') return;
    const dt = Math.min(0.05, rawDelta);
    const p = motionBus.pos;
    if (!p) return;
    const now = performance.now();
    const spinY = clock.elapsedTime * 3.0;
    const chunks = chunksRef.current;

    for (let i = 0; i < POOL_SIZE; i += 1) {
      const c = chunks[i];
      if (c.speed > 0 && c.obsAlive) c.z += c.speed * dt * 0.35;

      // Recycle chunk once 25 units behind player -> place 140+ units ahead
      if (c.z > p.z + 25) {
        seqRef.current += 1;
        const n = seqRef.current;
        const nextZ = Math.min(furthestZRef.current - CHUNK_STEP, p.z - 140);
        furthestZRef.current = nextZ;
        c.z = nextZ;
        c.lane = LANES[(n * 7) % 3];
        c.coinLane = LANES[(n * 7 + 1) % 3];
        c.obsKind = n % 4 === 2 ? 'ramp' : (n % 3 === 0 ? 'barrier' : 'crate');
        c.obsAlive = true;
        c.coinsAlive[0] = true; c.coinsAlive[1] = true; c.coinsAlive[2] = true;
        c.speed = n % 5 === 0 ? Math.min(14, 6 + n * 0.15) : 0;
      }

      const grp = groupRefs.current[i];
      if (grp) {
        grp.position.z = c.z;
        grp.visible = Math.abs(c.z - p.z) <= 148;
      }

      const obs = obsRefs.current[i];
      if (obs) {
        obs.position.x = c.lane;
        obs.visible = c.obsAlive;
      }

      // Analytical coin pickups
      for (let j = 0; j < 3; j += 1) {
        const cm = coinRefs.current[i * 3 + j];
        if (!cm) continue;
        cm.position.x = c.coinLane;
        cm.rotation.y = spinY + j * 0.4;
        cm.visible = c.coinsAlive[j];
        if (c.coinsAlive[j]) {
          const cz = c.z + (j - 1) * 2.4;
          const cy = c.obsKind === 'ramp' && j === 1 ? 2.4 : 1.0;
          if (Math.abs(p.x - c.coinLane) < 1.35 && Math.abs(p.y + 0.5 - cy) < 1.6 && Math.abs(p.z - cz) < 1.35) {
            c.coinsAlive[j] = false;
            cm.visible = false;
            emitJuice({ kind: 'coin', position: [c.coinLane, cy, cz], count: 8 });
            onCollect?.(25);
          }
        }
      }

      // Analytical obstacle collision & projectile destruction
      if (c.obsAlive) {
        if (shotsRef?.current?.length) {
          for (let sIdx = 0; sIdx < shotsRef.current.length; sIdx += 1) {
            const sh = shotsRef.current[sIdx];
            if (sh.life > 0 && Math.abs(sh.pos[0] - c.lane) < 1.6 && Math.abs(sh.pos[2] - c.z) < 1.8) {
              c.obsAlive = false;
              sh.life = 0;
              emitJuice({ kind: 'explosion', position: [c.lane, 1.0, c.z], count: 14 });
              onDestroyObstacle?.(50);
              break;
            }
          }
        }
        if (c.obsAlive && Math.abs(p.x - c.lane) < 1.2 && Math.abs(p.z - c.z) < 1.15 && p.y < 1.4 && now - lastHurtRef.current > 900) {
          lastHurtRef.current = now;
          c.obsAlive = false;
          triggerCameraShake(0.45);
          emitJuice({ kind: 'spark', position: [c.lane, 1.0, c.z], count: 10 });
          onHitPlayer?.(20, [c.lane, 1.0, c.z]);
        }
      }
    }
  });

  return (
    <group>
      {chunksRef.current.map((c, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el; }} position={[0, 0, c.z]}>
          <mesh ref={(el) => { obsRefs.current[i] = el; }} position={[c.lane, 0.75, 0]}>
            <boxGeometry args={[2.1, 1.4, 1.1]} />
            <meshToonMaterial color={matColors.obs} />
          </mesh>
          <mesh position={[-11.5, 3.2, 0]}><boxGeometry args={[3.6, 6.4, 3.6]} /><meshToonMaterial color={matColors.prop} /></mesh>
          <mesh position={[11.5, 3.2, 0]}><boxGeometry args={[3.6, 6.4, 3.6]} /><meshToonMaterial color={matColors.prop} /></mesh>
          {[0, 1, 2].map((j) => (
            <mesh key={j} ref={(el) => { coinRefs.current[i * 3 + j] = el; }} position={[c.coinLane, j === 1 && c.obsKind === 'ramp' ? 2.4 : 1.0, (j - 1) * 2.4]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.14, 12]} />
              <meshToonMaterial color={matColors.coin} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
