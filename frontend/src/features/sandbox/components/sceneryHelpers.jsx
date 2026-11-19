export function createRng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickBiomeEnvPreset(title = '', skyColor = '') {
  const low = `${title} ${skyColor}`.toLowerCase();
  if (['forest', 'pine', 'alpine', 'snow', 'jungle', 'canyon'].some((k) => low.includes(k))) return 'forest';
  if (['city', 'rooftop', 'train', 'freight', 'urban', 'street'].some((k) => low.includes(k))) return 'city';
  if (['dawn', 'temple', 'morning', 'night', 'twilight', 'obsidian', 'void'].some((k) => low.includes(k))) return 'dawn';
  return 'sunset';
}

export function isTwilightTheme(title = '', skyColor = '') {
  const low = `${title} ${skyColor}`.toLowerCase();
  return ['night', 'twilight', 'midnight', 'space', 'obsidian', 'void', 'shadow'].some((k) =>
    low.includes(k)
  );
}

export function getAtmospherePalette(title, environment = {}) {
  const twilight = isTwilightTheme(title, environment.sky_color);
  if (twilight) {
    return {
      isTwilight: true,
      horizon: '#23293A',
      zenith: '#0F131C',
      mountain: '#2D3446',
      cap: '#64748B',
      building: '#1E2433',
      roof: '#334155',
      foliage: '#283B35',
      cloud: '#475569',
      wood: '#3F3A34',
    };
  }
  return {
    isTwilight: false,
    horizon: '#E8C9A3',
    zenith: '#7CAAD8',
    mountain: '#7A6F64',
    cap: '#F6F4EF',
    building: '#E6DDD0',
    roof: '#9A3412',
    foliage: '#4C6658',
    cloud: '#FFFBF5',
    wood: '#7C5A3C',
  };
}
