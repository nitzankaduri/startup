import { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { remixGame } from '../../shared/api/gameApi';
import { useGameStore } from '../sandbox/store/useGameStore';

export function QuickEditDrawer({ onRemixed }) {
  const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const currentGame = useGameStore((s) => s.currentGame);
  const gravity = useGameStore((s) => s.gravity);
  const setEditorOpen = useGameStore((s) => s.setEditorOpen);
  const updatePhysicsParams = useGameStore((s) => s.updatePhysicsParams);

  const [remixPrompt, setRemixPrompt] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [error, setError] = useState('');

  if (!isEditorOpen || !currentGame) return null;

  const player = currentGame.game_config?.player || {};
  const speed = player.speed ?? 8;
  const jumpForce = player.jump_force ?? 9.5;

  const handleRemix = async (event) => {
    event.preventDefault();
    const trimmed = remixPrompt.trim();
    if (!trimmed || isRemixing) return;

    const generatedCode = currentGame.game_config?.code || currentGame.game_config?.generated_code || null;
    setError('');
    setIsRemixing(true);
    try {
      const remixed = await remixGame(currentGame.id, trimmed, generatedCode);
      setRemixPrompt('');
      onRemixed(remixed);
    } catch (err) {
      setError(err.message || 'Remix failed.');
    } finally {
      setIsRemixing(false);
    }
  };

  return (
    <aside className="fixed top-4 right-4 bottom-4 z-30 w-80 bg-[#FFFFFF]/95 dark:bg-[#111622]/95 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-6 shadow-[0_4px_20px_rgba(24,22,18,0.08)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.55)] flex flex-col justify-between gap-6 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">Edit World</h2>
          <button
            type="button"
            onClick={() => setEditorOpen(false)}
            className="p-1.5 rounded-xl text-[#6E6A61] dark:text-[#94A3B8] hover:text-[#181715] dark:hover:text-[#F1F5F9] hover:bg-[#EFECE4] dark:hover:bg-[#182032] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Gravity</span>
              <span className="font-medium text-[#181715] dark:text-[#F1F5F9] tabular-nums">{gravity}</span>
            </div>
            <input
              type="range"
              min={-36}
              max={-8}
              step={1}
              value={gravity}
              onChange={(e) => updatePhysicsParams({ gravity: Number(e.target.value) })}
              className="w-full accent-[#D96B27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Player Speed</span>
              <span className="font-medium text-[#181715] dark:text-[#F1F5F9] tabular-nums">{speed}</span>
            </div>
            <input
              type="range"
              min={3}
              max={18}
              step={0.5}
              value={speed}
              onChange={(e) => updatePhysicsParams({ speed: Number(e.target.value) })}
              className="w-full accent-[#D96B27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Jump Force</span>
              <span className="font-medium text-[#181715] dark:text-[#F1F5F9] tabular-nums">{jumpForce}</span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              step={0.5}
              value={jumpForce}
              onChange={(e) => updatePhysicsParams({ jump_force: Number(e.target.value) })}
              className="w-full accent-[#D96B27] cursor-pointer"
            />
          </label>
        </div>

        <div className="h-px bg-[#E6E2D8] dark:bg-[#232E42]" />

        <form onSubmit={handleRemix} className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[#6E6A61] dark:text-[#94A3B8]">
            AI Remix
          </span>
          <textarea
            rows={3}
            value={remixPrompt}
            onChange={(e) => setRemixPrompt(e.target.value)}
            placeholder="Make it harder with more moving platforms..."
            disabled={isRemixing}
            className="w-full resize-none rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-3 text-xs text-[#181715] dark:text-[#F1F5F9] placeholder:text-[#6E6A61]/70 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#181715]/30 dark:focus:border-[#3B4D6B] transition-colors disabled:opacity-50"
          />
          {error && <p className="text-[11px] text-[#9A3412] dark:text-[#FCA5A5]">{error}</p>}
          <button
            type="submit"
            disabled={isRemixing || !remixPrompt.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium hover:bg-[#2E2C28] dark:hover:bg-[#E2E8F0] transition-colors disabled:opacity-40"
          >
            {isRemixing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Remixing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
                <span>Remix Level</span>
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-[11px] text-[#6E6A61] dark:text-[#94A3B8]">
        Physics changes apply immediately during active runs.
      </p>
    </aside>
  );
}
