const LANES = [-3.2, 0, 3.2];
const POWERUP_TYPES = ['jetpack', 'magnet', 'sneakers', 'multiplier'];

function makeCoinArc(zCenter, yBase, x, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    return { id: `c-${zCenter}-${i}-${x}`, x, y: yBase + Math.sin(t * Math.PI) * 1.35, z: zCenter + 3.0 - t * 6.0, collected: false };
  });
}

export function createTrackChunks(count = 10, startZ = -22, chunkLen = 24) {
  return Array.from({ length: count }, (_, idx) => {
    const zCenter = startZ - idx * chunkLen;
    const pattern = idx % 4;
    const obstacles = [];
    const coins = [];
    const powerups = [];

    if (pattern === 0) {
      const rampLane = LANES[idx % 3];
      obstacles.push(
        { id: `tr-${idx}-1`, kind: 'train', x: rampLane, y: 1.2, z: zCenter - 2, w: 2.5, h: 2.4, d: 11, climbable: true },
        { id: `rm-${idx}`, kind: 'ramp', x: rampLane, y: 0.65, z: zCenter + 5.8, w: 2.4, h: 1.3, d: 4.5, climbable: true },
        { id: `tr-${idx}-2`, kind: 'train', x: LANES[(idx + 1) % 3], y: 1.2, z: zCenter, w: 2.5, h: 2.4, d: 11, climbable: true }
      );
      coins.push(...makeCoinArc(zCenter - 2, 2.9, rampLane, 5));
    } else if (pattern === 1) {
      obstacles.push(
        { id: `hi-${idx}`, kind: 'high_barrier', x: LANES[idx % 3], y: 1.95, z: zCenter, w: 2.6, h: 1.25, d: 0.7, duckable: true },
        { id: `lo-${idx}`, kind: 'low_hurdle', x: LANES[(idx + 1) % 3], y: 0.55, z: zCenter, w: 2.6, h: 1.0, d: 0.7 }
      );
      coins.push(...makeCoinArc(zCenter, 1.0, LANES[(idx + 2) % 3], 4));
    } else if (pattern === 2) {
      const brLane = LANES[(idx + 1) % 3];
      obstacles.push(
        { id: `mv-${idx}`, kind: 'moving_hazard', x: 0, y: 0.7, z: zCenter + 2, w: 2.4, h: 1.2, d: 1.0, moving: true },
        { id: `br-${idx}`, kind: 'bridge', x: brLane, y: 2.2, z: zCenter - 5, w: 2.8, h: 0.5, d: 8.5, climbable: true },
        { id: `rm2-${idx}`, kind: 'ramp', x: brLane, y: 1.1, z: zCenter + 1.2, w: 2.5, h: 2.2, d: 4.2, climbable: true }
      );
      coins.push(...makeCoinArc(zCenter - 5, 3.0, brLane, 4));
    } else {
      obstacles.push(
        { id: `sl-${idx}-a`, kind: 'low_hurdle', x: LANES[idx % 3], y: 0.55, z: zCenter + 4, w: 2.6, h: 1.0, d: 0.7 },
        { id: `sl-${idx}-b`, kind: 'high_barrier', x: LANES[(idx + 2) % 3], y: 1.95, z: zCenter - 4, w: 2.6, h: 1.25, d: 0.7, duckable: true }
      );
      coins.push(...makeCoinArc(zCenter, 1.1, LANES[(idx + 1) % 3], 4));
    }

    if (idx % 2 === 0) {
      const pType = POWERUP_TYPES[(idx >> 1) % POWERUP_TYPES.length];
      powerups.push({ id: `pw-${idx}`, type: pType, x: LANES[(idx + 2) % 3], y: 1.15, z: zCenter - 7, collected: false });
    }
    return { id: `chunk-${idx}`, zCenter, chunkLen, obstacles, coins, powerups };
  });
}

export function stepRunnerCollisions({ chunks, s, dt, isRolling, magnetActive, jetpackActive, shieldGraceUntil, now, nearMissedIds, onCoin, onPowerup, onNearMiss }) {
  const halfH = isRolling ? 0.35 : 0.75;
  for (const chunk of chunks) {
    for (const c of chunk.coins) {
      if (c.collected) continue;
      if (magnetActive && Math.abs(s.z - c.z) < 14 && Math.abs(s.y - c.y) < 9) {
        c.x += (s.x - c.x) * Math.min(1, dt * 11);
        c.y += (s.y - c.y) * Math.min(1, dt * 11);
        c.z += (s.z - c.z) * Math.min(1, dt * 11);
      }
      if (Math.hypot(s.x - c.x, s.y - c.y, s.z - c.z) < 1.35) {
        c.collected = true;
        onCoin(c);
      }
    }
    for (const p of chunk.powerups) {
      if (!p.collected && Math.hypot(s.x - p.x, s.y - p.y, s.z - p.z) < 1.45) {
        p.collected = true;
        onPowerup(p);
      }
    }
    for (const o of chunk.obstacles) {
      if (o.blasted) continue;
      const dz = Math.abs(s.z - o.z); const dx = Math.abs(s.x - o.x); const dy = Math.abs(s.y - o.y);
      if (!jetpackActive && now > shieldGraceUntil && dz < o.d * 0.48 + 0.35 && dy < o.h * 0.5 + halfH - 0.15) {
        if (dx < o.w * 0.48 + 0.25 && !(o.duckable && isRolling) && !(o.climbable && s.y > o.y + o.h * 0.4)) {
          return true;
        }
      }
      if (s.speed > 13 && !nearMissedIds.has(o.id) && s.z < o.z && o.z - s.z < 1.2) {
        const edgeGap = dx - (o.w * 0.5 + 0.35);
        if (edgeGap > 0 && edgeGap <= 0.45 && dy < o.h * 0.65 + 0.8) {
          nearMissedIds.add(o.id);
          onNearMiss();
        }
      }
    }
    if (chunk.zCenter > s.z + 26) {
      const minZ = Math.min(...chunks.map((ch) => ch.zCenter));
      const shift = chunk.zCenter - (minZ - chunk.chunkLen);
      chunk.zCenter -= shift;
      chunk.obstacles.forEach((o) => { o.z -= shift; o.blasted = false; nearMissedIds.delete(o.id); });
      chunk.coins.forEach((c) => { c.z -= shift; c.collected = false; if (jetpackActive) c.y = 6.2; });
      chunk.powerups.forEach((p) => { p.z -= shift; p.collected = false; });
    }
  }
  return false;
}
