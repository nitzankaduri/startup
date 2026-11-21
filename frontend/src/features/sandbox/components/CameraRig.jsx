import { DynamicActionCamera } from '../gameplay/DynamicActionCamera';
import { SmartCamera } from '../sdk/SmartCamera';

const MODE_TO_RIG = {
  time_trial_racer: 'arcade_car',
  arcade_runner: 'three_lane_runner',
  flight_combat: 'flight_combat',
};

export function CameraRig({ gameMode = 'platformer', cameraMode = 'follow', rig }) {
  if (!cameraMode || cameraMode === 'follow' || cameraMode === 'chase') {
    const resolvedRig = rig || MODE_TO_RIG[gameMode] || 'third_person_action';
    return <DynamicActionCamera rig={resolvedRig} />;
  }
  return <SmartCamera mode={cameraMode} isRacer={gameMode === 'time_trial_racer'} />;
}
