import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { SandboxCanvas } from './SandboxCanvas';

function ThrowAsyncError({ error }) {
  if (error) throw error;
  return null;
}

/**
 * Full-viewport sandbox container hosting StudioLightingRig, Rapier Physics,
 * SmartModel .glb world specs, seamless Co-Pilot focus preservation & 1.5s poster snapshot.
 */
export function SandboxViewport({ gameConfig, worldSpec, onBackToLobby }) {
  const viewportRef = useRef(null);
  const prevWorldRef = useRef(null);
  const runId = useGameStore((s) => s.runId);
  const gameId = useGameStore((s) => s.currentGame?.id || '');
  const storeWorld = useGameStore((s) => s.currentGame?.game_config?.world_json || null);
  const activeWorld = worldSpec || storeWorld;
  const hasThumbnail = useGameStore((s) => Boolean(s.currentGame?.thumbnail));
  const [fatalError, setFatalError] = useState(null);

  useEffect(() => {
    setFatalError(null);
  }, [gameId, runId]);

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
      data-thumbnail-ready={hasThumbnail ? 'true' : 'false'}
      tabIndex={-1}
      style={{ width: '100vw', height: '100vh' }}
      className="relative w-screen h-screen min-h-screen overflow-hidden bg-[#E8DFD5] outline-none"
    >
      <CanvasErrorBoundary resetKey={gameId || 'preview'} onRetry={() => setFatalError(null)} onBackToLobby={onBackToLobby}>
        <ThrowAsyncError error={fatalError} />
        <SandboxCanvas world={activeWorld} />
      </CanvasErrorBoundary>
    </div>
  );
}
