import { useMemo } from 'react';
import { resolveModelAsset } from './assetCatalog';
import { AutoNormalizeMesh } from './AutoNormalizeMesh';
import { StudioProp } from './StudioProps';

/** GLB prop or sculpted StudioProp renderer with Box3 targetHeight normalization, y=0 grounding & ContactShadows. */
export function PropModel({ model = 'crate', targetHeight, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], color }) {
  const spec = useMemo(() => resolveModelAsset(model), [model]);
  const fallbackKind = spec.fallbackKind || model;

  if (!spec.url) {
    return <StudioProp type={fallbackKind} position={position} rotation={rotation} scale={scale} color={color} />;
  }

  return (
    <AutoNormalizeMesh
      url={spec.url}
      targetHeight={targetHeight ?? spec.targetHeight ?? 1.6}
      scale={scale}
      position={position}
      rotation={rotation}
      rotationY={spec.rotationY || 0}
      fallback={<StudioProp type={fallbackKind} scale={scale} color={color} />}
    />
  );
}
