import { SmartCamera } from '../sdk/SmartCamera';

export function CameraRig({ gameMode = 'platformer', cameraMode = 'follow' }) {
  return <SmartCamera mode={cameraMode} isRacer={gameMode === 'time_trial_racer'} />;
}
