import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { Canvas2DViewport } from './Canvas2DViewport';
import { SandboxCanvas } from './SandboxCanvas';

function ThrowAsyncError({ error }) {
  if (error) throw error;
  return null;
}

/**
 * Full-viewport sandbox router seamlessly mounting Canvas2DViewport (2D Engine)
 * or SandboxCanvas (3D HDRI Studio Engine) from GameSpec.dimension / GameSpec.mode.
 */
export function SandboxViewport({ gameSpec, worldSpec, onBackToLobby }) {
  const viewportRef = useRef(null);
  const prevWorldRef = useRef(null);
  const runId = useGameStore((s) => s.runId);
  const gameId = useGameStore((s) => s.currentGame?.id || '');
  const cfg = useGameStore((s) => s.currentGame?.game_config || null);
  const activeWorld = gameSpec || worldSpec || cfg?.world_json || null;
  const hasThumbnail = useGameStore((s) => Boolean(s.currentGame?.thumbnail));
  const [fatalError, setFatalError] = useState(null);

  const rawMode = String(activeWorld?.mode || cfg?.mode || cfg?.game_mode || '').toLowerCase();
  const rawDim = String(activeWorld?.dimension || cfg?.dimension || '').toLowerCase();
  const dimension = rawDim === '2d' || rawMode.startsWith('2d_') ? '2d' : '3d';

  useEffect(() => { setFatalError(null); }, [gameId, runId, dimension]);

  useEffect(() => {
    if (!activeWorld) return;
    if (prevWorldRef.current && prevWorldRef.current !== activeWorld) {
      requestAnimationFrame(() => {
        const canvas = viewportRef.current?.querySelector('canvas');
        if (canvas) {
          if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '-1');
          canvas.focus({ preventScroll: true });
        }
      });
    }
    prevWorldRef.current = activeWorld;
  }, [activeWorld]);

  return (
    <div
      ref={viewportRef}
      data-sandbox-viewport="true"
      data-dimension={dimension}
      data-mode={rawMode}
      data-thumbnail-ready={hasThumbnail ? 'true' : 'false'}
      tabIndex={-1}
      style={{ width: '100vw', height: '100vh' }}
      className="relative w-screen h-screen min-h-screen overflow-hidden bg-[#E8DFD5] outline-none"
    >
      <CanvasErrorBoundary resetKey={`${gameId || 'preview'}-${dimension}-${rawMode}`} onRetry={() => setFatalError(null)} onBackToLobby={onBackToLobby}>
        <ThrowAsyncError error={fatalError} />
        {dimension === '2d' ? <Canvas2DViewport world={activeWorld} /> : <SandboxCanvas world={activeWorld} />}
      </CanvasErrorBoundary>
    </div>
  );
}
