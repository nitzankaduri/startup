import { useMemo } from 'react';
import * as THREE from 'three';

const THEME_SKIES = {
  sunny_city: { top: '#0284C7', mid: '#7DD3FC', horizon: '#FEF3C7', fog: '#BAE6FD', ground: '#FDE68A' },
  tropical_beach: { top: '#0EA5E9', mid: '#67E8F9', horizon: '#FEF08A', fog: '#BAE6FD', ground: '#FDE68A' },
  candy_sky: { top: '#818CF8', mid: '#F9A8D4', horizon: '#FEF3C7', fog: '#FBCFE8', ground: '#FBCFE8' },
  tokyo_festival: { top: '#2563EB', mid: '#93C5FD', horizon: '#FED7AA', fog: '#DBEAFE', ground: '#FDE68A' },
  desert_canyon: { top: '#818CF8', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74', ground: '#FED7AA' },
  wild_west: { top: '#A5B4FC', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74', ground: '#FDBA74' },
  space_sky: { top: '#050814', mid: '#0F172A', horizon: '#1E293B', fog: '#0F172A', ground: '#1E293B' },
};

function GradientSkyDome({ sky }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uTop: { value: new THREE.Color(sky.top) }, uMid: { value: new THREE.Color(sky.mid) }, uHorizon: { value: new THREE.Color(sky.horizon) } },
        vertexShader: 'varying vec3 vW; void main(){ vec4 p=modelMatrix*vec4(position,1.0); vW=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
        fragmentShader: 'varying vec3 vW; uniform vec3 uTop,uMid,uHorizon; void main(){ float h=clamp(normalize(vW).y*0.5+0.5,0.0,1.0); vec3 c=mix(uHorizon,uMid,smoothstep(0.1,0.48,h)); c=mix(c,uTop,smoothstep(0.45,0.9,h)); gl_FragColor=vec4(c,1.0); }',
      }),
    [sky.top, sky.mid, sky.horizon]
  );

  return (
    <mesh renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[260, 24, 14]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/** Studio 3-point lighting: hemisphere bounce, warm directional key light, back rim light & gradient sky dome. */
export function StudioVisualRig({ theme = 'sunny_city', mode = 'endless_runner', lighting = true, children }) {
  const skyKey = mode === 'sky_shooter' ? 'space_sky' : theme;
  const sky = THEME_SKIES[skyKey] || THEME_SKIES.sunny_city;
  return (
    <>
      {lighting && (
        <>
          <color attach="background" args={[sky.fog]} />
          <fogExp2 attach="fog" args={[sky.fog, mode === 'sky_shooter' ? 0.0028 : 0.0045]} />
          <GradientSkyDome sky={sky} />
          <hemisphereLight args={[mode === 'sky_shooter' ? '#93C5FD' : '#BAE6FD', sky.ground, 1.05]} />
          <directionalLight
            position={[24, 38, 22]}
            intensity={2.25}
            color="#FFF7E0"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={1}
            shadow-camera-far={140}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={45}
            shadow-camera-bottom={-45}
          />
          <directionalLight position={[-18, 14, -26]} intensity={1.15} color="#BAE6FD" />
          <directionalLight position={[0, 10, 20]} intensity={0.45} color="#FDE68A" />
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
