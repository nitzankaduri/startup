import * as THREE from 'three';

const CACHE = new Map();

function mkCanvas(w, h) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

function finalize(c, rx = 1, ry = 1) {
  if (!c) return null;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function memo(key, fn) {
  if (CACHE.has(key)) return CACHE.get(key);
  const v = fn();
  if (CACHE.size < 48) CACHE.set(key, v);
  return v;
}

/** Crisp 3-lane gravel ballast, wooden sleepers, twin brushed-steel rails & lane dividers (anisotropy=4). */
export function getBallastTrackTexture(rx = 1, ry = 28) {
  return memo(`ballast:${rx}:${ry}`, () => {
    const c = mkCanvas(512, 512); if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#645A52'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1100; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(38,34,30,0.32)' : 'rgba(226,216,205,0.22)';
      ctx.fillRect((i * 73) % 512, (i * 137) % 512, 4, 4);
    }
    const lanes = [86, 256, 426];
    lanes.forEach((lx) => {
      for (let y = 0; y < 512; y += 64) {
        ctx.fillStyle = '#5C3A21'; ctx.fillRect(lx - 58, y + 12, 116, 20);
        ctx.fillStyle = '#784B2A'; ctx.fillRect(lx - 54, y + 14, 108, 6);
      }
      [-40, 40].forEach((off) => {
        ctx.fillStyle = '#94A3B8'; ctx.fillRect(lx + off - 4, 0, 8, 512);
        ctx.fillStyle = '#F8FAFC'; ctx.fillRect(lx + off - 2, 0, 3, 512);
      });
    });
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.fillRect(168, 0, 4, 512); ctx.fillRect(340, 0, 4, 512);
    return finalize(c, rx, ry);
  });
}

/** Multi-story urban building facade with illuminated warm/sky glass windows, mullions & storefront. */
export function getBuildingFacadeTexture(wallHex = '#334155', litHex = '#FEF08A') {
  return memo(`facade2:${wallHex}:${litHex}`, () => {
    const c = mkCanvas(256, 512); if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = wallHex; ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = 'rgba(15,23,42,0.35)';
    ctx.fillRect(0, 0, 256, 18);
    for (let row = 0; row < 6; row += 1) {
      const y = 28 + row * 68;
      ctx.fillStyle = 'rgba(15,23,42,0.22)';
      ctx.fillRect(0, y - 6, 256, 4);
      for (let col = 0; col < 4; col += 1) {
        const x = 16 + col * 58;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x, y, 46, 50);
        const isWarm = (row * 3 + col * 5) % 3 !== 0;
        ctx.fillStyle = isWarm ? litHex : '#7DD3FC';
        ctx.fillRect(x + 4, y + 4, 38, 42);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x + 6, y + 6, 14, 38);
      }
    }
    ctx.fillStyle = '#D96B27'; ctx.fillRect(0, 438, 256, 16);
    ctx.fillStyle = '#1E293B'; ctx.fillRect(16, 456, 224, 56);
    ctx.fillStyle = '#FEF3C7'; ctx.fillRect(28, 464, 92, 42);
    ctx.fillStyle = '#BAE6FD'; ctx.fillRect(136, 464, 92, 42);
    return finalize(c, 1, 1);
  });
}

/** Soft radial falloff contact shadow disc texture for ground & train roofs. */
export function getContactShadowTexture() {
  return memo('contactShadow', () => {
    const c = mkCanvas(128, 128); if (!c) return null;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    g.addColorStop(0, 'rgba(18, 16, 40, 0.72)');
    g.addColorStop(0.55, 'rgba(18, 16, 40, 0.34)');
    g.addColorStop(1, 'rgba(18, 16, 40, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return finalize(c, 1, 1);
  });
}
