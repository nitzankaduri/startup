import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Crosshair, Link2, RotateCcw, Settings, Share2, SlidersHorizontal, Volume2, VolumeX, Wind } from 'lucide-react';
import { DASH_COOLDOWN_MS, useGameStore } from '../store/useGameStore';
import { useSceneEditorStore } from '../store/useSceneEditorStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { HUDActionButtons, HUDModeWidgets, MODE_HINTS, SynthesisStatusPill } from './HUDModeWidgets';
import { BossAndPowerupOverlay } from './BossAndPowerupOverlay';
import { FpsBadge } from './FpsBadge';
import { FreezeEditOverlay } from './FreezeEditOverlay';
import { GameHudOverlay } from './GameHudOverlay';
import { PauseMenu } from './PauseMenu';
import { PowerupHUD } from './PowerupHUD';
import { TitleOverlay } from './TitleOverlay';
import { MinimapHUD } from '../sdk/navigation/MinimapHUD';
import { ObjectivePointer } from '../sdk/navigation/ObjectivePointer';
import { ComboStreakHUD } from '../sdk/progression/RunProgression';
import { UpgradeModal } from '../sdk/progression/UpgradeModal';

const PILL_CLS = 'pointer-events-auto flex items-center gap-2.5 bg-[#FFFFFF]/85 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] rounded-2xl px-3.5 py-2 shadow-[0_4px_20px_rgba(24,22,18,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)]';
const DIV_CLS = 'h-3.5 w-px bg-[#E6E2D8] dark:bg-[#232E42]';
const MUTED_BTN = 'text-[#6E6A61] dark:text-[#94A3B8] hover:text-[#181715] dark:hover:text-[#F1F5F9] transition-colors';

function usePulse(trigger, ms) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setActive(true);
    const id = setTimeout(() => setActive(false), ms);
    return () => clearTimeout(id);
  }, [trigger, ms]);
  return active;
}

export function GameHUD({ onBackToLobby }) {
  const [copied, setCopied] = useState(false);
  const [dashRatio, setDashRatio] = useState(1);
  const { currentGame, gameState, lastDashAt, hitMarkerAt, nearMissAt, isMuted, controlsHint, resetRun, toggleMute, toggleEditor } = useGameStore();
  const togglePause = useSettingsStore((s) => s.togglePause);
  const { isEditMode, toggleEditMode, setPublishOpen } = useSceneEditorStore();

  const showHit = usePulse(hitMarkerAt, 120);
  const showNearMiss = usePulse(nearMissAt, 850);
  const worldSpec = currentGame?.game_config?.world_json;
  const gameMode = worldSpec?.mode || currentGame?.game_config?.game_mode || 'platformer';
  const specBadge = worldSpec?.themeId ? `${worldSpec.themeId.replaceAll('_', ' ')} • ${gameMode.replaceAll('_', ' ')}` : gameMode.replaceAll('_', ' ');

  useEffect(() => {
    const onKeyDown = (e) => { if (e.code === 'KeyR' && !['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) resetRun(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetRun]);

  useEffect(() => {
    if (!lastDashAt) return setDashRatio(1);
    let rafId;
    const tick = () => {
      const p = Math.min(1, (performance.now() - lastDashAt) / DASH_COOLDOWN_MS);
      setDashRatio(p);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafId);
  }, [lastDashAt]);

  const handleCopyLink = async () => {
    if (!currentGame?.id) return;
    await navigator.clipboard?.writeText(`${window.location.origin}/play/${currentGame.id}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const isEnded = gameState === 'won' || gameState === 'gameover';
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={PILL_CLS}>
          <button type="button" onClick={onBackToLobby} className={`inline-flex items-center gap-1.5 text-xs font-medium ${MUTED_BTN}`}><ArrowLeft className="w-3.5 h-3.5" /><span>Lobby</span></button>
          <span className={DIV_CLS} />
          <span className="text-xs font-semibold text-[#181715] dark:text-[#F1F5F9] truncate max-w-[180px]">{currentGame?.title || 'World'}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#6E6A61] dark:text-[#94A3B8] bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] rounded-lg px-2 py-0.5">{specBadge}</span>
          <SynthesisStatusPill currentGame={currentGame} />
          <FpsBadge />
        </div>

        <div className={PILL_CLS}>
          <HUDModeWidgets gameMode={gameMode} />
          {gameMode !== 'time_trial_racer' && gameMode !== 'arcade_runner' && (
            <>
              <span className={DIV_CLS} />
              <div className="flex items-center gap-1.5 px-1" title="Dash Cooldown (Shift)">
                <Wind className={`w-3.5 h-3.5 ${dashRatio >= 1 ? 'text-[#D96B27]' : 'text-[#6E6A61] dark:text-[#94A3B8]'}`} />
                <div className="w-8 h-1.5 rounded-full bg-[#EFECE4] dark:bg-[#182032] overflow-hidden"><div className="h-full bg-[#D96B27]" style={{ width: `${dashRatio * 100}%` }} /></div>
              </div>
            </>
          )}
          <span className={DIV_CLS} />
          <button type="button" onClick={toggleMute} aria-label={isMuted ? 'Unmute audio' : 'Mute audio'} title={isMuted ? 'Unmute' : 'Mute'} className={`p-1 ${MUTED_BTN}`}>{isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#D96B27]" /> : <Volume2 className="w-3.5 h-3.5" />}</button>
          <button type="button" onClick={resetRun} title="Restart (R)" className={`inline-flex items-center gap-1 text-xs font-medium px-1 ${MUTED_BTN}`}><RotateCcw className="w-3.5 h-3.5" /><span>Restart</span></button>
          <button type="button" onClick={handleCopyLink} className={`inline-flex items-center gap-1 text-xs font-medium px-1 ${MUTED_BTN}`}>{copied ? <Check className="w-3.5 h-3.5 text-[#D96B27]" /> : <Link2 className="w-3.5 h-3.5" />}<span>{copied ? 'Copied' : 'Share'}</span></button>
          <span className={DIV_CLS} />
          <button type="button" onClick={toggleEditor} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#182032]/85 hover:bg-[#182032] text-[#F1F5F9] border border-[#232E42] transition">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D96B27]" /><span>Edit World</span>
          </button>
          <button type="button" onClick={() => setPublishOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white transition"><Share2 className="w-3 h-3" /><span>Publish &amp; Export</span></button>
          <button type="button" onClick={togglePause} aria-label="Settings (Esc)" title="Settings (Esc)" className={`p-1 ${MUTED_BTN}`}><Settings className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {copied && <div className="self-center mt-2 px-3.5 py-1.5 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium shadow-md">Challenge link copied — share /play/{currentGame?.id}!</div>}
      <FreezeEditOverlay />
      <BossAndPowerupOverlay />
      {showNearMiss && <div className="self-center mt-4 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#111622]/90 border border-[#E6E2D8] dark:border-[#232E42] text-xs font-semibold text-[#D96B27] shadow-sm animate-bounce">+50 NEAR MISS</div>}
      {showHit && <div className="self-center my-auto text-[#FFFFFF] opacity-90"><Crosshair className="w-6 h-6" /></div>}
      <ObjectivePointer />
      <TitleOverlay />
      <UpgradeModal />
      <PauseMenu onBackToLobby={onBackToLobby} />
      <GameHudOverlay onCopyChallenge={handleCopyLink} copied={copied} onBackToLobby={onBackToLobby} />

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <ComboStreakHUD />
          <PowerupHUD />
          <HUDActionButtons />
          <div className="self-start bg-[#FFFFFF]/85 dark:bg-[#111622]/85 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl px-3.5 py-1.5 text-[11px] font-medium text-[#6E6A61] dark:text-[#94A3B8] shadow-[0_4px_20px_rgba(24,22,18,0.05)]">
            {controlsHint || MODE_HINTS[gameMode] || MODE_HINTS.platformer}
          </div>
        </div>
        <MinimapHUD />
      </div>
    </div>
  );
}
