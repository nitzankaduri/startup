import { useMemo } from 'react';
import * as THREE from 'three';
import { loadCdnImage, normRepeat, PBR_SURFACES, samplePbrPattern, tileableFbm } from './pbrNoise';

export { PBR_SURFACES };

const TEX_SIZE = 512;
const SURFACE_CACHE = new Map();
const TEXTURE_SET_CACHE = new Map();

function makeCanvas(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE; canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);
  drawFn(img.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function buildBaseCanvases(surface) {
  if (SURFACE_CACHE.has(surface)) return SURFACE_CACHE.get(surface);
  const spec = PBR_SURFACES[surface] || PBR_SURFACES.cracked_concrete;
  const total = TEX_SIZE * TEX_SIZE;
  const hf = new Float32Array(total);
  for (let y = 0; y < TEX_SIZE; y += 1) {
    const v = y / TEX_SIZE;
    for (let x = 0; x < TEX_SIZE; x += 1) {
      const u = x / TEX_SIZE;
      hf[y * TEX_SIZE + x] = samplePbrPattern(spec.mode, u, v, tileableFbm(u, v, 8, 4, 101), tileableFbm(u, v, 16, 3, 503), x, y);
    }
  }

  const albedoCanvas = makeCanvas((d) => {
    const [br, bg, bb] = spec.base; const [ar, ag, ab] = spec.accent;
    for (let i = 0; i < total; i += 1) {
      const h = hf[i]; const grime = 0.86 + h * 0.28;
      const mix = Math.max(0, Math.min(1, spec.mode === 'moss' ? (h < 0.45 ? 1 - h : 0) : 1 - h));
      const p = i * 4;
      d[p] = Math.min(255, (br * (1 - mix) + ar * mix) * grime);
      d[p + 1] = Math.min(255, (bg * (1 - mix) + ag * mix) * grime);
      d[p + 2] = Math.min(255, (bb * (1 - mix) + ab * mix) * grime);
      d[p + 3] = 255;
    }
  });

  const normalCanvas = makeCanvas((d) => {
    const str = 2.6;
    for (let y = 0; y < TEX_SIZE; y += 1) {
      const ym = (y - 1 + TEX_SIZE) % TEX_SIZE; const yp = (y + 1) % TEX_SIZE;
      for (let x = 0; x < TEX_SIZE; x += 1) {
        const xm = (x - 1 + TEX_SIZE) % TEX_SIZE; const xp = (x + 1) % TEX_SIZE;
        const dx = (hf[y * TEX_SIZE + xp] - hf[y * TEX_SIZE + xm]) * str;
        const dy = (hf[yp * TEX_SIZE + x] - hf[ym * TEX_SIZE + x]) * str;
        const inv = 1 / Math.hypot(dx, dy, 1);
        const p = (y * TEX_SIZE + x) * 4;
        d[p] = ((-dx * inv) * 0.5 + 0.5) * 255;
        d[p + 1] = ((-dy * inv) * 0.5 + 0.5) * 255;
        d[p + 2] = (inv * 0.5 + 0.5) * 255;
        d[p + 3] = 255;
      }
    }
  });

  const roughCanvas = makeCanvas((d) => {
    for (let i = 0; i < total; i += 1) {
      const h = hf[i];
      const rNorm = spec.mode === 'marble'
        ? THREE.MathUtils.lerp(0.22, 0.82, h)
        : spec.mode === 'puddle'
          ? THREE.MathUtils.lerp(0.72, 0.85, h)
          : Math.max(0.72, spec.roughness * 0.78 + (1 - h) * 0.22);
      const rVal = Math.max(25, Math.min(255, rNorm * 255));
      const p = i * 4; d[p] = d[p + 1] = d[p + 2] = rVal; d[p + 3] = 255;
    }
  });

  const result = { albedoCanvas, normalCanvas, roughCanvas, spec };
  SURFACE_CACHE.set(surface, result);
  return result;
}

function wrapTex(canvas, repeat, srgb = false, cdnPath = null) {
  const [rx, ry] = normRepeat(repeat);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  if (cdnPath) loadCdnImage(cdnPath, (img) => { tex.image = img; tex.anisotropy = 8; tex.needsUpdate = true; });
  return tex;
}

/** Synthesizes cached 512x512 seamless Albedo, Normal, and Roughness GPU TextureSets (+ async CDN maps) with anisotropy=8. */
export function createPbrTextureSet(surface = 'cracked_concrete', { repeat = [1, 1] } = {}) {
  const rep = normRepeat(repeat);
  const cacheKey = `${surface}:${rep[0]}:${rep[1]}`;
  if (TEXTURE_SET_CACHE.has(cacheKey)) return TEXTURE_SET_CACHE.get(cacheKey);
  const { albedoCanvas, normalCanvas, roughCanvas, spec } = buildBaseCanvases(surface);
  const [cdnDiff, cdnBump, cdnRough] = spec.cdn || [];
  const normalMap = wrapTex(normalCanvas, rep, false, cdnBump);
  const texSet = {
    map: wrapTex(albedoCanvas, rep, true, cdnDiff), normalMap, bumpMap: normalMap, roughnessMap: wrapTex(roughCanvas, rep, false, cdnRough),
    bumpScale: spec.bumpScale, roughness: spec.roughness, metalness: spec.metalness,
    ...(spec.clearcoat ? { clearcoat: spec.clearcoat, clearcoatRoughness: spec.clearcoatRoughness } : {}),
    ...(spec.transmission ? { transmission: spec.transmission, ior: spec.ior, thickness: spec.thickness, transparent: true } : {}),
    ...(spec.sheen ? { sheen: spec.sheen, sheenColor: spec.sheenColor, sheenRoughness: spec.sheenRoughness } : {}),
  };
  TEXTURE_SET_CACHE.set(cacheKey, texSet);
  return texSet;
}

export function createPhysicalMaterial(surface = 'cracked_concrete', options = {}) {
  const { repeat = [1, 1], color = '#FFFFFF', ...rest } = options;
  return new THREE.MeshPhysicalMaterial({ ...createPbrTextureSet(surface, { repeat: normRepeat(repeat) }), color, ...rest });
}

export function usePbrMaterial({ surface = 'cracked_concrete', repeat = [1, 1], color = '#FFFFFF', roughness, metalness, bumpScale, ...rest } = {}) {
  const [rx, ry] = normRepeat(repeat);
  return useMemo(() => {
    const tex = createPbrTextureSet(surface, { repeat: [rx, ry] });
    return { ...tex, color, roughness: roughness ?? tex.roughness, metalness: metalness ?? tex.metalness, bumpScale: bumpScale ?? tex.bumpScale, ...rest };
  }, [surface, rx, ry, color, roughness, metalness, bumpScale]);
}

export const pbrMaterials = {
  PBR_SURFACES,
  createPbrTextureSet,
  createPhysicalMaterial,
  usePbrMaterial,
};
