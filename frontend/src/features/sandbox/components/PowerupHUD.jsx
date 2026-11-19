import { useEffect, useState } from 'react';
import { Flame, Footprints, Magnet, Shield, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

const META = {
  jetpack: { label: 'Jetpack', icon: Flame },
  magnet: { label: 'Magnet', icon: Magnet },
  sneakers: { label: 'Sneakers', icon: Footprints },
  multiplier: { label: '2x Score', icon: Sparkles },
  hoverboard: { label: 'Board', icon: Shield },
};

export function PowerupHUD() {
  const activePowerups = useGameStore((s) => s.activePowerups);
  const [, setTick] = useState(0);

  const entries = Object.entries(activePowerups).filter(([, v]) => v.until > performance.now());

  useEffect(() => {
    if (!entries.length) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [entries.length]);

  if (!entries.length) return null;

  const now = performance.now();
  return (
    <div className="pointer-events-none flex flex-wrap items-center gap-2.5 self-start">
      {entries.map(([type, info]) => {
        const meta = META[type] || META.jetpack;
        const Icon = meta.icon;
        const remaining = Math.max(0, info.until - now);
        const pct = Math.max(0, Math.min(1, remaining / info.duration));
        const r = 10;
        const circ = 2 * Math.PI * r;

        return (
          <div
            key={type}
            className="flex items-center gap-2 bg-[#FFFFFF]/90 dark:bg-[#111622]/90 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl px-3 py-1.5 shadow-[0_4px_20px_rgba(24,22,18,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r={r} fill="none" className="stroke-[#EFECE4] dark:stroke-[#182032]" strokeWidth="2.5" />
                <circle
                  cx="12"
                  cy="12"
                  r={r}
                  fill="none"
                  stroke="#D96B27"
                  strokeWidth="2.5"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                  strokeLinecap="round"
                />
              </svg>
              <Icon className="w-3 h-3 text-[#181715] dark:text-[#F1F5F9] absolute" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-semibold text-[#181715] dark:text-[#F1F5F9]">{meta.label}</span>
              <span className="text-[10px] text-[#6E6A61] dark:text-[#94A3B8] tabular-nums">{(remaining / 1000).toFixed(1)}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
