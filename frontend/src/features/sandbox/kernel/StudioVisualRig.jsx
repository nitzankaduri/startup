import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/motionBus';
import { StudioPostFX } from './StudioPostFX';
import { updateShadowTracker } from './StudioRenderPipeline';

const THEME_SKIES = {
  sunny_city: { top: '#0284C7', mid: '#7DD3FC', horizon: '#FEF3C7', fog: '#BAE6FD', ground: '#FDE68A' },
  tropical_beach: { top: '#0EA5E9', mid: '#67E8F9', horizon: '#FEF08A', fog: '#BAE6FD', ground: '#FDE68A' },
  candy_sky: { top: '#818CF8', mid: '#F9A8D4', horizon: '#FEF3C7', fog: '#FBCFE8', ground: '#FBCFE8' },
  tokyo_festival: { top: '#2563EB', mid: '#93C5FD', horizon: '#FED7AA', fog: '#DBEAFE', ground: '#FDE68A' },
  desert_canyon: { top: '#4338CA', mid: '#EA580C', horizon: '#FEF3C7', fog: '#FED7AA', ground: '#D6D3D1' },
  wild_west: { top: '#4F46E5', mid: '#D97706', horizon: '#FEF3C7', fog: '#FED7AA', ground: '#D6D3D1' },
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

/** Cinematic HDRI PBR lighting, player-tracking 2048px soft shadows, sky dome & StudioPostFX. */
export function StudioVisualRig({ theme = 'sunny_city', mode = 'endless_runner', lighting = true, children }) {
  const sunRef = useRef(null);
  const skyKey = mode === 'sky_shooter' ? 'space_sky' : theme;
  const sky = THEME_SKIES[skyKey] || THEME_SKIES.sunny_city;

  useFrame(() => {
    if (lighting && sunRef.current) updateShadowTracker(sunRef.current, motionBus.pos);
  });

  return (
    <>
      {lighting && (
        <>
          <color attach="background" args={[sky.fog]} />
          <fogExp2 attach="fog" args={[sky.fog, mode === 'sky_shooter' ? 0.0028 : 0.0045]} />
          <GradientSkyDome sky={sky} />
          <hemisphereLight args={[mode === 'sky_shooter' ? '#93C5FD' : '#BAE6FD', sky.ground, 0.72]} />
          <directionalLight
            ref={sunRef}
            position={[22, 36, 20]}
            intensity={2.1}
            color="#FFF7E0"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-near={1}
            shadow-camera-far={130}
            shadow-camera-left={-32}
            shadow-camera-right={32}
            shadow-camera-top={32}
            shadow-camera-bottom={-32}
          />
          <directionalLight position={[-18, 14, -26]} intensity={0.95} color="#BAE6FD" />
        </>
      )}
      {children}
      {lighting && <StudioPostFX skyKey={skyKey} />}
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
