import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { GameCanvas } from './GameCanvas';

function ThrowAsyncError({ error }) {
  if (error) throw error;
  return null;
}

/** Full-viewport sandbox container enforcing explicit 100vw x 100vh dimensions, HUD-free 2s poster snapshot & ErrorBoundary. */
export function SandboxViewport({ gameConfig, onBackToLobby }) {
  const runId = useGameStore((s) => s.runId);
  const gameId = useGameStore((s) => s.currentGame?.id || '');
  const hasThumbnail = useGameStore((s) => Boolean(s.currentGame?.thumbnail));
  const [fatalError, setFatalError] = useState(null);

  useEffect(() => {
    setFatalError(null);
  }, [gameId, runId]);

  return (
    <div
      data-thumbnail-ready={hasThumbnail ? 'true' : 'false'}
      style={{ width: '100vw', height: '100vh' }}
      className="relative w-screen h-screen min-h-screen overflow-hidden bg-[#E8DFD5]"
    >
      <CanvasErrorBoundary resetKey={`${gameId}-${runId}`} onRetry={() => setFatalError(null)} onBackToLobby={onBackToLobby}>
        <ThrowAsyncError error={fatalError} />
        <GameCanvas gameConfig={gameConfig} onFatalError={setFatalError} />
      </CanvasErrorBoundary>
    </div>
  );
}
