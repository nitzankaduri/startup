import { Component, Suspense, useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AtmosphereRig } from '../components/AtmosphereRig';
import { motionBus } from './motionBus';

class BackdropBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Vibrant sunlit Pixar/Subway-Surfers 3-point lighting with player-following 2048px soft shadows & golden horizon haze. */
export function StudioBackdrop({
  skyTop = '#6BC4FF',
  skyHorizon = '#FCE5CE',
  sunColor = '#FFF2D2',
  sunIntensity = 2.75,
}) {
  const lightRef = useRef(null);
  const sunPos = [26, 28, 22];

  useFrame(() => {
    const lgt = lightRef.current;
    if (!lgt) return;
    const p = motionBus.pos;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    lgt.position.set(sx + sunPos[0], p.y + 36, sz + sunPos[2]);
    lgt.target.position.set(sx, p.y, sz);
    lgt.target.updateMatrixWorld();
  });

  const bg = skyHorizon || '#FCE5CE';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, 0.0036]} />
      <ambientLight intensity={0.62} color="#FFF6E8" />
      <hemisphereLight args={[skyTop, '#F2A986', 1.15]} />
      <directionalLight position={[-20, 16, -24]} intensity={0.75} color="#9ED6FF" />

      <BackdropBoundary>
        <Suspense fallback={null}>
          <AtmosphereRig horizonColor={bg} sunPos={sunPos} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="circle" intensity={4.5} color={sunColor} position={sunPos} scale={9} />
            <Lightformer form="ring" intensity={2.2} color={bg} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={42} />
            <Lightformer form="rect" intensity={1.6} color={skyTop} position={[0, 24, 0]} rotation-x={Math.PI / 2} scale={[48, 48, 1]} />
            <Lightformer form="rect" intensity={1.0} color="#F2B38C" position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[48, 48, 1]} />
          </Environment>
        </Suspense>
      </BackdropBoundary>

      <directionalLight
        ref={lightRef}
        castShadow
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={3}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />
    </>
  );
}
