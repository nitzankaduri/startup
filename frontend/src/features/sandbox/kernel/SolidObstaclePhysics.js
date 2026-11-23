/**
 * True 3D AABB volume physics for trains, barriers, and jump ramps:
 * - Roof Landing: snaps groundY atop train roofs so players sprint roof-to-roof
 * - Jump Ramps: smooth linear slope elevation directly up onto train roofs
 * - Side-Swipe: bounces player back to prevLane with sparks & chaser surge (train stays intact)
 * - Front Bumper Collision: halts forward Z at bumper + 60ms hit-stop (train NEVER vanishes)
 */
export function resolveSolidObstacles(st, prevPx, prevPz, now, spawnBurst, hurtPlayer, cb) {
  let supportY = 1.0;

  for (let i = 0; i < st.obstacles.length; i += 1) {
    const o = st.obstacles[i];
    if (!o.alive) continue;

    const halfX = o.halfX || 1.15;
    const halfZ = o.halfZ || 1.1;
    const height = o.isRamp ? 2.65 : (o.height || (st.isTrain ? 2.65 : 1.4));
    const inX = Math.abs(st.px - o.x) < halfX + 0.34;
    const inZ = st.pz <= o.z + halfZ + 0.45 && st.pz >= o.z - halfZ - 0.35;

    if (o.isRamp && inX && inZ) {
      const t = Math.max(0, Math.min(1, (o.z + halfZ - st.pz) / (halfZ * 2)));
      supportY = Math.max(supportY, 1.0 + t * height);
      continue;
    }

    if (!inX || !inZ) continue;
    const roofY = height + 1.0;

    // 1. Land / stay on top of solid roof (1.0 standing baseline + height)
    if (st.py >= roofY - 0.55 && st.vy <= 2.0) {
      supportY = Math.max(supportY, roofY);
      continue;
    }

    // 2. Side-swipe while switching lanes below roof height -> bounce back to prevLane
    const wasOutsideX = Math.abs(prevPx - o.x) >= halfX + 0.25;
    if (wasOutsideX && st.isRunner) {
      st.lane = st.prevLane;
      st.px = st.prevLane * 3.2;
      st.shake = 0.45;
      st.chaserBoostUntil = now + 2000;
      spawnBurst(st, st.px, st.py + 0.5, st.pz);
      cb.onEvent?.('stumble', st);
      continue;
    }

    // 3. Head-on front bumper impact -> halt at front face, 60ms hit-stop, keep obstacle intact
    st.pz = Math.max(prevPz, o.z + halfZ + 0.55);
    st.hitStopUntil = now + 60;
    spawnBurst(st, o.x, 1.2, o.z + halfZ);
    hurtPlayer(st, now, 20, cb);
  }

  st.groundY = supportY;
}
