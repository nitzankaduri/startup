import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { useGameStore } from '../../store/useGameStore';
import { recordComboEvent } from '../progression/RunProgression';
import { emitPopup } from '../motionBus';

/** Built-in mission, health, wave & objective state machine synced with Spawn.gg HUD, win/lose modals & restart. */
export function useMissionState({
  initialHp = 100,
  totalWaves = 3,
  targetObjectives = 3,
  targetScore = 0,
  controlsHint = '',
  extraMeters = null,
  objectiveLabel = 'Objectives',
  onVictory,
  onDefeat,
} = {}) {
  const hasStarted = useGameStore((s) => s.hasStarted);
  const storeGameState = useGameStore((s) => s.gameState);
  const runId = useGameStore((s) => s.runId);
  const registerHud = useGameStore((s) => s.registerHud);
  const triggerWin = useGameStore((s) => s.triggerWin);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);
  const setTelemetry = useGameStore((s) => s.setTelemetry);

  const [state, setState] = useState({
    score: 0, hp: initialHp, maxHp: initialHp, wave: 1, totalWaves,
    objectivesCompleted: 0, targetObjectives, combo: 1, outcome: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState({
      score: 0, hp: initialHp, maxHp: initialHp, wave: 1, totalWaves,
      objectivesCompleted: 0, targetObjectives, combo: 1, outcome: null,
    });
  }, [runId, initialHp, totalWaves, targetObjectives]);

  const phase = state.outcome || (storeGameState === 'won' ? 'victory' : storeGameState === 'gameover' ? 'defeat' : hasStarted ? 'playing' : 'ready');

  useEffect(() => {
    const meters = [
      { id: 'hp', label: 'HP', value: `${state.hp}/${state.maxHp}` },
      { id: 'score', label: 'Score', value: state.score },
      { id: 'wave', label: 'Wave', value: `${state.wave}/${state.totalWaves}` },
      { id: 'obj', label: objectiveLabel, value: `${state.objectivesCompleted}/${state.targetObjectives}` },
    ];
    if (extraMeters) {
      Object.entries(extraMeters).forEach(([k, v]) => meters.push({ id: k, label: k, value: v }));
    }
    registerHud({ meters, ...(controlsHint ? { controlsHint } : {}) });
  }, [state, controlsHint, extraMeters, objectiveLabel, registerHud]);

  const addScore = useCallback((pts = 100, label = '') => {
    setState((s) => {
      const next = s.score + pts;
      setTelemetry({ runnerScore: next, score: next });
      if (targetScore > 0 && next >= targetScore && !s.outcome) {
        triggerWin(); onVictory?.();
        return { ...s, score: next, combo: Math.min(5, s.combo + 1), outcome: 'victory' };
      }
      return { ...s, score: next, combo: Math.min(5, s.combo + 1) };
    });
    if (label) recordComboEvent(label);
    soundEngine.playCollect();
  }, [setTelemetry, targetScore, triggerWin, onVictory]);

  const damage = useCallback((amt = 15) => {
    soundEngine.playDamage();
    useGameStore.getState().triggerShake();
    setState((s) => {
      const nextHp = Math.max(0, s.hp - amt);
      setTelemetry({ hp: nextHp });
      if (nextHp <= 0 && !s.outcome) {
        triggerGameOver(true); onDefeat?.();
        return { ...s, hp: 0, combo: 1, outcome: 'defeat' };
      }
      return { ...s, hp: nextHp, combo: 1 };
    });
  }, [setTelemetry, triggerGameOver, onDefeat]);

  const heal = useCallback((amt = 25) => {
    setState((s) => {
      const nextHp = Math.min(s.maxHp, s.hp + amt);
      setTelemetry({ hp: nextHp });
      return { ...s, hp: nextHp };
    });
  }, [setTelemetry]);

  const triggerVictory = useCallback(() => {
    setState((s) => ({ ...s, outcome: 'victory' }));
    triggerWin(); onVictory?.();
  }, [triggerWin, onVictory]);

  const triggerDefeat = useCallback(() => {
    setState((s) => ({ ...s, outcome: 'defeat' }));
    triggerGameOver(true); onDefeat?.();
  }, [triggerGameOver, onDefeat]);

  const completeObjective = useCallback((label = 'Objective Complete') => {
    emitPopup(label);
    recordComboEvent(label);
    setState((s) => {
      const nextObj = s.objectivesCompleted + 1;
      const nextScore = s.score + 250;
      setTelemetry({ runnerScore: nextScore, score: nextScore });
      if (nextObj >= s.targetObjectives) {
        triggerWin(); onVictory?.();
        return { ...s, objectivesCompleted: nextObj, score: nextScore, outcome: 'victory' };
      }
      return { ...s, objectivesCompleted: nextObj, score: nextScore };
    });
  }, [setTelemetry, triggerWin]);

  const advanceWave = useCallback(() => {
    setState((s) => {
      const nextWave = Math.min(s.totalWaves + 1, s.wave + 1);
      emitPopup(`WAVE ${nextWave}`);
      return { ...s, wave: nextWave };
    });
  }, []);

  const resetMission = useCallback(() => { useGameStore.getState().resetRun(); }, []);

  return {
    ...state, phase, stateRef,
    addScore, damage, heal, completeObjective, advanceWave, triggerVictory, triggerDefeat, resetMission,
  };
}
