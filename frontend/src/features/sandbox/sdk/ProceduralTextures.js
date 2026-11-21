import * as THREE from 'three';

export { createAsphaltCobbleTextures, createBallastTrackTextures } from './proceduralTextures.jsx';

const CACHE = new Map();

function rand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function makeCanvas(size = 512) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function toTex(canvas, rx, ry, srgb = false) {
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function cached(key, build) {
  if (CACHE.has(key)) return CACHE.get(key);
  const val = build();
  if (CACHE.size >= 48) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, val);
  return val;
}

/** Procedural asphalt road PBR maps with aggregate grain, wear tracks, and lane markings. */
export function createAsphaltRoadTextures({ repeatX = 1, repeatY = 6, baseColor = '#27292E', markings = true } = {}) {
  return cached(`asphalt:${repeatX}:${repeatY}:${baseColor}:${markings}`, () => {
    const S = 512, mapC = makeCanvas(S), rghC = makeCanvas(S);
    if (!mapC || !rghC) return {};
    const ctx = mapC.getContext('2d'), rCtx = rghC.getContext('2d'), next = rand(104729);
    ctx.fillStyle = baseColor; ctx.fillRect(0, 0, S, S);
    rCtx.fillStyle = '#B8B8B8'; rCtx.fillRect(0, 0, S, S);
    for (let i = 0; i < 8500; i += 1) {
      const x = next() * S, y = next() * S, sz = next() > 0.8 ? 2 : 1;
      const v = Math.floor(28 + next() * 48), rv = Math.floor(155 + next() * 75);
      ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`; ctx.fillRect(x, y, sz, sz);
      rCtx.fillStyle = `rgb(${rv},${rv},${rv})`; rCtx.fillRect(x, y, sz, sz);
    }
    ctx.fillStyle = 'rgba(12,13,16,0.22)';
    ctx.fillRect(S * 0.22, 0, S * 0.14, S);
    ctx.fillRect(S * 0.64, 0, S * 0.14, S);
    if (markings) {
      ctx.fillStyle = '#EFECE4'; ctx.fillRect(20, 0, 12, S); ctx.fillRect(S - 32, 0, 12, S);
      ctx.fillStyle = '#D96B27';
      for (let y = 18; y < S; y += 96) ctx.fillRect(S / 2 - 7, y, 14, 52);
    }
    const rTex = toTex(rghC, repeatX, repeatY);
    return { map: toTex(mapC, repeatX, repeatY, true), bumpMap: rTex, roughnessMap: rTex };
  });
}

/** Procedural concrete + glass building facade with warm/cool lit interior windows. */
export function createBuildingFacadeTextures({ repeatX = 2, repeatY = 4, concreteColor = '#D6CFC2', night = false } = {}) {
  return cached(`facade:${repeatX}:${repeatY}:${concreteColor}:${night}`, () => {
    const S = 512, cols = 6, rows = 8;
    const mapC = makeCanvas(S), rghC = makeCanvas(S), emiC = makeCanvas(S);
    if (!mapC || !rghC || !emiC) return {};
    const ctx = mapC.getContext('2d'), rCtx = rghC.getContext('2d'), eCtx = emiC.getContext('2d');
    const next = rand(night ? 7919 : 3571), cw = S / cols, rh = S / rows;
    ctx.fillStyle = concreteColor; ctx.fillRect(0, 0, S, S);
    rCtx.fillStyle = '#DFDFDF'; rCtx.fillRect(0, 0, S, S);
    eCtx.fillStyle = '#000000'; eCtx.fillRect(0, 0, S, S);
    for (let r = 0; r < rows; r += 1) {
      ctx.fillStyle = 'rgba(24,23,21,0.12)'; ctx.fillRect(0, r * rh, S, 3);
      for (let c = 0; c < cols; c += 1) {
        const x = c * cw + 11, y = r * rh + 10, w = cw - 22, h = rh - 18;
        const lit = next() < (night ? 0.58 : 0.34);
        ctx.fillStyle = lit ? (next() > 0.35 ? '#F5D59B' : '#CFE1F2') : '#1E2738';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(24,23,21,0.28)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
        rCtx.fillStyle = '#282828'; rCtx.fillRect(x, y, w, h);
        if (lit) { eCtx.fillStyle = night ? '#FFE2AE' : '#A88C60'; eCtx.fillRect(x + 2, y + 2, w - 4, h - 4); }
      }
    }
    return { map: toTex(mapC, repeatX, repeatY, true), roughnessMap: toTex(rghC, repeatX, repeatY), emissiveMap: toTex(emiC, repeatX, repeatY, true) };
  });
}

/** Procedural terrain surface (grass meadow or wind-rippled sand) with bump + roughness maps. */
export function createTerrainSurfaceTextures({ biome = 'grass', repeatX = 12, repeatY = 12 } = {}) {
  return cached(`terrain:${biome}:${repeatX}:${repeatY}`, () => {
    const S = 512, isSand = biome === 'sand', mapC = makeCanvas(S), bmpC = makeCanvas(S);
    if (!mapC || !bmpC) return {};
    const ctx = mapC.getContext('2d'), bCtx = bmpC.getContext('2d'), next = rand(isSand ? 9973 : 6133);
    ctx.fillStyle = isSand ? '#DFC9A4' : '#537345'; ctx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#808080'; bCtx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += isSand ? 6 : 8) {
      ctx.fillStyle = isSand ? 'rgba(182,148,104,0.16)' : 'rgba(34,54,28,0.14)';
      ctx.fillRect(0, y + Math.sin(y * 0.08) * 2.5, S, isSand ? 3 : 5);
    }
    for (let i = 0; i < 6500; i += 1) {
      const x = next() * S, y = next() * S, r = 1 + next() * 2.5, bv = Math.floor(90 + next() * 110);
      ctx.fillStyle = isSand ? (next() > 0.5 ? '#C7AE83' : '#EFE1C4') : (next() > 0.5 ? '#668854' : '#3E5B32');
      ctx.fillRect(x, y, isSand ? r : 2, isSand ? r * 0.7 : 3 + next() * 5);
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`; bCtx.fillRect(x, y, 2, 3);
    }
    const bTex = toTex(bmpC, repeatX, repeatY);
    return { map: toTex(mapC, repeatX, repeatY, true), bumpMap: bTex, roughnessMap: bTex };
  });
}

/** Procedural brushed metal micro-streak albedo, bump, and roughness textures. */
export function createBrushedMetalTextures({ repeatX = 2, repeatY = 2, baseColor = '#8A909B' } = {}) {
  return cached(`metal:${repeatX}:${repeatY}:${baseColor}`, () => {
    const S = 256, mapC = makeCanvas(S), bmpC = makeCanvas(S);
    if (!mapC || !bmpC) return {};
    const ctx = mapC.getContext('2d'), bCtx = bmpC.getContext('2d'), next = rand(4999);
    ctx.fillStyle = baseColor; ctx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#707070'; bCtx.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i += 1) {
      const y = next() * S, x = next() * S, w = 24 + next() * 90, bv = Math.floor(95 + next() * 75);
      ctx.fillStyle = next() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(18,22,30,0.09)';
      ctx.fillRect(x, y, w, 1);
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`; bCtx.fillRect(x, y, w, 1);
    }
    ctx.strokeStyle = 'rgba(20,24,30,0.22)'; ctx.strokeRect(2, 2, S - 4, S - 4);
    const bTex = toTex(bmpC, repeatX, repeatY);
    return { map: toTex(mapC, repeatX, repeatY, true), bumpMap: bTex, roughnessMap: bTex };
  });
}
