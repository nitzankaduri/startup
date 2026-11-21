import * as THREE from 'three';

const CACHE = new Map();

function mkCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toDecalTex(canvas, rx = 1, ry = 1) {
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function cached(key, fn) {
  if (CACHE.has(key)) return CACHE.get(key);
  const v = fn();
  if (CACHE.size > 32) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, v);
  return v;
}

/** Vibrant Subway-Surfers stylized graffiti + striped livery decal texture for metro cars. */
export function createTrainGraffitiDecal(baseHex = '#F59E0B', stripeHex = '#E11D48') {
  return cached(`train:${baseHex}:${stripeHex}`, () => {
    const c = mkCanvas(512, 256);
    if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseHex; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = stripeHex; ctx.fillRect(0, 172, 512, 62);
    ctx.fillStyle = '#FFFBEB'; ctx.fillRect(0, 158, 512, 16);

    const splats = [['#0EA5E9', 96, 120, 44], ['#D96B27', 210, 108, 38], ['#10B981', 330, 124, 48], ['#FDE047', 425, 114, 34]];
    splats.forEach(([col, x, y, r]) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 6; ctx.stroke();
    });
    ctx.fillStyle = '#1E1B4B'; ctx.font = 'bold 54px sans-serif';
    ctx.fillText('SURF!', 148, 134);
    ctx.fillStyle = '#FFFBEB'; ctx.fillText('SURF!', 144, 130);
    return toDecalTex(c);
  });
}

/** Striped cafe / street shopfront awning CanvasTexture. */
export function createBuildingAwningTexture(stripeHex = '#D96B27') {
  return cached(`awning:${stripeHex}`, () => {
    const c = mkCanvas(256, 128);
    if (!c) return null;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? stripeHex : '#FFFBEB';
      ctx.fillRect(i * 32, 0, 32, 128);
    }
    ctx.fillStyle = '#1E1B4B'; ctx.fillRect(0, 118, 256, 10);
    return toDecalTex(c);
  });
}

/** Colorful rooftop billboard decal CanvasTexture. */
export function createBillboardTexture(bgHex = '#0EA5E9', label = 'SPAWN') {
  return cached(`board:${bgHex}:${label}`, () => {
    const c = mkCanvas(256, 128);
    if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgHex; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, 246, 118);
    ctx.fillStyle = '#FBBF24'; ctx.beginPath(); ctx.arc(46, 64, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFBEB'; ctx.font = 'bold 42px sans-serif';
    ctx.fillText(label, 84, 78);
    return toDecalTex(c);
  });
}
