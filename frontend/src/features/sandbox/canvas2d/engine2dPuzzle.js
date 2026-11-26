import { playArcadeSfx } from '../kernel/ArcadeSoundEngine';

const TILE_STYLES = {
  2: ['#FAF9F6', '#181715'], 4: ['#FDE68A', '#181715'], 8: ['#FDBA74', '#181715'],
  16: ['#FB923C', '#FFFFFF'], 32: ['#EA580C', '#FFFFFF'], 64: ['#D96B27', '#FFFFFF'],
  128: ['#F59E0B', '#181715'], 256: ['#EAB308', '#181715'], 512: ['#CA8A04', '#FFFFFF'],
  1024: ['#181715', '#FDE68A'], 2048: ['#D96B27', '#FFFFFF'],
};

let uid = 1;
const bestKey = (n) => `spawn-2048-best-${n}`;
const readBest = (n) => { try { return Number(localStorage.getItem(bestKey(n)) || 0); } catch { return 0; } };
const writeBest = (n, v) => { try { localStorage.setItem(bestKey(n), String(v)); } catch { /* ignore */ } };

function spawnTile(st, val = null) {
  const empty = [];
  for (let r = 0; r < st.gridSize; r += 1) for (let c = 0; c < st.gridSize; c += 1) if (!st.grid[r][c]) empty.push([r, c]);
  if (!empty.length) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const v = val || (Math.random() < 0.9 ? 2 : 4);
  st.grid[r][c] = { id: uid += 1, val: v, r, c, fromR: r, fromC: c, slideT: 1, popT: 0 };
  st.maxTile = Math.max(st.maxTile, v);
  return true;
}

function hasMoves(st) {
  const n = st.gridSize;
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) {
    const cur = st.grid[r][c]?.val;
    if (!cur) return true;
    if (r + 1 < n && st.grid[r + 1][c]?.val === cur) return true;
    if (c + 1 < n && st.grid[r][c + 1]?.val === cur) return true;
  }
  return false;
}

export function createGridPuzzleState(world, width = 1280, height = 720) {
  const gridSize = Math.max(3, Math.min(6, Number(world?.gridSize || 4)));
  const targetTile = Math.max(64, Number(world?.targetTile || 2048));
  const st = {
    mode: '2d_grid_puzzle', isPuzzle: true, isSide: false, isTopDown: false, isSpace: false,
    w: width, h: height, gridSize, targetTile, targetCount: targetTile, waveCount: 1,
    timer: Number(world?.rules?.timeLimit || 300), hp: 100, score: 0, bestScore: readBest(gridSize),
    maxTile: 2, kills: 0, coinsGot: 0, wave: 1, vx: 0, vy: 0, goalType: 'collect_and_escape',
    pal: { sky: '#F6F4EF', ground: '#EFECE4', track: '#E6E2D8', primary: '#D96B27', secondary: '#F59E0B', accent: '#181715', ...(world?.palette || {}) },
    tileLabels: world?.tileLabels || null,
    grid: Array.from({ length: gridSize }, () => Array(gridSize).fill(null)),
    popups: [], shake: 0, activePow: null, powUntil: 0, wonSent: false,
  };
  spawnTile(st, 2); spawnTile(st, Math.random() < 0.8 ? 2 : 4);
  return st;
}

export function moveGridPuzzle(st, dir, cb) {
  const n = st.gridSize;
  const dr = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
  const dc = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
  if (!dr && !dc) return false;
  let moved = false; let mergedPts = 0;
  const next = Array.from({ length: n }, () => Array(n).fill(null));

  for (let i = 0; i < n; i += 1) {
    const line = [];
    for (let j = 0; j < n; j += 1) {
      const r = dr === 1 ? n - 1 - j : dr === -1 ? j : i;
      const c = dc === 1 ? n - 1 - j : dc === -1 ? j : i;
      const cell = st.grid[r][c];
      if (cell) line.push(cell);
    }
    let outIdx = 0;
    for (let k = 0; k < line.length; k += 1) {
      const a = line[k];
      const b = line[k + 1];
      const tr = dr === 1 ? n - 1 - outIdx : dr === -1 ? outIdx : i;
      const tc = dc === 1 ? n - 1 - outIdx : dc === -1 ? outIdx : i;
      if (b && a.val === b.val) {
        const nv = a.val * 2;
        next[tr][tc] = { id: uid += 1, val: nv, r: tr, c: tc, fromR: b.r, fromC: b.c, slideT: 0, popT: 0 };
        mergedPts += nv; st.maxTile = Math.max(st.maxTile, nv);
        if (st.popups.length < 16) st.popups.push({ r: tr, c: tc, text: `+${nv}`, life: 0.7 });
        moved = true; k += 1;
      } else {
        if (a.r !== tr || a.c !== tc) moved = true;
        next[tr][tc] = { ...a, r: tr, c: tc, fromR: a.r, fromC: a.c, slideT: 0, popT: 1 };
      }
      outIdx += 1;
    }
  }
  if (!moved) return false;
  st.grid = next; st.score += mergedPts; st.coinsGot = st.maxTile;
  if (st.score > st.bestScore) { st.bestScore = st.score; writeBest(n, st.bestScore); }
  playArcadeSfx(mergedPts > 0 ? 'coin' : 'jump');
  spawnTile(st);
  if (st.maxTile >= st.targetTile && !st.wonSent) { st.wonSent = true; playArcadeSfx('victory'); cb?.onWin?.(); }
  else if (!hasMoves(st)) cb?.onLose?.();
  return true;
}

export function stepGridPuzzle(st, dt) {
  for (let r = 0; r < st.gridSize; r += 1) for (let c = 0; c < st.gridSize; c += 1) {
    const t = st.grid[r][c];
    if (!t) continue;
    if (t.slideT < 1) t.slideT = Math.min(1, t.slideT + dt / 0.11);
    if (t.popT < 1) t.popT = Math.min(1, t.popT + dt / 0.14);
  }
  st.popups = st.popups.filter((p) => { p.life -= dt; return p.life > 0; });
}

export function renderGridPuzzle(ctx, st) {
  const { w, h, gridSize: n, pal } = st;
  ctx.fillStyle = pal.sky || '#F6F4EF'; ctx.fillRect(0, 0, w, h);
  const boardPx = Math.min(w - 48, h - 220, 480);
  const bx = (w - boardPx) * 0.5; const by = Math.max(96, (h - boardPx) * 0.5 + 24);
  const gap = Math.max(8, Math.round(boardPx * 0.025));
  const cell = (boardPx - gap * (n + 1)) / n;

  const stats = [['SCORE', st.score], ['BEST', st.bestScore], [`TARGET ${st.targetTile}`, st.maxTile]];
  const cw = (boardPx - 16) / 3;
  stats.forEach(([lbl, val], i) => {
    const sx = bx + i * (cw + 8);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(sx, by - 64, cw, 52, 12); ctx.fill();
    ctx.strokeStyle = '#E6E2D8'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#6E6A61'; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(lbl, sx + cw * 0.5, by - 44);
    ctx.fillStyle = '#181715'; ctx.font = '700 17px Inter, sans-serif'; ctx.fillText(String(val), sx + cw * 0.5, by - 22);
  });

  ctx.fillStyle = '#D6D0C4'; ctx.beginPath(); ctx.roundRect(bx, by, boardPx, boardPx, 16); ctx.fill();
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) {
    ctx.fillStyle = '#EFECE4'; ctx.beginPath(); ctx.roundRect(bx + gap + c * (cell + gap), by + gap + r * (cell + gap), cell, cell, 10); ctx.fill();
  }
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) {
    const t = st.grid[r][c]; if (!t) continue;
    const ease = 1 - Math.pow(1 - t.slideT, 3);
    const rr = t.fromR + (t.r - t.fromR) * ease; const cc = t.fromC + (t.c - t.fromC) * ease;
    const pop = t.popT < 1 ? 0.85 + Math.sin(t.popT * Math.PI) * 0.22 : 1;
    const cx = bx + gap + cc * (cell + gap) + cell * 0.5; const cy = by + gap + rr * (cell + gap) + cell * 0.5;
    const s = cell * pop; const [bg, fg] = TILE_STYLES[t.val] || ['#181715', '#FFFFFF'];
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx - s * 0.5, cy - s * 0.5, s, s, 10); ctx.fill();
    ctx.fillStyle = fg; ctx.font = `700 ${Math.round(cell * (t.val >= 1024 ? 0.3 : t.val >= 128 ? 0.36 : 0.44))}px Inter, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(st.tileLabels?.[t.val] || String(t.val), cx, cy + 1);
  }
  ctx.textBaseline = 'alphabetic'; ctx.font = '700 14px Inter, sans-serif';
  st.popups.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 1.4); ctx.fillStyle = '#D96B27';
    ctx.fillText(p.text, bx + gap + p.c * (cell + gap) + cell * 0.5, by + gap + p.r * (cell + gap) - (1 - p.life) * 24);
  });
  ctx.globalAlpha = 1;
}
