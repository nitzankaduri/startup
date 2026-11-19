import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BIOME_PALETTES, createGroundedGeo, createRng, createTuftGeometry, sampleFoliageHeight,
} from './foliagePresets';

function makeWindMaterial({ sheenColor, doubleSide = false, roughness = 0.76, windRef }) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF', roughness, metalness: 0.02, sheen: 0.58, sheenColor, sheenRoughness: 0.55,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
  mat.customProgramCacheKey = () => 'spawn-foliage-wind-v1';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windRef.current.uTime;
    shader.uniforms.uWindSpeed = windRef.current.uWindSpeed;
    shader.uniforms.uWindStrength = windRef.current.uWindStrength;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWindSpeed;\nuniform float uWindStrength;')
      .replace('#include <project_vertex>', `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_BATCHING
          mvPosition = batchingMatrix * mvPosition;
        #endif
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          float tipWeight = clamp(position.y, 0.0, 1.0);
          float gust = sin(mvPosition.x * 0.22 + mvPosition.z * 0.17 - uTime * uWindSpeed)
                     + 0.45 * cos(mvPosition.x * 0.58 - mvPosition.z * 0.44 + uTime * uWindSpeed * 1.45);
          float micro = sin(mvPosition.x * 1.9 + mvPosition.z * 2.1 + uTime * uWindSpeed * 2.6) * 0.25;
          mvPosition.x += (gust + micro) * tipWeight * tipWeight * uWindStrength;
          mvPosition.z += (gust * 0.55 - micro) * tipWeight * tipWeight * uWindStrength;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `);
  };
  return mat;
}

/** GPU-instanced wind-swaying grass tufts, wildflowers, shrubs, and pebbles driven by a single uniform. */
export function InstancedFoliage({
  count = 800, biome = 'meadow', radius = 64, innerRadius = 4, position = [0, 0, 0],
  terrainAmplitude = 0, terrainFrequency = 0.028, flatRadius = 18, waterLevel = -999,
  windSpeed = 1.9, windStrength = 0.26, seed = 2026,
}) {
  const palette = BIOME_PALETTES[biome] || BIOME_PALETTES.meadow;
  const grassRef = useRef(null);
  const flowerRef = useRef(null);
  const shrubRef = useRef(null);
  const pebbleRef = useRef(null);

  const windRef = useRef({
    uTime: { value: 0 },
    uWindSpeed: { value: windSpeed },
    uWindStrength: { value: windStrength },
  });
  windRef.current.uWindSpeed.value = windSpeed;
  windRef.current.uWindStrength.value = windStrength;

  const counts = useMemo(() => {
    const grass = Math.max(1, Math.round(count * 0.6));
    const flower = Math.max(1, Math.round(count * 0.15));
    const shrub = Math.max(1, Math.round(count * 0.14));
    const pebble = Math.max(1, count - grass - flower - shrub);
    return { grass, flower, shrub, pebble };
  }, [count]);

  const geos = useMemo(() => ({
    grass: createTuftGeometry(),
    flower: createGroundedGeo('flower'),
    shrub: createGroundedGeo('shrub'),
    pebble: createGroundedGeo('pebble'),
  }), []);

  const mats = useMemo(() => ({
    grass: makeWindMaterial({ sheenColor: palette.sheen, doubleSide: true, roughness: 0.78, windRef }),
    flower: makeWindMaterial({ sheenColor: palette.sheen, doubleSide: true, roughness: 0.58, windRef }),
    shrub: makeWindMaterial({ sheenColor: palette.sheen, doubleSide: false, roughness: 0.82, windRef }),
    pebble: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, metalness: 0.05 }),
  }), [palette.sheen]);

  useEffect(() => {
    const rng = createRng(seed);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const groups = [
      { ref: grassRef.current, n: counts.grass, colors: palette.grass, scaleMin: 0.65, scaleMax: 1.45 },
      { ref: flowerRef.current, n: counts.flower, colors: palette.flower, scaleMin: 0.7, scaleMax: 1.2 },
      { ref: shrubRef.current, n: counts.shrub, colors: palette.shrub, scaleMin: 0.75, scaleMax: 1.55 },
      { ref: pebbleRef.current, n: counts.pebble, colors: palette.pebble, scaleMin: 0.6, scaleMax: 1.7 },
    ];

    groups.forEach(({ ref, n, colors, scaleMin, scaleMax }) => {
      if (!ref) return;
      for (let i = 0; i < n; i += 1) {
        const ang = rng() * Math.PI * 2;
        const dist = innerRadius + Math.sqrt(rng()) * Math.max(4, radius - innerRadius);
        const x = Math.cos(ang) * dist;
        const z = Math.sin(ang) * dist;
        const y = sampleFoliageHeight(x, z, { amplitude: terrainAmplitude, frequency: terrainFrequency, flatRadius });
        const submerged = y + position[1] < waterLevel + 0.15;
        const s = submerged ? 0.0001 : scaleMin + rng() * (scaleMax - scaleMin);
        dummy.position.set(x, y, z);
        dummy.rotation.set((rng() - 0.5) * 0.14, rng() * Math.PI * 2, (rng() - 0.5) * 0.14);
        dummy.scale.set(s, s * (0.85 + rng() * 0.35), s);
        dummy.updateMatrix();
        ref.setMatrixAt(i, dummy.matrix);
        ref.setColorAt(i, color.set(colors[Math.floor(rng() * colors.length)]));
      }
      ref.instanceMatrix.needsUpdate = true;
      if (ref.instanceColor) ref.instanceColor.needsUpdate = true;
    });
  }, [counts, palette, radius, innerRadius, terrainAmplitude, terrainFrequency, flatRadius, waterLevel, seed, position]);

  useEffect(() => () => {
    Object.values(geos).forEach((g) => g.dispose());
    Object.values(mats).forEach((m) => m.dispose());
  }, [geos, mats]);

  useFrame((_, rawDelta) => {
    windRef.current.uTime.value += Math.min(0.05, rawDelta);
  });

  return (
    <group position={position}>
      <instancedMesh ref={grassRef} args={[geos.grass, mats.grass, counts.grass]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={flowerRef} args={[geos.flower, mats.flower, counts.flower]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={shrubRef} args={[geos.shrub, mats.shrub, counts.shrub]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={pebbleRef} args={[geos.pebble, mats.pebble, counts.pebble]} receiveShadow frustumCulled={false} />
    </group>
  );
}
