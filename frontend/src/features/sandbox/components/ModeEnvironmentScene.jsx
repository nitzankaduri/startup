import { normalizeMode } from '../kernel/DirectorSetup';
import { ArenaWorldScene } from './ArenaWorldScene';
import { HighwayPursuitScene } from './HighwayPursuitScene';
import { OpenWorldScene } from './OpenWorldScene';
import { SkyShooterScene } from './SkyShooterScene';
import { SubwayCorridorScene } from './SubwayCorridorScene';

/** Switches the 3D world geometry cleanly by GameSpec.mode (zero hardcoded subway track leaks). */
export function ModeEnvironmentScene({ world }) {
  const mode = normalizeMode(world?.mode || world?.archetype, world);
  if (mode === 'open_world_sandbox') return <OpenWorldScene palette={world?.palette} />;
  if (mode === 'arena_action') return <ArenaWorldScene palette={world?.palette} />;
  if (mode === 'sky_shooter') return <SkyShooterScene palette={world?.palette} />;
  if (mode === 'vehicle_pursuit') return <HighwayPursuitScene palette={world?.palette} />;
  return <SubwayCorridorScene theme={world?.theme || 'sunny_city'} signLabel={world?.signLabel || 'METRO'} />;
}
