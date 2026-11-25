import { spawnFloatingNumber } from '../sdk/gameFeel';
import { playArcadeSfx } from './ArcadeSoundEngine';
import { emitArcadeVfx } from './ArcadeVFXSystem';
import { HIGHWAY_LANES, LANES, POW_KINDS, createDirectorState, fireAutoAimShot, spawnEnemyForMode } from './DirectorSetup';
import { onCollectiblePicked, onEnemyKilled, stepGoalProgress } from './GoalEngine';
import { stepModeEnemies, stepModeObstacles } from './ModePhysics';
import { addWantedHeat, stepOpenWorldMissions } from './OpenWorldMissions';
import { findNearestVehicle, stepRoamingVehicles } from './SandboxVehicleSystem';

export { createDirectorState, fireAutoAimShot };

export function spawnBurst(st, x, y, z, kind = 'spark', count = 8) {
  emitArcadeVfx(kind, x, y, z, count);
}

function hurtPlayer(st, now, dmg, cb) {
  if (now < (st.invulnUntil || 0) || now - st.lastHurt < 800) return;
  st.lastHurt = now;
  if (st.activePow === 'shield') {
    st.activePow = null; st.powUntil = 0; spawnBurst(st, st.px, st.py + 0.6, st.pz); playArcadeSfx('powerup'); return;
  }
  st.hp = Math.max(0, st.hp - dmg); st.combo = 1; st.shake = 0.55;
  spawnBurst(st, st.px, st.py + 0.5, st.pz); playArcadeSfx('hit'); cb.onEvent?.('hurt', st);
  if (st.hp <= 0) cb.onLose?.(st);
}

function recycleCoin(st, c, i) {
  if (st.isArena || st.isSandbox) {
    const ang = ((i + (st.seq += 1)) * 0.85) % (Math.PI * 2);
    const rad = st.isSandbox ? 18 + ((i * 9) % 52) : 8 + ((i * 5) % 26);
    c.x = Math.cos(ang) * rad; c.z = Math.sin(ang) * rad; c.y = 1.0;
  } else {
    const lanes = st.isPursuit ? HIGHWAY_LANES : LANES;
    c.z = st.pz - 135;
    c.x = st.isSky ? Math.sin(i + st.seq) * 12 : lanes[(st.seq += 1) % lanes.length];
    c.y = st.isSky ? 4.0 + ((i + st.seq) % 4) * 2.5 : 1.0;
  }
  c.alive = true;
}

export function stepDirector(st, prevPx, prevPz, dt, now, cb) {
  if (st.activePow && now > st.powUntil) st.activePow = null;
  const distDelta = (st.isArena || st.isSandbox) ? Math.hypot(st.px - prevPx, st.pz - prevPz) : Math.max(0, prevPz - st.pz);
  if (!st.isSandbox) stepGoalProgress(st, distDelta, cb);

  if (st.isSandbox) {
    st.nearVehicle = st.inVehicleIdx < 0 && findNearestVehicle(st) >= 0;
    stepRoamingVehicles(st, dt);
    stepOpenWorldMissions(st, dt, now, cb, spawnBurst);
  }

  if (st.boss.alive) {
    if (st.boss.flash > 0) st.boss.flash = Math.max(0, st.boss.flash - dt);
    st.boss.x += st.boss.vx * dt;
    if (st.isSandbox) { if (Math.abs(st.boss.x) > 78) st.boss.vx = -st.boss.vx; }
    else if (st.boss.x > 8.0 || st.boss.x < -8.0) st.boss.vx = -st.boss.vx;
    if (!st.isArena && !st.isSandbox) st.boss.z = st.pz - 24;
    if (now > st.boss.fireAt) {
      st.boss.fireAt = now + 1350;
      for (let i = 0; i < st.enemyShots.length; i += 1) {
        const es = st.enemyShots[i]; if (es.alive) continue;
        const dx = st.px - st.boss.x; const dy = st.py - st.boss.y; const dz = st.pz - st.boss.z;
        const inv = 22 / Math.max(0.1, Math.hypot(dx, dy, dz));
        es.alive = true; es.x = st.boss.x; es.y = st.boss.y; es.z = st.boss.z + 1.5;
        es.vx = dx * inv; es.vy = st.isSky ? dy * inv : 0; es.vz = dz * inv; es.life = 2.6; break;
      }
    }
  }

  for (let i = 0; i < st.shots.length; i += 1) {
    const s = st.shots[i]; if (!s.alive) continue;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.life -= dt;
    if (s.life <= 0) { s.alive = false; continue; }
    if (st.boss.alive && Math.abs(s.x - st.boss.x) < 2.4 && Math.abs(s.z - st.boss.z) < 2.4 && (!st.isSky || Math.abs(s.y - st.boss.y) < 2.4)) {
      s.alive = false; st.shotsHit += 1; st.boss.hp -= 20; st.boss.flash = 0.09;
      st.boss.x += (s.vx / 62) * 0.5;
      spawnFloatingNumber([st.boss.x, st.boss.y + 2.4, st.boss.z], '-20', 'crit');
      spawnBurst(st, st.boss.x, st.boss.y, st.boss.z, 'spark', 12);
      if (st.boss.hp <= 0) { st.boss.alive = false; st.score += 500; if (!st.isSandbox) { playArcadeSfx('victory'); cb.onWin?.(st); } }
      continue;
    }
    for (let j = 0; j < st.enemies.length; j += 1) {
      const e = st.enemies[j];
      if (!e.alive || Math.abs(s.x - e.x) > 1.7 || Math.abs(s.z - e.z) > 1.8 || (st.isSky && Math.abs(s.y - e.y) > 1.8)) continue;
      s.alive = false; st.shotsHit += 1; e.hp -= 20; e.flash = 0.09;
      e.x += (s.vx / 62) * 1.4; e.z += (s.vz / 62) * 1.4;
      spawnFloatingNumber([e.x, e.y + 1.4, e.z], e.hp <= 0 ? '-20 KO' : '-20', e.hp <= 0 ? 'crit' : 'damage');
      spawnBurst(st, e.x, e.y, e.z, 'spark', 12);
      if (e.hp <= 0) {
        if (st.isSandbox) { addWantedHeat(st, 0.75, now); st.kills += 1; st.score += 100; playArcadeSfx('explosion'); spawnEnemyForMode(st, e, j); }
        else { onEnemyKilled(st, spawnEnemyForMode); cb.onEvent?.('kill', st); if (st.goalType === 'survive_waves' && st.waveKills >= st.waveTarget) e.alive = false; else spawnEnemyForMode(st, e, j); }
      }
      break;
    }
  }

  for (let i = 0; i < st.enemyShots.length; i += 1) {
    const es = st.enemyShots[i]; if (!es.alive) continue;
    es.x += es.vx * dt; es.y += es.vy * dt; es.z += es.vz * dt; es.life -= dt;
    if (es.life <= 0) es.alive = false;
    if (es.alive && Math.abs(es.x - st.px) < 1.1 && Math.abs(es.z - st.pz) < 1.2 && Math.abs(es.y - st.py) < 1.4) {
      es.alive = false; hurtPlayer(st, now, 15, cb);
    }
  }

  stepModeEnemies(st, dt, now, hurtPlayer, spawnBurst, cb);
  stepModeObstacles(st, prevPx, prevPz, now, spawnBurst, hurtPlayer, cb);

  for (let i = 0; i < st.coins.length; i += 1) {
    const c = st.coins[i];
    if (!st.isArena && !st.isSandbox && c.z > st.pz + 25) recycleCoin(st, c, i);
    if (c.alive && st.activePow === 'magnet' && Math.hypot(st.px - c.x, st.pz - c.z) < 9.5) {
      c.x += (st.px - c.x) * Math.min(1, dt * 8); c.y += (st.py - c.y) * Math.min(1, dt * 8); c.z += (st.pz - c.z) * Math.min(1, dt * 8);
    }
    if (c.alive && Math.abs(st.px - c.x) < 1.5 && Math.abs(st.py - c.y) < 2.2 && Math.abs(st.pz - c.z) < 1.5) {
      c.alive = false; st.coinsGot += 1; st.score += 25 * st.combo; st.maxCombo = Math.max(st.maxCombo || 1, st.combo);
      spawnFloatingNumber([c.x, c.y + 1.0, c.z], `+${25 * st.combo}`, 'score');
      playArcadeSfx('coin', st.combo); spawnBurst(st, c.x, c.y, c.z, 'coin', 8);
      cb.onEvent?.('coin', st); onCollectiblePicked(st);
      if ((st.isArena || st.isSandbox) && st.goalType === 'collect_and_escape') recycleCoin(st, c, i);
    }
  }

  for (let i = 0; i < st.powerups.length; i += 1) {
    const pw = st.powerups[i];
    if (!st.isArena && !st.isSandbox && pw.z > st.pz + 25) {
      pw.z = st.pz - 130 - i * 40; pw.x = LANES[(st.seq += 1) % 3]; pw.y = st.isSky ? 5.5 : 1.3; pw.alive = true; pw.kind = POW_KINDS[st.seq % POW_KINDS.length];
    }
    if (pw.alive && Math.abs(st.px - pw.x) < 1.6 && Math.abs(st.pz - pw.z) < 1.6 && Math.abs(st.py - pw.y) < 2.0) {
      pw.alive = false; st.activePow = pw.kind; st.powUntil = now + 8000; playArcadeSfx('powerup'); spawnBurst(st, pw.x, pw.y, pw.z);
    }
  }
}
