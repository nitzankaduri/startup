import * as THREE from 'three';

const TARGET_CAM = new THREE.Vector3();
const LOOK_AT = new THREE.Vector3();

/**
 * Locked action chase camera: smoothly tracks behind player with dynamic boost FOV and impact micro-shake.
 * Zero per-frame allocations.
 */
export function stepActionCamera(camera, playerPos, { isArena = false, boosting = false, shake = 0 }, dt) {
  if (!camera || !playerPos) return 0;
  const ox = 0;
  const oy = isArena ? 7.5 : 4.2;
  const oz = isArena ? 11.0 : 8.5;

  const damp = 1 - Math.exp(-10 * dt);
  TARGET_CAM.set(playerPos.x + ox, Math.max(2.2, playerPos.y + oy), playerPos.z + oz);
  if (shake > 0.005) {
    TARGET_CAM.x += (Math.random() - 0.5) * shake;
    TARGET_CAM.y += (Math.random() - 0.5) * shake * 0.7;
  }
  camera.position.lerp(TARGET_CAM, damp);

  LOOK_AT.set(playerPos.x * 0.5, Math.max(0.8, playerPos.y + 1.5), playerPos.z - 12.0);
  camera.lookAt(LOOK_AT);

  const targetFov = boosting ? 70 : 60;
  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-8 * dt));
    camera.updateProjectionMatrix();
  }
  return Math.max(0, shake - dt * 2.4);
}
