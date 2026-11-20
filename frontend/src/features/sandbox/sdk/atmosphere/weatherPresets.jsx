import * as THREE from 'three';

export const WEATHER_CONFIGS = {
  clear: { count: 0, color: '#FFFFFF', size: 0, speedY: 0, speedXZ: 0, swirl: 0, stretchY: 1, opacity: 0 },
  rain: { count: 1400, color: '#CBD5E1', size: 0.14, speedY: -34, speedXZ: -4.2, swirl: 0.25, stretchY: 1.5, opacity: 0.58 },
  snow: { count: 1100, color: '#F8FAFC', size: 0.34, speedY: -3.8, speedXZ: 1.1, swirl: 1.6, stretchY: 1, opacity: 0.85 },
  embers: { count: 650, color: '#F97316', size: 0.28, speedY: 4.4, speedXZ: 1.4, swirl: 2.2, stretchY: 1, opacity: 0.9 },
  sandstorm: { count: 1300, color: '#D9B382', size: 0.42, speedY: -1.1, speedXZ: 19.5, swirl: 1.9, stretchY: 0.8, opacity: 0.52 },
  fireflies: { count: 280, color: '#FDE68A', size: 0.46, speedY: 0.45, speedXZ: 0.65, swirl: 2.8, stretchY: 1, opacity: 0.92 },
};

export const TIME_OF_DAY_PRESETS = {
  dawn: {
    skyTop: '#5B7BA6',
    skyHorizon: '#F4B89B',
    sunColor: '#FFD6B0',
    sunPos: [38, 12, 20],
    skySunPos: [38, 6, 20],
    sunIntensity: 1.95,
    ambientIntensity: 0.58,
    hemiGround: '#8C6E63',
    fogMult: 1.25,
    isTwilight: false,
    practicals: false,
  },
  noon: {
    skyTop: '#58AEE8',
    skyHorizon: '#E6EFF4',
    sunColor: '#FFF7E8',
    sunPos: [18, 42, 16],
    sunIntensity: 2.65,
    ambientIntensity: 0.78,
    hemiGround: '#7C857A',
    fogMult: 0.85,
    isTwilight: false,
    practicals: false,
  },
  golden_hour: {
    skyTop: '#6C84AD',
    skyHorizon: '#EFA975',
    sunColor: '#FDBA74',
    sunPos: [34, 14, -22],
    skySunPos: [34, 3.2, -22],
    sunIntensity: 2.25,
    ambientIntensity: 0.56,
    hemiGround: '#7C4F3B',
    fogMult: 1.15,
    isTwilight: true,
    practicals: true,
  },
  midnight: {
    skyTop: '#0B101B',
    skyHorizon: '#1D273B',
    sunColor: '#C7D6ED',
    sunPos: [-22, 28, -26],
    skySunPos: [-22, -14, -26],
    sunIntensity: 1.05,
    ambientIntensity: 0.42,
    skyFillColor: '#4A5D7A',
    hemiGround: '#2A2622',
    hemiIntensity: 0.65,
    fogMult: 1.32,
    isTwilight: true,
    practicals: true,
  },
};

const _cA = new THREE.Color();
const _cB = new THREE.Color();

function blendHex(baseHex, targetHex, t) {
  return `#${_cA.set(baseHex).lerp(_cB.set(targetHex), t).getHexString()}`;
}

/** Merge biome base appearance with optional timeOfDay mood & weather overcast shift. */
export function resolveStageLighting(biomeSpec, timeOfDay = null, weather = 'clear') {
  const todKey = timeOfDay ? String(timeOfDay).toLowerCase().replace(/[\s-]+/g, '_') : null;
  const mood = TIME_OF_DAY_PRESETS[todKey];
  const base = !mood ? { ...biomeSpec, practicals: biomeSpec.isTwilight } : {
    ...biomeSpec,
    skyTop: blendHex(biomeSpec.skyTop, mood.skyTop, todKey === 'midnight' ? 0.88 : 0.68),
    skyHorizon: blendHex(biomeSpec.skyHorizon, mood.skyHorizon, todKey === 'midnight' ? 0.85 : 0.65),
    sunColor: mood.sunColor,
    sunPos: mood.sunPos,
    skySunPos: mood.skySunPos || mood.sunPos,
    sunIntensity: mood.sunIntensity,
    ambientIntensity: mood.ambientIntensity,
    skyFillColor: mood.skyFillColor || null,
    hemiGround: mood.hemiGround,
    hemiIntensity: mood.hemiIntensity ?? null,
    fogDensity: biomeSpec.fogDensity * mood.fogMult,
    isTwilight: mood.isTwilight,
    practicals: mood.practicals,
  };
  if (weather === 'rain' || weather === 'sandstorm') {
    const fogBoost = weather === 'sandstorm' ? 1.9 : 1.45;
    const overcast = weather === 'sandstorm' ? '#C7A377' : '#526070';
    return {
      ...base,
      skyHorizon: blendHex(base.skyHorizon, overcast, weather === 'sandstorm' ? 0.55 : 0.4),
      sunIntensity: base.sunIntensity * 0.72,
      fogDensity: base.fogDensity * fogBoost,
    };
  }
  return base;
}

export function createParticleSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
