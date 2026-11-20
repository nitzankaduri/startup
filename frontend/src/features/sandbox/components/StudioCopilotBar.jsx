import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { refineGame } from '../../../shared/api/gameApi';
import { useGameStore } from '../store/useGameStore';

const QUICK_PROMPTS = ['Night + heavy rain', 'Double jump height', 'Add boss dragon'];

export function StudioCopilotBar({ theme = 'light' }) {
  const currentGame = useGameStore((s) => s.currentGame);
  const setGeneratedCode = useGameStore((s) => s.setGeneratedCode);
  const resetRun = useGameStore((s) => s.resetRun);
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState('');

  if (!currentGame) return null;
  const activeCode = currentGame?.game_config?.code || currentGame?.game_config?.generated_code || '';
  if (!activeCode) return null;

  const isDark = theme === 'dark';
  const surface = isDark
    ? 'bg-[#111622]/95 border-[#232E42] text-[#F1F5F9]'
    : 'bg-[#FFFFFF]/95 border-[#E6E2D8] text-[#181715]';
  const subText = isDark ? 'text-[#94A3B8]' : 'text-[#6E6A61]';
  const chipCls = isDark
    ? 'bg-[#182032] border-[#232E42] text-[#CBD5E1] hover:border-[#D96B27]'
    : 'bg-[#EFECE4] border-[#E6E2D8] text-[#181715] hover:border-[#D96B27]';

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = prompt.trim();
    if (!trimmed || isRefining) return;
    setIsRefining(true);
    setError('');
    setStatusNote('');
    try {
      const res = await refineGame({
        current_code: activeCode,
        refinement_prompt: trimmed,
        game_title: currentGame.title || 'Untitled 3D World',
        game_id: currentGame.id || null,
      });
      if (res?.code) {
        setGeneratedCode(res.code);
        resetRun();
        setStatusNote(res.notes || 'World upgraded live.');
        setPrompt('');
      }
    } catch (err) {
      setError(err?.message || 'Refinement failed.');
    } finally {
      setIsRefining(false);
    }
  };

  if (!expanded) {
    return (
      <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md text-xs font-semibold transition-all ${surface}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
          <span>Studio Co-Pilot</span>
          {statusNote && <span className={`hidden sm:inline ${subText}`}>• Updated</span>}
          <ChevronUp className={`w-3.5 h-3.5 ${subText}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,560px)]">
      <div className={`pointer-events-auto rounded-2xl border shadow-2xl backdrop-blur-md p-3 transition-all ${surface}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#D96B27]" />
            <span className="text-xs font-semibold tracking-tight">Studio Co-Pilot</span>
            <span className={`text-[11px] ${subText}`}>• Live multi-turn world editor</span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-[#182032]' : 'hover:bg-[#EFECE4]'}`}
            aria-label="Collapse Studio Co-Pilot"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="e.g. Make it night with rain, add a boss dragon, double jump height..."
            disabled={isRefining}
            className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none transition ${
              isDark
                ? 'bg-[#0A0D14] border-[#232E42] text-[#F1F5F9] placeholder-[#64748B] focus:border-[#D96B27]'
                : 'bg-[#F6F4EF] border-[#E6E2D8] text-[#181715] placeholder-[#6E6A61] focus:border-[#D96B27]'
            }`}
          />
          <button
            type="submit"
            disabled={isRefining || !prompt.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] disabled:opacity-50 text-white text-xs font-semibold transition shrink-0"
          >
            {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isRefining ? 'Upgrading...' : 'Refine'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPrompt((prev) => (prev ? `${prev}, ${q.toLowerCase()}` : q))}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-medium transition ${chipCls}`}
              >
                + {q}
              </button>
            ))}
          </div>
          {statusNote && <span className="text-[11px] text-[#D96B27] font-medium truncate max-w-[240px]">{statusNote}</span>}
          {error && <span className="text-[11px] text-[#DC2626] font-medium truncate max-w-[240px]">{error}</span>}
        </div>
      </div>
    </div>
  );
}
