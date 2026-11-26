export const EDITOR_PRESETS = [
  {
    label: 'Subway Trains', themeId: 'subway_trains', theme: 'sunny_city', signLabel: 'SUBWAY',
    mode: 'endless_runner', goalType: 'collect_and_escape', targetCount: 25,
    playerType: 'runner_kid', obstacleType: 'subway_train', enemyType: 'chaser_guard',
    collectibleType: 'gold_coin', canShoot: false, speed: 13, objectiveText: 'Collect 25 Coins',
    palette: { sky: '#0284C7', ground: '#CBD5E1', track: '#645A52', primary: '#10B981', secondary: '#F59E0B', accent: '#E11D48' },
  },
  {
    label: 'Space Shooter', themeId: 'space_shooter', theme: 'tokyo_festival', signLabel: 'SPACE',
    mode: 'sky_shooter', goalType: 'eliminate_targets', targetCount: 15,
    playerType: 'starfighter', obstacleType: 'asteroid', enemyType: 'alien_ufo',
    collectibleType: 'energy_orb', canShoot: true, enemiesShoot: true, speed: 16, objectiveText: 'Defeat 15 Alien UFOs',
    palette: { sky: '#0F172A', ground: '#1E293B', track: '#334155', primary: '#38BDF8', secondary: '#6366F1', accent: '#F59E0B' },
  },
  {
    label: 'Police Pursuit', themeId: 'police_pursuit', theme: 'sunny_city', signLabel: 'CHASE',
    mode: 'vehicle_pursuit', goalType: 'distance_race', targetDistance: 1500,
    playerType: 'sports_car', obstacleType: 'police_car', enemyType: 'rival_car',
    collectibleType: 'gold_coin', canShoot: false, speed: 18, objectiveText: 'Reach 1,500m',
    palette: { sky: '#0284C7', ground: '#64748B', track: '#334155', primary: '#EF4444', secondary: '#1E293B', accent: '#0EA5E9' },
  },
  {
    label: 'Arena Survival', themeId: 'lava_dragon', theme: 'desert_canyon', signLabel: 'ARENA',
    mode: 'arena_action', goalType: 'survive_waves', waveCount: 3,
    playerType: 'knight', obstacleType: 'lava_pillar', enemyType: 'skeleton',
    collectibleType: 'star', canShoot: true, enemiesShoot: true, speed: 12, objectiveText: 'Survive 3 Waves + Boss',
    palette: { sky: '#7C2D12', ground: '#44403C', track: '#451A03', primary: '#F59E0B', secondary: '#EA580C', accent: '#EF4444' },
  },
  {
    label: 'Open City GTA', themeId: 'police_pursuit', theme: 'sunny_city', signLabel: 'CITY',
    mode: 'open_world_sandbox', goalType: 'open_world_missions', targetCount: 4,
    playerType: 'runner_kid', obstacleType: 'police_car', enemyType: 'chaser_guard',
    collectibleType: 'gold_coin', canShoot: true, enemiesShoot: true, speed: 12, objectiveText: 'Complete 4 City Missions',
    palette: { sky: '#0284C7', ground: '#334155', track: '#1E293B', primary: '#D96B27', secondary: '#F59E0B', accent: '#EF4444' },
  },
];

export const MODE_OPTS = ['endless_runner', 'sky_shooter', 'vehicle_pursuit', 'arena_action', 'open_world_sandbox', '2d_grid_puzzle', '2d_platformer', '2d_topdown_action', '2d_endless_dash', '2d_space_arcade'];
export const GOAL_OPTS = ['collect_and_escape', 'eliminate_targets', 'survive_waves', 'distance_race', 'open_world_missions'];
export const PLAYER_OPTS = ['runner_kid', 'starfighter', 'pirate', 'sports_car', 'knight'];
export const OBSTACLE_OPTS = ['subway_train', 'asteroid', 'pirate_barrel', 'police_car', 'lava_pillar'];
export const ENEMY_OPTS = ['chaser_guard', 'alien_ufo', 'shark', 'rival_car', 'skeleton'];

export const CURATED_PALETTES = [
  { name: 'Terracotta', primary: '#D96B27', secondary: '#FBBF24', accent: '#E11D48' },
  { name: 'Emerald Bay', primary: '#10B981', secondary: '#38BDF8', accent: '#F59E0B' },
  { name: 'Royal Indigo', primary: '#4F46E5', secondary: '#FBBF24', accent: '#0EA5E9' },
  { name: 'Desert Amber', primary: '#EA580C', secondary: '#FDE047', accent: '#78350F' },
];

export const AI_CHIPS = ['More fast trains', 'Make sky sunset', 'Add double jump', 'Enable laser shooting'];
