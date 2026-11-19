import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { useGameStore } from '../../store/useGameStore';
import { motionBus, setTargetFov } from '../spawnSdk';
import { SmokeTrail } from '../SmokeTrail';
import { resolveModelAsset } from './modelRegistry';
import { computeNormalizedMetrics } from './normalizeModelMetrics';
import { ProceduralAssetFallback } from './ProceduralAssetFallbacks';

class ActorErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const WHITE = new THREE.Color('#FFFFFF');

function LoadedSkeletalActor({ asset, animationState = 'Idle', targetHeight, scale = 1, hitFlashAt = 0 }) {
  const groupRef = useRef(null);
  const prevActionRef = useRef(null);
  const { scene, animations } = useGLTF(asset.url);

  const { clonedScene, metrics, matEntries } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    const entries = [];
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true; child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const cloned = mats.map((m) => {
        if (!m?.clone) return m;
        const c = m.clone();
        entries.push({ mat: c, emissive: c.emissive ? c.emissive.clone() : new THREE.Color(0), intensity: c.emissiveIntensity ?? 0 });
        return c;
      });
      child.material = Array.isArray(child.material) ? cloned : cloned[0];
    });
    return { clonedScene: clone, metrics: computeNormalizedMetrics(clone, targetHeight ?? asset.targetHeight ?? 1.8), matEntries: entries };
  }, [scene, targetHeight, asset.targetHeight]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (!names.length || !actions) return;
    const mapped = asset.clips?.[animationState] || animationState;
    const match = names.find((n) => n === mapped) || names.find((n) => n.toLowerCase().includes(animationState.toLowerCase())) || names[0];
    const nextAction = actions[match];
    if (!nextAction || prevActionRef.current === nextAction) return;
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (prevActionRef.current) prevActionRef.current.crossFadeTo(nextAction, 0.15, true);
    else nextAction.fadeIn(0.15);
    prevActionRef.current = nextAction;
  }, [actions, names, animationState, asset]);

  useEffect(() => () => { Object.values(actions || {}).forEach((a) => a?.stop?.()); }, [actions]);

  useFrame(() => {
    const flashing = hitFlashAt > 0 && performance.now() - hitFlashAt < 120;
    for (let i = 0; i < matEntries.length; i += 1) {
      const e = matEntries[i];
      if (!e.mat?.emissive) continue;
      if (flashing) { e.mat.emissive.copy(WHITE); e.mat.emissiveIntensity = 0.85; }
      else if (e.mat.emissiveIntensity !== e.intensity) { e.mat.emissive.copy(e.emissive); e.mat.emissiveIntensity = e.intensity; }
    }
  });

  return (
    <group scale={scale}>
      <group ref={groupRef} scale={metrics.normScale} position={[0, metrics.offsetY, 0]} rotation={[0, asset.rotationY || 0, 0]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

/** Skeletal GLB actor with Box3 grounding, 0.15s crossfades, 0.12s white hit-flash & optional Shift dash burst. */
export function SkeletalActor({
  model = 'hero', animationState = 'Idle', targetHeight, scale = 1, position = [0, 0, 0],
  rotation = [0, 0, 0], hitFlashAt = 0, enableDash = false, dashSpeed = 18, onDash,
}) {
  const asset = useMemo(() => resolveModelAsset(model), [model]);
  const dashRef = useRef({ until: 0, lastAt: 0, burstX: 0, burstZ: 0 });
  const dashSmokeRef = useRef(false);
  const ringRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!enableDash) return undefined;
    const onKey = (e) => {
      if ((e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') || ['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const now = performance.now();
      if (now - dashRef.current.lastAt < 1400) return;
      dashRef.current.lastAt = now;
      dashRef.current.until = now + 170;
      const yaw = motionBus.yaw || rotation[1] || 0;
      dashRef.current.burstX = -Math.sin(yaw) * dashSpeed;
      dashRef.current.burstZ = -Math.cos(yaw) * dashSpeed;
      soundEngine.playDash();
      useGameStore.getState().triggerDash();
      setTargetFov(66);
      setTimeout(() => setTargetFov(null), 190);
      onDash?.({ vx: dashRef.current.burstX, vz: dashRef.current.burstZ });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableDash, dashSpeed, rotation[1], onDash]);

  useFrame((_, rawDelta) => {
    if (!enableDash) return;
    const now = performance.now();
    const active = now < dashRef.current.until;
    dashSmokeRef.current = active;
    motionBus.isBoosting = active;
    if (active && rootRef.current) {
      const dt = Math.min(0.05, rawDelta);
      rootRef.current.position.x += dashRef.current.burstX * dt;
      rootRef.current.position.z += dashRef.current.burstZ * dt;
    }
    if (ringRef.current) {
      const cd = Math.min(1, (now - dashRef.current.lastAt) / 1400);
      ringRef.current.visible = dashRef.current.lastAt > 0 && cd < 1;
      ringRef.current.scale.setScalar(0.55 + cd * 0.45);
    }
  });

  const fallback = <ProceduralAssetFallback kind={asset.fallbackKind} scale={scale} />;
  return (
    <group ref={rootRef} position={position} rotation={rotation}>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.42} scale={2.8 * scale} blur={1.8} far={2.4} frames={1} resolution={128} color="#181715" />
      {enableDash && (
        <>
          <SmokeTrail activeRef={dashSmokeRef} color="#E6DDD0" baseSize={0.34} maxSize={1.35} life={0.45} />
          <mesh ref={ringRef} visible={false} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.68, 0.84, 24]} /><meshBasicMaterial color="#D96B27" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      {asset.url ? (
        <ActorErrorBoundary fallback={fallback}>
          <Suspense fallback={fallback}><LoadedSkeletalActor asset={asset} animationState={animationState} targetHeight={targetHeight} scale={scale} hitFlashAt={hitFlashAt} /></Suspense>
        </ActorErrorBoundary>
      ) : fallback}
    </group>
  );
}
