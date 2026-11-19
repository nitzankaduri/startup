import { useEffect, useState } from 'react';
import { Navigation2 } from 'lucide-react';
import { radarBus } from './radarBus';

/** Renders screen-edge directional arrows whenever an active ObjectiveBeacon is outside the camera frustum. */
export function ObjectivePointer() {
  const [pointers, setPointers] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = Array.from(radarBus.pointers.values());
      setPointers((prev) => (prev.length === 0 && next.length === 0 ? prev : next));
    }, 80);
    return () => clearInterval(id);
  }, []);

  if (!pointers.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pointers.map((ptr) => (
        <div
          key={ptr.id}
          style={{ left: `${ptr.edgeX}%`, top: `${ptr.edgeY}%`, transform: 'translate(-50%, -50%)' }}
          className="absolute flex flex-col items-center gap-0.5"
        >
          <div className="w-8 h-8 rounded-full bg-[#FFFFFF]/92 dark:bg-[#111622]/92 border border-[#E6E2D8] dark:border-[#232E42] shadow-md flex items-center justify-center">
            <Navigation2
              className="w-4 h-4 text-[#2E7D32] dark:text-[#4ADE80]"
              style={{ transform: `rotate(${ptr.angleDeg}deg)` }}
            />
          </div>
          <span className="px-1.5 py-0.5 rounded-md bg-[#181715]/85 dark:bg-[#0A0D14]/85 text-[#F6F4EF] text-[10px] font-semibold tabular-nums whitespace-nowrap">
            {ptr.dist}m
          </span>
        </div>
      ))}
    </div>
  );
}
