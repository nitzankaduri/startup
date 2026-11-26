import { playArcadeSfx } from '../kernel/ArcadeSoundEngine';
import { emitParticles, hurtPlayer2d, stepEnemies2d, stepPickups2d, stepProjectiles2d } from './engine2dEntities';

export function triggerJump2d(st) {
  if (!st.isSide || st.jumpsLeft <= 0) return false;
  st.vy = st.jumpVel; st.grounded = false; st.jumpsLeft -= 1;
  emitParticles(st, st.px, st.py + 18, '#E2E8F0', 6); playArcadeSfx('jump');
  return true;
}

export function fireShot2d(st, now) {
  if (!st.canShoot || now - st.lastFire < 175) return false;
  st.lastFire = now;
  const angles = st.activePow === 'triple_shot' ? [-0.22, 0, 0.22] : [0];
  const baseAng = st.isSpace ? -Math.PI / 2 : (st.isTopDown ? st.aimAngle : (st.facing < 0 ? Math.PI : 0));
  angles.forEach((off) => {
    const s = st.shots.find((it) => !it.alive);
    if (!s) return;
    s.alive = true; s.x = st.px; s.y = st.py; s.life = 1.25;
    s.vx = Math.cos(baseAng + off) * 760; s.vy = Math.sin(baseAng + off) * 760;
  });
  playArcadeSfx('shoot');
  return true;
}

export function step2dWorld(st, keys, ptr, dt, now, cb) {
  st.timer = Math.max(0, st.timer - dt);
  if (st.timer <= 0) { cb.onLose?.(); return; }
  if (st.activePow && now > st.powUntil) st.activePow = null;
  st.shake = Math.max(0, st.shake - dt * 28);

  const mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const boost = Boolean(keys.ShiftLeft || keys.ShiftRight) ? 1.4 : 1.0;

  if (st.isSide) {
    if (st.mode === '2d_endless_dash') { st.vx = st.speed * boost; if (keys.KeyS || keys.ArrowDown) st.vy = Math.max(st.vy, 680); }
    else { st.vx = mx * st.speed * boost; if (mx !== 0) st.facing = mx > 0 ? 1 : -1; }
    st.px += st.vx * dt; st.vy += st.gravity * dt;
    const prevBot = st.py + 22; st.py += st.vy * dt; st.grounded = false;
    if (st.mode === '2d_platformer') st.px = Math.max(st.camX + 40, st.px);
    if (st.py >= st.groundY - 22) { st.py = st.groundY - 22; st.vy = 0; st.grounded = true; st.jumpsLeft = 2; }
    st.platforms.forEach((p) => {
      if (p.x + p.w < st.camX - 180) p.x += 14 * (st.mode === '2d_endless_dash' ? 230 : 210);
      if (st.vy >= 0 && prevBot <= p.y + 8 && st.py + 22 >= p.y && st.px + 14 > p.x && st.px - 14 < p.x + p.w) {
        st.py = p.y - 22; st.vy = 0; st.grounded = true; st.jumpsLeft = 2;
      }
    });
    st.obstacles.forEach((o) => {
      if (o.x + o.w < st.camX - 160) o.x += st.obstacles.length * 260;
      if (st.px + 14 > o.x && st.px - 14 < o.x + o.w && st.py + 22 > o.y && st.py - 20 < o.y + o.h) {
        if (st.vy >= 0 && prevBot <= o.y + 14) { st.py = o.y - 22; st.vy = 0; st.grounded = true; st.jumpsLeft = 2; }
        else { st.py = Math.min(st.py, o.y - 24); hurtPlayer2d(st, now, 20, cb); }
      }
    });
    const nextCam = Math.max(st.camX, st.px - st.w * 0.28);
    st.distance += Math.max(0, nextCam - st.camX) * 0.08; st.camX = nextCam;
  } else {
    const len = Math.hypot(mx, my) || 1;
    st.vx = (mx / len) * st.speed * (mx !== 0 || my !== 0 ? boost : 0);
    st.vy = (my / len) * st.speed * (mx !== 0 || my !== 0 ? boost : 0);
    st.px = Math.max(28, Math.min(st.w - 28, st.px + st.vx * dt));
    st.py = Math.max(st.isSpace ? st.h * 0.45 : 28, Math.min(st.h - 28, st.py + st.vy * dt));
    if (st.isTopDown && ptr) st.aimAngle = Math.atan2(ptr.y - st.py, ptr.x - st.px);
    if (st.isTopDown) st.platforms.forEach((b) => {
      const cx = Math.max(b.x, Math.min(st.px, b.x + b.w)); const cy = Math.max(b.y, Math.min(st.py, b.y + b.h));
      const dx = st.px - cx; const dy = st.py - cy; const d = Math.hypot(dx, dy);
      if (d > 0 && d < 20) { st.px += (dx / d) * (20 - d); st.py += (dy / d) * (20 - d); }
    });
  }

  if (keys.KeyE || keys.KeyF || (!st.isSide && keys.Space) || ptr?.down) fireShot2d(st, now);
  stepEnemies2d(st, dt, now, cb);
  stepProjectiles2d(st, dt, now, cb);
  stepPickups2d(st, dt, now, cb);

  if (st.goalType === 'distance_race' && st.distance >= st.targetDistance) cb.onWin?.();
  st.particles = st.particles.filter((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
  st.popups = st.popups.filter((p) => { p.y -= 42 * dt; p.life -= dt; return p.life > 0; });
}
