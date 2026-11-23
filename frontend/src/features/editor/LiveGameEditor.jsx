import { useState } from 'react';
import { Play, Sparkles, X } from 'lucide-react';
import { refineGame } from '../../shared/api/gameApi';
import { triggerResumeCountdown } from '../sandbox/kernel/kernelFreezeBus';
import { useGameStore } from '../sandbox/store/useGameStore';
import { AI_CHIPS, CURATED_PALETTES, EDITOR_PRESETS, ENEMY_OPTS, MODE_OPTS, OBSTACLE_OPTS, PLAYER_OPTS } from './liveEditorPresets';

const SEL_CLS = 'w-full rounded-lg bg-[#182032] border border-[#232E42] px-2 py-1 text-xs text-[#F1F5F9] outline-none focus:border-[#D96B27]';

export function LiveGameEditor() {
  const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const setEditorOpen = useGameStore((s) => s.setEditorOpen);
  const currentGame = useGameStore((s) => s.currentGame);
  const setWorldJson = useGameStore((s) => s.setWorldJson);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const world = currentGame?.game_config?.world_json;
  if (!isEditorOpen || !currentGame || !world) return null;

  const patch = (fields) => setWorldJson({ ...world, ...fields });
  const speedMult = Number(((Number(world.speed) || 12) / 12).toFixed(2));
  const jumpPower = Number(world.jumpPower || 13);

  const handleResume = () => {
    setEditorOpen(false);
    triggerResumeCountdown();
  };

  const runAiRefine = async (instruction) => {
    const text = (instruction || prompt).trim();
    if (!text || busy) return;
    setBusy(true); setNote('');
    try {
      const res = await refineGame({
        currentSpec: world, instruction: text,
        current_world_json: world, refinement_prompt: text,
        game_id: currentGame.id, game_title: currentGame.title,
      });
      if (res?.world_json) setWorldJson(res.world_json);
      setNote(res?.notes || 'Applied!');
      setPrompt('');
    } catch (err) {
      setNote(err.message || 'Refinement failed');
    } finally { setBusy(false); }
  };

  return (
    <aside className="fixed top-20 right-6 z-30 w-80 max-h-[82vh] overflow-y-auto rounded-2xl bg-[#111622]/92 backdrop-blur-md border border-[#232E42] text-[#F1F5F9] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.45)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-tight">Live World Editor</span>
        <button type="button" onClick={handleResume} aria-label="Resume Game" className="text-[#94A3B8] hover:text-[#F1F5F9]"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {EDITOR_PRESETS.map((p) => (
          <button key={p.themeId} type="button" onClick={() => patch(p)} className={`rounded-lg px-2 py-1.5 text-[11px] font-medium border transition ${world.themeId === p.themeId ? 'bg-[#D96B27] border-[#D96B27] text-white' : 'bg-[#182032] border-[#232E42] text-[#F1F5F9] hover:border-[#3B4D6B]'}`}>{p.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#94A3B8]">
        <label className="flex flex-col gap-1">Mode<select value={world.mode || 'endless_runner'} onChange={(e) => patch({ mode: e.target.value })} className={SEL_CLS}>{MODE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="flex flex-col gap-1">Player<select value={world.playerType || 'runner_kid'} onChange={(e) => patch({ playerType: e.target.value })} className={SEL_CLS}>{PLAYER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="flex flex-col gap-1">Obstacle<select value={world.obstacleType || 'subway_train'} onChange={(e) => patch({ obstacleType: e.target.value })} className={SEL_CLS}>{OBSTACLE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="flex flex-col gap-1">Enemy<select value={world.enemyType || 'chaser_guard'} onChange={(e) => patch({ enemyType: e.target.value })} className={SEL_CLS}>{ENEMY_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
      </div>

      <div className="flex flex-col gap-2 text-[11px] text-[#94A3B8]">
        <label className="flex items-center justify-between gap-2"><span>Speed ({speedMult}x)</span><input type="range" min="0.5" max="2.5" step="0.1" value={speedMult} onChange={(e) => patch({ speed: Math.round(Number(e.target.value) * 120) / 10 })} className="w-36 accent-[#D96B27]" /></label>
        <label className="flex items-center justify-between gap-2"><span>Jump ({jumpPower})</span><input type="range" min="9" max="20" step="0.5" value={jumpPower} onChange={(e) => patch({ jumpPower: Number(e.target.value) })} className="w-36 accent-[#D96B27]" /></label>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => patch({ canShoot: !world.canShoot })} className={`rounded-lg py-1 text-[11px] font-semibold ${world.canShoot ? 'bg-[#D96B27] text-white' : 'bg-[#182032] border border-[#232E42] text-[#94A3B8]'}`}>Can Shoot: {world.canShoot ? 'ON' : 'OFF'}</button>
          <button type="button" onClick={() => patch({ enemiesShoot: !world.enemiesShoot })} className={`rounded-lg py-1 text-[11px] font-semibold ${world.enemiesShoot ? 'bg-[#D96B27] text-white' : 'bg-[#182032] border border-[#232E42] text-[#94A3B8]'}`}>Enemy Fire: {world.enemiesShoot ? 'ON' : 'OFF'}</button>
        </div>
        <div className="flex items-center justify-between">
          <span>Palette</span>
          <div className="flex gap-1.5">{CURATED_PALETTES.map((c) => <button key={c.name} type="button" title={c.name} onClick={() => patch({ palette: { ...(world.palette || {}), ...c } })} className="w-5 h-5 rounded-full border border-[#F1F5F9]/30" style={{ backgroundColor: c.primary }} />)}</div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); runAiRefine(); }} className="pt-2 border-t border-[#232E42] flex flex-col gap-2">
        <div className="flex gap-1.5">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe any change... e.g., turn obstacles into asteroids" className="flex-1 rounded-lg bg-[#182032] border border-[#232E42] px-2.5 py-1.5 text-xs text-[#F1F5F9] placeholder-[#94A3B8] outline-none focus:border-[#D96B27]" />
          <button type="submit" disabled={busy} className="rounded-lg bg-[#D96B27] hover:bg-[#C25C1B] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><Sparkles className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex flex-wrap gap-1">{AI_CHIPS.map((c) => <button key={c} type="button" disabled={busy} onClick={() => runAiRefine(c)} className="rounded-md bg-[#182032] border border-[#232E42] px-2 py-0.5 text-[10px] text-[#94A3B8] hover:text-[#F1F5F9]">{c}</button>)}</div>
        {note && <p className="text-[10px] text-[#D96B27]">{note}</p>}
      </form>

      <button type="button" onClick={handleResume} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] py-2 text-xs font-semibold text-white shadow-sm transition">
        <Play className="w-3.5 h-3.5 fill-current" /><span>Resume Game</span>
      </button>
    </aside>
  );
}
