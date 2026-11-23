import { playArcadeSfx } from './ArcadeSoundEngine';

export const LANES = [-3.2, 0, 3.2];
export const POW_KINDS = ['shield', 'triple_shot', 'magnet', 'jetpack_boost'];

export function createDirectorState(world) {
  const arch = world?.mode || world?.archetype || 'endless_runner';
  const mech = world?.mechanics || {};
  const obstacleType = world?.obstacleType || 'subway_train';
  const isTrain = obstacleType === 'subway_train';
  const isRunner = arch === 'endless_runner' || world?.worldLayout === 'three_lane_track';
  const isArena = arch === 'arena_action' || arch === 'arena_survivor' || world?.playerRig === 'third_person_action';
  const targetKills = arch === 'sky_shooter' || isArena ? 15 : 0;
  const targetCoins = targetKills ? 0 : 30;
  const bossImmediate = Boolean(world?.bossConfig);

  return {
    arch, isRunner, isArena, obstacleType, isTrain,
    canShoot: world?.canShoot ?? (mech.canShoot !== false), enemiesShoot: Boolean(world?.enemiesShoot || arch === 'sky_shooter'),
    doubleJump: mech.doubleJump !== false, baseSpeed: Number(world?.speed || mech.baseSpeed || 12), jumpPower: Number(world?.jumpPower || 13.0),
    spawnRate: Number(world?.spawnRate || 1.0), targetKills, targetCoins,
    objective: world?.objectiveText || (targetKills ? `Defeat ${targetKills} Enemies` : `Collect ${targetCoins} Coins`),
    kills: 0, coinsGot: 0, score: 0, combo: 1, hp: 100, shake: 0, timer: Number(world?.rules?.timeLimit || 90),
    px: 0, py: 1.0, pz: 0, groundY: 1.0, vy: 0, jumpsLeft: 2, lane: 0, prevLane: 0,
    lastFire: 0, lastHurt: 0, hitStopUntil: 0, invulnUntil: 0, chaserBoostUntil: 0, seq: 0, activePow: null, powUntil: 0,
    boss: { alive: bossImmediate, spawned: bossImmediate, x: 0, y: 1.8, z: -26, hp: Number(world?.bossConfig?.hp || 180), maxHp: Number(world?.bossConfig?.hp || 180), flash: 0, vx: 3.2, fireAt: 0 },
    enemies: Array.from({ length: 8 }, (_, i) => ({ alive: true, x: LANES[i % 3], y: arch === 'sky_shooter' ? 2.5 + (i % 3) * 1.5 : 1.0, z: -28 - i * 18, hp: 40, maxHp: 40, flash: 0, vx: (i % 2 === 0 ? 1 : -1) * 2.2, vz: 4.5, fireAt: 1500 + i * 350 })),
    obstacles: Array.from({ length: 10 }, (_, i) => {
      const idx = Math.floor(i / 2);
      const isRamp = isTrain && i % 2 === 1;
      const baseZ = -34 - idx * (isTrain ? 26 : 16);
      const laneX = LANES[(idx + 1) % 3];
      return { alive: true, isRamp, x: laneX, y: 0.0, z: isRamp ? baseZ + 8.3 : baseZ, halfX: 1.15, halfZ: isRamp ? 2.8 : (isTrain ? 5.4 : 1.1), height: isTrain ? 2.65 : 1.4 };
    }),
    coins: Array.from({ length: 18 }, (_, i) => ({ alive: true, x: LANES[(i + 2) % 3], y: 1.0, z: -16 - i * 7 })),
    powerups: Array.from({ length: 3 }, (_, i) => ({ alive: true, x: LANES[i % 3], y: 1.3, z: -42 - i * 48, kind: POW_KINDS[i % POW_KINDS.length] })),
    shots: Array.from({ length: 18 }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: -55, life: 0 })),
    enemyShots: Array.from({ length: 10 }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 20, life: 0 })),
    bursts: Array.from({ length: 24 }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })),
  };
}

export function fireAutoAimShot(st, now) {
  if (!st.canShoot || now - st.lastFire < 185) return false;
  st.lastFire = now;
  const spread = st.activePow === 'triple_shot' ? [-7.5, 0, 7.5] : [0];
  let best = st.boss.alive ? st.boss : null; let bestD = 42;
  if (!best) for (let i = 0; i < st.enemies.length; i += 1) {
    const e = st.enemies[i]; if (!e.alive || e.z > st.pz + 4) continue;
    const d = Math.hypot(e.x - st.px, e.z - st.pz); if (d < bestD) { bestD = d; best = e; }
  }
  spread.forEach((sxOff) => {
    for (let i = 0; i < st.shots.length; i += 1) {
      const s = st.shots[i]; if (s.alive) continue;
      s.alive = true; s.x = st.px; s.y = st.py + 0.6; s.z = st.pz - 1.1; s.life = 1.2;
      if (best) { const inv = 60 / Math.max(0.1, bestD); s.vx = (best.x - st.px) * inv + sxOff; s.vy = (best.y - st.py) * inv * 0.5; s.vz = (best.z - st.pz) * inv; }
      else { s.vx = sxOff; s.vy = 0; s.vz = -60; }
      break;
    }
  });
  playArcadeSfx('shoot');
  return true;
}
