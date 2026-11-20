import * as THREE from 'three';

const TEX_CACHE = new Map();

function makeCanvas(w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(canvas, rx = 1, ry = 1, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Synthesizes crisp architectural facade textures (windows, mullions, ledges & warm plaster/brick). */
export function createBuildingFacadeTextures({
  wall = '#D89B72', trim = '#F3E5D0', glass = '#2B3E52', litGlass = '#FCE0A6', cols = 4, rows = 6, arched = false, seed = 1,
} = {}) {
  const key = `facade-${wall}-${trim}-${glass}-${cols}-${rows}-${arched}-${seed}`;
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key);

  const albedo = makeCanvas(512, 512);
  const rough = makeCanvas(512, 512);
  const bump = makeCanvas(512, 512);
  const ctx = albedo.getContext('2d');
  const rCtx = rough.getContext('2d');
  const bCtx = bump.getContext('2d');

  ctx.fillStyle = wall; ctx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = '#C8C8C8'; rCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#909090'; bCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, y, 512, 2);
  }

  const cw = 512 / cols;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r += 1) {
    const y0 = r * rh;
    ctx.fillStyle = trim; ctx.fillRect(0, y0 + rh - 8, 512, 8);
    bCtx.fillStyle = '#E0E0E0'; bCtx.fillRect(0, y0 + rh - 8, 512, 8);
    for (let c = 0; c < cols; c += 1) {
      const wx = c * cw + cw * 0.2;
      const wy = y0 + rh * 0.16;
      const ww = cw * 0.6;
      const wh = rh * 0.62;
      const lit = ((r * 7 + c * 13 + seed * 19) % 5) === 0;

      ctx.fillStyle = trim; ctx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      bCtx.fillStyle = '#D8D8D8'; bCtx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);

      ctx.fillStyle = lit ? litGlass : glass;
      if (arched) {
        ctx.beginPath();
        ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
        ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx, wy + wh); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(wx, wy, ww, wh);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(wx + 4, wy + 4, ww * 0.28, wh - 8);
      rCtx.fillStyle = '#242424'; rCtx.fillRect(wx, wy, ww, wh);
      bCtx.fillStyle = '#383838'; bCtx.fillRect(wx, wy, ww, wh);

      ctx.fillStyle = trim;
      ctx.fillRect(wx + ww * 0.48, wy, 3, wh);
      ctx.fillRect(wx, wy + wh * 0.5, ww, 3);
    }
  }

  const out = {
    map: toTexture(albedo, 1, 1, true),
    roughnessMap: toTexture(rough, 1, 1, false),
    bumpMap: toTexture(bump, 1, 1, false),
    bumpScale: 0.06, roughness: 0.85, metalness: 0.08,
  };
  TEX_CACHE.set(key, out);
  return out;
}

/** Synthesizes sunlit urban wet-asphalt road textures with dashed yellow centerlines & curb wear. */
export function createCityRoadTextures(rx = 1, ry = 18) {
  const key = `road-${rx}-${ry}`;
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key);

  const albedo = makeCanvas(512, 512);
  const bump = makeCanvas(512, 512);
  const ctx = albedo.getContext('2d');
  const bCtx = bump.getContext('2d');
  ctx.fillStyle = '#363940'; ctx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#888888'; bCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i += 1) {
    const x = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 512;
    const y = ((Math.sin(i * 78.233) * 19341.123) % 1 + 1) % 1 * 512;
    const v = 42 + (i % 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`; ctx.fillRect(x, y, 2, 2);
    const bv = 95 + (i % 90);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`; bCtx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = '#EFECE4'; ctx.fillRect(24, 0, 10, 512); ctx.fillRect(478, 0, 10, 512);
  ctx.fillStyle = '#F2B94B';
  for (let y = 16; y < 512; y += 96) { ctx.fillRect(248, y, 6, 56); ctx.fillRect(258, y, 6, 56); }

  const out = {
    map: toTexture(albedo, rx, ry, true),
    bumpMap: toTexture(bump, rx, ry, false),
    bumpScale: 0.035, roughness: 0.78, metalness: 0.03,
  };
  TEX_CACHE.set(key, out);
  return out;
}
