import { useEffect, useRef } from 'react';

/** Lightweight 500ms-throttled live FPS badge (zero React re-renders). */
export function FpsBadge() {
  const textRef = useRef(null);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let rafId = 0;
    const tick = (now) => {
      frames += 1;
      const elapsed = now - last;
      if (elapsed >= 500) {
        const fps = Math.round((frames * 1000) / elapsed);
        if (textRef.current) textRef.current.textContent = `${fps} FPS`;
        frames = 0;
        last = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={textRef}
      className="pointer-events-none select-none rounded-lg border border-[#E6E2D8] bg-[#FFFFFF]/90 px-2.5 py-1 text-xs font-semibold tabular-nums text-[#181715] shadow-sm dark:border-[#232E42] dark:bg-[#111622]/90 dark:text-[#F1F5F9]"
    >
      60 FPS
    </div>
  );
}
