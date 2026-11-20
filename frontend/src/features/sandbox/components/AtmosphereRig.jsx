import { useMemo, useRef } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const HALO_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HALO_FRAG = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float core = exp(-d * d * 18.0) * 0.75;
    float halo = exp(-d * 3.4) * 0.32;
    float rays = pow(max(0.0, cos(atan(vUv.y - 0.5, vUv.x - 0.5) * 6.0)), 6.0) * exp(-d * 3.2) * 0.14;
    float alpha = clamp((core + halo + rays) * uIntensity, 0.0, 0.85);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const HAZE_VERT = `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HAZE_FRAG = `
  uniform vec3 uHorizon;
  varying vec3 vPos;
  void main(){
    float h = normalize(vPos).y;
    float band = smoothstep(0.28, -0.04, h) * 0.55;
    gl_FragColor = vec4(uHorizon, band);
  }
`;

/** Atmospheric scattering sky, distant horizon haze band, and radial sun glare/god-ray halo. */
export function AtmosphereRig({ horizonColor = '#E8C9A3', isTwilight = false, sunPos = [28, 18, 22], skySunPos = null }) {
  const { camera } = useThree();
  const haloRef = useRef(null);
  const hazeRef = useRef(null);
  const effectiveSkySun = skySunPos || sunPos;
  const sunDir = useMemo(() => new THREE.Vector3(...effectiveSkySun).normalize(), [effectiveSkySun[0], effectiveSkySun[1], effectiveSkySun[2]]);
  const camFwd = useMemo(() => new THREE.Vector3(), []);

  const haloUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(isTwilight ? '#94A3B8' : '#FFF3E0') },
    uIntensity: { value: isTwilight ? 0.35 : 0.75 },
  }), [isTwilight]);

  const hazeUniforms = useMemo(() => ({
    uHorizon: { value: new THREE.Color(horizonColor) },
  }), [horizonColor]);

  useFrame(() => {
    if (hazeRef.current) hazeRef.current.position.copy(camera.position);
    if (haloRef.current) {
      haloRef.current.position.copy(camera.position).addScaledVector(sunDir, 170);
      haloRef.current.quaternion.copy(camera.quaternion);
      camera.getWorldDirection(camFwd);
      const facing = Math.max(0, camFwd.dot(sunDir));
      haloUniforms.uIntensity.value = (isTwilight ? 0.25 : 0.55) + Math.pow(facing, 3) * (isTwilight ? 0.25 : 0.45);
    }
  });

  return (
    <>
      <Sky
        distance={4500}
        sunPosition={effectiveSkySun}
        turbidity={isTwilight ? 9 : 6}
        rayleigh={isTwilight ? 0.45 : 1.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
      />

      <mesh ref={hazeRef}>
        <sphereGeometry args={[195, 24, 16]} />
        <shaderMaterial side={THREE.BackSide} transparent depthWrite={false} uniforms={hazeUniforms} vertexShader={HAZE_VERT} fragmentShader={HAZE_FRAG} />
      </mesh>

      <mesh ref={haloRef} renderOrder={-1}>
        <planeGeometry args={[95, 95]} />
        <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={haloUniforms} vertexShader={HALO_VERT} fragmentShader={HALO_FRAG} />
      </mesh>
    </>
  );
}
