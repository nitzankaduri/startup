import { playArcadeSfx } from './ArcadeSoundEngine';

const VALID_GOALS = new Set(['eliminate_targets', 'survive_waves', 'collect_and_escape', 'distance_race', 'open_world_missions']);

export function normalizeGoalType(world, mode) {
  const raw = world?.goalType;
  if (VALID_GOALS.has(raw)) return raw;
  const wc = world?.rules?.winCondition;
  if (wc === 'defeat_boss') return 'survive_waves';
  if (wc === 'checkpoints') return 'distance_race';
  if (mode === 'open_world_sandbox') return 'open_world_missions';
  if (mode === 'sky_shooter') return 'eliminate_targets';
  if (mode === 'arena_action') return 'survive_waves';
  if (mode === 'vehicle_pursuit') return 'distance_race';
  return 'collect_and_escape';
}

export function initGoalState(world, mode) {
  const goalType = normalizeGoalType(world, mode);
  const diff = Math.max(1, Number(world?.difficultyScale || 1));
  const targetCount = Math.max(3, Math.round(Number(world?.targetCount || world?.winTarget || (goalType === 'eliminate_targets' ? 15 : 20)) * diff));
  const waveCount = Math.max(1, Number(world?.waveCount || world?.rules?.wavesCount || 3));
  const targetDistance = Math.max(200, Math.round(Number(world?.targetDistance || 1500) * diff));
  return {
    goalType, targetCount, waveCount, targetDistance, wave: 1, waveKills: 0, waveTarget: 6, distance: 0,
    targetLabel: world?.enemyType ? world.enemyType.replaceAll('_', ' ') : 'Targets',
    collectibleLabel: world?.collectibleType ? world.collectibleType.replaceAll('_', ' ') : 'Relics',
    portal: { active: false, x: 0, y: 1.8, z: -26 },
  };
}

function triggerBossFinale(st) {
  if (st.boss.spawned) return;
  st.boss.spawned = true; st.boss.alive = true;
  st.boss.x = 0; st.boss.y = st.mode === 'sky_shooter' ? 6.5 : 1.8;
  st.boss.z = st.mode === 'arena_action' ? -28 : st.pz - 26;
  playArcadeSfx('boss_warning');
}

function triggerPortalFinale(st) {
  if (st.portal.active) return;
  st.portal.active = true;
  st.portal.x = 0;
  st.portal.y = st.isSky ? 6.0 : 1.6;
  st.portal.z = st.isArena ? 0 : st.pz - 28;
  playArcadeSfx('powerup');
}

export function onEnemyKilled(st, spawnEnemyFn) {
  st.kills += 1; st.waveKills += 1;
  st.combo = Math.min(8, st.combo + 1);
  st.maxCombo = Math.max(st.maxCombo || 1, st.combo);
  st.score += 50 * st.combo; st.shake = 0.25;
  playArcadeSfx('explosion');

  if (st.goalType === 'survive_waves' && st.waveKills >= st.waveTarget) {
    if (st.wave < st.waveCount) {
      st.wave += 1; st.waveKills = 0; st.waveTarget = 5 + st.wave * 2;
      st.hp = Math.min(100, st.hp + 20); playArcadeSfx('powerup');
      for (let i = 0; i < st.enemies.length; i += 1) { st.enemies[i].alive = true; spawnEnemyFn(st, st.enemies[i], i); }
    } else triggerBossFinale(st);
  } else if (st.goalType === 'eliminate_targets' && st.kills >= st.targetCount) {
    triggerBossFinale(st);
  }
}

export function onCollectiblePicked(st) {
  if (st.goalType === 'collect_and_escape' && st.coinsGot >= st.targetCount) {
    triggerPortalFinale(st);
  }
}

export function stepGoalProgress(st, distDelta, cb) {
  st.distance += distDelta;
  if (st.goalType === 'distance_race' && st.distance >= st.targetDistance) {
    triggerPortalFinale(st);
  }
  if (st.portal.active && Math.hypot(st.px - st.portal.x, st.pz - st.portal.z) < 3.8) {
    st.portal.active = false; st.score += 400;
    playArcadeSfx('victory'); cb.onWin?.(st);
  }
}

export function formatGoalHud(st) {
  if (st.portal?.active) {
    return { goalType: st.goalType, goalLabel: 'Enter Extraction Portal', goalValue: `${Math.round(Math.hypot(st.px - st.portal.x, st.pz - st.portal.z))}m`, goalPct: 100 };
  }
  if (st.boss?.alive) {
    return { goalType: st.goalType, goalLabel: 'Defeat Final Boss', goalValue: `${st.boss.hp}/${st.boss.maxHp} HP`, goalPct: 100 };
  }
  if (st.goalType === 'eliminate_targets') {
    const cur = Math.min(st.targetCount, st.kills);
    return { goalType: st.goalType, goalLabel: `Defeat ${st.targetCount} ${st.targetLabel}`, goalValue: `${cur} / ${st.targetCount} Targets`, goalPct: Math.min(100, (cur / Math.max(1, st.targetCount)) * 100) };
  }
  if (st.goalType === 'survive_waves') {
    return { goalType: st.goalType, goalLabel: `Wave ${st.wave}/${st.waveCount}`, goalValue: `${st.waveKills} / ${st.waveTarget} Enemies`, goalPct: Math.min(100, (st.waveKills / Math.max(1, st.waveTarget)) * 100) };
  }
  if (st.goalType === 'distance_race') {
    const cur = Math.min(st.targetDistance, Math.floor(st.distance));
    return { goalType: st.goalType, goalLabel: 'Reach Extraction', goalValue: `${cur.toLocaleString()} / ${st.targetDistance.toLocaleString()}m`, goalPct: Math.min(100, (cur / Math.max(1, st.targetDistance)) * 100) };
  }
  const cur = Math.min(st.targetCount, st.coinsGot);
  return { goalType: 'collect_and_escape', goalLabel: `Collect ${st.collectibleLabel}`, goalValue: `${cur} / ${st.targetCount}`, goalPct: Math.min(100, (cur / Math.max(1, st.targetCount)) * 100) };
}
