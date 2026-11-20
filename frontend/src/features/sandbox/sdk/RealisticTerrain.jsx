import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createPbrTextureSet } from './pbrMaterials';
import { fbm2D } from './pbrNoise';

const C_FLAT = new THREE.Color();
const C_ROCK = new THREE.Color();
const C_PEAK = new THREE.Color();
const C_OUT = new THREE.Color();

/** High-resolution 128x128 terrain mesh with multi-layer slope & elevation normal/roughness shader blending. */
export function RealisticTerrain({
  size = 160,
  segments = 128,
  amplitude = 18,
  frequency = 0.028,
  flatRadius = 18,
  surface = 'mossy_stone',
  cliffSurface = 'volcanic_rock',
  flatColor = '#4C6658',
  rockColor = '#6E655B',
  peakColor = '#EFECE4',
  position = [0, 0, 0],
  repeat = [14, 14],
  wetness = 0,
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const plateau = THREE.MathUtils.smoothstep(Math.hypot(x, z), flatRadius * 0.65, flatRadius * 1.8);
      const ridge = fbm2D(x * frequency + 12.4, z * frequency - 8.1, 5, 42);
      const detail = fbm2D(x * frequency * 3.1, z * frequency * 3.1, 3, 99) * 0.25;
      pos.setY(i, (Math.pow(ridge, 1.35) * amplitude + detail * 2.5) * plateau);
    }
    geo.computeVertexNormals();

    const norm = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    C_FLAT.set(flatColor); C_ROCK.set(rockColor); C_PEAK.set(peakColor);
    for (let i = 0; i < pos.count; i += 1) {
      const y = pos.getY(i);
      const slope = 1 - Math.max(0, norm.getY(i));
      const rockBlend = THREE.MathUtils.smoothstep(slope, 0.08, 0.34);
      const strata = 0.88 + 0.12 * Math.sin(y * 1.9);
      const snowBlend = THREE.MathUtils.smoothstep(y, amplitude * 0.56, amplitude * 0.82) * (1 - rockBlend * 0.55);
      C_OUT.copy(C_FLAT).lerp(C_ROCK, rockBlend).multiplyScalar(rockBlend > 0.2 ? strata : 1.0).lerp(C_PEAK, snowBlend);
      colors[i * 3] = C_OUT.r; colors[i * 3 + 1] = C_OUT.g; colors[i * 3 + 2] = C_OUT.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [size, segments, amplitude, frequency, flatRadius, flatColor, rockColor, peakColor]);

  const rx = Array.isArray(repeat) ? (Number(repeat[0]) || 14) : (Number(repeat) || 14);
  const ry = Array.isArray(repeat) ? (Number(repeat[1]) || 14) : (Number(repeat) || 14);
  const wet = THREE.MathUtils.clamp(Number(wetness) || 0, 0, 1);
  const material = useMemo(() => {
    const valleyTex = createPbrTextureSet(surface, { repeat: [rx, ry] });
    const cliffTex = createPbrTextureSet(cliffSurface, { repeat: [rx, ry] });
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      map: valleyTex.map,
      normalMap: valleyTex.normalMap,
      roughnessMap: valleyTex.roughnessMap,
      roughness: THREE.MathUtils.lerp(0.84, 0.74, wet),
      metalness: 0.03,
      clearcoat: wet * 0.18,
      clearcoatRoughness: 0.46,
      vertexColors: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uCliffNormal = { value: cliffTex.normalMap };
      shader.uniforms.uCliffRough = { value: cliffTex.roughnessMap };
      shader.uniforms.uWetness = { value: wet };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vTerrainBlend;\nvarying vec2 vTerrainXZ;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat slopeW = smoothstep(0.08, 0.34, 1.0 - max(0.0, normal.y));\nvTerrainBlend = clamp(slopeW + smoothstep(6.0, 16.0, position.y) * 0.35, 0.0, 1.0);\nvTerrainXZ = position.xz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTerrainBlend;\nvarying vec2 vTerrainXZ;\nuniform sampler2D uCliffNormal;\nuniform sampler2D uCliffRough;\nuniform float uWetness;')
        .replace(
          'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
          'vec3 mapN = mix(texture2D( normalMap, vNormalMapUv ).xyz, texture2D( uCliffNormal, vNormalMapUv ).xyz, vTerrainBlend) * 2.0 - 1.0;'
        )
        .replace(
          'vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );',
          'vec4 texelRoughness = mix(texture2D( roughnessMap, vRoughnessMapUv ), texture2D( uCliffRough, vRoughnessMapUv ), vTerrainBlend);\nfloat puddle = smoothstep(0.35, 0.72, sin(vTerrainXZ.x * 0.24) * cos(vTerrainXZ.y * 0.21)) * uWetness * (1.0 - vTerrainBlend);\ntexelRoughness.g = mix(texelRoughness.g, 0.72, puddle);'
        );
    };
    return mat;
  }, [surface, cliffSurface, rx, ry, wet]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  return <mesh geometry={geometry} material={material} position={position} receiveShadow castShadow />;
}
