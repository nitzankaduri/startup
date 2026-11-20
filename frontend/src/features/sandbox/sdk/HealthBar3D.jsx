import { Html } from '@react-three/drei';

/** Warm-editorial world-space floating health/posture/progress bar (strictly zero neon colors). */
export function HealthBar3D({
  current = 100,
  max = 100,
  position = [0, 2.3, 0],
  label = '',
  width = 76,
  showWhenFull = false,
  tone = 'terracotta',
}) {
  const safeMax = Math.max(1, Number(max) || 100);
  const clamped = Math.max(0, Math.min(safeMax, Number(current) || 0));
  const pct = Math.round((clamped / safeMax) * 100);
  if (!showWhenFull && pct >= 100) return null;

  const fillColor = tone === 'emerald' ? '#2E7D32' : tone === 'amber' ? '#B45309' : '#D96B27';
  return (
    <Html position={position} center distanceFactor={12} zIndexRange={[10, 0]}>
      <div className="pointer-events-none flex flex-col items-center gap-1 select-none">
        {label && (
          <span className="px-1.5 py-0.5 rounded-md bg-[#FAF9F6]/90 border border-[#E6E2D8] text-[9px] font-semibold tracking-wide text-[#181715] shadow-sm whitespace-nowrap">
            {label}
          </span>
        )}
        <div
          style={{ width }}
          className="h-2 rounded-full bg-[#181715]/85 border border-[#E6E2D8]/80 overflow-hidden p-[1px] shadow-sm"
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%`, backgroundColor: fillColor }}
          />
        </div>
      </div>
    </Html>
  );
}
