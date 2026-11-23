import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { subscribeFreezeBus } from '../kernel/kernelFreezeBus';

/** Displays PAUSED • LIVE EDIT MODE banner while editing and crisp 3... 2... 1... GO! resume countdown. */
export function FreezeEditOverlay() {
  const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const [bus, setBus] = useState({ paused: false, countdownText: '' });

  useEffect(() => subscribeFreezeBus(setBus), []);

  return (
    <>
      {isEditorOpen && (
        <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full bg-[#111622]/92 border border-[#232E42] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#F1F5F9] shadow-md">
          <Pencil className="w-3.5 h-3.5 text-[#D96B27]" />
          <span>PAUSED • LIVE EDIT MODE</span>
        </div>
      )}
      {bus.countdownText && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="rounded-3xl bg-[#111622]/88 border border-[#232E42] px-8 py-4 text-4xl font-bold tracking-tight text-[#F1F5F9] shadow-2xl">
            <span className={bus.countdownText === 'GO!' ? 'text-[#D96B27]' : ''}>{bus.countdownText}</span>
          </div>
        </div>
      )}
    </>
  );
}
