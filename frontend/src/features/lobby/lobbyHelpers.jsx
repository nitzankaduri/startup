import { useEffect, useState } from 'react';

export const GENRE_FILTERS = [
  { id: 'all', label: 'All Worlds' },
  { id: 'action', label: 'Action & Combat' },
  { id: 'vehicles_flight', label: 'Vehicles & Flight' },
  { id: 'strategy', label: 'Strategy & Builder' },
  { id: 'adventure', label: 'Arcade & Parkour' },
];

export const QUICK_CHIPS = [
  { label: 'Coastal Siege', prompt: 'Armored Soldier defending a sunlit coastal fortress with planar ocean reflections, patrolling guards, and cannon turrets' },
  { label: 'Desert Convoy', prompt: 'High-speed desert buggy convoy across volcanic canyons with suspension physics, dust plumes, and boss turret ambush' },
  { label: 'Alpine Outpost', prompt: 'Isometric snow mountain outpost defense with patrolling wolves, turret building, and ballistic projectile strikes' },
  { label: 'Sky Flight', prompt: '6-DOF jet aircraft soaring through sunlit mountain canyons, ringing aerial checkpoints cleanly before fuel runs dry' },
  { label: 'Lava Citadel', prompt: 'Skeletal warrior infiltrating a glowing lava caldera citadel with patrolling robots, crates, and explosive barrels' },
];

export const PLACEHOLDER_PROMPTS = [
  'Build a coastal harbor siege with ocean reflections...',
  'Spawn a desert buggy rally with jump ramps...',
  'Create an alpine mountain outpost defense...',
  'Design a wind-swept sunlit meadow parkour climb...',
];

export function useTypingPlaceholder(isActive) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!isActive) return undefined;
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer;

    const step = () => {
      const target = PLACEHOLDER_PROMPTS[phraseIdx];
      if (!deleting) {
        charIdx += 1;
        setText(target.slice(0, charIdx));
        if (charIdx >= target.length) {
          deleting = true;
          timer = setTimeout(step, 1700);
          return;
        }
        timer = setTimeout(step, 34);
      } else {
        charIdx -= 2;
        setText(target.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % PLACEHOLDER_PROMPTS.length;
          timer = setTimeout(step, 260);
          return;
        }
        timer = setTimeout(step, 16);
      }
    };
    timer = setTimeout(step, 320);
    return () => clearTimeout(timer);
  }, [isActive]);

  return text || 'Build a 3D world where...';
}

export function detectGameGenre(game) {
  const cfg = game?.game_config || {};
  const mode = cfg.game_mode || '';
  const code = cfg.code || '';
  const text = `${game?.title || ''} ${game?.prompt || ''}`.toLowerCase();

  if (code.includes('FlyableCraft') || /\b(flight|fly|aircraft|jet|plane|wing|sky|glider)\b/.test(text)) return 'Flight';
  if (mode === 'time_trial_racer' || code.includes('DrivableVehicle') || /\b(buggy|convoy|rally|vehicle|car|truck|racer|drift)\b/.test(text)) return 'Vehicles';
  if (code.includes('GridBuilder') || code.includes('useEconomy') || /\b(strategy|builder|outpost|tower|defense|colony|economy|fortress build)\b/.test(text)) return 'Strategy';
  if (mode === 'arena_shooter' || mode === 'survival_waves' || code.includes('ProjectilePool') || code.includes('SmartEntity') || /\b(combat|shooter|arena|boss|siege|waves|battle|soldier|citadel)\b/.test(text)) return 'Action';
  return 'Adventure';
}

export function matchesGenreFilter(genre, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'action') return genre === 'Action';
  if (filterId === 'vehicles_flight') return genre === 'Vehicles' || genre === 'Flight';
  if (filterId === 'strategy') return genre === 'Strategy';
  return genre === 'Adventure';
}
