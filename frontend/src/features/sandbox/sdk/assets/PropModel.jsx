import { Component, Suspense, useMemo } from 'react';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { resolveModelAsset } from './modelRegistry';
import { computeNormalizedMetrics } from './normalizeModelMetrics';
import { ProceduralAssetFallback } from './ProceduralAssetFallbacks';

class PropErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function LoadedProp({ asset, targetHeight, scale = 1 }) {
  const { scene } = useGLTF(asset.url);
  const { cloned, metrics } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return { cloned: c, metrics: computeNormalizedMetrics(c, targetHeight ?? asset.targetHeight ?? 1.6) };
  }, [scene, targetHeight, asset.targetHeight]);

  return (
    <group scale={scale}>
      <group scale={metrics.normScale} position={[metrics.centerX, metrics.offsetY, metrics.centerZ]} rotation={[0, asset.rotationY || 0, 0]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

/** GLB prop or vehicle renderer with Box3 targetHeight normalization, y=0 grounding, and offline PBR fallback. */
export function PropModel({ model = 'crate', targetHeight, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const asset = useMemo(() => resolveModelAsset(model), [model]);
  const fallback = <ProceduralAssetFallback kind={asset.fallbackKind} scale={scale} />;

  return (
    <group position={position} rotation={rotation}>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.36} scale={3.2 * scale} blur={2.0} far={2.6} frames={1} resolution={128} color="#181715" />
      {asset.url ? (
        <PropErrorBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <LoadedProp asset={asset} targetHeight={targetHeight} scale={scale} />
          </Suspense>
        </PropErrorBoundary>
      ) : fallback}
    </group>
  );
}
