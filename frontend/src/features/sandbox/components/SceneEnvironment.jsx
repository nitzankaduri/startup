import { Component, Suspense, useMemo, useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { motionBus } from '../sdk/spawnSdk';
import { AtmosphereRig } from './AtmosphereRig';
import { getAtmospherePalette } from './sceneryHelpers';

class EnvErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneEnvironment({ title = '', environment = {}, lowQuality = false, shadowMapSize }) {
  const palette = useMemo(() => getAtmospherePalette(title, environment), [title, environment]);
  const shadowRes = shadowMapSize || (lowQuality ? 1024 : 2048);
  const sunPos = palette.isTwilight ? [24, 10, -32] : [28, 22, 22];
  const sunLightRef = useRef(null);

  useFrame(() => {
    const lgt = sunLightRef.current;
    if (!lgt) return;
    const p = motionBus.pos;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    lgt.position.set(sx + sunPos[0], p.y + 34, sz + sunPos[2]);
    lgt.target.position.set(sx, p.y, sz);
    lgt.target.updateMatrixWorld();
  });

  const bg = palette.horizon || '#E8DFD5';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, palette.isTwilight ? 0.0072 : 0.0048]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#FFF3E0" />

      <EnvErrorBoundary>
        <Suspense fallback={null}>
          <AtmosphereRig horizonColor={bg} isTwilight={palette.isTwilight} sunPos={sunPos} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="circle" intensity={palette.isTwilight ? 1.8 : 4.2} color={palette.isTwilight ? '#CBD5E1' : '#FFF3E0'} position={sunPos} scale={8} />
            <Lightformer form="ring" intensity={palette.isTwilight ? 0.9 : 2.1} color={bg} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={42} />
            <Lightformer form="rect" intensity={palette.isTwilight ? 0.9 : 1.4} color={palette.isTwilight ? '#475569' : '#8EC5FC'} position={[0, 24, 0]} rotation-x={Math.PI / 2} scale={[48, 48, 1]} />
            <Lightformer form="rect" intensity={0.85} color={palette.isTwilight ? '#1E293B' : '#E6C79C'} position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[48, 48, 1]} />
          </Environment>
        </Suspense>
      </EnvErrorBoundary>

      <hemisphereLight args={[palette.isTwilight ? '#64748B' : '#9CC7EC', palette.isTwilight ? '#2D3446' : '#E6C79C', palette.isTwilight ? 0.65 : 0.85]} />
      <directionalLight
        ref={sunLightRef}
        castShadow
        position={sunPos}
        intensity={palette.isTwilight ? 1.35 : 2.1}
        color={palette.isTwilight ? '#E2E8F0' : '#FFF3E0'}
        shadow-mapSize={[shadowRes, shadowRes]}
        shadow-camera-near={2}
        shadow-camera-far={110}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-16, 12, -22]} intensity={0.75} color="#8EC5FC" />
    </>
  );
}
