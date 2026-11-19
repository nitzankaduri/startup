import { soundEngine } from '../../../shared/audio/soundEngine';
import { triggerHitStop } from './gameFeel';

export { useGameInput } from './useGameInput';
export { SmartCamera } from './SmartCamera';
export { RealisticPhysicsRig, stepInertiaBody } from './RealisticPhysicsRig';
export { SmokeTrail } from './SmokeTrail';
export { SkeletalActor } from './assets/SkeletalActor';
export { PropModel } from './assets/PropModel';
export { GLB_ASSETS, preloadAllRegistryModels, resolveModelAsset } from './assets/modelRegistry';
export { computeNormalizedMetrics } from './assets/normalizeModelMetrics';
export { DynamicWater } from './vfx/DynamicWater';
export { InstancedFoliage } from './foliage/InstancedFoliage';
export { ExplosionBurst, ProjectilePool } from './vfx/CombatVFX';
export { SmartEntity } from './ai/SmartEntity';
export { DrivableVehicle } from './vehicles/DrivableVehicle';
export { SkidMarks } from './vehicles/SkidMarks';
export { FlyableCraft } from './vehicles/FlyableCraft';
export { GridBuilder, useEconomy } from './strategy/GridBuilder';
export { ObjectiveBeacon } from './navigation/ObjectiveBeacon';
export { ObjectivePointer } from './navigation/ObjectivePointer';
export { MinimapHUD } from './navigation/MinimapHUD';
export { radarBus, registerRadarBlip, resetRadarBus, unregisterRadarBlip } from './navigation/radarBus';
export {
  ExtrudedShape, FloatingLabel, LatheObject, ParticleBurst, PBR_SURFACES,
  RealisticTerrain, StudioBackdrop, createPbrTextureSet, createPhysicalMaterial, usePbrMaterial, useStudioMaterial,
} from './MeshBuilder';
export { pbrMaterials } from './pbrMaterials';
export { FloatingNumbersLayer, getFeelDelta, resetFeelBus, spawnFloatingNumber, triggerHitStop } from './gameFeel';
export {
  ComboStreakHUD, DEFAULT_UPGRADES, recordComboEvent, resetProgression, triggerUpgradeDraft,
} from './progression/RunProgression';
export { UpgradeModal } from './progression/UpgradeModal';

export const COLLECTIBLE_GOLD_MAT = {
  color: '#E5B869',
  metalness: 0.75,
  roughness: 0.2,
};

export function createProceduralMaterial({ color = '#27272A', roughness = 0.72, metalness = 0.08 } = {}) {
  return { color, roughness, metalness };
}

export const motionBus = {
  pos: { x: 0, y: 2.2, z: 0 },
  vel: { x: 0, y: 0, z: 0 },
  yaw: 0,
  steer: 0,
  isGrounded: true,
  isBoosting: false,
  isRolling: false,
  jumpAt: 0,
  landAt: 0,
  trauma: 0,
  targetFov: null,
  dustQueue: [],
  powerups: {},
  popups: [],
};

export function resetMotionBus(pos = { x: 0, y: 2.2, z: 0 }) {
  motionBus.pos = { ...pos };
  motionBus.vel = { x: 0, y: 0, z: 0 };
  motionBus.yaw = 0;
  motionBus.steer = 0;
  motionBus.isGrounded = true;
  motionBus.isBoosting = false;
  motionBus.isRolling = false;
  motionBus.jumpAt = 0;
  motionBus.landAt = 0;
  motionBus.trauma = 0;
  motionBus.targetFov = null;
  motionBus.dustQueue = [];
  motionBus.powerups = {};
  motionBus.popups = [];
}

export function triggerCameraShake(intensity = 0.5) {
  motionBus.trauma = Math.min(1, motionBus.trauma + Math.max(0, intensity));
}

export function setTargetFov(fov = null) {
  motionBus.targetFov = fov;
}

export function emitPopup(text) {
  motionBus.popups.push({ id: `${text}-${performance.now()}`, text, at: performance.now() });
}

export function isPowerupActive(type) {
  return (motionBus.powerups[type] || 0) > performance.now();
}

export function triggerJumpMotion() { motionBus.jumpAt = performance.now(); }

export function triggerLandMotion(x, y, z) {
  const now = performance.now();
  motionBus.landAt = now;
  motionBus.trauma = Math.min(1, motionBus.trauma + 0.22);
  motionBus.dustQueue.push({ x, y: y - 0.65, z, at: now });
  triggerHitStop(32, 0.14);
  soundEngine.playLandThump();
}

export function addImpactTrauma(amount = 0.55) { motionBus.trauma = Math.min(1, motionBus.trauma + amount); }

export function stepSpring(state, target, stiffness, damping, dt) {
  const force = (target - state.value) * stiffness;
  state.velocity = (state.velocity + force * dt) * Math.max(0, 1 - damping * dt);
  state.value += state.velocity * dt;
  return state.value;
}

export function computeMagneticPull(itemPos, playerPos, radius = 2.5) {
  const dx = playerPos.x - itemPos[0];
  const dy = playerPos.y - itemPos[1];
  const dz = playerPos.z - itemPos[2];
  const dist = Math.hypot(dx, dy, dz);
  return { active: dist <= radius, dist, dx, dy, dz };
}
