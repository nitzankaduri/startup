export const PBR_SURFACES = {
  weathered_asphalt: { base: [58, 60, 66], accent: [38, 40, 46], roughness: 0.84, metalness: 0.06, bumpScale: 0.045, mode: 'grit' },
  cracked_concrete: { base: [164, 158, 148], accent: [112, 107, 98], roughness: 0.88, metalness: 0.04, bumpScale: 0.055, mode: 'crack' },
  brushed_steel: { base: [176, 182, 190], accent: [128, 136, 146], roughness: 0.34, metalness: 0.86, bumpScale: 0.022, mode: 'streak' },
  aged_timber: { base: [126, 88, 56], accent: [74, 48, 28], roughness: 0.78, metalness: 0.03, bumpScale: 0.042, mode: 'wood' },
  volcanic_rock: { base: [64, 58, 56], accent: [34, 30, 32], roughness: 0.92, metalness: 0.06, bumpScale: 0.075, mode: 'ridge' },
  desert_sand: { base: [214, 182, 134], accent: [178, 142, 96], roughness: 0.9, metalness: 0.02, bumpScale: 0.035, mode: 'ripple' },
  alpine_snow: { base: [236, 240, 245], accent: [204, 214, 226], roughness: 0.62, metalness: 0.04, bumpScale: 0.028, mode: 'drift' },
  mossy_stone: { base: [118, 120, 112], accent: [76, 108, 72], roughness: 0.85, metalness: 0.03, bumpScale: 0.06, mode: 'moss' },
  automotive_paint: { base: [217, 107, 39], accent: [176, 82, 26], roughness: 0.28, metalness: 0.6, bumpScale: 0.008, clearcoat: 1.0, clearcoatRoughness: 0.08, ior: 1.5, mode: 'flake' },
  architectural_glass: { base: [216, 232, 242], accent: [194, 216, 228], roughness: 0.05, metalness: 0.05, bumpScale: 0.004, transmission: 0.88, ior: 1.5, thickness: 0.4, transparent: true, mode: 'drift' },
  wet_asphalt: { base: [48, 50, 56], accent: [32, 34, 40], roughness: 0.76, metalness: 0.04, bumpScale: 0.045, clearcoat: 0.16, clearcoatRoughness: 0.48, mode: 'puddle' },
  polished_marble: { base: [232, 228, 220], accent: [148, 142, 136], roughness: 1.0, metalness: 0.04, bumpScale: 0.02, clearcoat: 0.72, clearcoatRoughness: 0.12, mode: 'marble' },
  foliage_leaf: { base: [82, 118, 76], accent: [56, 88, 52], roughness: 0.74, metalness: 0.02, bumpScale: 0.035, sheen: 0.6, sheenColor: '#C5E1A5', sheenRoughness: 0.55, mode: 'moss' },
  stone_bricks: { base: [138, 128, 118], accent: [86, 78, 72], roughness: 0.88, metalness: 0.04, bumpScale: 0.065, mode: 'brick', cdn: ['brick_diffuse.jpg', 'brick_bump.jpg', 'brick_roughness.jpg'] },
  grass_turf: { base: [74, 116, 68], accent: [52, 86, 48], roughness: 0.86, metalness: 0.02, bumpScale: 0.045, sheen: 0.45, sheenColor: '#B8D49E', sheenRoughness: 0.65, mode: 'turf', cdn: ['terrain/grasslight-big.jpg', null, null] },
  wood_planks: { base: [128, 88, 56], accent: [74, 48, 28], roughness: 0.76, metalness: 0.03, bumpScale: 0.05, mode: 'plank', cdn: ['hardwood2_diffuse.jpg', 'hardwood2_bump.jpg', 'hardwood2_roughness.jpg'] },
  sand_ripples: { base: [214, 182, 134], accent: [178, 142, 96], roughness: 0.9, metalness: 0.02, bumpScale: 0.038, mode: 'ripple' },
  brushed_alloy: { base: [182, 188, 196], accent: [134, 142, 152], roughness: 0.3, metalness: 0.88, bumpScale: 0.024, mode: 'streak' },
};

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

export function hash2(ix, iy, seed = 1337) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function tileableNoise(u, v, period, seed = 1337) {
  const x = u * period;
  const y = v * period;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const ix0 = ((x0 % period) + period) % period;
  const iy0 = ((y0 % period) + period) % period;
  const ix1 = (ix0 + 1) % period;
  const iy1 = (iy0 + 1) % period;
  const n00 = hash2(ix0, iy0, seed);
  const n10 = hash2(ix1, iy0, seed);
  const n01 = hash2(ix0, iy1, seed);
  const n11 = hash2(ix1, iy1, seed);
  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy);
}

export function tileableFbm(u, v, basePeriod = 8, octaves = 4, seed = 1337) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = basePeriod;
  for (let i = 0; i < octaves; i += 1) {
    sum += tileableNoise(u, v, p, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

export function noise2D(x, y, seed = 901) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  return lerp(
    lerp(hash2(x0, y0, seed), hash2(x0 + 1, y0, seed), fx),
    lerp(hash2(x0, y0 + 1, seed), hash2(x0 + 1, y0 + 1, seed), fx),
    fy
  );
}

export function normRepeat(repeat, fallback = 1) {
  if (Array.isArray(repeat)) return [Number(repeat[0]) || fallback, Number(repeat[1]) || fallback];
  const n = Number(repeat) || fallback;
  return [n, n];
}

export function fbm2D(x, y, octaves = 5, seed = 901) {
  let sum = 0; let amp = 0.5; let norm = 0; let freq = 1;
  for (let i = 0; i < octaves; i += 1) { sum += noise2D(x * freq, y * freq, seed + i * 47) * amp; norm += amp; amp *= 0.5; freq *= 2.02; }
  return sum / norm;
}

const THREE_TEX_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures';
const CDN_CACHE = new Map();

export function loadCdnImage(path, onLoaded) {
  if (!path || typeof Image === 'undefined') return;
  if (CDN_CACHE.has(path)) {
    const entry = CDN_CACHE.get(path);
    if (entry.img) onLoaded(entry.img); else entry.waiters.push(onLoaded);
    return;
  }
  const entry = { img: null, waiters: [onLoaded] };
  CDN_CACHE.set(path, entry);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { entry.img = img; entry.waiters.forEach((fn) => fn(img)); entry.waiters = []; };
  img.src = `${THREE_TEX_CDN}/${path}`;
}

export function samplePbrPattern(mode, u, v, n1, n2, px, py) {
  if (mode === 'brick') {
    const row = Math.floor(v * 6);
    const bu = (u * 3 + (row % 2) * 0.5) % 1; const bv = (v * 6) % 1;
    return (bu < 0.05 || bv < 0.08) ? 0.14 + n2 * 0.12 : 0.68 + hash2(Math.floor(u * 3), row, 17) * 0.18 + n1 * 0.14;
  }
  if (mode === 'turf') return 0.35 + n1 * 0.35 + tileableFbm(u * 2, v * 2, 16, 3, 77) * 0.3;
  if (mode === 'plank') return ((v * 5) % 1 < 0.05 ? 0.12 : 0.52 + 0.32 * Math.sin((u * 10 + n1 * 2.1) * Math.PI * 2)) + n2 * 0.16;
  if (mode === 'streak') return tileableFbm(u * 0.5, v * 8, 8, 3, 21) * 0.75 + hash2(px, py, 7) * 0.25;
  if (mode === 'wood') return 0.5 + 0.5 * Math.sin((u * 9 + n1 * 2.4) * Math.PI * 2) * 0.65 + n2 * 0.25;
  if (mode === 'ripple') return 0.5 + 0.5 * Math.sin((u * 14 + v * 3 + n1 * 1.8) * Math.PI * 2) * 0.45 + n2 * 0.35;
  if (mode === 'crack') return Math.min(1, Math.abs(n1 - 0.5) * 3.8) * 0.7 + n2 * 0.3;
  if (mode === 'ridge') return (1 - Math.abs(n1 * 2 - 1)) * 0.72 + n2 * 0.28;
  if (mode === 'grit' || mode === 'flake') return n1 * 0.55 + hash2(px, py, 99) * 0.45;
  if (mode === 'puddle') return n1 > 0.6 ? 0.14 : 0.62 + n2 * 0.32;
  if (mode === 'marble') return Math.pow(Math.abs(Math.sin((u * 4 + v * 2 + n1 * 3.2) * Math.PI)), 0.35);
  if (mode === 'moss') return n1 > 0.57 ? 0.25 + n2 * 0.25 : 0.75 + n2 * 0.25;
  return n1 * 0.7 + n2 * 0.3;
}
