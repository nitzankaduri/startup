import { playArcadeSfx } from '../kernel/ArcadeSoundEngine';

export function emitParticles(st, x, y, color, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const spd = 70 + Math.random() * 190;
    if (st.particles.length < 140) st.particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 0.45, color, r: 3 + Math.random() * 3 });
  }
}

export function addPopup(st, x, y, text, color = '#D96B27') {
  if (st.popups.length < 24) st.popups.push({ x, y, text, color, life: 0.85 });
}

export function hurtPlayer2d(st, now, dmg, cb) {
  if (now < st.invulnUntil || now - st.lastHurt < 750) return;
  st.lastHurt = now;
  if (st.activePow === 'shield') { st.activePow = null; emitParticles(st, st.px, st.py, '#38BDF8', 12); playArcadeSfx('powerup'); return; }
  st.hp = Math.max(0, st.hp - dmg); st.shake = 10;
  emitParticles(st, st.px, st.py, '#EF4444', 10); playArcadeSfx('hit');
  if (st.hp <= 0) cb.onLose?.();
}

export function spawnEnemy2d(st, e, i) {
  e.alive = true; e.hp = e.maxHp; e.flash = 0;
  if (st.isSide) { e.x = st.camX + st.w + 120 + i * 190; e.y = st.groundY - e.r; e.vx = -125; }
  else if (st.isSpace) { e.x = 120 + ((i * 150) % (st.w - 240)); e.y = 75 + (i % 3) * 52; }
  else {
    const edge = (i + (st.seq += 1)) % 4;
    e.x = edge === 0 ? 40 : edge === 1 ? st.w - 40 : 80 + ((i * 140) % (st.w - 160));
    e.y = edge === 2 ? 40 : edge === 3 ? st.h - 40 : 80 + ((i * 95) % (st.h - 160));
  }
}

export function stepEnemies2d(st, dt, now, cb) {
  let hitWall = false;
  st.enemies.forEach((e, i) => {
    if (!e.alive) return;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
    if (st.isSide) {
      e.x += e.vx * dt;
      if (e.x < st.camX - 100) spawnEnemy2d(st, e, i);
    } else if (st.isSpace) {
      e.x += st.spaceDir * 115 * dt;
      if (e.x > st.w - 40 || e.x < 40) hitWall = true;
    } else {
      const d = Math.hypot(st.px - e.x, st.py - e.y) || 1;
      e.x += ((st.px - e.x) / d) * (105 + st.wave * 18) * dt;
      e.y += ((st.py - e.y) / d) * (105 + st.wave * 18) * dt;
    }
    if (st.enemiesShoot && now > e.fireAt) {
      e.fireAt = now + (st.isSpace ? 1900 : 2300);
      const es = st.eShots.find((it) => !it.alive);
      if (es) {
        const d = Math.hypot(st.px - e.x, st.py - e.y) || 1;
        es.alive = true; es.x = e.x; es.y = e.y; es.life = 2.6;
        es.vx = st.isSpace ? 0 : ((st.px - e.x) / d) * 320;
        es.vy = st.isSpace ? 330 : ((st.py - e.y) / d) * 320;
      }
    }
    if (Math.hypot(st.px - e.x, st.py - e.y) < e.r + 18) {
      if (st.isSide && st.vy > 60 && st.py < e.y - 6) {
        e.hp = 0; st.vy = st.jumpVel * 0.72; st.kills += 1; st.score += 75;
        emitParticles(st, e.x, e.y, '#F59E0B', 10); addPopup(st, e.x, e.y - 16, '+75 STOMP'); spawnEnemy2d(st, e, i);
      } else { hurtPlayer2d(st, now, 15, cb); if (!st.isSpace) spawnEnemy2d(st, e, i); }
    }
  });
  if (hitWall && st.isSpace) { st.spaceDir *= -1; st.enemies.forEach((e) => { if (e.alive) e.y += 26; }); }
}

export function stepProjectiles2d(st, dt, now, cb) {
  st.shots.forEach((s) => {
    if (!s.alive) return;
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) { s.alive = false; return; }
    if (st.boss.alive && Math.hypot(s.x - st.boss.x, s.y - st.boss.y) < st.boss.r + 8) {
      s.alive = false; st.boss.hp -= 20; st.boss.flash = 0.09; emitParticles(st, s.x, s.y, '#D96B27', 8);
      if (st.boss.hp <= 0) { st.boss.alive = false; st.score += 500; playArcadeSfx('victory'); cb.onWin?.(); }
      return;
    }
    for (let i = 0; i < st.enemies.length; i += 1) {
      const e = st.enemies[i];
      if (!e.alive || Math.hypot(s.x - e.x, s.y - e.y) > e.r + 8) continue;
      s.alive = false; e.hp -= 15; e.flash = 0.09; emitParticles(st, e.x, e.y, '#F59E0B', 7);
      if (e.hp <= 0) {
        st.kills += 1; st.waveKills += 1; st.score += 100; addPopup(st, e.x, e.y - 12, '+100');
        if (st.goalType === 'survive_waves' && st.waveKills >= st.waveTarget) {
          st.waveKills = 0;
          if (st.wave < st.waveCount) { st.wave += 1; addPopup(st, st.w * 0.5, 90, `WAVE ${st.wave}!`); spawnEnemy2d(st, e, i); }
          else { st.boss.alive = true; st.enemies.forEach((en) => { en.alive = false; }); addPopup(st, st.w * 0.5, 90, 'BOSS!'); }
        } else if (st.goalType === 'eliminate_targets' && st.kills >= st.targetCount) {
          if (!st.boss.alive && !st.bossSpawned) { st.bossSpawned = true; st.boss.alive = true; addPopup(st, st.w * 0.5, 90, 'BOSS!'); }
          else if (!st.boss.alive) cb.onWin?.();
          e.alive = false;
        } else spawnEnemy2d(st, e, i);
      }
      break;
    }
  });
  if (st.boss.alive) {
    if (st.boss.flash > 0) st.boss.flash = Math.max(0, st.boss.flash - dt);
    st.boss.x += st.boss.vx * dt; if (st.boss.x > st.w - 80 || st.boss.x < 80) st.boss.vx *= -1;
    if (now > st.boss.fireAt) {
      st.boss.fireAt = now + 1300;
      const es = st.eShots.find((it) => !it.alive);
      if (es) { const d = Math.hypot(st.px - st.boss.x, st.py - st.boss.y) || 1; es.alive = true; es.x = st.boss.x; es.y = st.boss.y + 20; es.life = 2.6; es.vx = ((st.px - st.boss.x) / d) * 340; es.vy = ((st.py - st.boss.y) / d) * 340; }
    }
  }
  st.eShots.forEach((es) => {
    if (!es.alive) return;
    es.x += es.vx * dt; es.y += es.vy * dt; es.life -= dt;
    if (es.life <= 0) es.alive = false;
    else if (Math.hypot(es.x - st.px, es.y - st.py) < 20) { es.alive = false; hurtPlayer2d(st, now, 12, cb); }
  });
}

export function stepPickups2d(st, dt, now, cb) {
  st.coins.forEach((c, i) => {
    if (st.isSide && c.x < st.camX - 80) { c.x += st.coins.length * 135; c.alive = true; }
    if (!c.alive) return;
    if (st.activePow === 'magnet' && Math.hypot(st.px - c.x, st.py - c.y) < 210) { c.x += (st.px - c.x) * Math.min(1, dt * 7); c.y += (st.py - c.y) * Math.min(1, dt * 7); }
    if (Math.hypot(st.px - c.x, st.py - c.y) < 30) {
      c.alive = false; st.coinsGot += 1; st.score += 25; playArcadeSfx('coin');
      emitParticles(st, c.x, c.y, '#FBBF24', 6); addPopup(st, c.x, c.y - 10, '+25', '#F59E0B');
      if (!st.isSide) { c.x = 90 + (((i + (st.seq += 1)) * 137) % (st.w - 180)); c.y = 90 + ((i * 89) % (st.h - 180)); c.alive = true; }
      if (st.goalType === 'collect_and_escape' && st.coinsGot >= st.targetCount) cb.onWin?.();
    }
  });
  st.powerups.forEach((pw) => {
    if (st.isSide && pw.x < st.camX - 100) { pw.x += 2400; pw.alive = true; }
    if (pw.alive && Math.hypot(st.px - pw.x, st.py - pw.y) < 32) {
      pw.alive = false; st.activePow = pw.kind; st.powUntil = now + 8000;
      playArcadeSfx('powerup'); emitParticles(st, pw.x, pw.y, '#D96B27', 10); addPopup(st, pw.x, pw.y - 14, pw.kind.toUpperCase());
    }
  });
}
