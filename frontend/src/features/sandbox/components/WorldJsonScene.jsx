import { GameKernel } from '../kernel/GameKernel';
import { SubwayCorridorScene } from './SubwayCorridorScene';

/** High-FPS imperative WorldJsonScene powered by GameKernel + endless streaming corridor. */
export function WorldJsonScene({ world }) {
  if (!world) return null;
  return (
    <group>
      <SubwayCorridorScene theme={world.theme || 'sunny_city'} signLabel={world.signLabel || 'METRO'} />
      <GameKernel world={world} />
    </group>
  );
}
