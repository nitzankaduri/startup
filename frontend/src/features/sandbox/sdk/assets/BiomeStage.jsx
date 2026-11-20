import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AtmosphereRig } from '../../components/AtmosphereRig';
import { PracticalLights } from '../atmosphere/PracticalLights';
import { WeatherSystem } from '../atmosphere/WeatherSystem';
import { resolveStageLighting } from '../atmosphere/weatherPresets';
import { InstancedFoliage } from '../foliage/InstancedFoliage';
import { RealisticTerrain } from '../RealisticTerrain';
import { setTerrainConfig } from '../runtime/useArenaPhysics';
import { motionBus } from '../motionBus';
import { DynamicWater } from '../vfx/DynamicWater';
import { resolveBiomeTheme } from './biomePresets';

class StageBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** 6 instant AAA biome environments with dynamic timeOfDay lighting moods, practical lanterns, and GPU weather. */
export function BiomeStage({
  theme = 'alpine_meadow',
  timeOfDay = null,
  weather = 'clear',
  weatherIntensity = 0.7,
  mode = 'exploration',
  flatGround,
  size = 180,
  amplitude = 16,
  flatRadius = 20,
  foliageCount = 900,
  showFoliage = true,
  showWater = true,
}) {
  const isFlat = flatGround ?? (mode === 'city' || mode === 'racing' || mode === 'arena');
  const effAmplitude = isFlat ? 0 : amplitude;
  const effFlatRadius = isFlat ? Math.max(flatRadius, size * 0.44) : flatRadius;
  const spec = useMemo(() => resolveStageLighting(resolveBiomeTheme(theme), timeOfDay, weather), [theme, timeOfDay, weather]);
  const sunLightRef = useRef(null);
  const rimLightRef = useRef(null);
  const contactRef = useRef(null);
  const rainWetness = weather === 'rain' ? Math.min(1, (Number(weatherIntensity) || 0.7) * 1.15) : 0;

  useEffect(() => {
    setTerrainConfig({ amplitude: effAmplitude, frequency: 0.028, flatRadius: effFlatRadius, floorY: 0, bounds: size * 0.48 });
  }, [effAmplitude, effFlatRadius, size]);

  useFrame(() => {
    const p = motionBus.pos;
    const sx = Math.round(p.x * 2) / 2;
    const sz = Math.round(p.z * 2) / 2;
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sx + spec.sunPos[0], p.y + 36, sz + spec.sunPos[2]);
      sunLightRef.current.target.position.set(sx, p.y, sz);
      sunLightRef.current.target.updateMatrixWorld();
    }
    if (rimLightRef.current) {
      rimLightRef.current.position.set(sx - spec.sunPos[0] * 0.45, p.y + 13, sz - spec.sunPos[2] * 0.65);
      rimLightRef.current.target.position.set(sx, p.y + 1, sz);
      rimLightRef.current.target.updateMatrixWorld();
    }
    if (contactRef.current) contactRef.current.position.set(p.x, 0.03, p.z);
  });

  return (
    <group>
      <color attach="background" args={[spec.skyHorizon]} />
      <fogExp2 attach="fog" args={[spec.skyHorizon, spec.fogDensity]} />
      <ambientLight intensity={spec.ambientIntensity} color={spec.sunColor} />
      <hemisphereLight args={[spec.skyFillColor || (spec.isTwilight ? '#4A5D7A' : spec.skyTop), spec.hemiGround || (spec.isTwilight ? '#2A2622' : '#8FA382'), spec.hemiIntensity ?? (spec.isTwilight ? 0.65 : 1.05)]} />

      <StageBoundary>
        <Suspense fallback={null}>
          <AtmosphereRig horizonColor={spec.skyHorizon} isTwilight={spec.isTwilight} sunPos={spec.sunPos} skySunPos={spec.skySunPos || spec.sunPos} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="circle" intensity={spec.isTwilight ? 2.4 : 4.5} color={spec.sunColor} position={spec.sunPos} scale={9} />
            <Lightformer form="ring" intensity={spec.isTwilight ? 1.1 : 2.2} color={spec.skyHorizon} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={42} />
            <Lightformer form="rect" intensity={1.5} color={spec.skyTop} position={[0, 24, 0]} rotation-x={Math.PI / 2} scale={[48, 48, 1]} />
            <Lightformer form="rect" intensity={0.95} color={spec.hemiGround} position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[48, 48, 1]} />
          </Environment>
        </Suspense>
      </StageBoundary>

      <directionalLight
        ref={sunLightRef}
        castShadow
        position={spec.sunPos}
        intensity={spec.sunIntensity}
        color={spec.sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-radius={3}
        shadow-camera-near={2}
        shadow-camera-far={120}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />
      <directionalLight ref={rimLightRef} position={[-18, 14, -22]} intensity={spec.isTwilight ? 1.1 : 0.95} color={spec.isTwilight ? '#93C5FD' : '#BCE3FF'} />
      <group ref={contactRef}><ContactShadows opacity={0.36} scale={26} blur={2.1} far={4.5} frames={3} resolution={128} color="#181715" /></group>

      <RealisticTerrain
        size={size}
        segments={isFlat ? 32 : 160}
        amplitude={effAmplitude}
        flatRadius={effFlatRadius}
        surface={spec.surface}
        cliffSurface={spec.cliffSurface}
        flatColor={spec.flatColor}
        rockColor={spec.rockColor}
        peakColor={spec.peakColor}
        repeat={[18, 18]}
        wetness={rainWetness}
      />

      <PracticalLights enabled={Boolean(spec.practicals)} radius={Math.max(14, effFlatRadius - 2)} />
      <WeatherSystem type={weather} intensity={weatherIntensity} />

      {showFoliage && !isFlat && spec.foliageBiome && (
        <InstancedFoliage
          count={foliageCount}
          biome={spec.foliageBiome}
          radius={size * 0.42}
          terrainAmplitude={effAmplitude}
          flatRadius={effFlatRadius}
          waterLevel={spec.waterType ? spec.waterLevel : -999}
        />
      )}

      {showWater && spec.waterType && (
        <DynamicWater type={spec.waterType} level={spec.waterLevel} size={size * 1.15} />
      )}
    </group>
  );
}
