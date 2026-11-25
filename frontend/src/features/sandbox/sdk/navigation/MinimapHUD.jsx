import { useEffect, useState } from 'react';
import { Navigation2, Star } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { motionBus } from '../motionBus';
import { radarBus } from './radarBus';

const RADAR_RADIUS = 54;
const WORLD_RANGE = 42;

function toRadarXY(wx, wz, px, pz, yaw, worldRange = 42) {
  const dx = wx - px;
  const dz = wz - pz;
  const cos = Math.cos(-yaw);
  const sin = Math.sin(-yaw);
  const rx = dx * cos - dz * sin;
  const rz = dx * sin + dz * cos;
  const dist = Math.hypot(rx, rz);
  const clampDist = Math.min(worldRange, dist);
  const scale = dist > 0.001 ? (clampDist / worldRange) * (RADAR_RADIUS - 8) / dist : 0;
  return { x: RADAR_RADIUS + rx * scale, y: RADAR_RADIUS + rz * scale };
}

/** Compact top-down Minimap plotting player heading, enemies, collectibles, and active objectives. */
export function MinimapHUD() {
  const currentGame = useGameStore((s) => s.currentGame);
  const collectedIds = useGameStore((s) => s.collectedIds);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 70);
    return () => clearInterval(id);
  }, []);

  if (!currentGame || !hasStarted) return null;

  const px = motionBus.pos.x;
  const pz = motionBus.pos.z;
  const yaw = motionBus.yaw || 0;
  const worldRange = currentGame?.game_config?.world_json?.mode === 'open_world_sandbox' ? 75 : WORLD_RANGE;
  const dots = [];

  radarBus.blips.forEach((b) => {
    dots.push({ id: b.id, type: b.type, ...toRadarXY(b.position[0], b.position[2], px, pz, yaw, worldRange) });
  });

  const cfg = currentGame.game_config || {};
  (cfg.entities || []).forEach((e) => {
    if (collectedIds.includes(e.id)) return;
    if (e.type === 'collectible' || e.type === 'powerup') {
      dots.push({ id: e.id, type: 'collectible', ...toRadarXY(e.position[0], e.position[2], px, pz, yaw) });
    } else if (e.type.includes('bot')) {
      dots.push({ id: e.id, type: 'enemy', ...toRadarXY(e.position[0], e.position[2], px, pz, yaw) });
    }
  });
  const worldSpec = cfg.world_json || cfg.worldSpec;
  (worldSpec?.entities || []).forEach((e) => {
    if (collectedIds.includes(e.id) || radarBus.blips.has(e.id)) return;
    if (e.kind === 'collectible' || e.kind === 'checkpoint') {
      dots.push({ id: e.id, type: 'collectible', ...toRadarXY(e.position[0], e.position[2], px, pz, yaw) });
    } else if (e.kind === 'enemy' || e.kind === 'boss') {
      dots.push({ id: e.id, type: 'enemy', ...toRadarXY(e.position[0], e.position[2], px, pz, yaw) });
    }
  });
  if (cfg.goal?.position && !radarBus.blips.size) {
    dots.push({ id: 'cfg-goal', type: 'objective', ...toRadarXY(cfg.goal.position[0], cfg.goal.position[2], px, pz, yaw) });
  }

  return (
    <div className="pointer-events-none relative w-[108px] h-[108px] rounded-2xl bg-[#FFFFFF]/85 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] shadow-[0_4px_20px_rgba(24,22,18,0.08)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.45)] overflow-hidden">
      <div className="absolute inset-2 rounded-full border border-dashed border-[#E6E2D8]/80 dark:border-[#232E42]/90" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#181715] dark:text-[#F1F5F9]">
        <Navigation2 className="w-3.5 h-3.5 fill-current" />
      </div>

      {dots.map((d) => {
        if (d.type === 'objective') {
          return (
            <div key={d.id} style={{ left: d.x, top: d.y, transform: 'translate(-50%, -50%)' }} className="absolute text-[#2E7D32]">
              <Star className="w-3 h-3 fill-current" />
            </div>
          );
        }
        return (
          <span
            key={d.id}
            style={{ left: d.x, top: d.y, transform: 'translate(-50%, -50%)' }}
            className={`absolute rounded-full ${
              d.type === 'enemy' ? 'w-2 h-2 bg-[#D96B27]' : d.type === 'vehicle' ? 'w-2 h-2 bg-[#0284C7]' : 'w-1.5 h-1.5 bg-[#E5B869]'
            }`}
          />
        );
      })}
    </div>
  );
}
