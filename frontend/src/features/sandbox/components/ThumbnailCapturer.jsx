import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { uploadThumbnail } from '../../../shared/api/gameApi';
import { useGameStore } from '../store/useGameStore';

export function ThumbnailCapturer() {
  const { gl, scene, camera } = useThree();
  const currentGame = useGameStore((s) => s.currentGame);
  const updateThumbnail = useGameStore((s) => s.updateCurrentGameThumbnail);

  const gameId = currentGame?.id;
  const hasThumbnail = Boolean(currentGame?.thumbnail);

  useEffect(() => {
    if (!gameId || hasThumbnail) return;

    const timer = setTimeout(() => {
      try {
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/webp', 0.75);
        if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
        updateThumbnail(dataUrl);
        uploadThumbnail(gameId, dataUrl).catch(() => {});
      } catch {
        // Ignore canvas capture errors
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [camera, gameId, gl, hasThumbnail, scene, updateThumbnail]);

  return null;
}
