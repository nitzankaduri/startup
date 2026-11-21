import { AlertTriangle, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export function HUDActionButtons() {
  const customActions = useGameStore((s) => s.customActions);
  if (!customActions.length) return null;
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 self-start">
      {customActions.map((act, idx) => (
        <button
          key={act.id || act.label || idx}
          type="button"
          disabled={act.disabled}
          onClick={act.onClick}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 disabled:opacity-45 shadow-sm ${
            act.accent
              ? 'bg-[#D96B27] border-[#D96B27] text-[#FFFFFF] hover:bg-[#C25D1F]'
              : 'bg-[#FFFFFF]/90 dark:bg-[#111622]/90 border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] hover:border-[#181715]/30 dark:hover:border-[#3B4D6B]'
          }`}
        >
          {act.label}
        </button>
      ))}
    </div>
  );
}

export function SynthesisStatusPill({ currentGame }) {
  const synthesisError = useGameStore((s) => s.synthesisError);
  const cfg = currentGame?.game_config || {};
  const hasCode = Boolean(cfg.world_json || cfg.worldSpec || cfg.code || cfg.generated_code);
  const reason = synthesisError || cfg.generation_error || (!hasCode ? 'GEMINI_API_KEY missing or static preset' : '');
  const isLive = hasCode && !reason;

  return (
    <span
      title={isLive ? `Live synthesized via ${cfg.model_id || 'gemini-2.5-flash'}` : `Fallback: ${reason}`}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium border max-w-[190px] truncate ${
        isLive
          ? 'bg-[#EAF4EA] dark:bg-[#13261A] text-[#2E7D32] dark:text-[#6EE7B7] border-[#B7DFB9] dark:border-[#1E462C]'
          : 'bg-[#FFF5EE] dark:bg-[#2A1B14] text-[#D96B27] border-[#F2C9AE] dark:border-[#5C311B]'
      }`}
    >
      {isLive ? <Sparkles className="w-2.5 h-2.5 shrink-0" /> : <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
      <span className="truncate">{isLive ? 'AI Live Synthesized' : `Fallback: ${reason}`}</span>
    </span>
  );
}
