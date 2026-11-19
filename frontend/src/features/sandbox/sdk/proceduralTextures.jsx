import * as THREE from 'three';

const cache = new Map();

function makeCanvas(size = 256) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function finalizeTex(canvas, rx = 2, ry = 2, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBallastTrackTextures(rx = 3, ry = 36) {
  const key = `ballast-${rx}-${ry}`;
  if (cache.has(key)) return cache.get(key);

  const colorCanvas = makeCanvas(256);
  const bumpCanvas = makeCanvas(256);
  if (!colorCanvas || !bumpCanvas) return { map: null, bumpMap: null };

  const cCtx = colorCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');
  cCtx.fillStyle = '#4A4138';
  cCtx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2200; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 256;
    const y = (Math.sin(i * 78.233) * 19341.123 % 1 + 1) % 1 * 256;
    const s = 2 + (i % 4);
    const shade = 58 + (i % 38);
    cCtx.fillStyle = `rgb(${shade + 8}, ${shade}, ${shade - 8})`;
    cCtx.fillRect(x, y, s, s);
    const b = 90 + (i % 130);
    bCtx.fillStyle = `rgb(${b},${b},${b})`;
    bCtx.fillRect(x, y, s, s);
  }

  const pair = { map: finalizeTex(colorCanvas, rx, ry, true), bumpMap: finalizeTex(bumpCanvas, rx, ry, false) };
  cache.set(key, pair);
  return pair;
}

export function createAsphaltCobbleTextures(baseHex = '#3D3732', rx = 2, ry = 4) {
  const key = `cobble-${baseHex}-${rx}-${ry}`;
  if (cache.has(key)) return cache.get(key);

  const colorCanvas = makeCanvas(256);
  const bumpCanvas = makeCanvas(256);
  if (!colorCanvas || !bumpCanvas) return { map: null, bumpMap: null };

  const cCtx = colorCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');
  cCtx.fillStyle = baseHex;
  cCtx.fillRect(0, 0, 256, 256);
  bCtx.fillStyle = '#969696';
  bCtx.fillRect(0, 0, 256, 256);

  for (let row = 0; row < 8; row += 1) {
    const y = row * 32;
    const off = (row % 2) * 16;
    cCtx.strokeStyle = 'rgba(24, 23, 21, 0.22)';
    cCtx.lineWidth = 2;
    bCtx.strokeStyle = '#383838';
    bCtx.lineWidth = 3;
    for (let col = -1; col < 8; col += 1) {
      const x = col * 32 + off;
      cCtx.strokeRect(x, y, 32, 32);
      bCtx.strokeRect(x, y, 32, 32);
    }
  }

  for (let i = 0; i < 900; i += 1) {
    const x = (Math.sin(i * 19.31) * 9123.4 % 1 + 1) % 1 * 256;
    const y = (Math.sin(i * 41.73) * 5321.7 % 1 + 1) % 1 * 256;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(255,248,235,0.05)' : 'rgba(24,23,21,0.08)';
    cCtx.fillRect(x, y, 3, 2);
  }

  const pair = { map: finalizeTex(colorCanvas, rx, ry, true), bumpMap: finalizeTex(bumpCanvas, rx, ry, false) };
  cache.set(key, pair);
  return pair;
}
