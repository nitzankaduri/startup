import * as THREE from 'three';

const ENV_CACHE = new Map();
const SUN_DIR = new THREE.Vector3(0.45, 0.72, 0.48).normalize();
const RIM_DIR = new THREE.Vector3(-0.55, 0.38, -0.68).normalize();
const DIR = new THREE.Vector3();

const ENV_PALETTES = {
  sunny_city: { top: [0.35, 0.72, 1.38], horizon: [1.45, 1.15, 0.82], ground: [0.46, 0.40, 0.34] },
  tropical_beach: { top: [0.22, 0.78, 1.38], horizon: [1.50, 1.25, 0.78], ground: [0.55, 0.46, 0.32] },
  candy_sky: { top: [0.68, 0.62, 1.42], horizon: [1.48, 1.05, 1.18], ground: [0.52, 0.38, 0.48] },
  tokyo_festival: { top: [0.26, 0.56, 1.32], horizon: [1.45, 0.96, 0.76], ground: [0.38, 0.34, 0.40] },
  desert_canyon: { top: [0.42, 0.66, 1.26], horizon: [1.55, 1.04, 0.66], ground: [0.58, 0.38, 0.24] },
  wild_west: { top: [0.48, 0.66, 1.26], horizon: [1.55, 1.04, 0.66], ground: [0.56, 0.38, 0.24] },
  space_sky: { top: [0.12, 0.22, 0.58], horizon: [0.38, 0.56, 0.95], ground: [0.14, 0.16, 0.26] },
};

export const STUDIO_BLOOM_CONFIG = {
  luminanceThreshold: 0.92,
  luminanceSmoothing: 0.14,
  intensity: 0.35,
  mipmapBlur: true,
};

/** Configures WebGLRenderer for ACESFilmic HDR tone mapping, sRGB output & crisp PCFSoftShadowMap. */
export function configureStudioRenderer(gl) {
  if (!gl) return;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.15;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}

/** Synthesizes & caches a procedural studio HDRI PMREM environment map for rich PBR reflections. */
export function createStudioEnvironmentMap(gl, theme = 'sunny_city') {
  if (!gl) return null;
  const key = ENV_PALETTES[theme] ? theme : 'sunny_city';
  if (ENV_CACHE.has(key)) return ENV_CACHE.get(key);

  const pal = ENV_PALETTES[key];
  const w = 128; const h = 64;
  const data = new Uint16Array(w * h * 4);
  const toHalf = THREE.DataUtils.toHalfFloat;

  for (let y = 0; y < h; y += 1) {
    const v = 1 - (y + 0.5) / h;
    const phi = (1 - v) * Math.PI;
    const sinP = Math.sin(phi); const cosP = Math.cos(phi);
    for (let x = 0; x < w; x += 1) {
      const theta = ((x + 0.5) / w) * Math.PI * 2;
      DIR.set(-sinP * Math.sin(theta), cosP, -sinP * Math.cos(theta)).normalize();
      const up = DIR.y;
      const skyMix = THREE.MathUtils.smoothstep(up, 0.0, 0.65);
      const gndMix = THREE.MathUtils.smoothstep(-up, 0.0, 0.45);
      let r = THREE.MathUtils.lerp(pal.horizon[0], pal.top[0], skyMix);
      let g = THREE.MathUtils.lerp(pal.horizon[1], pal.top[1], skyMix);
      let b = THREE.MathUtils.lerp(pal.horizon[2], pal.top[2], skyMix);
      if (up < 0) {
        r = THREE.MathUtils.lerp(r, pal.ground[0], gndMix);
        g = THREE.MathUtils.lerp(g, pal.ground[1], gndMix);
        b = THREE.MathUtils.lerp(b, pal.ground[2], gndMix);
      }
      const sunDot = Math.max(0, DIR.dot(SUN_DIR));
      const sunLobe = Math.pow(sunDot, 28) * 5.2 + Math.pow(sunDot, 5) * 0.45;
      const rimLobe = Math.pow(Math.max(0, DIR.dot(RIM_DIR)), 14) * 1.4;
      r += sunLobe * 1.05 + rimLobe * 0.65;
      g += sunLobe * 0.96 + rimLobe * 0.85;
      b += sunLobe * 0.82 + rimLobe * 1.15;

      const idx = (y * w + x) * 4;
      data[idx] = toHalf(r); data[idx + 1] = toHalf(g); data[idx + 2] = toHalf(b); data[idx + 3] = toHalf(1);
    }
  }

  const equirect = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.magFilter = THREE.LinearFilter;
  equirect.minFilter = THREE.LinearFilter;
  equirect.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  const envTarget = pmrem.fromEquirectangular(equirect);
  equirect.dispose();
  pmrem.dispose();

  ENV_CACHE.set(key, envTarget.texture);
  return envTarget.texture;
}

/** Tightly tracks the active player with the 2048x2048 directional shadow frustum to avoid shadow swimming. */
export function updateShadowTracker(sunLight, playerPos) {
  if (!sunLight || !playerPos) return;
  const snap = 0.25;
  const tx = Math.round((playerPos.x || 0) / snap) * snap;
  const tz = Math.round((playerPos.z || 0) / snap) * snap;
  sunLight.position.set(tx + 22, 36, tz + 20);
  sunLight.target.position.set(tx, 0, tz - 6);
  sunLight.target.updateMatrixWorld();
}
