import { useEffect, useId } from 'react';
import { RoundedBox } from '@react-three/drei';
import { registerCollider, resetArenaPhysics, setTerrainConfig, unregisterCollider } from './useArenaPhysics';

export { PlayerController } from './PlayerController';
export {
  getTerrainHeight, registerCollider, registerObjectCollider, resetArenaPhysics, resolveMovement, setHardCollisionHandler, setTerrainConfig, unregisterCollider, useArenaPhysics,
} from './useArenaPhysics';
export { useMissionState } from './useMissionState';

/** Declarative spatial obstacle box/cylinder that registers cleanly with useArenaPhysics on mount. */
export function ColliderBox({ id, position = [0, 0, 0], size = [2, 2, 2], radius = null, type = 'box', color = '#9A8F80', visible = false }) {
  const autoId = useId();
  const cid = id || `col-${autoId}`;

  useEffect(() => {
    registerCollider(cid, { position, size, radius }, type);
    return () => unregisterCollider(cid);
  }, [cid, position[0], position[1], position[2], size[0], size[1], size[2], radius, type]);

  if (!visible) return null;
  return (
    <RoundedBox args={size} radius={0.08} position={[position[0], position[1] + size[1] * 0.5, position[2]]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.78} />
    </RoundedBox>
  );
}

/** Wraps an entire scene to configure arena terrain collision bounds and reset stale colliders cleanly. */
export function GameRuntimeProvider({ terrain = null, children }) {
  useEffect(() => {
    if (terrain) setTerrainConfig(terrain);
    return () => resetArenaPhysics();
  }, [terrain?.amplitude, terrain?.flatRadius, terrain?.bounds]);

  return children || null;
}
