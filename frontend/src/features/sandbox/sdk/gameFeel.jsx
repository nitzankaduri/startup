import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
import { useSceneEditorStore } from '../store/useSceneEditorStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProgressionStore } from './progression/RunProgression';

const MAX_NUMBERS = 24;
const LIFETIME_MS = 850;
const TONE_CLASSES = {
  damage: 'bg-[#181715]/90 text-[#FAF9F6] border-[#D96B27]',
  crit: 'bg-[#D96B27] text-[#FFFFFF] border-[#FFF3E0] scale-110',
  score: 'bg-[#FFFFFF]/95 text-[#181715] border-[#E5B869]',
  heal: 'bg-[#2E7D32] text-[#FFFFFF] border-[#C5E1A5]',
  neutral: 'bg-[#EFECE4]/95 text-[#181715] border-[#E6E2D8]',
};

export const feelBus = { hitStopUntil: 0, slowFactor: 0.08, items: [], listeners: new Set() };
const notify = () => { const snap = [...feelBus.items]; feelBus.listeners.forEach((fn) => fn(snap)); };

export function resetFeelBus() { feelBus.hitStopUntil = 0; feelBus.slowFactor = 0.08; feelBus.items = []; notify(); }

/** Briefly freezes/slows simulation delta for crisp impact weight on crits, explosions, or heavy landings. */
export function triggerHitStop(durationMs = 45, slowFactor = 0.08) {
  const until = performance.now() + Math.max(10, durationMs);
  if (until > feelBus.hitStopUntil) feelBus.hitStopUntil = until;
  feelBus.slowFactor = Math.max(0.02, Math.min(1, slowFactor));
}

/** Returns clamped frame delta (<= 0.05s) scaled by active hit-stop time dilation. */
export function getFeelDelta(rawDelta) {
  const base = Math.min(0.05, Math.max(0.001, rawDelta));
  return performance.now() < feelBus.hitStopUntil ? base * feelBus.slowFactor : base;
}

/** Safe simulation loop wrapping useFrame: clamps dt <= 0.05s and pauses on PauseMenu / UpgradeModal / pre-start. */
export function useGameLoop(callback, priority = 0) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  return useFrame((state, rawDelta) => {
    const gs = useGameStore.getState();
    if (!gs.hasStarted || gs.gameState !== 'playing') return;
    if (useSettingsStore.getState().isPaused || useSceneEditorStore.getState().isEditMode || useProgressionStore.getState().draft) return;
    cbRef.current?.(state, getFeelDelta(rawDelta));
  }, priority);
}

/** Spawns an animated world-space floating damage or score number without touching per-frame React state. */
export function spawnFloatingNumber(position = [0, 1.5, 0], text = '-40', tone = 'damage') {
  const now = performance.now();
  const pos = Array.isArray(position)
    ? [position[0] || 0, position[1] ?? 1.5, position[2] || 0]
    : [position?.x || 0, position?.y ?? 1.5, position?.z || 0];
  const next = {
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    position: pos, text: String(text), tone: TONE_CLASSES[tone] ? tone : 'damage',
    createdAt: now, driftX: (Math.random() - 0.5) * 0.75,
  };
  feelBus.items = [...feelBus.items.slice(-(MAX_NUMBERS - 1)), next];
  notify();
}

function FloatingNumberItem({ item }) {
  const grpRef = useRef(null);
  useFrame(() => {
    const grp = grpRef.current;
    if (!grp) return;
    const t = Math.max(0, Math.min(1, (performance.now() - item.createdAt) / LIFETIME_MS));
    grp.position.set(item.position[0] + item.driftX * t, item.position[1] + (1 - Math.pow(1 - t, 3)) * 1.45, item.position[2]);
    grp.scale.setScalar(t < 0.16 ? 0.65 + (t / 0.16) * 0.55 : Math.max(0.4, 1.2 - t * 0.45));
    grp.visible = t < 1;
  });
  return (
    <group ref={grpRef} position={item.position}>
      <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold tabular-nums shadow-md whitespace-nowrap select-none ${TONE_CLASSES[item.tone]}`}>
          {item.text}
        </span>
      </Html>
    </group>
  );
}

/** Global Canvas overlay layer rendering spawned world-space damage & score popups. */
export function FloatingNumbersLayer() {
  const [items, setItems] = useState(() => feelBus.items);
  useEffect(() => { feelBus.listeners.add(setItems); return () => feelBus.listeners.delete(setItems); }, []);
  useEffect(() => {
    if (!items.length) return undefined;
    const id = setInterval(() => {
      const cutoff = performance.now() - LIFETIME_MS;
      const alive = feelBus.items.filter((x) => x.createdAt > cutoff);
      if (alive.length !== feelBus.items.length) { feelBus.items = alive; notify(); }
    }, 140);
    return () => clearInterval(id);
  }, [items.length]);
  return <group>{items.map((item) => <FloatingNumberItem key={item.id} item={item} />)}</group>;
}
