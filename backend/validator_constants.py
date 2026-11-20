from typing import Set

VALID_SDK_EXPORTS: Set[str] = {
    "React", "useState", "useEffect", "useRef", "useMemo", "useCallback", "THREE", "useFrame", "useGameLoop",
    "useThree", "RoundedBox", "OrbitControls", "Html", "ContactShadows", "Float", "Text", "Physics", "RigidBody",
    "CuboidCollider", "BallCollider", "useGameInput", "SmartCamera", "RealisticPhysicsRig", "stepInertiaBody",
    "SmokeTrail", "PlayerController", "ColliderBox", "GameRuntimeProvider", "useArenaPhysics", "useMissionState",
    "registerCollider", "registerObjectCollider", "unregisterCollider", "resolveMovement", "getTerrainHeight", "setTerrainConfig",
    "SkeletalActor", "ArticulatedRunner", "PropModel", "AssetCatalog", "AutoNormalizeMesh", "StudioProp",
    "BiomeStage", "WeatherSystem", "PracticalLights", "WEATHER_CONFIGS", "TIME_OF_DAY_PRESETS",
    "SubwayCorridor", "CityBlockWorld", "CityGrid", "RaceTrack", "StylizedTrain", "StylizedRampTrain", "LowHurdleProp",
    "HighBarrierProp", "StylizedCoinProp", "resolveModelAsset", "DynamicWater", "InstancedFoliage",
    "ProjectilePool", "ExplosionBurst", "SmartEntity", "DrivableVehicle", "SkidMarks", "FlyableCraft",
    "GridBuilder", "useEconomy", "ObjectiveBeacon", "registerRadarBlip", "ExtrudedShape", "LatheObject",
    "RealisticTerrain", "ParticleBurst", "FloatingLabel", "HealthBar3D", "StudioBackdrop", "useStudioMaterial",
    "usePbrMaterial", "createPbrTextureSet", "createPhysicalMaterial", "PBR_SURFACES", "pbrMaterials",
    "motionBus", "addImpactTrauma", "triggerCameraShake", "setTargetFov", "emitPopup", "triggerHitStop",
    "spawnFloatingNumber", "getFeelDelta", "triggerUpgradeDraft", "recordComboEvent", "DEFAULT_UPGRADES",
    "stepSpring", "soundEngine",
}

JSX_PRIMITIVES: Set[str] = {
    "group", "mesh", "points", "line", "primitive", "ambientLight", "directionalLight", "pointLight", "spotLight",
    "hemisphereLight", "fog", "color", "div", "span", "p", "h1", "h2", "h3", "button",
}

WIN_LOSE_PATTERNS = ("onWin", "onGameOver", "triggerVictory", "triggerDefeat", "completeObjective")

CATALOG_MANIFEST = (
    "40+ STUDIO ASSET CATALOG (`<AssetCatalog name='...' />` or `<StudioProp type='...' />`):\n"
    "- Characters & Creatures: robot, soldier, hero, cesium_man, knight_hero, goblin_enemy, skeleton_enemy, fox, horse, flamingo, parrot\n"
    "- Sci-Fi & Space: starfighter, planetary_rover, laser_turret, cryo_pod, orbital_ring_gate, asteroid_cluster, helmet, crate\n"
    "- Fantasy & Medieval: castle_keep (tower), timber_tavern, crystal_shrine, catapult, treasure_chest, ruins_pillar\n"
    "- Modern & Racing: supercar (sports_car), offroad_buggy, buggy, police_cruiser, truck, streetlamp, concrete_barrier, suspension_bridge, skyscraper_block, tokyo\n"
    "- Nature & Survival: pine_tree, palm_tree, stylized_oak, boulder, wooden_dock, campfire, ruins_pillar"
)
