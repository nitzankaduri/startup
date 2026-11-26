import { useEffect, useState } from 'react';

export const GENRE_FILTERS = [
  { id: 'all', label: 'All Worlds' },
  { id: 'action', label: 'Action & Combat' },
  { id: 'vehicles_flight', label: 'Vehicles & Flight' },
  { id: 'strategy', label: 'Strategy & Builder' },
  { id: 'adventure', label: 'Arcade & Parkour' },
];

export const PRESETS_3D = [
  { label: '3D Subway Train Runner', prompt: '3D Subway Train Runner with colorful trains, roof parkour ramps, golden coin arcs & chaser guard' },
  { label: 'Open-World City Police Chase', prompt: 'Open-World City Police Chase with drivable sports cars, wanted stars & urban missions' },
  { label: '3D Space Fighter Squadron', prompt: '3D Space Fighter Squadron battling alien UFO waves, asteroid belts & mothership boss' },
  { label: '3D Gladiator Arena', prompt: '3D Gladiator Arena fighting waves of skeleton knights with dash & rapid blasters' },
];

export const PRESETS_2D = [
  { label: '2D Cyber Platformer', prompt: '2D Cyber Platformer with precision double-jump platforms, patrol guards, blasters & coin arcs' },
  { label: '2D Top-Down Zombie Survival', prompt: '2D Top-Down Zombie Survival arena with 360 aim shooting, multi-wave enemies & power-ups' },
  { label: '2D Neon-Free Rhythm Dash', prompt: '2D Neon-Free Rhythm Dash runner with crisp beat-timed spikes, jump pads & warm parallax sky' },
  { label: '2D Retro Space Invaders', prompt: '2D Retro Space Invaders squadron waves, laser cannons, asteroid cover & mothership boss' },
];

export const QUICK_CHIPS = PRESETS_3D;

export const PLACEHOLDERS_3D = [
  '3D Subway Train Runner with jumpable train roofs...',
  'Open-World City Police Chase with drivable supercars...',
  '3D Space Fighter Squadron vs alien UFO boss...',
  '3D Gladiator Arena survival with waves & power-ups...',
];

export const PLACEHOLDERS_2D = [
  '2D Cyber Platformer with double jumps and coins...',
  '2D Top-Down Zombie Survival with 360 blasters...',
  '2D Neon-Free Rhythm Dash over beat spikes...',
  '2D Retro Space Invaders defending Earth orbit...',
];

export function useTypingPlaceholder(isActive, dimension = '3d') {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!isActive) return undefined;
    const phrases = dimension === '2d' ? PLACEHOLDERS_2D : PLACEHOLDERS_3D;
    let phraseIdx = 0; let charIdx = 0; let deleting = false; let timer;
    const step = () => {
      const target = phrases[phraseIdx % phrases.length];
      if (!deleting) {
        charIdx += 1; setText(target.slice(0, charIdx));
        if (charIdx >= target.length) { deleting = true; timer = setTimeout(step, 1700); return; }
        timer = setTimeout(step, 34);
      } else {
        charIdx -= 2; setText(target.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; timer = setTimeout(step, 260); return; }
        timer = setTimeout(step, 16);
      }
    };
    timer = setTimeout(step, 180);
    return () => clearTimeout(timer);
  }, [isActive, dimension]);

  return text || (dimension === '2d' ? 'Build a 2D arcade game where...' : 'Build a 3D world where...');
}

export function detectGameGenre(game) {
  const cfg = game?.game_config || {};
  const mode = cfg.mode || cfg.world_json?.mode || cfg.game_mode || '';
  const code = cfg.code || '';
  const text = `${game?.title || ''} ${game?.prompt || ''}`.toLowerCase();
  if (code.includes('FlyableCraft') || mode.includes('sky') || mode.includes('space') || /\b(flight|fly|aircraft|jet|plane|wing|sky|space|invader)\b/.test(text)) return 'Flight';
  if (mode === 'time_trial_racer' || mode === 'vehicle_pursuit' || code.includes('DrivableVehicle') || /\b(buggy|convoy|rally|vehicle|car|truck|racer|drift|police chase)\b/.test(text)) return 'Vehicles';
  if (code.includes('GridBuilder') || code.includes('useEconomy') || /\b(strategy|builder|outpost|tower|defense|colony|economy)\b/.test(text)) return 'Strategy';
  if (mode === 'arena_shooter' || mode === 'arena_action' || mode === '2d_topdown_action' || mode === 'survival_waves' || /\b(combat|shooter|arena|boss|siege|waves|battle|zombie|gladiator)\b/.test(text)) return 'Action';
  return 'Adventure';
}

export function matchesGenreFilter(genre, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'action') return genre === 'Action';
  if (filterId === 'vehicles_flight') return genre === 'Vehicles' || genre === 'Flight';
  if (filterId === 'strategy') return genre === 'Strategy';
  return genre === 'Adventure';
}
