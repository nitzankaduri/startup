export function extractInitialMetrics(game) {
  const cfg = game?.game_config;
  const entities = cfg?.entities || [];
  const rules = cfg?.rules || {};
  const maxHp = rules.player_hp ?? 100;

  return {
    totalCollectibles: entities.filter((e) => e.type === 'collectible').length,
    totalCheckpoints: entities.filter((e) => e.type === 'checkpoint_gate').length,
    targetKills: rules.target_kills ?? 8,
    totalWaves: rules.waves_count ?? 3,
    timeLimit: rules.time_limit_sec ?? 90,
    maxHp,
    gravity: cfg?.environment?.gravity ?? -22,
  };
}

export function buildFreshRunState(game, runId, started = true) {
  const m = extractInitialMetrics(game);
  const cfg = game?.game_config || {};
  return {
    gameState: game ? 'playing' : 'idle',
    hasStarted: started,
    score: 0, finalScore: 0, runnerScore: 0, combo: 1, nearMissAt: 0, kills: 0,
    currentWave: 1, checkpointsPassed: 0, driftBoosts: 0, collectedIds: [], collectedKeys: [],
    passedCheckpointIds: [], bursts: [], lastDashAt: 0, hitMarkerAt: 0, speedKmh: 0, driftCharge: 0,
    activePowerups: {}, hoverboardCooldownUntil: 0,
    customMeters: [], customActions: [], synthesisError: '',
    controlsHint: cfg.controls_hint || cfg.architecture_plan?.input_scheme || '',
    runStartedAt: performance.now(), runDurationMs: 0,
    timeLeft: m.timeLimit, hp: m.maxHp, maxHp: m.maxHp,
    totalCollectibles: m.totalCollectibles, totalCheckpoints: m.totalCheckpoints,
    targetKills: m.targetKills, totalWaves: m.totalWaves, gravity: m.gravity,
    runId: runId + 1,
  };
}

export function computeFinalScore({
  gameMode, collectedCount, kills, checkpointsPassed, timeLeft, driftBoosts, runnerScore = 0, runDurationMs,
}) {
  if (gameMode === 'arcade_runner') return Math.max(100, Math.round(runnerScore));
  const clearSecs = runDurationMs / 1000;
  const timePts = gameMode === 'time_trial_racer'
    ? Math.max(100, Math.round(timeLeft * 18))
    : Math.max(100, Math.round(Math.max(0, 90 - clearSecs) * 12));
  return collectedCount * 100 + checkpointsPassed * 150 + kills * 120 + driftBoosts * 75 + timePts;
}
