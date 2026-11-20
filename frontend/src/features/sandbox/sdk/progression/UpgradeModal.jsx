import { useCallback, useEffect } from 'react';
import { Flame, Shield, Sparkles, Wind, Zap } from 'lucide-react';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { emitPopup } from '../motionBus';
import { useProgressionStore } from './RunProgression';

const ICONS = { zap: Zap, wind: Wind, flame: Flame, shield: Shield, sparkles: Sparkles };

/** 3-card warm-editorial mid-run upgrade draft modal selectable via click or keys 1 / 2 / 3. */
export function UpgradeModal() {
  const draft = useProgressionStore((s) => s.draft);
  const closeDraft = useProgressionStore((s) => s.closeDraft);

  const pickChoice = useCallback((choice, index) => {
    if (!draft) return;
    soundEngine.playBoost();
    emitPopup(choice.title || `Upgrade #${index + 1}`);
    const cb = draft.onSelect;
    closeDraft();
    cb?.(choice, index);
  }, [draft, closeDraft]);

  useEffect(() => {
    if (!draft) return undefined;
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const idx = e.code === 'Digit1' ? 0 : e.code === 'Digit2' ? 1 : e.code === 'Digit3' ? 2 : -1;
      if (idx >= 0 && draft.choices[idx]) {
        e.preventDefault();
        pickChoice(draft.choices[idx], idx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [draft, pickChoice]);

  if (!draft) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#181715]/35 dark:bg-[#0A0D14]/70 backdrop-blur-sm animate-fade-up">
      <div className="w-full max-w-2xl bg-[#FAF9F6] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-6 shadow-[0_18px_50px_rgba(24,22,18,0.18)] dark:shadow-[0_20px_54px_rgba(0,0,0,0.7)] flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#D96B27]">Upgrade Draft</span>
          <h2 className="text-xl font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">Choose Your Edge</h2>
          <p className="text-xs text-[#6E6A61] dark:text-[#94A3B8]">Click a card or press 1, 2, or 3</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {draft.choices.map((item, idx) => {
            const Icon = ICONS[item.icon] || Sparkles;
            return (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => pickChoice(item, idx)}
                className="group text-left bg-[#FFFFFF] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-4 shadow-[0_4px_20px_rgba(24,22,18,0.05)] hover:-translate-y-1 hover:border-[#D96B27] active:scale-[0.98] transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-[#EFECE4] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] flex items-center justify-center text-[#D96B27]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-[11px] font-bold tabular-nums">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9] group-hover:text-[#D96B27] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#6E6A61] dark:text-[#94A3B8]">
                    {item.desc || item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
