import { Coins, Crosshair, Flag, Gauge, Heart, Shield, Target, Zap } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export { HUDActionButtons, SynthesisStatusPill } from './HudStatusPills';

export const MODE_HINTS = {
  platformer: 'WASD / Arrows · Space jump · E / 2x Space Hoverboard · Shift dash · R restart',
  arcade_runner: 'A / D lanes · W / Space jump · S roll/slam · E / 2x Space Hoverboard · R restart',
  arena_shooter: 'WASD move · Click / F fire · Space jump · Shift dash · R restart',
  survival_waves: 'WASD move · Click / F fire · Survive all waves · R restart',
  time_trial_racer: 'W / S drive · A / D steer · Space handbrake · Shift nitro boost · R restart',
};

const TXT = 'text-[#181715] dark:text-[#F1F5F9]';
const MUTED = 'text-[#6E6A61] dark:text-[#94A3B8]';
const DIV = 'h-3.5 w-px bg-[#E6E2D8] dark:bg-[#232E42]';

export function HUDModeWidgets({ gameMode }) {
  const customMeters = useGameStore((s) => s.customMeters);
  const worldSpec = useGameStore((s) => s.currentGame?.game_config?.world_json || s.currentGame?.game_config?.worldSpec);
  const cash = useGameStore((s) => s.cash ?? 0);
  const score = useGameStore((s) => s.score);
  const runnerScore = useGameStore((s) => s.runnerScore);
  const combo = useGameStore((s) => s.combo);
  const totalCollectibles = useGameStore((s) => s.totalCollectibles);
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const kills = useGameStore((s) => s.kills);
  const targetKills = useGameStore((s) => s.targetKills);
  const currentWave = useGameStore((s) => s.currentWave);
  const totalWaves = useGameStore((s) => s.totalWaves);
  const speedKmh = useGameStore((s) => s.speedKmh);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const checkpointsPassed = useGameStore((s) => s.checkpointsPassed);
  const totalCheckpoints = useGameStore((s) => s.totalCheckpoints);

  if (customMeters.length > 0) {
    return (
      <div className="flex items-center gap-3 px-1">
        {customMeters.map((m, idx) => (
          <div key={m.id || m.label || idx} className="flex items-center gap-3">
            {idx > 0 && <span className={DIV} />}
            <span className={`text-xs font-medium tabular-nums ${MUTED}`}>
              {typeof m.label === 'object' ? '' : m.label}: <strong className={`font-semibold ${TXT}`}>{typeof m.value === 'object' ? '' : m.value}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (worldSpec) {
    return (
      <div className="flex items-center gap-3 px-1">
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Heart className="w-3.5 h-3.5 text-[#D96B27]" />{hp}</span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Target className={`w-3.5 h-3.5 ${MUTED}`} />{Math.round(runnerScore)}/{worldSpec.rules?.targetScore || 500}</span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Coins className="w-3.5 h-3.5 text-[#D96B27]" />${cash}</span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${MUTED}`}><Gauge className="w-3.5 h-3.5" />{speedKmh} km/h</span>
        <span className={DIV} />
        <span className={`text-xs font-medium tabular-nums ${TXT}`}>{timeLeft.toFixed(0)}s</span>
      </div>
    );
  }

  if (gameMode === 'arcade_runner') {
    return (
      <div className="flex items-center gap-3 px-1">
        <span className={`text-xs font-semibold tabular-nums ${TXT}`}>{Math.round(runnerScore)} pts</span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold tabular-nums ${combo > 1 ? 'bg-[#D96B27] text-[#F6F4EF]' : 'bg-[#EFECE4] dark:bg-[#182032] text-[#181715] dark:text-[#F1F5F9]'}`}>
          <Zap className="w-3 h-3" />x{combo}
        </span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${MUTED}`}>
          <Gauge className="w-3.5 h-3.5" />{speedKmh} km/h
        </span>
      </div>
    );
  }

  if (gameMode === 'time_trial_racer') {
    return (
      <div className="flex items-center gap-3 px-1">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium tabular-nums ${TXT}`}><Gauge className="w-3.5 h-3.5 text-[#D96B27]" />{speedKmh} km/h</span>
        <span className={DIV} />
        <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Flag className={`w-3.5 h-3.5 ${MUTED}`} />{checkpointsPassed}/{totalCheckpoints}</span>
        <span className={DIV} />
        <span className={`text-xs font-medium tabular-nums ${TXT}`}>{timeLeft.toFixed(1)}s</span>
      </div>
    );
  }

  if (gameMode === 'arena_shooter' || gameMode === 'survival_waves') {
    return (
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5" title="Player HP">
          <Heart className="w-3.5 h-3.5 text-[#D96B27]" />
          <div className="w-16 h-1.5 rounded-full bg-[#EFECE4] dark:bg-[#182032] overflow-hidden"><div className="h-full bg-[#D96B27] transition-all" style={{ width: `${(hp / Math.max(1, maxHp)) * 100}%` }} /></div>
          <span className={`text-[11px] font-medium tabular-nums ${TXT}`}>{hp}</span>
        </div>
        <span className={DIV} />
        {gameMode === 'survival_waves' ? (
          <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Shield className={`w-3.5 h-3.5 ${MUTED}`} />Wave {currentWave}/{totalWaves}</span>
        ) : (
          <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${TXT}`}><Target className={`w-3.5 h-3.5 ${MUTED}`} />{kills}/{targetKills}</span>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tabular-nums px-1 ${TXT}`}>
      <Crosshair className="w-3.5 h-3.5 text-[#D96B27]" />
      {score} / {totalCollectibles}
    </span>
  );
}
