import * as THREE from 'three';

const CACHE = new Map();

function toDecalTex(canvas) {
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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

export function createBuildingAwningTexture(stripeHex = '#D96B27') {
  return cached(`awning:${stripeHex}`, () => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 8; i += 1) { ctx.fillStyle = i % 2 === 0 ? stripeHex : '#FFFBEB'; ctx.fillRect(i * 32, 0, 32, 128); }
    ctx.fillStyle = '#1E1B4B'; ctx.fillRect(0, 118, 256, 10);
    return toDecalTex(c);
  });
}

export function createBillboardTexture(bgHex = '#0EA5E9', label = 'SPAWN') {
  return cached(`board:${bgHex}:${label}`, () => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgHex; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, 246, 118);
    ctx.fillStyle = '#FBBF24'; ctx.beginPath(); ctx.arc(46, 64, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFBEB'; ctx.font = 'bold 42px sans-serif'; ctx.fillText(label, 84, 78);
    return toDecalTex(c);
  });
}
