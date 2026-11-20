import { Component } from 'react';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { QUALITY_PRESETS } from '../store/useSettingsStore';

class PostFXBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Crash-proof HDR Bloom + ACES Filmic composer with zero-MSAA HalfFloat pass and ErrorBoundary fallback. */
export function PostFX({ quality = 'balanced', lowQuality = false }) {
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  if (lowQuality || !preset.postFx) return null;

  return (
    <PostFXBoundary>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={1.12}
          luminanceSmoothing={0.22}
          intensity={quality === 'ultra' ? 0.34 : 0.24}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </PostFXBoundary>
  );
}
