import { Component, Suspense, useMemo, useRef } from 'react';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { motionBus } from '../sdk/spawnSdk';
import { AtmosphereRig } from './AtmosphereRig';
import { getAtmospherePalette } from './sceneryHelpers';

class EnvErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Studio-grade 2048px shadow rig, horizon-matched atmospheric fog, and PMREM metallic/glass lightformers. */
export function SceneEnvironment({ title = '', environment = {}, lowQuality = false, shadowMapSize }) {
  const palette = useMemo(() => getAtmospherePalette(title, environment), [title, environment]);
  const shadowRes = shadowMapSize || (lowQuality ? 1024 : 2048);
  const sunPos = palette.isTwilight ? [24, 14, -30] : [26, 28, 22];
  const sunLightRef = useRef(null);
  const rimLightRef = useRef(null);
  const shadowFollowRef = useRef(null);

  useFrame(() => {
    const p = motionBus.pos;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sx + sunPos[0], p.y + 34, sz + sunPos[2]);
      sunLightRef.current.target.position.set(sx, p.y, sz);
      sunLightRef.current.target.updateMatrixWorld();
    }
    if (rimLightRef.current) {
      rimLightRef.current.position.set(sx - sunPos[0] * 0.45, p.y + 13, sz - sunPos[2] * 0.65);
      rimLightRef.current.target.position.set(sx, p.y + 1, sz);
      rimLightRef.current.target.updateMatrixWorld();
    }
    if (shadowFollowRef.current) shadowFollowRef.current.position.set(p.x, 0.03, p.z);
  });

  const bg = palette.horizon || '#FCE5CE';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, palette.isTwilight ? 0.0068 : 0.0038]} />
      <ambientLight intensity={0.62} color="#FFF6E8" />

      <EnvErrorBoundary>
        <Suspense fallback={null}>
          <AtmosphereRig horizonColor={bg} isTwilight={palette.isTwilight} sunPos={sunPos} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="circle" intensity={palette.isTwilight ? 2.0 : 4.6} color={palette.isTwilight ? '#CBD5E1' : '#FFF3E0'} position={sunPos} scale={9} />
            <Lightformer form="ring" intensity={palette.isTwilight ? 1.0 : 2.3} color={bg} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={42} />
            <Lightformer form="rect" intensity={palette.isTwilight ? 0.95 : 1.65} color={palette.isTwilight ? '#475569' : '#8EC5FC'} position={[0, 24, 0]} rotation-x={Math.PI / 2} scale={[48, 48, 1]} />
            <Lightformer form="rect" intensity={0.95} color={palette.isTwilight ? '#1E293B' : '#E6C79C'} position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[48, 48, 1]} />
          </Environment>
        </Suspense>
      </EnvErrorBoundary>

      <hemisphereLight args={[palette.isTwilight ? '#4A5D7A' : '#8CC8FF', palette.isTwilight ? '#2A2622' : '#E6B898', palette.isTwilight ? 0.65 : 1.05]} />
      <directionalLight
        ref={sunLightRef}
        castShadow
        position={sunPos}
        intensity={palette.isTwilight ? 1.45 : 2.45}
        color={palette.isTwilight ? '#E2E8F0' : '#FFF3DC'}
        shadow-mapSize={[shadowRes, shadowRes]}
        shadow-radius={3}
        shadow-camera-near={2}
        shadow-camera-far={110}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />
      <directionalLight ref={rimLightRef} position={[-14, 14, -22]} intensity={palette.isTwilight ? 1.15 : 1.05} color={palette.isTwilight ? '#93C5FD' : '#BCE3FF'} />
      <group ref={shadowFollowRef}>
        <ContactShadows opacity={0.38} scale={26} blur={2.2} far={4.5} frames={3} resolution={128} color="#181715" />
      </group>
    </>
  );
}
