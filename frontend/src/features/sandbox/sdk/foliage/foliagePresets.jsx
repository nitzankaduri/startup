import * as THREE from 'three';
import { fbm2D } from '../pbrNoise';

export const BIOME_PALETTES = {
  meadow: {
    grass: ['#4C6B48', '#5E7D52', '#6E8B5B', '#7B945E'],
    flower: ['#D96B27', '#E5B869', '#FAF9F6', '#C87D55'],
    shrub: ['#3D593D', '#4A6847', '#56744F'],
    pebble: ['#7A756C', '#8C867B', '#625E57'],
    sheen: '#C5E1A5',
  },
  forest: {
    grass: ['#3A573B', '#486845', '#55754F'],
    flower: ['#E5B869', '#EFECE4', '#C96A32'],
    shrub: ['#2E4A32', '#3B583C', '#486644'],
    pebble: ['#636058', '#757268', '#524F48'],
    sheen: '#B7D79A',
  },
  desert: {
    grass: ['#9C8A54', '#B29B62', '#8B7948'],
    flower: ['#D96B27', '#C95A2B', '#E5B869'],
    shrub: ['#787A52', '#88885C', '#696C4A'],
    pebble: ['#9E8264', '#B59674', '#826A52'],
    sheen: '#DFC793',
  },
  alpine: {
    grass: ['#5E7568', '#708677', '#809485'],
    flower: ['#EFECE4', '#94A3B8', '#D9B675'],
    shrub: ['#3E554B', '#4D6458', '#5D7466'],
    pebble: ['#767E87', '#8E969E', '#5F6770'],
    sheen: '#CBD5E1',
  },
  volcanic: {
    grass: ['#4A463E', '#5C4D3C', '#6E5338'],
    flower: ['#D96B27', '#B85423', '#E5B869'],
    shrub: ['#383430', '#4A4139', '#5B4535'],
    pebble: ['#3A383A', '#4B4747', '#2A2829'],
    sheen: '#D69E7E',
  },
  coastal: {
    grass: ['#4F7454', '#638962', '#75986D'],
    flower: ['#D96B27', '#FAF9F6', '#E5B869'],
    shrub: ['#3F6347', '#4D7354', '#5B805F'],
    pebble: ['#9A9182', '#AEA494', '#7C7468'],
    sheen: '#C8E0AE',
  },
};

export function createRng(seed = 2026) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sampleFoliageHeight(x, z, { amplitude = 0, frequency = 0.028, flatRadius = 18 } = {}) {
  if (!amplitude) return 0;
  const plateau = THREE.MathUtils.smoothstep(Math.hypot(x, z), flatRadius * 0.65, flatRadius * 1.8);
  const ridge = fbm2D(x * frequency + 12.4, z * frequency - 8.1, 5, 42);
  const detail = fbm2D(x * frequency * 3.1, z * frequency * 3.1, 3, 99) * 0.25;
  return (Math.pow(ridge, 1.35) * amplitude + detail * 2.5) * plateau;
}

/** Builds a 3-blade crossed grass tuft anchored cleanly at y = 0 for root-locked wind sway. */
export function createTuftGeometry() {
  const pos = [];
  const norm = [];
  const blades = [
    { angle: 0, tilt: 0.08, h: 0.85, w: 0.1 },
    { angle: (Math.PI * 2) / 3, tilt: 0.14, h: 0.72, w: 0.09 },
    { angle: (Math.PI * 4) / 3, tilt: -0.1, h: 0.92, w: 0.095 },
  ];
  blades.forEach(({ angle, tilt, h, w }) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const v = [
      [-w * c, 0, -w * s],
      [w * c, 0, w * s],
      [-w * 0.55 * c + tilt * 0.4, h * 0.52, -w * 0.55 * s],
      [w * 0.55 * c + tilt * 0.4, h * 0.52, w * 0.55 * s],
      [tilt, h, tilt * 0.5],
    ];
    [[0, 1, 2], [1, 3, 2], [2, 3, 4]].forEach(([a, b, d]) => {
      pos.push(...v[a], ...v[b], ...v[d]);
      norm.push(-s, 0.35, c, -s, 0.35, c, -s, 0.35, c);
    });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createGroundedGeo(type) {
  if (type === 'flower') {
    const geo = new THREE.ConeGeometry(0.16, 0.65, 5);
    geo.rotateX(Math.PI);
    geo.translate(0, 0.36, 0);
    return geo;
  }
  if (type === 'shrub') {
    const geo = new THREE.IcosahedronGeometry(0.42, 1);
    geo.scale(1.15, 0.78, 1.08);
    geo.translate(0, 0.28, 0);
    return geo;
  }
  const geo = new THREE.DodecahedronGeometry(0.22, 0);
  geo.scale(1.25, 0.55, 1.0);
  geo.translate(0, 0.08, 0);
  return geo;
}
