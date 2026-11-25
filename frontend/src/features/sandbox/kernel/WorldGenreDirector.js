export const RUNNER_LANES = [-3.2, 0, 3.2];
export const HIGHWAY_LANES = [-6.4, -3.2, 0, 3.2, 6.4];

export const GENRE_PROFILES = {
  endless_runner: {
    mode: 'endless_runner', defaultGoal: 'collect_and_escape', worldLayout: 'three_lane_track', playerRig: 'three_lane_runner',
    defaultPlayer: 'runner_kid', defaultObstacle: 'subway_train', defaultEnemy: 'chaser_guard',
    baseSpeed: 13, timeLimit: 90, canShoot: false, enemiesShoot: false,
    ruleSummary: '3-lane railway track with jumpable trains, ramps, coin arcs & chaser.',
  },
  open_world_sandbox: {
    mode: 'open_world_sandbox', defaultGoal: 'open_world_missions', worldLayout: 'city_grid', playerRig: 'third_person_action',
    defaultPlayer: 'runner_kid', defaultObstacle: 'police_car', defaultEnemy: 'chaser_guard',
    baseSpeed: 12, timeLimit: 180, canShoot: true, enemiesShoot: true,
    ruleSummary: '360° open city grid with vehicles (F), shooting (Click/E), missions & Wanted stars.',
  },
  sky_shooter: {
    mode: 'sky_shooter', defaultGoal: 'eliminate_targets', worldLayout: 'open_biome', playerRig: 'flight_combat',
    defaultPlayer: 'starfighter', defaultObstacle: 'asteroid', defaultEnemy: 'alien_ufo',
    baseSpeed: 16, timeLimit: 90, canShoot: true, enemiesShoot: true,
    ruleSummary: 'Full 3D space/sky flight with asteroids, enemy squadrons, laser blasters & Boss ship.',
  },
  vehicle_pursuit: {
    mode: 'vehicle_pursuit', defaultGoal: 'distance_race', worldLayout: 'city_grid', playerRig: 'arcade_car',
    defaultPlayer: 'sports_car', defaultObstacle: 'police_car', defaultEnemy: 'rival_car',
    baseSpeed: 18, timeLimit: 90, canShoot: false, enemiesShoot: false,
    ruleSummary: 'High-speed 5-lane highway pursuit with analog steering, nitro boost & rival cars.',
  },
  arena_action: {
    mode: 'arena_action', defaultGoal: 'survive_waves', worldLayout: 'open_biome', playerRig: 'third_person_action',
    defaultPlayer: 'knight', defaultObstacle: 'lava_pillar', defaultEnemy: 'skeleton',
    baseSpeed: 12, timeLimit: 110, canShoot: true, enemiesShoot: true,
    ruleSummary: 'Open 360° combat arena with multi-wave enemies, cover pillars & power-ups.',
  },
};

export function resolveGenreProfile(rawMode, world) {
  const m = String(rawMode || world?.mode || world?.archetype || 'endless_runner').toLowerCase();
  if (['open_world_sandbox', 'open_world', 'sandbox', 'gta'].includes(m)) return GENRE_PROFILES.open_world_sandbox;
  if (['arena_action', 'arena_survivor', 'arena_shooter', 'survival_waves'].includes(m)) return GENRE_PROFILES.arena_action;
  if (['sky_shooter', 'flight_combat'].includes(m)) return GENRE_PROFILES.sky_shooter;
  if (['vehicle_pursuit', 'time_trial_racer', 'arcade_car'].includes(m)) return GENRE_PROFILES.vehicle_pursuit;
  if (world?.playerRig === 'flight_combat') return GENRE_PROFILES.sky_shooter;
  if (world?.playerRig === 'arcade_car') return GENRE_PROFILES.vehicle_pursuit;
  if (world?.playerRig === 'third_person_action') return GENRE_PROFILES.arena_action;
  return GENRE_PROFILES.endless_runner;
}

export function buildGenreObstacles(mode, isTrain) {
  if (mode === 'open_world_sandbox') return [];
  if (mode === 'arena_action') {
    return Array.from({ length: 12 }, (_, i) => {
      const ang = (i / 12) * Math.PI * 2 + 0.25; const rad = i % 2 === 0 ? 13 : 24;
      return { alive: true, isRamp: false, x: Math.cos(ang) * rad, y: 0, z: Math.sin(ang) * rad, halfX: 1.25, halfZ: 1.25, height: 2.2 };
    });
  }
  if (mode === 'sky_shooter') {
    return Array.from({ length: 12 }, (_, i) => ({ alive: true, isRamp: false, x: ((i * 7) % 30) - 15, y: 2.5 + (i % 4) * 3.0, z: -42 - i * 16, halfX: 1.35, halfZ: 1.35, height: 2.2 }));
  }
  if (mode === 'vehicle_pursuit') {
    return Array.from({ length: 12 }, (_, i) => ({ alive: true, isRamp: false, x: HIGHWAY_LANES[(i * 2) % HIGHWAY_LANES.length], y: 0, z: -38 - i * 19, halfX: 1.0, halfZ: 2.0, height: 1.4 }));
  }
  return Array.from({ length: 10 }, (_, i) => {
    const idx = Math.floor(i / 2); const isRamp = isTrain && i % 2 === 1; const baseZ = -34 - idx * (isTrain ? 26 : 16);
    return { alive: true, isRamp, x: RUNNER_LANES[(idx + 1) % 3], y: 0, z: isRamp ? baseZ + 8.3 : baseZ, halfX: 1.15, halfZ: isRamp ? 2.8 : (isTrain ? 5.4 : 1.1), height: isTrain ? 2.65 : 1.4 };
  });
}

export function buildGenreCoins(mode) {
  if (mode === 'open_world_sandbox') {
    return Array.from({ length: 16 }, (_, i) => ({ alive: true, x: ((i % 4) - 1.5) * 40, y: 1.0, z: (Math.floor(i / 4) - 1.5) * 40 }));
  }
  if (mode === 'arena_action') {
    return Array.from({ length: 20 }, (_, i) => ({ alive: true, x: Math.cos((i / 20) * Math.PI * 2) * (10 + (i % 4) * 6.5), y: 1.0, z: Math.sin((i / 20) * Math.PI * 2) * (10 + (i % 4) * 6.5) }));
  }
  if (mode === 'sky_shooter') {
    return Array.from({ length: 18 }, (_, i) => ({ alive: true, x: Math.sin(i * 0.7) * 11, y: 4.5 + Math.cos(i * 0.5) * 3.5, z: -22 - i * 11 }));
  }
  const lanes = mode === 'vehicle_pursuit' ? HIGHWAY_LANES : RUNNER_LANES;
  return Array.from({ length: 18 }, (_, i) => ({ alive: true, x: lanes[(i + 2) % lanes.length], y: 1.0, z: -16 - i * 8 }));
}

export function buildGenreWorldConfig(world) {
  const profile = resolveGenreProfile(world?.mode || world?.archetype, world);
  return {
    ...profile,
    obstacleType: world?.obstacleType || profile.defaultObstacle,
    playerType: world?.playerType || profile.defaultPlayer,
    enemyType: world?.enemyType || profile.defaultEnemy,
    canShoot: world?.canShoot ?? profile.canShoot,
    enemiesShoot: Boolean(world?.enemiesShoot ?? profile.enemiesShoot),
  };
}
