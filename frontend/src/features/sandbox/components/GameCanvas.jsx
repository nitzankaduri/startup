import { useEffect, useMemo, useState } from 'react';
import { PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { preloadCartoonCatalog } from '../assets/CartoonAssetCatalog';
import { JuiceFX } from '../assets/JuiceFX';
import { preloadCatalogModels } from '../assets/ModelCatalog';
import { CartoonVFX } from '../gameplay/CartoonVFX';
import { ArcadeRunnerRig } from '../modes/ArcadeRunnerRig';
import { ArenaCombatSystem } from '../modes/ArenaCombatSystem';
import { resetCombatBus } from '../modes/combatBus';
import { RacerController } from '../modes/RacerController';
import { WaveSpawner } from '../modes/WaveSpawner';
import { WorldPhysicsProvider } from '../physics/WorldPhysicsProvider';
import { createAsphaltRoadTextures, createBrushedMetalTextures, createTerrainSurfaceTextures } from '../sdk/ProceduralTextures';
import { FloatingNumbersLayer, resetArenaPhysics, resetFeelBus, resetMotionBus, resetProgression, resetRadarBus } from '../sdk/spawnSdk';
import { preloadAllRegistryModels } from '../sdk/assets/modelRegistry';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { SandboxEditorRig } from '../../editor/SandboxEditorRig';
import { useGameStore } from '../store/useGameStore';
import { useSceneEditorStore } from '../store/useSceneEditorStore';
import { QUALITY_PRESETS, useSettingsStore } from '../store/useSettingsStore';
import { AssetCatalog } from './AssetCatalog';
import { CameraRig } from './CameraRig';
import { DynamicGameRunner } from './DynamicGameRunner';
import { HoverboardSystem } from './HoverboardSystem';
import { ParticleSystem } from './ParticleSystem';
import { PlayerController } from './PlayerController';
import { PowerupSystem } from './PowerupSystem';
import { SceneCleanup } from './SceneCleanup';
import { SubwayToonArtDirector } from './SubwayToonArtDirector';
import { ThumbnailCapturer } from './ThumbnailCapturer';
import { WorldJsonScene } from './WorldJsonScene';
import { WorldScenery } from './WorldScenery';

export function GameCanvas({ gameConfig: propConfig, worldSpec = null, onFatalError }) {
  const [lowQuality, setLowQuality] = useState(false);

  const quality = useSettingsStore((s) => s.quality);
  const isPaused = useSettingsStore((s) => s.isPaused);
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  const dpr = lowQuality ? 1 : preset.dpr;
  const shadowMapSize = lowQuality ? 1024 : preset.shadowRes;

  const storeGame = useGameStore((state) => state.currentGame);
  const gravity = useGameStore((state) => state.gravity);
  const runId = useGameStore((state) => state.runId);
  const isEditMode = useSceneEditorStore((s) => s.isEditMode);
  const setSceneRootRef = useSceneEditorStore((s) => s.setSceneRootRef);

  useEffect(() => {
    preloadAllRegistryModels();
    preloadCatalogModels();
    preloadCartoonCatalog();
    return () => soundEngine.stopAmbient();
  }, []);

  useEffect(() => {
    useSettingsStore.getState().setPaused(false);
    useSceneEditorStore.getState().setEditMode(false);
    resetCombatBus(); resetMotionBus(); resetArenaPhysics();
    resetRadarBus(); resetFeelBus(); resetProgression();
  }, [runId]);

  const gameConfig = propConfig || storeGame?.game_config;
  const env = gameConfig?.environment || {};
  const gameMode = gameConfig?.game_mode || 'platformer';
  const groundColor = env.ground_color || '#3D261C';
  const isArena = gameMode === 'arena_shooter' || gameMode === 'survival_waves';
  const isRacer = gameMode === 'time_trial_racer';
  const isRunner = gameMode === 'arcade_runner';
  const activeWorldSpec = worldSpec || gameConfig?.world_json || gameConfig?.worldSpec || null;
  const hasWorldJson = Boolean(activeWorldSpec);
  const hasDynamicCode = !hasWorldJson && Boolean(gameConfig?.code || gameConfig?.generated_code);
  const deckSize = isArena ? [38, 1, 38] : [8, 1, 8];

  const deckTex = useMemo(
    () => (isRacer
      ? createAsphaltRoadTextures({ repeatX: 1, repeatY: 3 })
      : createTerrainSurfaceTextures({ biome: isArena ? 'sand' : 'grass', repeatX: isArena ? 6 : 2, repeatY: isArena ? 6 : 2 })),
    [isRacer, isArena]
  );
  const pedestalTex = useMemo(() => createBrushedMetalTextures({ repeatX: 2, repeatY: 6, baseColor: '#5B564E' }), []);

  if (!gameConfig) return null;

  return (
    <Canvas
      shadows dpr={dpr}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      camera={{ position: [0, 6, 10], fov: 60 }} style={{ width: '100%', height: '100%' }} className="w-full h-full block"
    >
      <PerformanceMonitor bounds={() => [45, 60]} onDecline={() => setLowQuality(true)} onIncline={() => setLowQuality(false)} />
      <SubwayToonArtDirector
        theme={activeWorldSpec?.theme}
        lighting={!hasDynamicCode}
        postFx={preset.postFx} lowQuality={lowQuality} shadowMapSize={lowQuality ? [1024, 1024] : [2048, 2048]}
      >
        <WorldPhysicsProvider runId={runId} paused={isPaused || isEditMode} gravity={[0, gravity ?? -22, 0]}>
          <group ref={setSceneRootRef}>
            {hasWorldJson ? (
              <WorldJsonScene world={activeWorldSpec} />
            ) : hasDynamicCode ? (
              <DynamicGameRunner key={runId} gameConfig={gameConfig} prompt={storeGame?.prompt || ''} onFatalError={onFatalError} />
            ) : (
              <>
                <WorldScenery title={gameConfig.title} environment={env} />
                <CameraRig gameMode={gameMode} cameraMode={gameConfig.camera_mode || env.camera_mode || 'follow'} rig={gameConfig.player?.rig} />
                {isRunner ? (
                  <ArcadeRunnerRig key={runId} playerConfig={gameConfig.player} groundColor={groundColor} />
                ) : (
                  <>
                    <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]} friction={0.85}>
                      <CuboidCollider args={[deckSize[0] / 2, 0.5, deckSize[2] / 2]} />
                      <RoundedBox args={deckSize} radius={0.1} smoothness={4} receiveShadow>
                        <meshStandardMaterial color={isRacer ? '#FFFFFF' : groundColor} {...deckTex} roughness={0.82} metalness={0.08} />
                      </RoundedBox>
                      <mesh position={[0, -12.5, 0]} receiveShadow>
                        <boxGeometry args={[deckSize[0] * 0.45, 24, deckSize[2] * 0.45]} />
                        <meshStandardMaterial color="#5B564E" {...pedestalTex} roughness={0.62} metalness={0.55} />
                      </mesh>
                    </RigidBody>
                    <AssetCatalog gameConfig={gameConfig} />
                    {isRacer ? <RacerController playerConfig={gameConfig.player} /> : <PlayerController playerConfig={gameConfig.player} />}
                    {isArena && <ArenaCombatSystem />}
                    {gameMode === 'survival_waves' && <WaveSpawner />}
                  </>
                )}
              </>
            )}
          </group>
        </WorldPhysicsProvider>
        <SandboxEditorRig />
        <JuiceFX vehicle={isRacer} />
        <CartoonVFX />
        <ParticleSystem />
        <PowerupSystem />
        <HoverboardSystem />
        <FloatingNumbersLayer />
      </SubwayToonArtDirector>
      <ThumbnailCapturer />
      <SceneCleanup runId={runId} />
    </Canvas>
  );
}
