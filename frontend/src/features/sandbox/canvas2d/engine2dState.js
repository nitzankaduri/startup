export const MODES_2D_SET = new Set(['2d_platformer', '2d_topdown_action', '2d_endless_dash', '2d_space_arcade']);

export function resolve2dMode(world) {
  const m = String(world?.mode || world?.archetype || '').toLowerCase();
  if (MODES_2D_SET.has(m)) return m;
  if (m === 'sky_shooter') return '2d_space_arcade';
  if (m === 'arena_action' || m === 'open_world_sandbox') return '2d_topdown_action';
  if (m === 'vehicle_pursuit' || m === 'endless_runner') return '2d_endless_dash';
  return '2d_platformer';
}

export function create2dState(world, width = 1280, height = 720) {
  const mode = resolve2dMode(world);
  const w = Math.max(800, width); const h = Math.max(520, height);
  const pal = { sky: '#E2E8F0', ground: '#334155', track: '#475569', primary: '#D96B27', secondary: '#F59E0B', accent: '#1E293B', ...(world?.palette || {}) };
  const isSide = mode === '2d_platformer' || mode === '2d_endless_dash';
  const isTopDown = mode === '2d_topdown_action';
  const isSpace = mode === '2d_space_arcade';
  const groundY = h - 92;

  const platforms = isSide
    ? Array.from({ length: 14 }, (_, i) => ({
        x: 240 + i * (mode === '2d_endless_dash' ? 230 : 210),
        y: groundY - (i % 3) * 85 - 70,
        w: mode === '2d_endless_dash' ? 145 : 155,
        h: 20,
      }))
    : isTopDown
      ? Array.from({ length: 6 }, (_, i) => ({
          x: 180 + ((i % 3) * (w - 360)) / 2,
          y: 150 + Math.floor(i / 3) * (h - 320),
          w: 76, h: 76,
        }))
      : Array.from({ length: 4 }, (_, i) => ({ x: 140 + i * ((w - 280) / 3) - 42, y: h - 185, w: 84, h: 24 }));

  const obstacles = mode === '2d_endless_dash'
    ? Array.from({ length: 12 }, (_, i) => ({
        x: 520 + i * 260, y: groundY - (i % 4 === 2 ? 54 : 38),
        w: i % 4 === 2 ? 78 : 34, h: i % 4 === 2 ? 54 : 38, tall: i % 4 === 2,
      }))
    : [];

  const coins = Array.from({ length: 18 }, (_, i) => ({
    alive: true,
    x: isSide ? 280 + i * 135 : 100 + ((i * 173) % (w - 200)),
    y: isSide ? groundY - 55 - (i % 4) * 52 : (isSpace ? 130 + (i % 4) * 65 : 110 + ((i * 97) % (h - 220))),
    r: 12,
  }));

  const enemyCount = isSpace ? 10 : isTopDown ? 7 : 6;
  const enemies = Array.from({ length: enemyCount }, (_, i) => ({
    alive: true,
    x: isSide ? 540 + i * 310 : (isSpace ? 150 + (i % 5) * ((w - 300) / 4) : (i % 2 === 0 ? 70 : w - 70)),
    y: isSide ? groundY - 22 : (isSpace ? 90 + Math.floor(i / 5) * 64 : 100 + ((i * 110) % (h - 200))),
    vx: isSpace ? 135 : -110, vy: 0, r: 18, hp: 30, maxHp: 30, flash: 0,
    fireAt: 1200 + i * 380,
  }));

  const powKinds = ['shield', 'triple_shot', 'magnet'];
  const powerups = Array.from({ length: 3 }, (_, i) => ({
    alive: true, kind: powKinds[i % 3],
    x: isSide ? 760 + i * 820 : 180 + i * ((w - 360) / 2),
    y: isSide ? groundY - 130 : h * 0.48,
    r: 15,
  }));

  const waveCount = Number(world?.waveCount || 3);
  const targetCount = Number(world?.targetCount || (isSpace ? 18 : 20));
  const targetDistance = Number(world?.targetDistance || 1200);
  const goalType = world?.goalType || (isTopDown ? 'survive_waves' : isSpace ? 'eliminate_targets' : mode === '2d_endless_dash' ? 'distance_race' : 'collect_and_escape');

  return {
    mode, isSide, isTopDown, isSpace, w, h, groundY, pal,
    gravity: Number(world?.gravity2d ?? (isSide ? 1450 : 0)),
    speed: (Number(world?.speed || 12) * 26),
    jumpVel: -(Number(world?.jumpPower || 14) * 44),
    canShoot: world?.canShoot ?? (mode !== '2d_endless_dash'),
    enemiesShoot: Boolean(world?.enemiesShoot ?? (isTopDown || isSpace)),
    goalType, targetCount, waveCount, targetDistance,
    timer: Number(world?.rules?.timeLimit || 90),
    hp: 100, score: 0, kills: 0, coinsGot: 0, distance: 0, wave: 1, waveKills: 0, waveTarget: 6,
    camX: 0, shake: 0, seq: 0, activePow: null, powUntil: 0,
    px: isSide ? 140 : w * 0.5, py: isSide ? groundY - 22 : isSpace ? h - 76 : h * 0.5,
    vx: 0, vy: 0, facing: 1, aimAngle: -Math.PI / 2, grounded: isSide, jumpsLeft: 2,
    lastFire: 0, lastHurt: 0, invulnUntil: 0, spaceDir: 1,
    platforms, obstacles, coins, enemies, powerups,
    boss: { alive: false, x: w * 0.5, y: 110, r: 34, hp: Number(world?.bossConfig?.hp || 180), maxHp: Number(world?.bossConfig?.hp || 180), vx: 150, flash: 0, fireAt: 0 },
    shots: Array.from({ length: 28 }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 })),
    eShots: Array.from({ length: 18 }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 })),
    particles: [], popups: [],
  };
}
