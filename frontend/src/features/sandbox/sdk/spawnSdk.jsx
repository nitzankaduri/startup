import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';
import {
  addImpactTrauma, computeMagneticPull, emitPopup, isPowerupActive, motionBus, resetMotionBus,
  setTargetFov, stepSpring, triggerCameraShake, triggerJumpMotion, triggerLandMotion,
  COLLECTIBLE_GOLD_MAT, createProceduralMaterial,
} from './motionBus';
import { setHardCollisionHandler } from './runtime/GameRuntimeKit';

export {
  ColliderBox, GameRuntimeProvider, PlayerController,
  getTerrainHeight, registerCollider, registerObjectCollider, resetArenaPhysics, resolveMovement, setHardCollisionHandler, setTerrainConfig, unregisterCollider,
  useArenaPhysics, useMissionState,
} from './runtime/GameRuntimeKit';
export { useGameInput } from './useGameInput';
export { SmartCamera } from './SmartCamera';
export { ChaseCameraRig } from '../physics/ChaseCameraRig';
export { PlayerRigController } from '../physics/PlayerRigController';
export { StaticPhysicsBody, WorldPhysicsProvider } from '../physics/WorldPhysicsProvider';
export { CartoonPlayerRig } from '../gameplay/CartoonPlayerRig';
export { DynamicActionCamera } from '../gameplay/DynamicActionCamera';
export { CartoonVFX, emitCartoonVfx } from '../gameplay/CartoonVFX';
export { MODEL_CATALOG, preloadCatalogModels, resolveCatalogModel } from '../assets/ModelCatalog';
export { CARTOON_ASSET_CATALOG, preloadCartoonCatalog, resolveCartoonAsset } from '../assets/CartoonAssetCatalog';
export { SmartModel } from '../assets/SmartModel';
export { StylizedEntity } from '../assets/StylizedEntity';
export { JuiceFX, emitJuice } from '../assets/JuiceFX';
export { RealisticPhysicsRig, stepInertiaBody } from './RealisticPhysicsRig';
export { SmokeTrail } from './SmokeTrail';
export { SkeletalActor } from './assets/SkeletalActor';
export { ArticulatedRunner } from './assets/ArticulatedRunner';
export { PropModel } from './assets/PropModel';
export { AutoNormalizeMesh } from './assets/AutoNormalizeMesh';
export { ASSET_MANIFEST, AssetCatalog, GLB_ASSETS, preloadAllRegistryModels, resolveModelAsset } from './assets/assetCatalog';
export { StudioProp } from './assets/StudioProps';
export { BiomeStage } from './assets/BiomeStage';
export { BIOME_THEMES, resolveBiomeTheme } from './assets/biomePresets';
export { WeatherSystem } from './atmosphere/WeatherSystem';
export { PracticalLights } from './atmosphere/PracticalLights';
export { TIME_OF_DAY_PRESETS, WEATHER_CONFIGS } from './atmosphere/weatherPresets';
export { SubwayCorridor } from './worlds/SubwayCorridor';
export { CityBlockWorld } from './worlds/CityBlockWorld';
export { CityGrid, CityGridGenerator, RaceTrack, TrackGenerator } from './world/CityRoadBuilder';
export { StylizedTrain, StylizedRampTrain } from './props/StylizedTrain';
export { LowHurdleProp, HighBarrierProp, StylizedCoinProp } from './props/StylizedObstacles';
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
export { SubwayToonArtDirector } from '../components/SubwayToonArtDirector';
export { SubwayToonGroup, applySubwayToonStyle, getToonGradientMap, saturateToonColor, toToonMaterial } from './ToonMaterialHelper';
export { HealthBar3D } from './HealthBar3D';
export { FloatingNumbersLayer, getFeelDelta, resetFeelBus, spawnFloatingNumber, triggerHitStop, useGameLoop } from './gameFeel';
export {
  ComboStreakHUD, DEFAULT_UPGRADES, recordComboEvent, resetProgression, triggerUpgradeDraft,
} from './progression/RunProgression';
export { UpgradeModal } from './progression/UpgradeModal';
export {
  COLLECTIBLE_GOLD_MAT, addImpactTrauma, computeMagneticPull, createProceduralMaterial, emitPopup,
  isPowerupActive, motionBus, resetMotionBus, setTargetFov, stepSpring, triggerCameraShake, triggerJumpMotion, triggerLandMotion,
};

setHardCollisionHandler((x, y, z, spd) => {
  triggerCameraShake(Math.min(0.85, spd * 0.045));
  soundEngine.playLandThump();
  useGameStore.setState((s) => ({
    bursts: [...s.bursts.slice(-6), { id: `hit-${Date.now()}-${Math.random()}`, position: [x, y + 0.65, z], color: '#F59E0B' }],
  }));
});
