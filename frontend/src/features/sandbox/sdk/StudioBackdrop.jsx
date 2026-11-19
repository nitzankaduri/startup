import { Component, Suspense, useRef } from 'react';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AtmosphereRig } from '../components/AtmosphereRig';
import { motionBus } from './spawnSdk';

class BackdropBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Crash-proof HDRP-grade studio lighting with guaranteed ambient/directional light and #E8DFD5 fallback background. */
export function StudioBackdrop({
  skyTop = '#8EC5FC',
  skyHorizon = '#E8DFD5',
  sunColor = '#FFF3E0',
  sunIntensity = 2.0,
  shadowScale = 32,
}) {
  const lightRef = useRef(null);
  const sunPos = [28, 22, 22];

  useFrame(() => {
    const lgt = lightRef.current;
    if (!lgt) return;
    const p = motionBus.pos;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    lgt.position.set(sx + sunPos[0], p.y + 34, sz + sunPos[2]);
    lgt.target.position.set(sx, p.y, sz);
    lgt.target.updateMatrixWorld();
  });

  const bg = skyHorizon || '#E8DFD5';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, 0.0048]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#FFF3E0" />

      <BackdropBoundary>
        <Suspense fallback={null}>
          <AtmosphereRig horizonColor={bg} sunPos={sunPos} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="circle" intensity={4.0} color={sunColor} position={sunPos} scale={8} />
            <Lightformer form="ring" intensity={2.0} color={bg} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={42} />
            <Lightformer form="rect" intensity={1.4} color={skyTop} position={[0, 24, 0]} rotation-x={Math.PI / 2} scale={[48, 48, 1]} />
            <Lightformer form="rect" intensity={0.85} color="#E6C79C" position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[48, 48, 1]} />
          </Environment>
        </Suspense>
      </BackdropBoundary>

      <hemisphereLight args={[skyTop, '#E6C79C', 0.85]} />
      <directionalLight
        ref={lightRef}
        castShadow
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={2}
        shadow-camera-far={110}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={shadowScale} blur={2.2} far={12} color="#181715" />
    </>
  );
}
