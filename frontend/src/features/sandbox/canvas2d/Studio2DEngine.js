import { createGridPuzzleState, moveGridPuzzle, renderGridPuzzle, stepGridPuzzle } from './engine2dPuzzle';
import { render2dWorld } from './engine2dRender';
import { create2dState, resolve2dMode } from './engine2dState';
import { fireShot2d, step2dWorld, triggerJump2d } from './engine2dStep';

const DIR_BY_CODE = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

export function create2dEngineState(world, width, height) {
  const mode = String(world?.mode || world?.archetype || '').toLowerCase();
  if (mode === '2d_grid_puzzle') return createGridPuzzleState(world, width, height);
  return create2dState(world, width, height);
}

export function step2dEngine(st, keys, ptr, dt, now, cb) {
  if (!st) return;
  if (st.isPuzzle) { stepGridPuzzle(st, dt); return; }
  step2dWorld(st, keys, ptr, dt, now, cb);
}

export function render2dEngine(ctx, st, t) {
  if (!st) return;
  if (st.isPuzzle) { renderGridPuzzle(ctx, st); return; }
  render2dWorld(ctx, st, t);
}

export function handle2dKey(st, code, now, cb) {
  if (!st) return;
  if (st.isPuzzle) { const dir = DIR_BY_CODE[code]; if (dir) moveGridPuzzle(st, dir, cb); return; }
  if (st.isSide && (code === 'Space' || code === 'KeyW' || code === 'ArrowUp')) triggerJump2d(st);
  if (code === 'KeyE' || code === 'KeyF') fireShot2d(st, now);
}

export function handle2dSwipe(st, dx, dy, cb) {
  if (!st?.isPuzzle || Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  moveGridPuzzle(st, dir, cb);
}

export { resolve2dMode };
