import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { create } from 'zustand';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const COMBO_WINDOW_MS = 4500;

export const DEFAULT_UPGRADES = [
  { id: 'rapid_fire', title: 'Rapid Fire +30%', desc: 'Boosts projectile fire rate and velocity by 30%.', icon: 'zap', stat: 'fireRate', mult: 1.3 },
  { id: 'kinetic_dash', title: 'Kinetic Dash', desc: 'Cuts dash cooldown and extends sprint burst momentum.', icon: 'wind', stat: 'dash', mult: 1.35 },
  { id: 'explosive_rounds', title: 'Explosive Rounds', desc: 'Adds concussive splash blast & bonus impact knockback.', icon: 'flame', stat: 'damage', mult: 1.4 },
];

export const useProgressionStore = create((set) => ({
  streak: 0,
  multiplier: 1,
  lastEventAt: 0,
  lastLabel: '',
  draft: null,
  reset: () => set({ streak: 0, multiplier: 1, lastEventAt: 0, lastLabel: '', draft: null }),
  openDraft: (choices, onSelect) => {
    const items = (Array.isArray(choices) && choices.length ? choices : DEFAULT_UPGRADES).slice(0, 3);
    useSettingsStore.getState().setPaused(true);
    set({ draft: { choices: items, onSelect } });
  },
  closeDraft: () => {
    useSettingsStore.getState().setPaused(false);
    set({ draft: null });
  },
}));

/** Records a rapid combat or scoring beat, escalating streak multiplier (x1 -> x2 -> x3 -> x5). */
export function recordComboEvent(label = 'STREAK') {
  const now = performance.now();
  useProgressionStore.setState((s) => {
    const alive = now - s.lastEventAt <= COMBO_WINDOW_MS;
    const streak = alive ? s.streak + 1 : 1;
    const multiplier = streak >= 10 ? 5 : streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
    return { streak, multiplier, lastEventAt: now, lastLabel: label };
  });
}

export function resetProgression() {
  useProgressionStore.getState().reset();
}

/** Pauses active gameplay and opens a 3-card warm-editorial upgrade draft modal. */
export function triggerUpgradeDraft(choices = DEFAULT_UPGRADES, onSelect) {
  useProgressionStore.getState().openDraft(choices, onSelect);
}

/** Live streak & multiplier HUD pill with smoothly decaying timer bar. */
export function ComboStreakHUD() {
  const streak = useProgressionStore((s) => s.streak);
  const multiplier = useProgressionStore((s) => s.multiplier);
  const lastEventAt = useProgressionStore((s) => s.lastEventAt);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.gameState !== 'playing') return;
      if (state.kills > prev.kills) recordComboEvent('ELIMINATION');
      else if (state.checkpointsPassed > prev.checkpointsPassed) recordComboEvent('CHECKPOINT');
      else if (state.driftBoosts > prev.driftBoosts) recordComboEvent('DRIFT BOOST');
      else if (state.score > prev.score) recordComboEvent('COLLECT');
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!lastEventAt || streak <= 0) { setRatio(0); return undefined; }
    let rafId;
    const tick = () => {
      const rem = Math.max(0, 1 - (performance.now() - lastEventAt) / COMBO_WINDOW_MS);
      setRatio(rem);
      if (rem > 0) rafId = requestAnimationFrame(tick);
      else useProgressionStore.setState({ streak: 0, multiplier: 1, lastEventAt: 0 });
    };
    tick();
    return () => cancelAnimationFrame(rafId);
  }, [lastEventAt, streak]);

  if (streak <= 0 || ratio <= 0) return null;

  return (
    <div className="pointer-events-none self-start flex flex-col gap-1.5 bg-[#FFFFFF]/90 dark:bg-[#111622]/90 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl px-3.5 py-2 shadow-[0_4px_20px_rgba(24,22,18,0.08)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#D96B27] text-[#FFFFFF] text-[11px] font-bold tabular-nums">
          <Flame className="w-3 h-3 fill-current" />
          x{multiplier}
        </span>
        <span className="text-xs font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">
          {streak} Streak
        </span>
      </div>
      <div className="w-28 h-1.5 rounded-full bg-[#EFECE4] dark:bg-[#182032] overflow-hidden">
        <div className="h-full bg-[#D96B27] transition-[width] duration-75" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
