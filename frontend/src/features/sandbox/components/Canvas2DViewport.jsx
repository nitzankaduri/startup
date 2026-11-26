import { useEffect, useRef } from 'react';
import { create2dEngineState, handle2dKey, handle2dSwipe, render2dEngine, step2dEngine } from '../canvas2d/Studio2DEngine';
import { fireShot2d } from '../canvas2d/engine2dStep';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';

/** Full-viewport 60-120 FPS data-driven HTML5 Canvas 2D engine powering all 2D GameSpec modes. */
export function Canvas2DViewport({ world }) {
  const canvasRef = useRef(null);
  const stRef = useRef(null);
  const keysRef = useRef({});
  const ptrRef = useRef({ x: 400, y: 300, sx: 0, sy: 0, down: false });

  const runId = useGameStore((s) => s.runId);
  const gameState = useGameStore((s) => s.gameState);
  const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const isPaused = useSettingsStore((s) => s.isPaused);
  const setTelemetry = useGameStore((s) => s.setTelemetry);
  const registerHud = useGameStore((s) => s.registerHud);
  const triggerWin = useGameStore((s) => s.triggerWin);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);

  useEffect(() => {
    useSettingsStore.getState().setPaused(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    stRef.current = create2dEngineState(world, window.innerWidth, window.innerHeight);
    setTelemetry({ hp: 100, cash: 0, runnerScore: 0, speedKmh: 0, timeLeft: stRef.current.timer, kills: 0, currentWave: 1, totalWaves: stRef.current.waveCount || 1 });
    registerHud({ meters: [] });
    canvas.focus({ preventScroll: true });
  }, [runId, world, setTelemetry, registerHud]);

  useEffect(() => {
    const nav = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    const cb = { onWin: () => triggerWin(), onLose: () => triggerGameOver(true) };
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (nav.has(e.code)) e.preventDefault();
      if (!e.repeat || !stRef.current?.isPuzzle) handle2dKey(stRef.current, e.code, performance.now(), cb);
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [triggerWin, triggerGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0; let last = performance.now(); let lastHud = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stRef.current) { stRef.current.w = window.innerWidth; stRef.current.h = window.innerHeight; stRef.current.groundY = window.innerHeight - 92; }
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const st = stRef.current;
      if (st) {
        const frozen = isPaused || isEditorOpen || gameState === 'won' || gameState === 'gameover';
        if (!frozen) step2dEngine(st, keysRef.current, ptrRef.current, dt, now, { onWin: () => triggerWin(), onLose: () => triggerGameOver(true) });
        render2dEngine(ctx, st, now / 1000);
        if (now - lastHud > 100) {
          lastHud = now;
          const pct = st.isPuzzle ? (Math.log2(st.maxTile) / Math.log2(st.targetTile)) * 100
            : st.goalType === 'distance_race' ? (st.distance / st.targetDistance) * 100
              : st.goalType === 'survive_waves' ? ((st.wave - 1 + st.waveKills / st.waveTarget) / st.waveCount) * 100
                : st.goalType === 'eliminate_targets' ? (st.kills / st.targetCount) * 100 : (st.coinsGot / st.targetCount) * 100;
          setTelemetry({
            hp: st.hp, cash: st.score, runnerScore: st.score, kills: st.kills, currentWave: st.wave, totalWaves: st.waveCount || 1,
            speedKmh: frozen || st.isPuzzle ? 0 : Math.round(Math.hypot(st.vx, st.vy) * 0.25), timeLeft: st.timer,
            goalType: st.goalType, goalValue: st.isPuzzle ? `${st.maxTile}/${st.targetTile}` : (st.goalType === 'distance_race' ? `${Math.round(st.distance)}/${st.targetDistance}m` : `${st.coinsGot || st.kills}/${st.targetCount}`),
            goalPct: Math.min(100, Math.max(0, pct)),
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [gameState, isEditorOpen, isPaused, setTelemetry, triggerWin, triggerGameOver]);

  const cb = { onWin: () => triggerWin(), onLose: () => triggerGameOver(true) };
  return (
    <canvas
      ref={canvasRef}
      tabIndex={-1}
      onPointerMove={(e) => { ptrRef.current.x = e.clientX; ptrRef.current.y = e.clientY; }}
      onPointerDown={(e) => {
        e.currentTarget.focus({ preventScroll: true });
        ptrRef.current.sx = e.clientX; ptrRef.current.sy = e.clientY; ptrRef.current.down = true;
        if (stRef.current && !stRef.current.isPuzzle) fireShot2d(stRef.current, performance.now());
      }}
      onPointerUp={(e) => {
        ptrRef.current.down = false;
        handle2dSwipe(stRef.current, e.clientX - ptrRef.current.sx, e.clientY - ptrRef.current.sy, cb);
      }}
      className="w-full h-full block outline-none cursor-pointer"
    />
  );
}
