import * as THREE from 'three';

const TARGET_CAM = new THREE.Vector3();
const LOOK_AT = new THREE.Vector3();
const BANK_STATE = { roll: 0 };

function computeArenaThreatBias(playerPos, enemies) {
  if (!enemies?.length) return [0, 0];
  let sx = 0; let sz = 0; let count = 0;
  for (let i = 0; i < enemies.length; i += 1) {
    const e = enemies[i];
    if (!e.alive) continue;
    const d = Math.hypot(e.x - playerPos.x, e.z - playerPos.z);
    if (d < 24) { sx += e.x - playerPos.x; sz += e.z - playerPos.z; count += 1; }
  }
  if (!count) return [0, 0];
  return [THREE.MathUtils.clamp((sx / count) * 0.22, -3.2, 3.2), THREE.MathUtils.clamp((sz / count) * 0.22, -3.2, 3.2)];
}

/**
 * Mode-aware dynamic camera rig:
 * - endless_runner: crisp behind-the-back chase [0, 4.5, 9.5], lookAt [0, 1.5, -10]
 * - arena_action: elevated tactical isometric [0, 14, 13] tracking player + nearby enemies
 * - sky_shooter: dynamic banking flight [0, 3.0, 9.5] with subtle turn roll
 * - vehicle_pursuit: low hood/bumper chase [0, 3.2, 7.5] with speed-scaled FOV (60 -> 82)
 * - open_world_sandbox: 3rd-person on-foot [0, 5.5, 9.5] <-> wide vehicle chase [0, 6.5, 12]
 */
export function stepActionCamera(camera, playerPos, opts, dt) {
  if (!camera || !playerPos) return 0;
  const { mode = 'endless_runner', boosting = false, shake = 0, vx = 0, speedRatio = 0, enemies = null, yaw = 0, inVehicle = false } = opts || {};

  let ox = 0; let oy = 4.5; let oz = 9.5;
  let lookX = playerPos.x * 0.4;
  let lookY = Math.max(1.5, playerPos.y + 0.5);
  let lookZ = playerPos.z - 10.0;
  let targetFov = boosting ? 70 : 60;

  if (mode === 'open_world_sandbox') {
    const dist = inVehicle ? 12.0 : 9.5;
    oy = inVehicle ? 6.5 : 5.5;
    ox = Math.sin(yaw) * dist;
    oz = Math.cos(yaw) * dist;
    lookX = playerPos.x - Math.sin(yaw) * (inVehicle ? 8.0 : 4.5);
    lookY = playerPos.y + (inVehicle ? 1.5 : 1.2);
    lookZ = playerPos.z - Math.cos(yaw) * (inVehicle ? 8.0 : 4.5);
    targetFov = inVehicle ? THREE.MathUtils.clamp(62 + speedRatio * 14, 62, 76) : (boosting ? 66 : 60);
  } else if (mode === 'arena_action') {
    const [bx, bz] = computeArenaThreatBias(playerPos, enemies);
    ox = bx * 0.45; oy = 14.0; oz = 13.0;
    lookX = playerPos.x + bx; lookY = playerPos.y + 0.5; lookZ = playerPos.z + bz - 1.5;
    targetFov = 58;
  } else if (mode === 'sky_shooter') {
    oy = 3.0; oz = 9.5;
    lookX = playerPos.x * 0.65; lookY = playerPos.y + 0.4; lookZ = playerPos.z - 18.0;
    targetFov = boosting ? 76 : 64;
  } else if (mode === 'vehicle_pursuit') {
    oy = 3.2; oz = 7.5;
    lookX = playerPos.x * 0.8; lookY = playerPos.y + 0.9; lookZ = playerPos.z - 16.0;
    targetFov = THREE.MathUtils.clamp(60 + speedRatio * 22, 60, 82);
  }

  const damp = 1 - Math.exp(-10 * dt);
  const minY = mode === 'sky_shooter' ? 1.5 : 2.2;
  TARGET_CAM.set(playerPos.x + ox, Math.max(minY, playerPos.y + oy), playerPos.z + oz);
  if (shake > 0.005) {
    TARGET_CAM.x += (Math.random() - 0.5) * shake;
    TARGET_CAM.y += (Math.random() - 0.5) * shake * 0.7;
  }
  camera.position.lerp(TARGET_CAM, damp);
  LOOK_AT.set(lookX, lookY, lookZ);
  camera.lookAt(LOOK_AT);

  const desiredRoll = mode === 'sky_shooter' ? THREE.MathUtils.clamp(-vx * 0.014, -0.22, 0.22) : 0;
  BANK_STATE.roll = THREE.MathUtils.lerp(BANK_STATE.roll, desiredRoll, 1 - Math.exp(-8 * dt));
  if (Math.abs(BANK_STATE.roll) > 0.001) camera.rotateZ(BANK_STATE.roll);

  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-8 * dt));
    camera.updateProjectionMatrix();
  }
  return Math.max(0, shake - dt * 2.4);
}
