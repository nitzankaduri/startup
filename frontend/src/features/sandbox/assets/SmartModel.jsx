import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useIsInsidePhysics } from '../physics/WorldPhysicsProvider';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';
import { DetailedModelFallback } from './DetailedModelFallback';
import { resolveCatalogModel } from './ModelCatalog';

const BOX = new THREE.Box3();
const SIZE = new THREE.Vector3();
const CENTER = new THREE.Vector3();

class ModelBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function measureNormalized(root, targetHeight, rotationY = 0) {
  root.updateMatrixWorld(true);
  BOX.setFromObject(root);
  if (BOX.isEmpty()) return { normScale: 1, offsetY: 0, cx: 0, cz: 0, halfExtents: [0.5, 0.5, 0.5] };
  BOX.getSize(SIZE);
  BOX.getCenter(CENTER);
  const normScale = targetHeight / Math.max(0.001, SIZE.y);
  const rotSwap = Math.abs(Math.sin(rotationY)) > 0.7;
  const rx = rotSwap ? SIZE.z : SIZE.x;
  const rz = rotSwap ? SIZE.x : SIZE.z;
  const halfExtents = [
    Math.max(0.12, rx * normScale * 0.5),
    Math.max(0.12, SIZE.y * normScale * 0.5),
    Math.max(0.12, rz * normScale * 0.5),
  ];
  return { normScale, cx: -CENTER.x * normScale, offsetY: -BOX.min.y * normScale, cz: -CENTER.z * normScale, halfExtents };
}

function LoadedCatalogGlb({ url, targetHeight, rotationY = 0, animationState = 'Idle', clips = {}, onBounds }) {
  const animRoot = useRef(null);
  const { scene, animations } = useGLTF(url);
  const { clone, metrics } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((obj) => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
    return { clone: c, metrics: measureNormalized(c, targetHeight, rotationY) };
  }, [scene, targetHeight, rotationY]);

  const { actions, names } = useAnimations(animations, animRoot);
  useEffect(() => { onBounds?.(metrics.halfExtents); }, [metrics.halfExtents, onBounds]);
  useEffect(() => {
    if (!names.length || !actions) return;
    const key = clips[animationState] || animationState;
    const match = names.find((n) => n === key) || names.find((n) => n.toLowerCase().includes(String(key).toLowerCase())) || names[0];
    const act = actions[match];
    if (act) act.reset().fadeIn(0.15).play();
    return () => { act?.fadeOut?.(0.12); };
  }, [actions, names, animationState, clips]);

  return (
    <group ref={animRoot} scale={metrics.normScale} position={[metrics.cx, metrics.offsetY, metrics.cz]} rotation={[0, rotationY, 0]}>
      <primitive object={clone} />
    </group>
  );
}

/**
 * Loads bundled or remote .glb models (with detailed multi-part fallback),
 * grounds base flush on y = 0 via THREE.Box3, and wraps with exact RigidBody colliders.
 */
export function SmartModel({
  name = 'sports_car',
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  targetHeight,
  color = '#D96B27',
  animationState = 'Idle',
  physics = true,
  solid = true,
  sensor,
  bodyType = 'fixed',
  onCollide,
  onSensorEnter,
}) {
  const entry = resolveCatalogModel(model || name);
  const resolvedH = targetHeight ?? entry.targetHeight;
  const scaleVec = Array.isArray(scale) ? scale : [scale, scale, scale];
  const scaleY = resolvedH / Math.max(0.001, entry.targetHeight);
  const [halfExtents, setHalfExtents] = useState(() =>
    (entry.defaultBounds || [1.2, resolvedH, 1.2]).map((v, idx) => Math.max(0.12, v * 0.5 * (idx === 1 ? scaleY : 1)))
  );
  const inPhysics = useIsInsidePhysics();
  const isSensor = sensor ?? Boolean(entry.sensor);

  const fallback = (
    <group scale={[scaleVec[0] * scaleY, scaleVec[1] * scaleY, scaleVec[2] * scaleY]}>
      <DetailedModelFallback kind={entry.fallbackKind} color={color} />
    </group>
  );

  const content = (
    <SubwayToonGroup outline thickness={0.03} color="#1E1B4B">
      <group scale={scaleVec}>
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            {entry.url ? (
              <LoadedCatalogGlb
                url={entry.url}
                targetHeight={resolvedH}
                rotationY={entry.rotationY || 0}
                animationState={animationState}
                clips={entry.clips}
                onBounds={(he) => setHalfExtents([he[0] * scaleVec[0], he[1] * scaleVec[1], he[2] * scaleVec[2]])}
              />
            ) : fallback}
          </Suspense>
        </ModelBoundary>
      </group>
    </SubwayToonGroup>
  );

  if (!physics || solid === false || !inPhysics) {
    return <group position={position} rotation={rotation}>{content}</group>;
  }

  return (
    <RigidBody
      type={bodyType}
      colliders={false}
      position={position}
      rotation={rotation}
      onCollisionEnter={onCollide}
    >
      <CuboidCollider args={halfExtents} position={[0, halfExtents[1], 0]} sensor={isSensor} onIntersectionEnter={onSensorEnter} />
      {content}
    </RigidBody>
  );
}
