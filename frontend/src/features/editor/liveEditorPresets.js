export const EDITOR_PRESETS = [
  {
    label: 'Subway Trains', themeId: 'subway_trains', theme: 'sunny_city', signLabel: 'SUBWAY',
    mode: 'endless_runner', playerType: 'runner_kid', obstacleType: 'subway_train', enemyType: 'chaser_guard',
    collectibleType: 'gold_coin', canShoot: false, speed: 13, objectiveText: 'Collect 30 Coins',
    palette: { sky: '#0284C7', ground: '#4ADE80', track: '#78350F', primary: '#10B981', secondary: '#F59E0B', accent: '#E11D48' },
  },
  {
    label: 'Space Shooter', themeId: 'space_shooter', theme: 'tokyo_festival', signLabel: 'SPACE',
    mode: 'sky_shooter', playerType: 'starfighter', obstacleType: 'asteroid', enemyType: 'alien_ufo',
    collectibleType: 'energy_orb', canShoot: true, speed: 16, objectiveText: 'Defeat 15 Alien UFOs',
    palette: { sky: '#0F172A', ground: '#1E293B', track: '#334155', primary: '#38BDF8', secondary: '#6366F1', accent: '#F59E0B' },
  },
  {
    label: 'Police Pursuit', themeId: 'police_pursuit', theme: 'sunny_city', signLabel: 'CHASE',
    mode: 'vehicle_pursuit', playerType: 'sports_car', obstacleType: 'police_car', enemyType: 'rival_car',
    collectibleType: 'gold_coin', canShoot: false, speed: 16, objectiveText: 'Collect 30 Coins',
    palette: { sky: '#0284C7', ground: '#64748B', track: '#334155', primary: '#EF4444', secondary: '#1E293B', accent: '#0EA5E9' },
  },
  {
    label: 'Pirate Island', themeId: 'pirate_island', theme: 'tropical_beach', signLabel: 'ALOHA',
    mode: 'endless_runner', playerType: 'pirate', obstacleType: 'pirate_barrel', enemyType: 'shark',
    collectibleType: 'gem', canShoot: true, speed: 12.5, objectiveText: 'Collect 30 Gems',
    palette: { sky: '#0EA5E9', ground: '#FCD34D', track: '#92400E', primary: '#D96B27', secondary: '#0EA5E9', accent: '#E11D48' },
  },
];

export const MODE_OPTS = ['endless_runner', 'sky_shooter', 'vehicle_pursuit', 'arena_action'];
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
