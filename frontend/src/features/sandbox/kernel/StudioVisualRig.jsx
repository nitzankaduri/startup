import { useMemo } from 'react';
import * as THREE from 'three';

const THEME_SKIES = {
  sunny_city: { top: '#0284C7', mid: '#7DD3FC', horizon: '#FEF3C7', fog: '#BAE6FD' },
  tropical_beach: { top: '#0EA5E9', mid: '#67E8F9', horizon: '#FEF08A', fog: '#BAE6FD' },
  candy_sky: { top: '#818CF8', mid: '#F9A8D4', horizon: '#FEF3C7', fog: '#FBCFE8' },
  tokyo_festival: { top: '#2563EB', mid: '#93C5FD', horizon: '#FED7AA', fog: '#DBEAFE' },
  desert_canyon: { top: '#818CF8', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74' },
  wild_west: { top: '#A5B4FC', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74' },
};

function GradientSkyDome({ sky }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uTop: { value: new THREE.Color(sky.top) }, uMid: { value: new THREE.Color(sky.mid) }, uHorizon: { value: new THREE.Color(sky.horizon) } },
        vertexShader: 'varying vec3 vW; void main(){ vec4 p=modelMatrix*vec4(position,1.0); vW=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
        fragmentShader: 'varying vec3 vW; uniform vec3 uTop,uMid,uHorizon; void main(){ float h=clamp(normalize(vW).y,0.0,1.0); vec3 c=mix(uHorizon,uMid,smoothstep(0.0,0.28,h)); c=mix(c,uTop,smoothstep(0.24,0.85,h)); gl_FragColor=vec4(c,1.0); }',
      }),
    [sky.top, sky.mid, sky.horizon]
  );

  return (
    <mesh renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[240, 24, 14]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/** 3-point stylized lighting, FogExp2 atmospheric depth & multi-stop gradient sky dome (60-120 FPS). */
export function StudioVisualRig({ theme = 'sunny_city', lighting = true, children }) {
  const sky = THEME_SKIES[theme] || THEME_SKIES.sunny_city;
  return (
    <>
      {lighting && (
        <>
          <color attach="background" args={[sky.fog]} />
          <fogExp2 attach="fog" args={[sky.fog, 0.0048]} />
          <GradientSkyDome sky={sky} />
          <hemisphereLight args={['#7DD3FC', '#FDE68A', 0.95]} />
          <directionalLight position={[24, 38, 22]} intensity={2.15} color="#FFF7E0" />
          <directionalLight position={[-18, 16, -20]} intensity={0.75} color="#BAE6FD" />
        </>
      )}
      {children}
    </>
  );
}

/** Projects dynamic soft contact shadow onto ground or train roofs, scaling & fading by altitude. */
export function updateDynamicContactShadow(mesh, px, pz, playerY, groundY) {
  if (!mesh) return;
  const h = Math.max(0, playerY - groundY);
  const s = THREE.MathUtils.clamp(1.15 - h * 0.14, 0.38, 1.15);
  mesh.position.set(px, groundY - 0.98, pz);
  mesh.scale.setScalar(s);
  if (mesh.material) mesh.material.opacity = THREE.MathUtils.clamp(0.55 - h * 0.08, 0.14, 0.55);
}
