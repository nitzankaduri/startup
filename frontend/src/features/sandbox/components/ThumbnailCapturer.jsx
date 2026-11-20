import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { uploadThumbnail } from '../../../shared/api/gameApi';
import { useGameStore } from '../store/useGameStore';

/** Auto-captures a clean HUD-free WebGL poster snapshot 2s after gameplay starts for the Lobby gallery. */
export function ThumbnailCapturer() {
  const { gl, scene, camera } = useThree();
  const currentGame = useGameStore((s) => s.currentGame);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const gameState = useGameStore((s) => s.gameState);
  const updateThumbnail = useGameStore((s) => s.updateCurrentGameThumbnail);
  const capturedIdRef = useRef('');

  const gameId = currentGame?.id;
  const hasThumbnail = Boolean(currentGame?.thumbnail);

  useEffect(() => {
    if (!gameId || hasThumbnail || !hasStarted || gameState !== 'playing' || capturedIdRef.current === gameId) return;

    const timer = setTimeout(() => {
      try {
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/webp', 0.86);
        if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
        capturedIdRef.current = gameId;
        updateThumbnail(dataUrl);
        uploadThumbnail(gameId, dataUrl).catch(() => {});
      } catch {
        // Ignore canvas capture errors
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [camera, gameId, gameState, gl, hasStarted, hasThumbnail, scene, updateThumbnail]);

  return null;
}
