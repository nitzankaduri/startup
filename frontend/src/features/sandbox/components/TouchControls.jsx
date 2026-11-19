import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Crosshair, Wind } from 'lucide-react';
import { touchInput } from '../hooks/touchInputState';
import { useGameStore } from '../store/useGameStore';

export function TouchControls() {
  const [isTouch, setIsTouch] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const padRef = useRef(null);
  const currentGame = useGameStore((s) => s.currentGame);
  const gameState = useGameStore((s) => s.gameState);

  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
    setIsTouch(Boolean(coarse || navigator.maxTouchPoints > 0));
    return () => {
      touchInput.moveX = 0;
      touchInput.moveZ = 0;
      touchInput.jump = false;
      touchInput.dash = false;
    };
  }, []);

  if (!isTouch || gameState !== 'playing') return null;

  const mode = currentGame?.game_config?.game_mode || 'platformer';
  const isCombat = mode === 'arena_shooter' || mode === 'survival_waves';

  const updateStick = (clientX, clientY) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxR = rect.width * 0.38;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(maxR, dist);
    setKnob({ x: (dx / dist) * clamped, y: (dy / dist) * clamped });
    touchInput.moveX = (dx / dist) * (clamped / maxR);
    touchInput.moveZ = (dy / dist) * (clamped / maxR);
  };

  const resetStick = () => {
    setKnob({ x: 0, y: 0 });
    touchInput.moveX = 0;
    touchInput.moveZ = 0;
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-14 z-30 flex items-end justify-between px-6 select-none">
      <div
        ref={padRef}
        onTouchStart={(e) => e.touches[0] && updateStick(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => e.touches[0] && updateStick(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={resetStick}
        onTouchCancel={resetStick}
        className="pointer-events-auto relative w-28 h-28 rounded-full bg-[#FFFFFF]/75 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] shadow-[0_4px_20px_rgba(24,22,18,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] flex items-center justify-center touch-none"
      >
        <div
          className="w-11 h-11 rounded-full bg-[#181715]/85 dark:bg-[#F1F5F9]/85"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <div className="pointer-events-auto flex items-center gap-3 touch-none">
        {isCombat ? (
          <button
            type="button"
            onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }))}
            className="w-14 h-14 rounded-full bg-[#FFFFFF]/85 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] shadow-[0_4px_20px_rgba(24,22,18,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] flex items-center justify-center"
          >
            <Crosshair className="w-5 h-5 text-[#D96B27]" />
          </button>
        ) : (
          <button
            type="button"
            onTouchStart={() => { touchInput.dash = true; }}
            onTouchEnd={() => { touchInput.dash = false; }}
            onTouchCancel={() => { touchInput.dash = false; }}
            className="w-14 h-14 rounded-full bg-[#FFFFFF]/85 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] shadow-[0_4px_20px_rgba(24,22,18,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] flex items-center justify-center"
          >
            <Wind className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onTouchStart={() => { touchInput.jump = true; }}
          onTouchEnd={() => { touchInput.jump = false; }}
          onTouchCancel={() => { touchInput.jump = false; }}
          className="w-16 h-16 rounded-full bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] shadow-[0_4px_20px_rgba(24,22,18,0.12)] flex items-center justify-center"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
