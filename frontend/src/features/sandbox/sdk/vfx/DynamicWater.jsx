import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WATER_FRAG, WATER_VERT } from './waterShaders';

const WATER_PRESETS = {
  ocean: { mode: 0, waveScale: 0.36, speed: 1.0, deep: '#1A3649', shallow: '#366B82', foam: '#EFECE4', sky: '#9CC7EC' },
  river: { mode: 1, waveScale: 0.18, speed: 1.85, deep: '#244A54', shallow: '#467D84', foam: '#F6F4EF', sky: '#9CC7EC' },
  lake: { mode: 1.1, waveScale: 0.09, speed: 0.75, deep: '#1E3F4D', shallow: '#3B6E7D', foam: '#EFECE4', sky: '#A8CDE8' },
  harbor: { mode: 1.3, waveScale: 0.05, speed: 0.5, deep: '#222B35', shallow: '#3E4C59', foam: '#E6E2D8', sky: '#D6C4AE' },
  lava: { mode: 2, waveScale: 0.24, speed: 0.55, deep: '#241410', shallow: '#7C2D12', foam: '#D96B27', sky: '#D96B27' },
};

/** Lightweight GPU Fresnel sky-reflection & animated multi-wave ripple shader for ocean, river, lake, harbor & lava. */
export function DynamicWater({ type = 'ocean', level = 0, size = 180, segments = 64, position = [0, 0, 0] }) {
  const spec = WATER_PRESETS[type] || WATER_PRESETS.ocean;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMode: { value: spec.mode },
    uWaveScale: { value: spec.waveScale },
    uSpeed: { value: spec.speed },
    uDeepColor: { value: new THREE.Color(spec.deep) },
    uShallowColor: { value: new THREE.Color(spec.shallow) },
    uFoamColor: { value: new THREE.Color(spec.foam) },
    uSkyColor: { value: new THREE.Color(spec.sky) },
  }), [spec]);

  useFrame((_, rawDelta) => {
    uniforms.uTime.value += Math.min(0.05, rawDelta);
  });

  return (
    <mesh position={[position[0], level + position[1], position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, segments, segments]} />
      <shaderMaterial
        transparent={spec.mode !== 2}
        uniforms={uniforms}
        vertexShader={WATER_VERT}
        fragmentShader={WATER_FRAG}
      />
    </mesh>
  );
}
