import { playArcadeSfx } from './ArcadeSoundEngine';
import { initGoalState } from './GoalEngine';
import { buildOpenWorldData } from './OpenWorldBuilder';
import { createNextMission } from './OpenWorldMissions';
import { buildOpenWorldVehicles } from './SandboxVehicleSystem';
import { HIGHWAY_LANES, RUNNER_LANES as LANES, buildGenreCoins, buildGenreObstacles, buildGenreWorldConfig, resolveGenreProfile } from './WorldGenreDirector';

export { HIGHWAY_LANES, LANES };
export const POW_KINDS = ['shield', 'triple_shot', 'magnet', 'jetpack_boost'];

export function normalizeMode(raw, world) {
  return resolveGenreProfile(raw, world).mode;
}

export function spawnEnemyForMode(st, e, i) {
  e.alive = true; e.hp = e.maxHp;
  if (st.mode === 'open_world_sandbox') {
    const spots = [[-60, -20], [60, -20], [-20, 60], [20, -60], [60, 60], [-60, 60]];
    const [sx, sz] = spots[(i + (st.seq += 1)) % spots.length];
    e.x = sx + ((i % 3) - 1) * 3; e.z = sz + ((i % 2) - 0.5) * 4; e.y = 1.0; e.vx = 0; e.vz = 0; return;
  }
  if (st.mode === 'arena_action') {
    const edge = (i + st.seq) % 4; const span = ((i * 19 + st.seq * 11) % 64) - 32;
    e.x = edge === 0 ? -36 : edge === 1 ? 36 : span; e.z = edge === 2 ? -36 : edge === 3 ? 36 : span;
    e.y = 1.0; e.vx = 0; e.vz = 0; return;
  }
  if (st.mode === 'sky_shooter') {
    e.x = ((i % 5) - 2) * 5.2; e.y = 3.2 + (i % 4) * 2.6; e.z = st.pz - 65 - Math.floor(i / 5) * 22 - (i % 3) * 6;
    e.vx = (i % 2 === 0 ? 1 : -1) * 3.0; e.vz = 8.5; return;
  }
  if (st.mode === 'vehicle_pursuit') {
    e.x = HIGHWAY_LANES[(i + st.seq) % HIGHWAY_LANES.length]; e.y = 1.0; e.z = st.pz - 36 - i * 24;
    e.vx = (i % 2 === 0 ? 1 : -1) * 0.8; e.vz = -(st.baseSpeed * 0.55); return;
  }
  e.x = LANES[(st.seq += 1) % 3]; e.y = 1.0; e.z = st.pz - 125 - (i % 4) * 14;
  e.vx = (i % 2 === 0 ? 1 : -1) * 2.2; e.vz = 4.5;
}

export function createDirectorState(world) {
  const gCfg = buildGenreWorldConfig(world);
  const mode = gCfg.mode;
  const mech = world?.mechanics || {};
  const obstacleType = gCfg.obstacleType;
  const isTrain = mode === 'endless_runner' && obstacleType === 'subway_train';
  const goal = initGoalState(world, mode);
  const canShoot = world?.canShoot ?? (gCfg.canShoot || mech.canShoot === true);
  const diff = Math.max(1, Number(world?.difficultyScale || 1));
  const baseSpeed = Number(world?.speed || mech.baseSpeed || gCfg.baseSpeed) * (1 + (diff - 1) * 0.5);
  const bossImm = Boolean(world?.bossConfig && goal.goalType !== 'survive_waves' && goal.goalType !== 'eliminate_targets' && mode !== 'open_world_sandbox');
  const ow = mode === 'open_world_sandbox' ? buildOpenWorldData() : { buildings: [], props: [], beacons: [] };

  const st = {
    mode, arch: mode, isRunner: mode === 'endless_runner', isArena: mode === 'arena_action',
    isSky: mode === 'sky_shooter', isPursuit: mode === 'vehicle_pursuit', isSandbox: mode === 'open_world_sandbox',
    obstacleType, isTrain, canShoot, enemiesShoot: gCfg.enemiesShoot,
    doubleJump: mech.doubleJump !== false, baseSpeed, curSpeed: baseSpeed, jumpPower: Number(world?.jumpPower || 13.0),
    spawnRate: Number(world?.spawnRate || 1.0) * diff, ...goal,
    kills: 0, coinsGot: 0, score: 0, combo: 1, maxCombo: 1, shotsFired: 0, shotsHit: 0, hp: 100, shake: 0, timer: Number(world?.rules?.timeLimit || gCfg.timeLimit),
    px: 0, py: mode === 'sky_shooter' ? 6.0 : 1.0, pz: 0, groundY: mode === 'sky_shooter' ? -99 : 1.0,
    vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, steerVel: 0, jumpsLeft: 2, lane: 0, prevLane: 0,
    lastFire: 0, lastHurt: 0, hitStopUntil: 0, invulnUntil: 0, barrelRollUntil: 0, chaserBoostUntil: 0, seq: 0, activePow: null, powUntil: 0,
    buildings: ow.buildings, props: ow.props, beacons: ow.beacons, vehicles: mode === 'open_world_sandbox' ? buildOpenWorldVehicles() : [],
    inVehicleIdx: -1, nearVehicle: false, heat: 0, wantedStars: 0, lastCrimeAt: 0, missionsDone: 0, targetMissions: Number(world?.targetCount || 4),
    boss: { alive: bossImm, spawned: bossImm, x: 0, y: mode === 'sky_shooter' ? 6.5 : 1.8, z: -28, hp: Number(world?.bossConfig?.hp || 180), maxHp: Number(world?.bossConfig?.hp || 180), flash: 0, vx: 3.5, fireAt: 0 },
    enemies: Array.from({ length: mode === 'arena_action' || mode === 'open_world_sandbox' ? 10 : 8 }, (_, i) => ({ alive: true, x: 0, y: 1.0, z: -30, hp: 40, maxHp: 40, flash: 0, vx: 0, vz: 0, fireAt: 1400 + i * 320 })),
    obstacles: buildGenreObstacles(mode, isTrain), coins: buildGenreCoins(mode),
    powerups: Array.from({ length: 3 }, (_, i) => ({ alive: true, x: mode === 'arena_action' ? (i - 1) * 18 : LANES[i % 3], y: mode === 'sky_shooter' ? 6.0 : 1.3, z: mode === 'arena_action' ? (i % 2 === 0 ? -16 : 16) : -42 - i * 48, kind: POW_KINDS[i % POW_KINDS.length] })),
    shots: Array.from({ length: 24 }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: -55, life: 0 })),
    enemyShots: Array.from({ length: 14 }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 20, life: 0 })),
  };
  st.enemies.forEach((e, i) => spawnEnemyForMode(st, e, i));
  if (st.isSandbox) st.mission = createNextMission(st, 0);
  return st;
}

export function fireAutoAimShot(st, now) {
  if (!st.canShoot || now - st.lastFire < 175) return false;
  st.lastFire = now; st.shotsFired += 1;
  const spread = st.activePow === 'triple_shot' ? [-8.0, 0, 8.0] : [0];
  const is360 = st.isArena || st.isSandbox;
  let best = st.boss.alive ? st.boss : null;
  let bestD = is360 ? 48 : 55;
  if (!best) for (let i = 0; i < st.enemies.length; i += 1) {
    const e = st.enemies[i];
    if (!e.alive || (!is360 && e.z > st.pz + 4)) continue;
    const d = Math.hypot(e.x - st.px, e.y - st.py, e.z - st.pz);
    if (d < bestD) { bestD = d; best = e; }
  }
  const fx = is360 ? -Math.sin(st.yaw) : 0; const fz = is360 ? -Math.cos(st.yaw) : -1;
  spread.forEach((sxOff) => {
    for (let i = 0; i < st.shots.length; i += 1) {
      const s = st.shots[i]; if (s.alive) continue;
      s.alive = true; s.x = st.px + fx * 0.9; s.y = st.py + 0.4; s.z = st.pz + fz * 0.9; s.life = 1.25;
      if (best) {
        const inv = 62 / Math.max(0.1, bestD);
        s.vx = (best.x - st.px) * inv + sxOff; s.vy = st.isSky ? (best.y - st.py) * inv : (best.y - st.py) * inv * 0.4; s.vz = (best.z - st.pz) * inv;
      } else { s.vx = fx * 62 + sxOff; s.vy = 0; s.vz = fz * 62; }
      break;
    }
  });
  playArcadeSfx('shoot');
  return true;
}
