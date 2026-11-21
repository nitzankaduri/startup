import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { uploadThumbnail } from '../../../shared/api/gameApi';
import { useGameStore } from '../store/useGameStore';

/**
 * Auto-captures a crisp HUD-free WebGL poster snapshot 1.5s after studio lighting
 * and .glb models finish rendering so Lobby game cards show high-contrast 3D visuals.
 */
export function ThumbnailCapturer() {
  const { gl, scene, camera } = useThree();
  const currentGame = useGameStore((s) => s.currentGame);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const updateThumbnail = useGameStore((s) => s.updateCurrentGameThumbnail);
  const capturedKeyRef = useRef('');

  const gameId = currentGame?.id;
  const hasThumbnail = Boolean(currentGame?.thumbnail);
  const worldKey = currentGame?.game_config?.world_json?.title || currentGame?.title || '';

  useEffect(() => {
    if (!gameId || hasThumbnail) return;
    const captureKey = `${gameId}-${worldKey}`;
    if (capturedKeyRef.current === captureKey) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          gl.render(scene, camera);
          const dataUrl = gl.domElement.toDataURL('image/webp', 0.88);
          if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
          capturedKeyRef.current = captureKey;
          updateThumbnail(dataUrl);
          uploadThumbnail(gameId, dataUrl).catch(() => {});
        } catch {
          // Ignore canvas capture errors
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [camera, gameId, gl, hasStarted, hasThumbnail, scene, updateThumbnail, worldKey]);

  return null;
}
