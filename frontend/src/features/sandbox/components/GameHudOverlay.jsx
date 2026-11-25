import { useEffect, useState } from 'react';
import { ArrowRight, Crosshair, RotateCcw, SlidersHorizontal, Target, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { LeaderboardPanel } from './LeaderboardPanel';

/** Mission briefing banner (2s), top-center objective progress bar, and Victory/Game Over score breakdown modal. */
export function GameHudOverlay({ onCopyChallenge, copied, onBackToLobby }) {
  const [showBrief, setShowBrief] = useState(true);
  const currentGame = useGameStore((s) => s.currentGame);
  const gameState = useGameStore((s) => s.gameState);
  const runId = useGameStore((s) => s.runId);
  const level = useGameStore((s) => s.level || 1);
  const goalLabel = useGameStore((s) => s.goalLabel);
  const goalValue = useGameStore((s) => s.goalValue);
  const goalPct = useGameStore((s) => s.goalPct);
  const accuracy = useGameStore((s) => s.accuracy ?? 100);
  const maxCombo = useGameStore((s) => s.maxCombo ?? 1);
  const kills = useGameStore((s) => s.kills ?? 0);
  const resetRun = useGameStore((s) => s.resetRun);
  const advanceNextLevel = useGameStore((s) => s.advanceNextLevel);
  const toggleEditor = useGameStore((s) => s.toggleEditor);

  const worldSpec = currentGame?.game_config?.world_json || currentGame?.game_config?.worldSpec;
  const missionText = goalLabel || worldSpec?.objectiveText || 'Complete the Objective';

  useEffect(() => {
    setShowBrief(true);
    const id = setTimeout(() => setShowBrief(false), 2200);
    return () => clearTimeout(id);
  }, [runId, currentGame?.id]);

  const isEnded = gameState === 'won' || gameState === 'gameover';

  return (
    <>
      {worldSpec && gameState === 'playing' && (
        <div className="pointer-events-none flex flex-col items-center gap-2 mt-1">
          <div className="flex items-center gap-3 rounded-2xl bg-[#FFFFFF]/88 dark:bg-[#111622]/88 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] px-4 py-1.5 shadow-sm">
            <Target className="w-3.5 h-3.5 text-[#D96B27]" />
            <span className="text-xs font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">
              {missionText}: <span className="text-[#D96B27]">{goalValue || '0'}</span>
            </span>
            <div className="w-24 h-1.5 rounded-full bg-[#EFECE4] dark:bg-[#182032] overflow-hidden">
              <div className="h-full bg-[#D96B27] transition-all duration-150" style={{ width: `${Math.max(4, Math.min(100, goalPct || 0))}%` }} />
            </div>
            {level > 1 && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EFECE4] dark:bg-[#182032] text-[#6E6A61] dark:text-[#94A3B8]">Lv.{level}</span>}
          </div>

          {showBrief && (
            <div className="mt-2 rounded-2xl bg-[#181715]/92 dark:bg-[#111622]/95 border border-[#D96B27]/60 px-6 py-3 text-center shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#D96B27]">Mission · Level {level}</div>
              <div className="text-base font-semibold tracking-tight text-[#F6F4EF] dark:text-[#F1F5F9] mt-0.5">
                MISSION: {missionText}
              </div>
            </div>
          )}
        </div>
      )}

      {isEnded && (
        <div className="pointer-events-auto self-center my-auto w-full max-w-md bg-[#FFFFFF]/95 dark:bg-[#111622]/95 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-6 shadow-[0_8px_32px_rgba(24,22,18,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex flex-col gap-4 text-center">
          <div className="flex flex-col items-center gap-1">
            {gameState === 'won' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#EFECE4] dark:bg-[#182032] text-[#D96B27] text-[11px] font-semibold">
                <Trophy className="w-3 h-3" /> Level {level} Complete
              </span>
            )}
            <h2 className="text-xl font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">
              {gameState === 'won' ? 'Victory' : 'Game Over'}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-2.5">
              <div className="text-[10px] uppercase text-[#6E6A61] dark:text-[#94A3B8]">Accuracy</div>
              <div className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums inline-flex items-center gap-1 mt-0.5">
                <Crosshair className="w-3 h-3 text-[#D96B27]" />{accuracy}%
              </div>
            </div>
            <div className="rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-2.5">
              <div className="text-[10px] uppercase text-[#6E6A61] dark:text-[#94A3B8]">Max Combo</div>
              <div className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums mt-0.5">x{maxCombo}</div>
            </div>
            <div className="rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-2.5">
              <div className="text-[10px] uppercase text-[#6E6A61] dark:text-[#94A3B8]">Eliminations</div>
              <div className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums mt-0.5">{kills}</div>
            </div>
          </div>

          <LeaderboardPanel onCopyChallenge={onCopyChallenge} copied={copied} />

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {gameState === 'won' && worldSpec && (
              <button type="button" onClick={advanceNextLevel} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white text-xs font-semibold transition">
                <span>Next Level (+25%)</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button type="button" onClick={resetRun} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium hover:bg-[#2E2C28] dark:hover:bg-[#E2E8F0]">
              <RotateCcw className="w-3.5 h-3.5" /><span>Play Again</span>
            </button>
            <button type="button" onClick={toggleEditor} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] text-xs font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D96B27]" /><span>Edit World</span>
            </button>
            <button type="button" onClick={onBackToLobby} className="px-3.5 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#6E6A61] dark:text-[#94A3B8] text-xs font-medium">
              New Prompt
            </button>
          </div>
        </div>
      )}
    </>
  );
}
