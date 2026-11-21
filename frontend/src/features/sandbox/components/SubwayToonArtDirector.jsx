import { Component, Suspense, useMemo } from 'react';
import { ContactShadows, Environment } from '@react-three/drei';
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

class ArtBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}

const THEME_SKIES = {
  sunny_city: { top: '#0284C7', mid: '#7DD3FC', horizon: '#FEF3C7', fog: '#BAE6FD' },
  tropical_beach: { top: '#0EA5E9', mid: '#67E8F9', horizon: '#FEF08A', fog: '#BAE6FD' },
  candy_sky: { top: '#818CF8', mid: '#F9A8D4', horizon: '#FEF3C7', fog: '#FBCFE8' },
  tokyo_festival: { top: '#2563EB', mid: '#93C5FD', horizon: '#FED7AA', fog: '#DBEAFE' },
  desert_canyon: { top: '#818CF8', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74' },
  wild_west: { top: '#A5B4FC', mid: '#FDBA74', horizon: '#FEF3C7', fog: '#FDBA74' },
};

function SubwayGradientSkyDome({ sky }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(sky.top) },
          uMid: { value: new THREE.Color(sky.mid) },
          uHorizon: { value: new THREE.Color(sky.horizon) },
        },
        vertexShader: 'varying vec3 vWorld; void main(){ vec4 p=modelMatrix*vec4(position,1.0); vWorld=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
        fragmentShader: 'varying vec3 vWorld; uniform vec3 uTop,uMid,uHorizon; void main(){ float h=clamp(normalize(vWorld).y,0.0,1.0); vec3 col=mix(uHorizon,uMid,smoothstep(0.0,0.28,h)); col=mix(col,uTop,smoothstep(0.24,0.85,h)); gl_FragColor=vec4(col,1.0); }',
      }),
    [sky.top, sky.mid, sky.horizon]
  );

  return (
    <mesh renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[240, 32, 20]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Locked global Subway Surfers stylized cartoon art direction:
 * bright sun key light (#FFF7E0, 2.2), sky/sand hemisphere bounce (#7DD3FC / #FDE68A),
 * <Environment preset="park" />, gradient sky dome, soft haze (#BAE6FD), and vibrant bloom/color grading.
 */
export function SubwayToonArtDirector({
  theme = 'sunny_city',
  lighting = true,
  postFx = true,
  lowQuality = false,
  shadowMapSize = [2048, 2048],
  children,
}) {
  const mapRes = Array.isArray(shadowMapSize) ? shadowMapSize : [shadowMapSize || 2048, shadowMapSize || 2048];
  const sky = THEME_SKIES[theme] || THEME_SKIES.sunny_city;

  return (
    <>
      {lighting && (
        <>
          <color attach="background" args={[sky.fog]} />
          <fog attach="fog" args={[sky.fog, 54, 185]} />
          <SubwayGradientSkyDome sky={sky} />

          <ArtBoundary fallback={null}>
            <Suspense fallback={null}>
              <Environment preset="park" />
            </Suspense>
          </ArtBoundary>

          <hemisphereLight args={['#7DD3FC', '#FDE68A', 0.95]} />

          <directionalLight
            position={[24, 38, 22]}
            intensity={2.2}
            color="#FFF7E0"
            castShadow
            shadow-mapSize={mapRes}
            shadow-camera-near={1}
            shadow-camera-far={130}
            shadow-camera-left={-36}
            shadow-camera-right={36}
            shadow-camera-top={36}
            shadow-camera-bottom={-36}
            shadow-bias={-0.0003}
          />

          <directionalLight position={[-18, 16, -20]} intensity={0.68} color="#BAE6FD" />

          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.34}
            scale={34}
            blur={2.0}
            far={5}
            frames={4}
            resolution={256}
            color="#1E1B4B"
          />
        </>
      )}

      {children}

      {postFx && !lowQuality && (
        <ArtBoundary fallback={null}>
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.35} />
            <BrightnessContrast brightness={0.02} contrast={0.08} />
            <HueSaturation saturation={0.18} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </ArtBoundary>
      )}
    </>
  );
}
