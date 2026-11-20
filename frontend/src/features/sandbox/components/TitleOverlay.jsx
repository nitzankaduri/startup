import { useEffect } from 'react';
import { Play } from 'lucide-react';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';

const START_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter']);
const CONTROL_PILLS = ['WASD', 'Mouse Aim / Click', 'Space'];

export function TitleOverlay() {
  const currentGame = useGameStore((s) => s.currentGame);
  const gameState = useGameStore((s) => s.gameState);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const controlsHint = useGameStore((s) => s.controlsHint);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    if (hasStarted || gameState === 'won' || gameState === 'gameover') return;
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (START_KEYS.has(e.code)) {
        soundEngine.startAmbient();
        startGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasStarted, gameState, startGame]);

  if (hasStarted || gameState === 'won' || gameState === 'gameover' || !currentGame) return null;

  const cfg = currentGame.game_config || {};
  const mission = cfg.architecture_plan?.rules_summary || currentGame.prompt || 'Explore the 3D world and complete the objective.';
  const pills = controlsHint ? controlsHint.split(/[·,]/).map((s) => s.trim()).filter(Boolean).slice(0, 4) : CONTROL_PILLS;

  const handlePlay = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    soundEngine.uiClick();
    soundEngine.startAmbient();
    startGame();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center p-6 bg-[#181715]/15 dark:bg-[#0A0D14]/35 backdrop-blur-[2px]">
      <div className="w-full max-w-md bg-[#FFFFFF]/95 dark:bg-[#111622]/95 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-6 shadow-[0_12px_40px_rgba(24,22,18,0.12)] dark:shadow-[0_14px_44px_rgba(0,0,0,0.6)] flex flex-col items-center text-center gap-4 animate-fade-up">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D96B27]">Ready To Launch</span>
        <h1 className="text-2xl font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">
          {currentGame.title}
        </h1>
        <p className="text-xs text-[#6E6A61] dark:text-[#94A3B8] leading-relaxed line-clamp-2">
          {mission}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          {pills.map((pill) => (
            <span
              key={pill}
              className="px-2.5 py-1 rounded-lg bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[11px] font-medium text-[#181715] dark:text-[#F1F5F9]"
            >
              {pill}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handlePlay}
          className="w-full py-2.5 px-6 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-semibold tracking-wide hover:bg-[#2E2C28] dark:hover:bg-[#E2E8F0] active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#D96B27]" />
          <span>PLAY</span>
        </button>
        <span className="text-[10px] text-[#6E6A61] dark:text-[#94A3B8]">Press WASD, Space, or click PLAY</span>
      </div>
    </div>
  );
}
