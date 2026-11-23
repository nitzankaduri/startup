import { Shield, Sparkles, Zap } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

/** Top-center Boss HP bar & active power-up indicator pills for the imperative GameKernel. */
export function BossAndPowerupOverlay() {
  const customMeters = useGameStore((s) => s.customMeters);
  const boss = customMeters?.find((m) => m.label === 'BOSS');
  const activePow = customMeters?.find((m) => m.label === 'POWERUP');

  if (!boss && !activePow) return null;
  return (
    <div className="pointer-events-none flex flex-col items-center gap-2 mt-2">
      {boss && (
        <div className="w-72 rounded-xl bg-[#111622]/90 border border-[#232E42] px-3 py-2 shadow-md">
          <div className="flex justify-between text-[11px] font-semibold text-[#F1F5F9] mb-1">
            <span>BOSS</span>
            <span className="text-[#D96B27]">{boss.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#182032] overflow-hidden">
            <div className="h-full bg-[#D96B27] transition-all duration-150" style={{ width: `${Math.max(0, Math.min(100, Number(boss.pct ?? 100)))}%` }} />
          </div>
        </div>
      )}
      {activePow && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D96B27] text-white px-3 py-1 text-xs font-semibold shadow-sm">
          {String(activePow.value).includes('SHIELD') ? <Shield className="w-3.5 h-3.5" /> : String(activePow.value).includes('JET') ? <Zap className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{activePow.value}</span>
        </div>
      )}
    </div>
  );
}
