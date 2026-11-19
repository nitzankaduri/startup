import * as THREE from 'three';

const TMP_BOX = new THREE.Box3();
const TMP_SIZE = new THREE.Vector3();
const TMP_CENTER = new THREE.Vector3();

/** Computes uniform scale to match targetHeight (m) and Y offset so bounding box min.y sits at y = 0. */
export function computeNormalizedMetrics(object, targetHeight = 1.8) {
  if (!object) return { normScale: 1, offsetY: 0, centerX: 0, centerZ: 0, height: targetHeight };

  object.updateMatrixWorld(true);
  TMP_BOX.setFromObject(object);
  if (TMP_BOX.isEmpty()) return { normScale: 1, offsetY: 0, centerX: 0, centerZ: 0, height: targetHeight };

  TMP_BOX.getSize(TMP_SIZE);
  TMP_BOX.getCenter(TMP_CENTER);
  const rawHeight = TMP_SIZE.y;
  const normScale = rawHeight > 0.0005 ? targetHeight / rawHeight : 1;
  const offsetY = -TMP_BOX.min.y * normScale;

  return {
    normScale,
    offsetY,
    centerX: -TMP_CENTER.x * normScale,
    centerZ: -TMP_CENTER.z * normScale,
    height: rawHeight * normScale,
  };
}
