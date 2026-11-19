import { useEffect, useState } from 'react';
import { PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { ArcadeRunnerRig } from '../modes/ArcadeRunnerRig';
import { ArenaCombatSystem } from '../modes/ArenaCombatSystem';
import { resetCombatBus } from '../modes/combatBus';
import { RacerController } from '../modes/RacerController';
import { WaveSpawner } from '../modes/WaveSpawner';
import { FloatingNumbersLayer, resetFeelBus, resetMotionBus, resetProgression, resetRadarBus } from '../sdk/spawnSdk';
import { preloadAllRegistryModels } from '../sdk/assets/modelRegistry';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';
import { QUALITY_PRESETS, useSettingsStore } from '../store/useSettingsStore';
import { AssetCatalog } from './AssetCatalog';
import { CameraRig } from './CameraRig';
import { DynamicGameRunner } from './DynamicGameRunner';
import { HoverboardSystem } from './HoverboardSystem';
import { ParticleSystem } from './ParticleSystem';
import { PlayerController } from './PlayerController';
import { PostFX } from './PostFX';
import { PowerupSystem } from './PowerupSystem';
import { SceneCleanup } from './SceneCleanup';
import { SceneEnvironment } from './SceneEnvironment';
import { ThumbnailCapturer } from './ThumbnailCapturer';
import { WorldScenery } from './WorldScenery';

export function GameCanvas({ gameConfig: propConfig, onFatalError }) {
  const [lowQuality, setLowQuality] = useState(false);

  const quality = useSettingsStore((s) => s.quality);
  const isPaused = useSettingsStore((s) => s.isPaused);
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  const dpr = lowQuality ? 1 : preset.dpr;
  const shadowMapSize = lowQuality ? 1024 : preset.shadowRes;

  const storeGame = useGameStore((state) => state.currentGame);
  const gravity = useGameStore((state) => state.gravity);
  const runId = useGameStore((state) => state.runId);

  useEffect(() => {
    preloadAllRegistryModels();
    return () => soundEngine.stopAmbient();
  }, []);

  useEffect(() => {
    resetCombatBus();
    resetMotionBus();
    resetRadarBus();
    resetFeelBus();
    resetProgression();
  }, [runId]);

  const gameConfig = propConfig || storeGame?.game_config;
  if (!gameConfig) return null;

  const env = gameConfig.environment || {};
  const gameMode = gameConfig.game_mode || 'platformer';
  const groundColor = env.ground_color || '#3D261C';
  const isArena = gameMode === 'arena_shooter' || gameMode === 'survival_waves';
  const isRacer = gameMode === 'time_trial_racer';
  const isRunner = gameMode === 'arcade_runner';
  const hasDynamicCode = Boolean(gameConfig.code || gameConfig.generated_code);
  const deckSize = isArena ? [38, 1, 38] : [8, 1, 8];

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, 6, 10], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
      className="w-full h-full block"
    >
      <PerformanceMonitor
        bounds={() => [45, 60]}
        onDecline={() => setLowQuality(true)}
        onIncline={() => setLowQuality(false)}
      />
      {hasDynamicCode ? (
        <DynamicGameRunner key={runId} gameConfig={gameConfig} prompt={storeGame?.prompt || ''} onFatalError={onFatalError} />
      ) : (
        <>
          <SceneEnvironment title={gameConfig.title} environment={env} lowQuality={lowQuality} shadowMapSize={shadowMapSize} />
          <WorldScenery title={gameConfig.title} environment={env} />
          <CameraRig gameMode={gameMode} cameraMode={gameConfig.camera_mode || env.camera_mode || 'follow'} />

          {isRunner ? (
            <ArcadeRunnerRig key={runId} playerConfig={gameConfig.player} groundColor={groundColor} />
          ) : (
            <Physics key={runId} paused={isPaused} gravity={[0, gravity, 0]}>
              <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]} friction={0.7}>
                <CuboidCollider args={[deckSize[0] / 2, 0.5, deckSize[2] / 2]} />
                <RoundedBox args={deckSize} radius={0.1} smoothness={4} receiveShadow>
                  <meshStandardMaterial color={groundColor} roughness={0.78} metalness={0.05} />
                </RoundedBox>
                <mesh position={[0, -12.5, 0]} receiveShadow>
                  <boxGeometry args={[deckSize[0] * 0.45, 24, deckSize[2] * 0.45]} />
                  <meshStandardMaterial color="#3F3A34" roughness={0.9} metalness={0.05} />
                </mesh>
              </RigidBody>

              <AssetCatalog gameConfig={gameConfig} />
              {isRacer ? (
                <RacerController playerConfig={gameConfig.player} />
              ) : (
                <PlayerController playerConfig={gameConfig.player} />
              )}
              {isArena && <ArenaCombatSystem />}
              {gameMode === 'survival_waves' && <WaveSpawner />}
            </Physics>
          )}
        </>
      )}

      <ParticleSystem />
      <PowerupSystem />
      <HoverboardSystem />
      <FloatingNumbersLayer />
      <PostFX quality={quality} lowQuality={lowQuality} cameraMode={gameConfig.camera_mode || env.camera_mode || 'follow'} />
      <ThumbnailCapturer />
      <SceneCleanup runId={runId} />
    </Canvas>
  );
}
