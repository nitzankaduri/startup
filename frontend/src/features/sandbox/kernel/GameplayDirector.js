import { playArcadeSfx } from './ArcadeSoundEngine';
import { emitArcadeVfx } from './ArcadeVFXSystem';
import { LANES, POW_KINDS, createDirectorState, fireAutoAimShot } from './DirectorSetup';
import { resolveSolidObstacles } from './SolidObstaclePhysics';

export { createDirectorState, fireAutoAimShot };

export function spawnBurst(st, x, y, z, kind = 'spark', count = 8) {
  emitArcadeVfx(kind, x, y, z, count);
}

function hurtPlayer(st, now, dmg, cb) {
  if (now < (st.invulnUntil || 0) || now - st.lastHurt < 800) return;
  st.lastHurt = now;
  if (st.activePow === 'shield') { st.activePow = null; st.powUntil = 0; spawnBurst(st, st.px, st.py + 0.6, st.pz); playArcadeSfx('powerup'); return; }
  st.hp = Math.max(0, st.hp - dmg); st.combo = 1; st.shake = 0.55;
  spawnBurst(st, st.px, st.py + 0.5, st.pz); playArcadeSfx('hit'); cb.onEvent?.('hurt', st);
  if (st.hp <= 0) cb.onLose?.(st);
}

export function stepDirector(st, prevPx, prevPz, dt, now, cb) {
  if (st.activePow && now > st.powUntil) st.activePow = null;
  const prog = st.targetKills ? st.kills / st.targetKills : st.coinsGot / Math.max(1, st.targetCoins);
  if (!st.boss.spawned && prog >= 0.8) { st.boss.spawned = true; st.boss.alive = true; st.boss.z = st.pz - 24; playArcadeSfx('boss_warning'); }

  if (st.boss.alive) {
    if (st.boss.flash > 0) st.boss.flash = Math.max(0, st.boss.flash - dt);
    st.boss.x += st.boss.vx * dt; if (st.boss.x > 4.2 || st.boss.x < -4.2) st.boss.vx = -st.boss.vx;
    st.boss.z = st.pz - 22;
    if (now > st.boss.fireAt) {
      st.boss.fireAt = now + 1350;
      for (let i = 0; i < st.enemyShots.length; i += 1) {
        const es = st.enemyShots[i]; if (es.alive) continue;
        es.alive = true; es.x = st.boss.x; es.y = 1.2; es.z = st.boss.z + 1.5; es.vx = (st.px - st.boss.x) * 0.55; es.vy = 0; es.vz = 14 - st.baseSpeed; es.life = 2.4; break;
      }
    }
  }

  for (let i = 0; i < st.shots.length; i += 1) {
    const s = st.shots[i]; if (!s.alive) continue;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.life -= dt;
    if (s.life <= 0) { s.alive = false; continue; }
    if (st.boss.alive && Math.abs(s.x - st.boss.x) < 2.2 && Math.abs(s.z - st.boss.z) < 2.2) {
      s.alive = false; st.boss.hp -= 20; st.boss.flash = 0.07; spawnBurst(st, st.boss.x, st.boss.y, st.boss.z, 'spark', 10);
      if (st.boss.hp <= 0) { st.boss.alive = false; st.score += 500; playArcadeSfx('victory'); cb.onWin?.(st); }
      continue;
    }
    for (let j = 0; j < st.enemies.length; j += 1) {
      const e = st.enemies[j]; if (!e.alive || Math.abs(s.x - e.x) > 1.5 || Math.abs(s.z - e.z) > 1.7) continue;
      s.alive = false; e.hp -= 20; e.flash = 0.07; spawnBurst(st, e.x, e.y, e.z, 'spark', 8);
      if (e.hp <= 0) {
        st.kills += 1; st.combo = Math.min(8, st.combo + 1); st.score += 50 * st.combo; st.shake = 0.25;
        playArcadeSfx('explosion'); e.z = st.pz - 135 - (j % 4) * 14; e.x = LANES[(st.seq += 1) % 3]; e.hp = e.maxHp;
        cb.onEvent?.('kill', st); if (st.targetKills && st.kills >= st.targetKills && !st.boss.alive) { playArcadeSfx('victory'); cb.onWin?.(st); }
      }
      break;
    }
  }

  for (let i = 0; i < st.enemyShots.length; i += 1) {
    const es = st.enemyShots[i]; if (!es.alive) continue;
    es.x += es.vx * dt; es.z += es.vz * dt; es.life -= dt; if (es.life <= 0) es.alive = false;
    if (es.alive && Math.abs(es.x - st.px) < 1.1 && Math.abs(es.z - st.pz) < 1.2 && st.py < 2.1) { es.alive = false; hurtPlayer(st, now, 15, cb); }
  }

  for (let i = 0; i < st.enemies.length; i += 1) {
    const e = st.enemies[i]; if (!e.alive) continue;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
    e.x += e.vx * dt; e.z += e.vz * dt; if (e.x > 4.5 || e.x < -4.5) e.vx = -e.vx;
    if (st.enemiesShoot && now > e.fireAt && e.z < st.pz - 6 && e.z > st.pz - 42) {
      e.fireAt = now + 2200;
      for (let k = 0; k < st.enemyShots.length; k += 1) { const es = st.enemyShots[k]; if (!es.alive) { es.alive = true; es.x = e.x; es.y = e.y; es.z = e.z + 1; es.vx = 0; es.vy = 0; es.vz = 14 - st.baseSpeed; es.life = 2.0; break; } }
    }
    if (e.z > st.pz + 20) { e.z = st.pz - 130 - (i % 3) * 12; e.x = LANES[(st.seq += 1) % 3]; e.hp = e.maxHp; }
    if (Math.abs(st.px - e.x) < 1.25 && Math.abs(st.pz - e.z) < 1.3 && Math.abs(st.py - e.y) < 1.5) { e.z = st.pz - 120; hurtPlayer(st, now, 15, cb); }
  }

  for (let i = 0; i < st.obstacles.length; i += 1) {
    const o = st.obstacles[i];
    if (o.z > st.pz + 25) {
      o.z -= Math.round(135 / Math.max(0.5, st.spawnRate || 1));
      o.x = o.isRamp && i > 0 ? st.obstacles[i - 1].x : LANES[(st.seq += 1) % 3];
      o.alive = true;
    }
  }
  resolveSolidObstacles(st, prevPx, prevPz, now, spawnBurst, hurtPlayer, cb);

  for (let i = 0; i < st.coins.length; i += 1) {
    const c = st.coins[i];
    if (c.z > st.pz + 25) { c.z = st.pz - 135; c.x = LANES[(st.seq += 1) % 3]; c.alive = true; }
    if (c.alive && st.activePow === 'magnet' && Math.hypot(st.px - c.x, st.pz - c.z) < 9.5) { c.x += (st.px - c.x) * Math.min(1, dt * 8); c.z += (st.pz - c.z) * Math.min(1, dt * 8); }
    if (c.alive && Math.abs(st.px - c.x) < 1.4 && Math.abs(st.py - c.y) < 2.2 && Math.abs(st.pz - c.z) < 1.4) {
      c.alive = false; st.coinsGot += 1; st.score += 25 * st.combo; playArcadeSfx('coin', st.combo); spawnBurst(st, c.x, c.y, c.z, 'coin', 8); cb.onEvent?.('coin', st);
      if (st.targetCoins && st.coinsGot >= st.targetCoins && !st.boss.alive) { playArcadeSfx('victory'); cb.onWin?.(st); }
    }
  }

  for (let i = 0; i < st.powerups.length; i += 1) {
    const pw = st.powerups[i];
    if (pw.z > st.pz + 25) { pw.z = st.pz - 130 - i * 40; pw.x = LANES[(st.seq += 1) % 3]; pw.alive = true; pw.kind = POW_KINDS[(st.seq) % POW_KINDS.length]; }
    if (pw.alive && Math.abs(st.px - pw.x) < 1.5 && Math.abs(st.pz - pw.z) < 1.5) {
      pw.alive = false; st.activePow = pw.kind; st.powUntil = now + 8000; playArcadeSfx('powerup'); spawnBurst(st, pw.x, pw.y, pw.z);
    }
  }

  for (let i = 0; i < st.bursts.length; i += 1) {
    const b = st.bursts[i]; if (!b.alive) continue;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.life -= dt; if (b.life <= 0) b.alive = false;
  }
}
