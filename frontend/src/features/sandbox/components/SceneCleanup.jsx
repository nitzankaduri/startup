import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

function disposeSceneResources(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => mat?.dispose?.());
    }
  });
}

export function SceneCleanup({ runId }) {
  const { scene } = useThree();

  useEffect(() => {
    return () => disposeSceneResources(scene);
  }, [runId, scene]);

  return null;
}
