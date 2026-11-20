import * as THREE from 'three';

const CACHE = new Map();

function makeTex(canvas, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Crisp 512x256 Subway-Surfers red-and-white diagonal chevron hazard barrier texture + bump map. */
export function createChevronBarrierTexture() {
  if (CACHE.has('chevron')) return CACHE.get('chevron');
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, 512, 256);

  // V-shaped chevron stripes radiating from center
  ctx.fillStyle = '#E02D2D';
  for (let i = -4; i < 10; i += 1) {
    const x = i * 68;
    // Left half slanted up-right
    ctx.beginPath();
    ctx.moveTo(x, 256); ctx.lineTo(x + 34, 256);
    ctx.lineTo(x + 150, 0); ctx.lineTo(x + 116, 0);
    ctx.closePath();
    ctx.fill();
  }
  // Crisp dark riveted metal border frame
  ctx.strokeStyle = '#2B2F36';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 242);

  const out = { map: makeTex(c, true), roughness: 0.36, metalness: 0.14 };
  CACHE.set('chevron', out);
  return out;
}

/** Crisp 256x256 embossed golden 5-point star coin texture + bump map. */
export function createStarCoinTexture() {
  if (CACHE.has('starCoin')) return CACHE.get('starCoin');
  const c = document.createElement('canvas');
  const b = document.createElement('canvas');
  c.width = b.width = 256; c.height = b.height = 256;
  const ctx = c.getContext('2d');
  const bCtx = b.getContext('2d');

  const g = ctx.createRadialGradient(110, 100, 14, 128, 128, 128);
  g.addColorStop(0, '#FFF1A8');
  g.addColorStop(0.55, '#F7B924');
  g.addColorStop(1, '#D4830E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  // Inner ring groove
  ctx.strokeStyle = '#FFE885'; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(128, 128, 104, 0, Math.PI * 2); ctx.stroke();
  bCtx.strokeStyle = '#E0E0E0'; bCtx.lineWidth = 14;
  bCtx.beginPath(); bCtx.arc(128, 128, 104, 0, Math.PI * 2); bCtx.stroke();

  // Embossed 5-point star
  const drawStar = (target, fill) => {
    target.fillStyle = fill;
    target.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? 74 : 33;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const x = 128 + Math.cos(a) * r;
      const y = 128 + Math.sin(a) * r;
      if (i === 0) target.moveTo(x, y); else target.lineTo(x, y);
    }
    target.closePath();
    target.fill();
  };
  drawStar(ctx, '#FFF4B8');
  drawStar(bCtx, '#FFFFFF');

  const out = { map: makeTex(c, true), bumpMap: makeTex(b, false), bumpScale: 0.09 };
  CACHE.set('starCoin', out);
  return out;
}

/** Matte industrial train roof texture with panel seams & recessed dark rectangular vent slats. */
export function createTrainRoofTexture() {
  if (CACHE.has('trainRoof')) return CACHE.get('trainRoof');
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6E747E';
  ctx.fillRect(0, 0, 256, 512);

  // Subtle side roof curvature shading
  const sideGrad = ctx.createLinearGradient(0, 0, 256, 0);
  sideGrad.addColorStop(0, 'rgba(20,22,28,0.28)');
  sideGrad.addColorStop(0.2, 'rgba(255,255,255,0.08)');
  sideGrad.addColorStop(0.8, 'rgba(255,255,255,0.08)');
  sideGrad.addColorStop(1, 'rgba(20,22,28,0.28)');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(0, 0, 256, 512);

  // 4 recessed dark vent louvers like Subway Surfers train tops
  for (let i = 0; i < 4; i += 1) {
    const y = 44 + i * 114;
    ctx.fillStyle = '#4B505A';
    ctx.fillRect(58, y, 140, 48);
    ctx.fillStyle = '#2B2F36';
    ctx.fillRect(68, y + 10, 120, 10);
    ctx.fillRect(68, y + 28, 120, 10);
  }
  const out = { map: makeTex(c, true), roughness: 0.56, metalness: 0.28 };
  CACHE.set('trainRoof', out);
  return out;
}
