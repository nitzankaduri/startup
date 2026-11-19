import { BouncyPad } from './entities/BouncyPad';
import { ChaserBot } from './entities/ChaserBot';
import { CheckpointGate } from './entities/CheckpointGate';
import { CollectibleItem } from './entities/CollectibleItem';
import { CrumblingPlatform } from './entities/CrumblingPlatform';
import { GoalZone } from './entities/GoalZone';
import { HazardBlock } from './entities/HazardBlock';
import { HealPickup } from './entities/HealPickup';
import { KeyItem } from './entities/KeyItem';
import { LockedGate } from './entities/LockedGate';
import { MovingPlatform } from './entities/MovingPlatform';
import { PatrolBot } from './entities/PatrolBot';
import { PowerupBlock } from './entities/PowerupBlock';
import { RotatingBeam } from './entities/RotatingBeam';
import { SpeedPad } from './entities/SpeedPad';
import { StaticBlock } from './entities/StaticBlock';
import { TrainBlock } from './entities/TrainBlock';
import { TurretBot } from './entities/TurretBot';

const ENTITY_MAP = {
  platform: StaticBlock,
  ramp: StaticBlock,
  train: TrainBlock,
  ramp_train: TrainBlock,
  moving_platform: MovingPlatform,
  hazard: HazardBlock,
  collectible: CollectibleItem,
  bouncy_pad: BouncyPad,
  rotating_beam: RotatingBeam,
  speed_pad: SpeedPad,
  crumbling_platform: CrumblingPlatform,
  key: KeyItem,
  locked_gate: LockedGate,
  patrol_bot: PatrolBot,
  chaser_bot: ChaserBot,
  turret_bot: TurretBot,
  checkpoint_gate: CheckpointGate,
  heal_pickup: HealPickup,
  powerup: PowerupBlock,
};

export function AssetCatalog({ gameConfig }) {
  const entities = gameConfig?.entities || [];
  const gameMode = gameConfig?.game_mode || 'platformer';
  const isRacer = gameMode === 'time_trial_racer';
  const goalPosition = gameConfig?.goal?.position || [0, 4.5, -28];
  const showGoal = gameMode === 'platformer' || isRacer;

  return (
    <group>
      {entities.map((entity) => {
        const Component = ENTITY_MAP[entity.type];
        if (!Component) return null;
        return <Component key={entity.id} entity={entity} isRacer={isRacer} />;
      })}
      {showGoal && <GoalZone position={goalPosition} />}
    </group>
  );
}
