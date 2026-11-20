import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  { step: 1, label: '1/3 Designing game rules & mechanics...' },
  { step: 2, label: '2/3 Sculpting 3D world & physics...' },
  { step: 3, label: '3/3 Compiling & launching...' },
];

/** Warm-editorial multi-step pipeline progress pill displayed during Two-Stage synthesis. */
export function BuildProgressPill({ buildStage }) {
  const activeStep = buildStage?.step || 1;
  const activeLabel = buildStage?.label || STEPS[0].label;

  return (
    <div className="flex flex-col gap-2 w-full pt-2 border-t border-[#E6E2D8]/80 dark:border-[#232E42]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#181715] dark:text-[#F1F5F9]">
          <Loader2 className="w-3.5 h-3.5 text-[#D96B27] animate-spin shrink-0" />
          <span>{activeLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => {
            const done = activeStep > s.step;
            const current = activeStep === s.step;
            return (
              <span
                key={s.step}
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold transition-all border ${
                  done
                    ? 'bg-[#181715] dark:bg-[#F1F5F9] border-[#181715] dark:border-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14]'
                    : current
                    ? 'bg-[#EFECE4] dark:bg-[#182032] border-[#D96B27] text-[#D96B27]'
                    : 'bg-[#FAF9F6] dark:bg-[#111622] border-[#E6E2D8] dark:border-[#232E42] text-[#6E6A61] dark:text-[#94A3B8]'
                }`}
              >
                {done ? <Check className="w-2.5 h-2.5" /> : s.step}
              </span>
            );
          })}
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-[#EFECE4] dark:bg-[#182032] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#D96B27] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.round((activeStep / 3) * 100))}%` }}
        />
      </div>
    </div>
  );
}
