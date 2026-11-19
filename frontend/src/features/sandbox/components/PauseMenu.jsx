import { useEffect } from 'react';
import { LogOut, Play, RotateCcw, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useProgressionStore } from '../sdk/progression/RunProgression';
import { useGameStore } from '../store/useGameStore';
import { QUALITY_PRESETS, useSettingsStore } from '../store/useSettingsStore';

export function PauseMenu({ onBackToLobby }) {
  const isPaused = useSettingsStore((s) => s.isPaused);
  const hasDraft = useProgressionStore((s) => Boolean(s.draft));
  const quality = useSettingsStore((s) => s.quality);
  const sensitivity = useSettingsStore((s) => s.cameraSensitivity);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const setPaused = useSettingsStore((s) => s.setPaused);
  const togglePause = useSettingsStore((s) => s.togglePause);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const setSensitivity = useSettingsStore((s) => s.setCameraSensitivity);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);

  const resetRun = useGameStore((s) => s.resetRun);
  const setEditorOpen = useGameStore((s) => s.setEditorOpen);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Escape' && !['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
        soundEngine.uiClick();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePause]);

  if (!isPaused || hasDraft) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-6 bg-[#181715]/30 dark:bg-[#0A0D14]/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#FAF9F6] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-6 shadow-[0_14px_44px_rgba(24,22,18,0.16)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.65)] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#D96B27]" />
            <h2 className="text-base font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9]">Paused & Quality</h2>
          </div>
          <button type="button" onClick={() => setPaused(false)} className="p-1.5 rounded-xl text-[#6E6A61] dark:text-[#94A3B8] hover:bg-[#EFECE4] dark:hover:bg-[#182032]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#6E6A61] dark:text-[#94A3B8]">Graphics Quality Preset</span>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(QUALITY_PRESETS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => { soundEngine.uiClick(); setQuality(key); }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  quality === key
                    ? 'bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] border-[#181715] dark:border-[#F1F5F9]'
                    : 'bg-[#FFFFFF] dark:bg-[#182032] text-[#6E6A61] dark:text-[#94A3B8] border-[#E6E2D8] dark:border-[#232E42] hover:text-[#181715] dark:hover:text-[#F1F5F9]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#6E6A61] dark:text-[#94A3B8]">{QUALITY_PRESETS[quality]?.desc}</p>
        </div>

        <div className="flex flex-col gap-4 pt-1">
          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Camera Sensitivity</span>
              <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{sensitivity.toFixed(1)}x</span>
            </div>
            <input type="range" min={0.4} max={2.0} step={0.1} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className="w-full accent-[#D96B27] cursor-pointer" />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Master Volume</span>
              <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={masterVolume} onChange={(e) => setMasterVolume(Number(e.target.value))} className="w-full accent-[#D96B27] cursor-pointer" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#E6E2D8] dark:border-[#232E42]">
          <button type="button" onClick={() => setPaused(false)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-semibold hover:opacity-90">
            <Play className="w-3.5 h-3.5 fill-current text-[#D96B27]" /><span>Resume</span>
          </button>
          <button type="button" onClick={() => { setPaused(false); resetRun(); }} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] text-xs font-medium hover:opacity-85">
            <RotateCcw className="w-3.5 h-3.5" /><span>Restart Run</span>
          </button>
          <button type="button" onClick={() => { setPaused(false); setEditorOpen(true); }} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] text-xs font-medium hover:opacity-85">
            <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" /><span>Remix World</span>
          </button>
          <button type="button" onClick={() => { setPaused(false); onBackToLobby(); }} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] text-xs font-medium hover:opacity-85">
            <LogOut className="w-3.5 h-3.5" /><span>Exit to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
}
