import { useEffect, useRef, useState } from 'react';
import { motionBus } from '../sdk/spawnSdk';

const ANGLES = [10, 28, 152, 170, 190, 208, 332, 350, 44, 136, 224, 316];

export function SpeedEffects() {
  const containerRef = useRef(null);
  const [popups, setPopups] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    let rafId;
    const tick = () => {
      const el = containerRef.current;
      if (el) {
        const speed = Math.hypot(motionBus.vel.x, motionBus.vel.z);
        const speedRatio = speed / 26;
        const opacity = motionBus.isBoosting
          ? 0.65
          : speedRatio >= 0.75
          ? Math.min(0.55, (speedRatio - 0.75) * 2.2)
          : 0;
        el.style.opacity = opacity.toFixed(2);
      }

      const now = performance.now();
      const fresh = motionBus.popups.filter((p) => now - p.at < 950);
      motionBus.popups = fresh;
      const key = fresh.map((p) => p.id).join(',');
      if (!seenRef.current.has(key)) {
        seenRef.current = new Set([key]);
        setPopups([...fresh]);
      }

      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden transition-opacity duration-150"
      >
        {ANGLES.map((deg, idx) => (
          <span
            key={idx}
            style={{ transform: `rotate(${deg}deg) translateX(40vw)` }}
            className="absolute left-1/2 top-1/2 w-28 h-[1.5px] -mt-[1px] bg-gradient-to-r from-transparent to-[#FFF3E0]/75 rounded-full"
          />
        ))}
      </div>

      {popups.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-20 flex flex-col items-center gap-2">
          {popups.map((p) => (
            <div
              key={p.id}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF]/92 dark:bg-[#111622]/92 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] text-xs font-semibold tracking-tight text-[#D96B27] shadow-[0_4px_16px_rgba(24,22,18,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] animate-bounce"
            >
              {p.text}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
