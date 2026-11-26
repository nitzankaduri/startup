import { useState } from 'react';
import { AlertCircle, ArrowRight, Box, Layers, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { BuildProgressPill } from './BuildProgressPill';
import { PRESETS_2D, PRESETS_3D, useTypingPlaceholder } from './lobbyHelpers';

export function PromptBar({ prompt, setPrompt, dimension = '3d', setDimension, onGenerate, isLoading, buildStage, error, onClearError, inputRef }) {
  const [needsText, setNeedsText] = useState(false);
  const animatedPlaceholder = useTypingPlaceholder(!prompt && !isLoading, dimension);
  const activePresets = dimension === '2d' ? PRESETS_2D : PRESETS_3D;

  const handleSubmit = (event) => {
    event?.preventDefault();
    const trimmed = prompt.trim();
    if (isLoading) return;
    if (!trimmed) {
      setNeedsText(true); inputRef?.current?.focus();
      setTimeout(() => setNeedsText(false), 900);
      return;
    }
    onClearError?.();
    onGenerate(trimmed, dimension);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const pickStarter = () => {
    const pick = activePresets[Math.floor(Math.random() * activePresets.length)];
    setPrompt(pick.prompt); setNeedsText(false); onClearError?.(); inputRef?.current?.focus();
  };

  return (
    <div className="relative w-full max-w-[660px] mx-auto">
      <form
        onSubmit={handleSubmit}
        style={{ animationDelay: '150ms' }}
        className={`animate-fade-up min-h-[132px] bg-[#FFFFFF] dark:bg-[#111622] border rounded-[24px] px-5 py-4 shadow-[0_20px_50px_rgba(28,25,23,0.08)] dark:shadow-[0_22px_58px_rgba(0,0,0,0.62)] focus-within:-translate-y-0.5 focus-within:shadow-[0_24px_60px_rgba(28,25,23,0.12)] flex flex-col justify-between gap-3 transition-all duration-300 ${
          needsText ? 'border-[#D96B27] ring-2 ring-[#D96B27]/25' : 'border-[#E6E2D8]/90 dark:border-[#232E42] focus-within:border-[#1C1917]/25 dark:focus-within:border-[#3B4D6B]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E6E2D8]/60 dark:border-[#232E42]/80 pb-2.5">
          <div role="group" aria-label="Dimension Selector" className="inline-flex items-center p-0.5 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42]">
            {[['3d', '3D World', Box], ['2d', '2D Arcade', Layers]].map(([id, label, Icon]) => {
              const active = dimension === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setDimension?.(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#1C1917] dark:bg-[#F1F5F9] text-[#FAF9F6] dark:text-[#0A0D14] shadow-sm'
                      : 'text-[#6E6A61] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D96B27]' : ''}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6E6A61] dark:text-[#94A3B8]">
            <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
            <span>{dimension === '2d' ? '2D Sprite & Parallax Engine' : '3D HDRI Studio Engine'}</span>
          </span>
        </div>

        <textarea
          ref={inputRef}
          id="game-prompt"
          rows={2}
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); if (needsText) setNeedsText(false); if (error) onClearError?.(); }}
          onKeyDown={handleKeyDown}
          placeholder={animatedPlaceholder}
          disabled={isLoading}
          className="w-full h-[52px] resize-none bg-transparent px-0.5 pt-0.5 text-[15px] leading-relaxed text-[#1C1917] dark:text-[#F1F5F9] placeholder:text-[#6E6A61]/65 dark:placeholder:text-[#94A3B8]/60 focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pickStarter}
              disabled={isLoading}
              title={`Try a ${dimension.toUpperCase()} prompt`}
              className="group w-8 h-8 rounded-full bg-[#FAF9F6] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#6E6A61] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-[#F1F5F9] flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            </button>
            {isLoading && <span className="text-xs font-medium text-[#D96B27]">Architecting {dimension.toUpperCase()} world...</span>}
            {!isLoading && needsText && <span className="text-xs font-medium text-[#D96B27]">Describe a {dimension.toUpperCase()} game or click +</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1917] dark:bg-[#F1F5F9] text-[#FAF9F6] dark:text-[#0A0D14] text-xs font-semibold shadow-sm hover:bg-[#2E2A27] dark:hover:bg-[#E2E8F0] hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><span>{dimension === '2d' ? 'Spawn 2D Game' : 'Spawn 3D World'}</span><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" /></>
            )}
          </button>
        </div>

        {isLoading && <BuildProgressPill buildStage={buildStage} />}
      </form>

      {error && (
        <div role="alert" className="absolute left-0 right-0 top-full mt-3 flex items-center justify-between gap-2.5 rounded-2xl bg-[#FFF5F2] dark:bg-[#231418] border border-[#F5C6B8] dark:border-[#7F1D1D] px-4 py-2.5 text-xs text-[#9A3412] dark:text-[#FCA5A5] shadow-md">
          <div className="flex items-center gap-2 min-w-0"><AlertCircle className="w-4 h-4 text-[#D96B27] shrink-0" /><span className="leading-relaxed truncate">{error}</span></div>
          <button type="button" onClick={onClearError} aria-label="Dismiss message" className="p-0.5 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
