import React, { useEffect, useRef, useState } from 'react';
import { Outlines } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import * as THREE from 'three';

const SUBWAY_SWATCHES = ['#F59E0B', '#D96B27', '#0EA5E9', '#10B981', '#4F46E5', '#E11D48', '#FBBF24', '#F97316'];
const MAT_CACHE = new WeakMap();
const TOON_MAT_CACHE = new Map();
let GRADIENT_TEX = null;

/** Cached 3-step nearest-neighbor DataTexture creating crisp cel-shaded light/mid/shadow bands. */
export function getToonGradientMap() {
  if (GRADIENT_TEX) return GRADIENT_TEX;
  const data = new Uint8Array([84, 84, 84, 255, 176, 176, 176, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  GRADIENT_TEX = tex;
  return tex;
}

/** Boosts washed-out colors and converts dull gray plastic into vibrant Subway-Surfers hues. */
export function saturateToonColor(input, seed = 0) {
  const c = input instanceof THREE.Color ? input.clone() : new THREE.Color(input || '#D96B27');
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  if (hsl.s < 0.14 && hsl.l > 0.18 && hsl.l < 0.84) {
    c.set(SUBWAY_SWATCHES[Math.abs(seed) % SUBWAY_SWATCHES.length]);
    return c;
  }
  c.setHSL(hsl.h, Math.min(0.95, Math.max(hsl.s, hsl.s + 0.24)), THREE.MathUtils.clamp(hsl.l, 0.2, 0.82));
  return c;
}

/** Convert any Three.js standard/physical material into a 3-band MeshToonMaterial. */
export function toToonMaterial(src, seed = 0) {
  if (!src || src.isMeshBasicMaterial || src.isShaderMaterial || src.userData?.isToonOutline) return src;
  if (src.isMeshToonMaterial && src.gradientMap === getToonGradientMap()) return src;
  if (MAT_CACHE.has(src)) return MAT_CACHE.get(src);

  const col = saturateToonColor(src.color, seed);
  const key = `${col.getHexString()}|${src.map?.uuid || ''}|${src.opacity ?? 1}|${Boolean(src.transparent)}|${src.emissiveIntensity ?? 1}`;
  if (TOON_MAT_CACHE.has(key)) {
    const cached = TOON_MAT_CACHE.get(key);
    MAT_CACHE.set(src, cached);
    return cached;
  }

  const toon = new THREE.MeshToonMaterial({
    color: col,
    gradientMap: getToonGradientMap(),
    map: src.map || null,
    emissive: src.emissive ? src.emissive.clone() : new THREE.Color('#000000'),
    emissiveMap: src.emissiveMap || null,
    emissiveIntensity: src.emissiveIntensity ?? 1,
    transparent: Boolean(src.transparent),
    opacity: src.opacity ?? 1,
    side: src.side ?? THREE.FrontSide,
    depthWrite: src.depthWrite ?? true,
    vertexColors: Boolean(src.vertexColors),
  });
  if (TOON_MAT_CACHE.size < 256) TOON_MAT_CACHE.set(key, toon);
  MAT_CACHE.set(src, toon);
  return toon;
}

/** Traverse a Three.js scene/group, convert materials to 3-band toon shading, and collect outline meshes. */
export function applySubwayToonStyle(root, { outlines = true, seed = 0 } = {}) {
  if (!root) return [];
  const targets = [];
  let idx = seed;
  root.traverse((obj) => {
    if (!obj.isMesh || obj.userData?.isToonOutline) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (Array.isArray(obj.material)) obj.material = obj.material.map((m) => toToonMaterial(m, idx++));
    else if (obj.material) obj.material = toToonMaterial(obj.material, idx++);

    const hasPos = Boolean(obj.geometry?.attributes?.position);
    const opaque = !obj.material?.transparent || (obj.material?.opacity ?? 1) > 0.6;
    if (outlines && !obj.isSkinnedMesh && hasPos && !obj.isInstancedMesh && !obj.userData?.skipOutline && opaque) {
      targets.push(obj);
    }
  });
  return targets;
}

/**
 * Wraps characters, vehicles, trains, obstacles, and .glb assets to apply 3-band toon shading
 * plus crisp @react-three/drei <Outlines thickness={0.03} color="#1E1B4B" /> edges.
 */
export function SubwayToonGroup({ outline = true, thickness = 0.03, color = '#1E1B4B', seed = 0, children }) {
  const groupRef = useRef(null);
  const [meshes, setMeshes] = useState([]);

  useEffect(() => {
    const list = applySubwayToonStyle(groupRef.current, { outlines: outline, seed });
    setMeshes(list);
  }, [outline, seed, children]);

  return React.createElement(
    'group',
    { ref: groupRef },
    children,
    outline
      ? meshes.filter((m) => m?.parent).map((m) => createPortal(React.createElement(Outlines, { key: m.uuid, thickness, color }), m))
      : null
  );
}
