import * as THREE from 'three';

const TEX_LOADER = typeof THREE.TextureLoader === 'function' ? new THREE.TextureLoader() : null;
const MATCAP_TEX_CACHE = new Map();
const MATCAP_MAT_CACHE = new Map();
const WHITE = new THREE.Color('#FFFFFF');

/** Cached MatCap Texture loader (toon_vibrant, toon_metallic, toon_soft). */
export function getMatcapTexture(kind = 'toon_vibrant') {
  if (MATCAP_TEX_CACHE.has(kind)) return MATCAP_TEX_CACHE.get(kind);
  const path = `/matcaps/${kind}.png`;
  const tex = TEX_LOADER ? TEX_LOADER.load(path) : null;
  if (tex) tex.colorSpace = THREE.SRGBColorSpace;
  MATCAP_TEX_CACHE.set(kind, tex);
  return tex;
}

/** Module-cached MeshMatcapMaterial tinted by palette color — zero allocations after warm-up. */
export function getStudioMatcapMaterial(colorHex = '#FFFFFF', kind = 'toon_vibrant') {
  const key = `${kind}|${colorHex}`;
  if (MATCAP_MAT_CACHE.has(key)) return MATCAP_MAT_CACHE.get(key);
  const mat = new THREE.MeshMatcapMaterial({
    color: new THREE.Color(colorHex),
    matcap: getMatcapTexture(kind),
  });
  if (MATCAP_MAT_CACHE.size < 256) MATCAP_MAT_CACHE.set(key, mat);
  return mat;
}

/** Converts all child mesh materials on a rigged/prop root to cached MeshMatcapMaterial. */
export function applyStudioMatcap(root, tintHex = null, kind = 'toon_vibrant') {
  if (!root) return;
  const matcapTex = getMatcapTexture(kind);
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const hex = tintHex || `#${(src.color || WHITE).getHexString()}`;
    const texKey = `${kind}|${hex}|${src.map?.uuid || ''}`;
    if (MATCAP_MAT_CACHE.has(texKey)) {
      obj.material = MATCAP_MAT_CACHE.get(texKey);
      return;
    }
    const mat = new THREE.MeshMatcapMaterial({
      color: new THREE.Color(hex),
      matcap: matcapTex,
      map: src.map || null,
    });
    if (MATCAP_MAT_CACHE.size < 256) MATCAP_MAT_CACHE.set(texKey, mat);
    obj.material = mat;
  });
}

/** Triggers crisp 80ms white hit-flash feedback by toggling cached white vs original material. */
export function applyHitFlash(root, isFlashing) {
  if (!root) return;
  const flashMat = getStudioMatcapMaterial('#FFFFFF', 'toon_vibrant');
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (isFlashing) {
      if (!obj.userData._origMat) obj.userData._origMat = obj.material;
      obj.material = flashMat;
    } else if (obj.userData._origMat) {
      obj.material = obj.userData._origMat;
    }
  });
}
