import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { STUDIO_BLOOM_CONFIG, configureStudioRenderer, createStudioEnvironmentMap } from './StudioRenderPipeline';

/**
 * Binds procedural HDRI PMREM reflections to scene.environment and runs a crisp
 * 60-120 FPS post-processing pass (subtle HDR Bloom + SMAA + ACES Filmic ToneMapping).
 */
export function StudioPostFX({ skyKey = 'sunny_city' }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    configureStudioRenderer(gl);
    const envTex = createStudioEnvironmentMap(gl, skyKey);
    if (envTex) {
      scene.environment = envTex;
      scene.environmentIntensity = skyKey === 'space_sky' ? 1.05 : 0.9;
    }
  }, [gl, scene, skyKey]);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        mipmapBlur={STUDIO_BLOOM_CONFIG.mipmapBlur}
        luminanceThreshold={STUDIO_BLOOM_CONFIG.luminanceThreshold}
        luminanceSmoothing={STUDIO_BLOOM_CONFIG.luminanceSmoothing}
        intensity={STUDIO_BLOOM_CONFIG.intensity}
      />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
