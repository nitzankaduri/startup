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
    ctx.fillStyle = '#C9B39B'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(110,92,72,0.22)' : 'rgba(255,248,235,0.2)';
      ctx.fillRect((i * 73) % 512, (i * 137) % 512, 4, 4);
    }
    const lanes = [86, 256, 426];
    lanes.forEach((lx) => {
      for (let y = 0; y < 512; y += 64) {
        ctx.fillStyle = '#78350F'; ctx.fillRect(lx - 58, y + 12, 116, 20);
        ctx.fillStyle = '#92400E'; ctx.fillRect(lx - 54, y + 14, 108, 6);
      }
      [-40, 40].forEach((off) => {
        ctx.fillStyle = '#94A3B8'; ctx.fillRect(lx + off - 4, 0, 8, 512);
        ctx.fillStyle = '#F8FAFC'; ctx.fillRect(lx + off - 2, 0, 3, 512);
      });
    });
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(168, 0, 4, 512); ctx.fillRect(340, 0, 4, 512);
    return finalize(c, rx, ry);
  });
}

/** Rich painted subway train livery with racing stripes & tinted passenger windows. */
export function getTrainLiveryTexture(bodyHex = '#0EA5E9', stripeHex = '#F59E0B') {
  return memo(`livery:${bodyHex}:${stripeHex}`, () => {
    const c = mkCanvas(512, 256); if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bodyHex; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#FFFBEB'; ctx.fillRect(0, 154, 512, 14);
    ctx.fillStyle = stripeHex; ctx.fillRect(0, 168, 512, 46);
    for (let x = 28; x < 480; x += 92) {
      ctx.fillStyle = '#1E293B'; ctx.fillRect(x, 56, 70, 68);
      ctx.fillStyle = '#38BDF8'; ctx.fillRect(x + 6, 62, 58, 56);
    }
    return finalize(c, 1, 1);
  });
}

/** Colorful multi-story shopfront / city facade with framed windows & awning band. */
export function getBuildingFacadeTexture(wallHex = '#FDE68A') {
  return memo(`facade:${wallHex}`, () => {
    const c = mkCanvas(256, 512); if (!c) return null;
    const ctx = c.getContext('2d');
    ctx.fillStyle = wallHex; ctx.fillRect(0, 0, 256, 512);
    for (let y = 36; y < 380; y += 92) {
      for (let x = 24; x < 230; x += 72) {
        ctx.fillStyle = '#FFFBEB'; ctx.fillRect(x, y, 52, 62);
        ctx.fillStyle = '#93C5FD'; ctx.fillRect(x + 6, y + 6, 40, 50);
      }
    }
    ctx.fillStyle = '#D96B27'; ctx.fillRect(0, 404, 256, 32);
    ctx.fillStyle = '#475569'; ctx.fillRect(88, 436, 80, 76);
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
