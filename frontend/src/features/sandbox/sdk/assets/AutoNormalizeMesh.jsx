import { Component, Suspense, useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { registerObjectCollider, unregisterCollider } from '../runtime/useArenaPhysics';
import { computeNormalizedMetrics } from './normalizeModelMetrics';
import { SoftShadowDecal } from './StudioProps';

class GlbBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function LoadedGlb({ url, targetHeight = 1.8, scale = 1, rotationY = 0, animationState = 'Idle', clips = {}, onReady }) {
  const groupRef = useRef(null);
  const prevActionRef = useRef(null);
  const { scene, animations } = useGLTF(url);

  const { clonedScene, metrics } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return { clonedScene: clone, metrics: computeNormalizedMetrics(clone, targetHeight) };
  }, [scene, targetHeight]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (!names.length || !actions) return;
    const desired = clips?.[animationState] || animationState;
    const match = names.find((n) => n === desired) || names.find((n) => n.toLowerCase().includes(String(desired).toLowerCase())) || names[0];
    const nextAction = actions[match];
    if (!nextAction || prevActionRef.current === nextAction) return;
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (prevActionRef.current) prevActionRef.current.crossFadeTo(nextAction, 0.15, true);
    else nextAction.fadeIn(0.15);
    prevActionRef.current = nextAction;
  }, [actions, names, animationState, clips]);

  useEffect(() => () => { Object.values(actions || {}).forEach((a) => a?.stop?.()); }, [actions]);
  useEffect(() => { onReady?.(); }, [clonedScene, metrics.normScale, onReady]);

  return (
    <group scale={scale}>
      <group
        ref={groupRef}
        scale={metrics.normScale}
        position={[metrics.centerX, metrics.offsetY, metrics.centerZ]}
        rotation={[0, rotationY, 0]}
      >
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

/** Auto-normalizes any .glb asset via THREE.Box3 (grounded at y=0) with ContactShadows and ErrorBoundary fallback. */
export function AutoNormalizeMesh({
  url, targetHeight = 1.8, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], rotationY = 0,
  animationState = 'Idle', clips = {}, fallback = null, solid = true, colliderPadding = 0, onCollide,
}) {
  const meshWrapRef = useRef(null);
  const cid = `glb-${useId()}`;
  const shadowScale = Array.isArray(scale) ? Math.max(...scale.map((n) => Math.abs(Number(n) || 1))) : (Number(scale) || 1);
  const px = position?.[0] || 0; const py = position?.[1] || 0; const pz = position?.[2] || 0;
  const syncCollider = useCallback(
    () => registerObjectCollider(cid, meshWrapRef.current, { padding: colliderPadding, solid: solid !== false, onCollide }),
    [cid, colliderPadding, solid, onCollide]
  );

  useEffect(() => {
    syncCollider();
    return () => unregisterCollider(cid);
  }, [syncCollider, cid, url, targetHeight, px, py, pz, shadowScale]);

  return (
    <group position={position} rotation={rotation} userData={{ studioProp: true, solid: solid !== false, entityLabel: '3D Model' }}>
      <SoftShadowDecal scale={2.4 * shadowScale} />
      <group ref={meshWrapRef}>
        <GlbBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <LoadedGlb url={url} targetHeight={targetHeight} scale={scale} rotationY={rotationY} animationState={animationState} clips={clips} onReady={syncCollider} />
          </Suspense>
        </GlbBoundary>
      </group>
    </group>
  );
}
