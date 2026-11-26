import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GameKernel } from '../kernel/GameKernel';
import { setKernelPaused } from '../kernel/kernelFreezeBus';
import { configureStudioShadows, preloadKenneyStudio } from '../kernel/StudioEngineCore';
import { FloatingNumbersLayer } from '../sdk/gameFeel';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ModeEnvironmentScene } from './ModeEnvironmentScene';
import { SubwayToonArtDirector } from './SubwayToonArtDirector';
import { ThumbnailCapturer } from './ThumbnailCapturer';

/** Standalone high-FPS Canvas hosting the imperative GameKernel and global keyboard focus capture. */
export function SandboxCanvas({ world }) {
  const wrapRef = useRef(null);
  const runId = useGameStore((s) => s.runId);

  useEffect(() => {
    preloadKenneyStudio();
    useSettingsStore.getState().setPaused(false);
    setKernelPaused(false);
    wrapRef.current?.focus({ preventScroll: true });
    const canvas = wrapRef.current?.querySelector('canvas');
    if (canvas) {
      if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '-1');
      canvas.focus({ preventScroll: true });
    }
  }, [runId, world]);

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}
      onPointerDown={() => wrapRef.current?.focus({ preventScroll: true })}
      style={{ width: '100%', height: '100%' }}
      className="w-full h-full outline-none"
    >
        <Canvas
          dpr={[1, 1.5]}
          shadows="soft"
          onCreated={({ gl }) => configureStudioShadows(gl)}
          gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', antialias: false, stencil: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
          camera={{ position: [0, 4.5, 9.5], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full block"
        >
        <SubwayToonArtDirector theme={world?.theme || 'sunny_city'} mode={world?.mode || 'endless_runner'}>
          <ModeEnvironmentScene world={world} />
          <GameKernel world={world} />
          <FloatingNumbersLayer />
        </SubwayToonArtDirector>
        <ThumbnailCapturer />
      </Canvas>
    </div>
  );
}
