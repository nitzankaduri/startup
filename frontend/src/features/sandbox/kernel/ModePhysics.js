import * as THREE from 'three';
import { spawnFloatingNumber } from '../sdk/gameFeel';
import { HIGHWAY_LANES, LANES, spawnEnemyForMode } from './DirectorSetup';
import { resolveBuildingCollisions } from './OpenWorldBuilder';
import { stepSandboxDriving, stepSandboxOnFoot } from './SandboxVehicleSystem';
import { resolveSolidObstacles } from './SolidObstaclePhysics';

export function stepModeMovement({ st, feel, keys, dt, boosting }) {
  const k = keys;
  const mx = ((k.KeyD || k.ArrowRight) ? 1 : 0) - ((k.KeyA || k.ArrowLeft) ? 1 : 0);
  const mz = ((k.KeyS || k.ArrowDown) ? 1 : 0) - ((k.KeyW || k.ArrowUp) ? 1 : 0);

  if (st.isSandbox) {
    if (st.inVehicleIdx >= 0) stepSandboxDriving({ st, feel, keys, dt });
    else stepSandboxOnFoot(st, mx, mz, dt, boosting);
    return;
  }

  if (st.isRunner) {
    st.px = THREE.MathUtils.lerp(st.px, st.lane * 3.2, 1 - Math.exp(-15 * dt));
    st.curSpeed = st.baseSpeed * (boosting ? 1.45 : 1.0);
    st.pz -= st.curSpeed * dt; st.yaw = 0; st.pitch = 0;
    if (st.activePow === 'jetpack_boost') { st.py = THREE.MathUtils.lerp(st.py, 4.2, 1 - Math.exp(-8 * dt)); st.vy = 0; }
    else { st.vy -= 28 * dt; st.py += st.vy * dt; }
    return;
  }

  if (st.isArena) {
    const len = Math.hypot(mx, mz) || 1; const nx = mx / len; const nz = mz / len;
    const spd = st.baseSpeed * (boosting ? 1.55 : 1.0);
    st.vx = THREE.MathUtils.lerp(st.vx, nx * spd, 1 - Math.exp(-14 * dt));
    st.vz = THREE.MathUtils.lerp(st.vz, nz * spd, 1 - Math.exp(-14 * dt));
    st.px = THREE.MathUtils.clamp(st.px + st.vx * dt, -37.5, 37.5);
    st.pz = THREE.MathUtils.clamp(st.pz + st.vz * dt, -37.5, 37.5);
    st.curSpeed = Math.hypot(st.vx, st.vz);
    if (Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05) {
      const targetYaw = Math.atan2(-nx, -nz);
      st.yaw += Math.atan2(Math.sin(targetYaw - st.yaw), Math.cos(targetYaw - st.yaw)) * (1 - Math.exp(-14 * dt));
    }
    st.vy -= 28 * dt; st.py += st.vy * dt;
    return;
  }

  if (st.isSky) {
    const upDown = ((k.KeyW || k.ArrowUp) ? 1 : 0) - ((k.KeyS || k.ArrowDown) ? 1 : 0);
    st.vx = THREE.MathUtils.lerp(st.vx, mx * st.baseSpeed * 1.15, 1 - Math.exp(-9 * dt));
    st.vy = THREE.MathUtils.lerp(st.vy, upDown * st.baseSpeed * 0.95, 1 - Math.exp(-9 * dt));
    st.curSpeed = st.baseSpeed * (boosting ? 1.55 : 1.0);
    st.px = THREE.MathUtils.clamp(st.px + st.vx * dt, -18.0, 18.0); st.py = THREE.MathUtils.clamp(st.py + st.vy * dt, 1.8, 15.5); st.pz -= st.curSpeed * dt;
    st.pitch = THREE.MathUtils.lerp(st.pitch, THREE.MathUtils.clamp(st.vy * 0.035, -0.42, 0.42), 1 - Math.exp(-10 * dt));
    st.yaw = THREE.MathUtils.lerp(st.yaw, THREE.MathUtils.clamp(-st.vx * 0.018, -0.28, 0.28), 1 - Math.exp(-10 * dt));
    return;
  }

  const targetSteer = mx * st.baseSpeed * 0.85;
  st.steerVel = THREE.MathUtils.lerp(st.steerVel, targetSteer, 1 - Math.exp(-9 * dt));
  st.px += st.steerVel * dt;
  if (st.px > 8.2 || st.px < -8.2) { st.px = THREE.MathUtils.clamp(st.px, -8.2, 8.2); st.steerVel *= -0.35; }
  const nitro = Boolean(k.ShiftLeft || k.ShiftRight || k.Space || st.activePow === 'jetpack_boost');
  const throttleMul = nitro ? 1.85 : (k.KeyW || k.ArrowUp) ? 1.35 : (k.KeyS || k.ArrowDown) ? 0.58 : 1.0;
  st.curSpeed = THREE.MathUtils.lerp(st.curSpeed, st.baseSpeed * throttleMul, 1 - Math.exp(-6 * dt));
  st.pz -= st.curSpeed * dt; st.py = st.groundY;
  st.yaw = THREE.MathUtils.lerp(st.yaw, THREE.MathUtils.clamp(-st.steerVel * 0.025, -0.32, 0.32), 1 - Math.exp(-12 * dt));
  feel.bankRoll = THREE.MathUtils.lerp(feel.bankRoll, st.steerVel * 0.015, 1 - Math.exp(-12 * dt));
}

export function stepModeEnemies(st, dt, now, hurtPlayer, spawnBurst, cb) {
  const activeCap = st.isSandbox ? Math.min(st.enemies.length, 2 + (st.wantedStars || 0) * 2) : st.enemies.length;
  for (let i = 0; i < st.enemies.length; i += 1) {
    const e = st.enemies[i];
    if (st.isSandbox && i >= activeCap) { e.alive = false; continue; }
    if (st.isSandbox && !e.alive) spawnEnemyForMode(st, e, i);
    if (!e.alive) continue;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);

    if (st.isArena || st.isSandbox) {
      const dx = st.px - e.x; const dz = st.pz - e.z; const dist = Math.hypot(dx, dz) || 1;
      const flank = Math.sin(now * 0.002 + i * 1.7) * (dist > 6 ? 0.38 : 0.0);
      const nx = dx / dist; const nz = dz / dist;
      const spd = st.isSandbox ? (4.8 + (st.wantedStars || 0) * 1.1) : (4.6 + Math.min(3.5, (st.wave - 1) * 0.9));
      e.x += (nx - nz * flank) * spd * dt; e.z += (nz + nx * flank) * spd * dt; e.yaw = Math.atan2(-dx, -dz);
      if (st.isSandbox) resolveBuildingCollisions(e, 0.65, st.buildings);
    } else if (st.isSky) {
      e.x += Math.sin(now * 0.002 + i) * 3.2 * dt; e.z += e.vz * dt;
      if (e.z > st.pz + 16) spawnEnemyForMode(st, e, i);
    } else if (st.isPursuit) {
      e.z += e.vz * dt; e.x = THREE.MathUtils.clamp(e.x + Math.sin(now * 0.0015 + i * 2) * 1.6 * dt, -7.2, 7.2);
      if (e.z > st.pz + 20 || e.z < st.pz - 140) spawnEnemyForMode(st, e, i);
    } else {
      e.x += e.vx * dt; e.z += e.vz * dt;
      if (e.x > 4.5 || e.x < -4.5) e.vx = -e.vx;
      if (e.z > st.pz + 20) spawnEnemyForMode(st, e, i);
    }

    if (st.enemiesShoot && now > e.fireAt) {
      const dx = st.px - e.x; const dy = st.py - e.y; const dz = st.pz - e.z; const d = Math.hypot(dx, dy, dz);
      if (d < 44 && (st.isArena || st.isSandbox || e.z < st.pz - 5)) {
        e.fireAt = now + (st.isArena || st.isSandbox ? 2400 : 2100);
        for (let k = 0; k < st.enemyShots.length; k += 1) {
          const es = st.enemyShots[k]; if (es.alive) continue;
          const inv = 18 / Math.max(0.1, d);
          es.alive = true; es.x = e.x; es.y = e.y; es.z = e.z; es.vx = dx * inv; es.vy = st.isSky ? dy * inv : 0; es.vz = dz * inv; es.life = 2.4; break;
        }
      }
    }

    if (Math.hypot(st.px - e.x, st.pz - e.z) < 1.5 && Math.abs(st.py - e.y) < 1.6) {
      if ((st.isPursuit || (st.isSandbox && st.inVehicleIdx >= 0)) && Math.abs(st.curSpeed) > 10) {
        e.hp -= 50; e.flash = 0.1; st.shake = 0.3; spawnFloatingNumber([e.x, e.y + 1.4, e.z], '-50 RAM', 'crit');
        spawnBurst(st, e.x, e.y, e.z, 'spark', 12);
        if (e.hp <= 0) spawnEnemyForMode(st, e, i);
      } else { spawnEnemyForMode(st, e, i); hurtPlayer(st, now, 15, cb); }
    }
  }
}

export function stepModeObstacles(st, prevPx, prevPz, now, spawnBurst, hurtPlayer, cb) {
  if (st.isSandbox) return;
  if (st.isRunner) {
    for (let i = 0; i < st.obstacles.length; i += 1) {
      const o = st.obstacles[i];
      if (o.z > st.pz + 25) { o.z -= Math.round(135 / Math.max(0.5, st.spawnRate || 1)); o.x = o.isRamp && i > 0 ? st.obstacles[i - 1].x : LANES[(st.seq += 1) % 3]; o.alive = true; }
    }
    resolveSolidObstacles(st, prevPx, prevPz, now, spawnBurst, hurtPlayer, cb);
    return;
  }
  if (st.isArena) {
    for (let i = 0; i < st.obstacles.length; i += 1) {
      const o = st.obstacles[i]; if (!o.alive) continue;
      const dx = st.px - o.x; const dz = st.pz - o.z; const ox = o.halfX + 0.55 - Math.abs(dx); const oz = o.halfZ + 0.55 - Math.abs(dz);
      if (ox > 0 && oz > 0) { if (ox < oz) st.px += dx >= 0 ? ox : -ox; else st.pz += dz >= 0 ? oz : -oz; }
    }
    return;
  }
  for (let i = 0; i < st.obstacles.length; i += 1) {
    const o = st.obstacles[i];
    if (o.z > st.pz + 24) {
      o.z = st.pz - 140 - (i % 5) * 16; o.x = st.isPursuit ? HIGHWAY_LANES[(st.seq += 1) % HIGHWAY_LANES.length] : ((i * 7) % 30) - 15;
      if (st.isSky) o.y = 2.5 + ((i + st.seq) % 4) * 3.0;
      o.alive = true;
    }
    if (o.alive && Math.abs(st.px - o.x) < o.halfX + 0.5 && Math.abs(st.pz - o.z) < o.halfZ + 0.6 && Math.abs(st.py - (o.y + (o.height || 1.4) * 0.5)) < 1.6) {
      o.alive = false; spawnBurst(st, o.x, o.y + 0.8, o.z, 'spark', 12); hurtPlayer(st, now, 18, cb);
    }
  }
}
