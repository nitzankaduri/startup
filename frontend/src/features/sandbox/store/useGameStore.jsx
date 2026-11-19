import { create } from 'zustand';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { emitPopup, isPowerupActive, motionBus } from '../sdk/spawnSdk';
import { buildFreshRunState, computeFinalScore } from './gameStoreHelpers';

export const DASH_COOLDOWN_MS = 1400;

export const useGameStore = create((set, get) => ({
  currentGame: null, gameState: 'idle', score: 0, finalScore: 0, runnerScore: 0, combo: 1, nearMissAt: 0,
  totalCollectibles: 0, collectedIds: [], collectedKeys: [], passedCheckpointIds: [], checkpointsPassed: 0,
  totalCheckpoints: 0, kills: 0, targetKills: 8, currentWave: 1, totalWaves: 3, hp: 100, maxHp: 100,
  timeLeft: 90, speedKmh: 0, driftCharge: 0, driftBoosts: 0, runStartedAt: 0, runDurationMs: 0,
  bursts: [], gravity: -22, shakeAt: 0, hitMarkerAt: 0, lastDashAt: 0, isMuted: false, isEditorOpen: false,
  activePowerups: {}, hoverboardCooldownUntil: 0, customMeters: [], customActions: [], controlsHint: '',
  hasStarted: false, runId: 0, isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  startGame: () => set({ hasStarted: true, runStartedAt: performance.now() }),
  toggleEditor: () => set((s) => ({ isEditorOpen: !s.isEditorOpen })),
  setEditorOpen: (isEditorOpen) => set({ isEditorOpen }),
  toggleMute: () => set((s) => { const n = !s.isMuted; soundEngine.setMuted(n); return { isMuted: n }; }),
  setGame: (game) => set((s) => ({ currentGame: game, ...buildFreshRunState(game, s.runId, false) })),
  resetRun: () => set((s) => buildFreshRunState(s.currentGame, s.runId, true)),
  setGeneratedCode: (code) => set((s) => (s.currentGame ? { currentGame: { ...s.currentGame, game_config: { ...s.currentGame.game_config, code } } } : {})),
  registerHud: ({ meters, actions, controlsHint } = {}) => set((s) => ({
    ...(meters !== undefined ? { customMeters: Array.isArray(meters) ? meters : Object.entries(meters).map(([label, value]) => ({ label, value })) } : {}),
    ...(actions !== undefined ? { customActions: actions } : {}),
    ...(controlsHint !== undefined ? { controlsHint } : {}),
    ...(meters === undefined && actions === undefined && controlsHint === undefined ? s : {}),
  })),
  updateCurrentGameThumbnail: (thumbnail) => set((s) => (s.currentGame ? { currentGame: { ...s.currentGame, thumbnail } } : {})),
  updateCurrentGameScores: (scores) => set((s) => (s.currentGame ? { currentGame: { ...s.currentGame, scores } } : {})),

  updatePhysicsParams: ({ gravity, speed, jump_force }) => set((s) => {
    if (!s.currentGame) return {};
    const cfg = s.currentGame.game_config;
    return {
      ...(gravity !== undefined ? { gravity } : {}),
      currentGame: { ...s.currentGame, game_config: { ...cfg, player: { ...cfg.player, ...(speed !== undefined ? { speed } : {}), ...(jump_force !== undefined ? { jump_force } : {}) } } },
    };
  }),

  activatePowerup: (type, durationMs) => {
    const until = performance.now() + durationMs;
    motionBus.powerups[type] = until;
    soundEngine.playBoost();
    emitPopup(`${type === 'multiplier' ? '2X SCORE' : type.toUpperCase()}!`);
    set((s) => ({ activePowerups: { ...s.activePowerups, [type]: { until, duration: durationMs } } }));
  },

  shatterHoverboard: () => {
    motionBus.powerups.hoverboard = 0;
    soundEngine.playHoverboardShatter();
    emitPopup('SAVED!');
    set((s) => {
      const next = { ...s.activePowerups };
      delete next.hoverboard;
      return {
        activePowerups: next,
        hoverboardCooldownUntil: performance.now() + 4500,
        shakeAt: performance.now(),
        bursts: [...s.bursts, { id: `hb-${Date.now()}`, position: [motionBus.pos.x, motionBus.pos.y, motionBus.pos.z], color: '#D96B27' }],
      };
    });
  },

  collectItem: (itemId, position, color) => {
    const { collectedIds, gameState, combo } = get();
    if (gameState !== 'playing' || collectedIds.includes(itemId)) return;
    soundEngine.playCollect();
    const mult = combo * (isPowerupActive('multiplier') ? 2 : 1);
    const burst = position ? { id: `${itemId}-${Date.now()}`, position, color } : null;
    set((s) => ({
      collectedIds: [...s.collectedIds, itemId], score: s.score + 1,
      runnerScore: s.runnerScore + 25 * mult, bursts: burst ? [...s.bursts, burst] : s.bursts,
    }));
  },

  collectKey: (itemId, keyId, position, color) => {
    const { collectedIds, collectedKeys, gameState } = get();
    if (gameState !== 'playing' || collectedIds.includes(itemId)) return;
    soundEngine.playKeyUnlock();
    const tag = keyId || itemId;
    const burst = position ? { id: `${itemId}-${Date.now()}`, position, color } : null;
    set((s) => ({
      collectedIds: [...s.collectedIds, itemId],
      collectedKeys: collectedKeys.includes(tag) ? collectedKeys : [...collectedKeys, tag],
      bursts: burst ? [...s.bursts, burst] : s.bursts,
    }));
  },

  passCheckpoint: (id) => {
    const { passedCheckpointIds, gameState } = get();
    if (gameState !== 'playing' || passedCheckpointIds.includes(id)) return;
    soundEngine.playCollect();
    set((s) => ({ passedCheckpointIds: [...s.passedCheckpointIds, id], checkpointsPassed: s.checkpointsPassed + 1 }));
  },

  registerNearMiss: () => {
    soundEngine.playDash();
    const mult = isPowerupActive('multiplier') ? 2 : 1;
    emitPopup(`+${50 * mult} NEAR MISS!`);
    set((s) => ({ combo: Math.min(5, s.combo + 1), runnerScore: s.runnerScore + 50 * mult, nearMissAt: performance.now() }));
  },
  addRunnerPoints: (pts) => set((s) => ({ runnerScore: s.runnerScore + pts * s.combo * (isPowerupActive('multiplier') ? 2 : 1) })),
  registerDriftBoost: () => set((s) => ({ driftBoosts: s.driftBoosts + 1 })),
  registerKill: () => {
    const { gameState, kills, targetKills, currentGame } = get();
    if (gameState !== 'playing') return;
    const nextKills = kills + 1;
    set({ kills: nextKills });
    if (currentGame?.game_config?.game_mode === 'arena_shooter' && nextKills >= targetKills) get().triggerWin();
  },
  damagePlayer: (amount) => {
    const { gameState, hp } = get();
    if (gameState !== 'playing') return;
    const nextHp = Math.max(0, hp - amount);
    soundEngine.playDamage();
    set({ hp: nextHp, shakeAt: performance.now() });
    if (nextHp <= 0) get().triggerGameOver(true);
  },
  healPlayer: (amount) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),
  advanceWave: (wave) => set({ currentWave: wave }),
  setTelemetry: (patch) => set(patch),
  removeBurst: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),
  triggerDash: () => set({ lastDashAt: performance.now() }),
  triggerHitMarker: () => set({ hitMarkerAt: performance.now() }),
  triggerShake: () => set({ shakeAt: performance.now() }),
  triggerGameOver: (withShake = false) => {
    const s = get();
    if (s.gameState !== 'playing') return;
    soundEngine.playFail();
    const runDurationMs = Math.max(100, Math.round(performance.now() - s.runStartedAt));
    const finalScore = Math.max(Math.round(s.runnerScore), s.score * 100 + s.kills * 120 + s.checkpointsPassed * 150);
    set({ gameState: 'gameover', runDurationMs, finalScore, ...(withShake ? { shakeAt: performance.now() } : {}) });
  },
  triggerWin: () => {
    const s = get();
    if (s.gameState !== 'playing') return;
    soundEngine.playWin();
    const runDurationMs = Math.max(100, Math.round(performance.now() - s.runStartedAt));
    const finalScore = computeFinalScore({
      gameMode: s.currentGame?.game_config?.game_mode || 'platformer',
      collectedCount: s.score, kills: s.kills, checkpointsPassed: s.checkpointsPassed,
      timeLeft: s.timeLeft, driftBoosts: s.driftBoosts, runnerScore: s.runnerScore, runDurationMs,
    });
    set({ gameState: 'won', runDurationMs, finalScore });
  },
}));
