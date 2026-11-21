import { Component, Suspense, useMemo } from 'react';
import { ContactShadows, Environment } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { getAtmospherePalette, isTwilightTheme } from './sceneryHelpers';

const STUDIO_PRESETS = new Set(['sunset', 'city', 'night', 'dawn', 'park']);

class RigBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}

/** Resolve one of the 5 supported drei studio HDRI presets from props, environment, or title. */
export function resolveStudioPreset(presetProp, title = '', environment = {}) {
  if (presetProp && STUDIO_PRESETS.has(presetProp)) return presetProp;
  const envPreset = environment?.preset || environment?.env_preset;
  if (envPreset && STUDIO_PRESETS.has(envPreset)) return envPreset;
  const low = `${title} ${environment?.sky_color || ''}`.toLowerCase();
  if (isTwilightTheme(title, environment?.sky_color)) return 'night';
  if (['city', 'rooftop', 'train', 'freight', 'urban', 'street'].some((k) => low.includes(k))) return 'city';
  if (['dawn', 'temple', 'morning'].some((k) => low.includes(k))) return 'dawn';
  if (['forest', 'pine', 'alpine', 'snow', 'jungle', 'park', 'meadow'].some((k) => low.includes(k))) return 'park';
  return 'sunset';
}

/**
 * Studio-grade PBR lighting rig, HDRI Environment reflections, ContactShadows,
 * distance atmospheric fog, and ACES Filmic + Bloom + Vignette post-processing.
 */
export function StudioLightingRig({
  preset,
  title = '',
  environment = {},
  lighting = true,
  postFx = true,
  lowQuality = false,
  shadowMapSize = [2048, 2048],
  children,
}) {
  const activePreset = useMemo(
    () => resolveStudioPreset(preset, title, environment),
    [preset, title, environment]
  );
  const palette = useMemo(() => getAtmospherePalette(title, environment), [title, environment]);
  const isNight = activePreset === 'night' || palette.isTwilight;

  const fogColor = environment?.fog_color || (isNight ? '#111622' : '#E7DEC8');
  const bgColor = environment?.sky_color || palette.horizon;
  const mapRes = Array.isArray(shadowMapSize) ? shadowMapSize : [shadowMapSize || 2048, shadowMapSize || 2048];
  const fogNear = Number(environment?.fog_near ?? 44);
  const fogFar = Number(environment?.fog_far ?? 165);

  return (
    <>
      {lighting && (
        <>
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

          <RigBoundary fallback={null}>
            <Suspense fallback={null}>
              <Environment preset={activePreset} />
            </Suspense>
          </RigBoundary>

          <hemisphereLight
            args={[isNight ? '#4F638A' : '#F6F4EF', isNight ? '#1E2433' : '#7D705F', isNight ? 0.55 : 0.78]}
          />

          <directionalLight
            position={[22, 34, 18]}
            intensity={isNight ? 1.45 : 2.35}
            color={isNight ? '#C8D8F6' : '#FFF4DC'}
            castShadow
            shadow-mapSize={mapRes}
            shadow-camera-near={1}
            shadow-camera-far={120}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={34}
            shadow-camera-bottom={-34}
            shadow-bias={-0.0003}
          />

          <directionalLight
            position={[-18, 12, -16]}
            intensity={isNight ? 0.48 : 0.62}
            color={isNight ? '#D96B27' : '#CBD8EC'}
          />

          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={isNight ? 0.48 : 0.36}
            scale={32}
            blur={2.1}
            far={5}
            frames={4}
            resolution={256}
            color="#181715"
          />
        </>
      )}

      {children}

      {postFx && !lowQuality && (
        <RigBoundary fallback={null}>
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur luminanceThreshold={1.0} intensity={0.45} />
            <Vignette darkness={0.35} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </RigBoundary>
      )}
    </>
  );
}
