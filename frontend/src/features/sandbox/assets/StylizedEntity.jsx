import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useIsInsidePhysics } from '../physics/WorldPhysicsProvider';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';
import { resolveCartoonAsset } from './CartoonAssetCatalog';
import { CartoonCarPrefab, CartoonCharacterPrefab, CartoonPickupPrefab } from './CartoonActorPrefabs';
import { CartoonCityBuildingPrefab, StreetBarrierPrefab, SubwayTrainPrefab, TrainRampPrefab } from './CartoonWorldPrefabs';

const BOX = new THREE.Box3();
const SIZE = new THREE.Vector3();
const CENTER = new THREE.Vector3();

class EntityBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function PrefabSwitch({ prefab, variant, color }) {
  if (prefab === 'subway_train') return <SubwayTrainPrefab color={color} />;
  if (prefab === 'train_ramp') return <TrainRampPrefab />;
  if (prefab === 'street_barrier') return <StreetBarrierPrefab variant={variant} />;
  if (prefab === 'cartoon_car') return <CartoonCarPrefab color={color} />;
  if (prefab === 'police_cruiser') return <CartoonCarPrefab police />;
  if (prefab === 'city_building') return <CartoonCityBuildingPrefab color={color} />;
  if (prefab === 'gold_coin' || prefab === 'powerup_magnet' || prefab === 'jetpack') return <CartoonPickupPrefab kind={prefab} />;
  if (prefab === 'chaser_guard') return <CartoonCharacterPrefab guard />;
  return <CartoonCharacterPrefab color={color} />;
}

function LoadedCartoonGlb({ url, targetHeight, rotationY = 0, animationState = 'Idle', clips = {}, onBounds }) {
  const animRoot = useRef(null);
  const { scene, animations } = useGLTF(url);
  const { clone, m } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.updateMatrixWorld(true);
    BOX.setFromObject(c);
    BOX.getSize(SIZE); BOX.getCenter(CENTER);
    const ns = targetHeight / Math.max(0.001, SIZE.y || 1);
    const swap = Math.abs(Math.sin(rotationY)) > 0.7;
    return {
      clone: c,
      m: { ns, cx: -CENTER.x * ns, oy: -BOX.min.y * ns, cz: -CENTER.z * ns, he: [Math.max(0.15, (swap ? SIZE.z : SIZE.x) * ns * 0.5), Math.max(0.15, SIZE.y * ns * 0.5), Math.max(0.15, (swap ? SIZE.x : SIZE.z) * ns * 0.5)] },
    };
  }, [scene, targetHeight, rotationY]);

  const { actions, names } = useAnimations(animations, animRoot);
  useEffect(() => { onBounds?.(m.he); }, [m.he, onBounds]);
  useEffect(() => {
    if (!names.length || !actions) return;
    const key = clips?.[animationState] || animationState;
    const match = names.find((n) => n === key) || names.find((n) => n.toLowerCase().includes(String(key).toLowerCase())) || names[0];
    const act = actions[match];
    if (act) act.reset().fadeIn(0.15).play();
    return () => { act?.fadeOut?.(0.12); };
  }, [actions, names, animationState, clips]);

  return (
    <group ref={animRoot} scale={m.ns} position={[m.cx, m.oy, m.cz]} rotation={[0, rotationY, 0]}>
      <primitive object={clone} />
    </group>
  );
}

/**
 * Stylized Subway-Surfers entity loader supporting .glb useGLTF assets & high-detail cartoon prefabs,
 * auto-applying 3-band toon shading, #1E1B4B <Outlines />, y=0 alignment & Rapier colliders.
 */
export function StylizedEntity({
  name = 'cartoon_character', model, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1,
  color = '#D96B27', variant, useGlb = true, physics = true, solid = true, sensor, bodyType = 'fixed',
  animationState = 'Idle', onCollide, onSensorEnter,
}) {
  const entry = resolveCartoonAsset(model || name);
  const scaleVec = Array.isArray(scale) ? scale : [scale, scale, scale];
  const [halfExtents, setHalfExtents] = useState(() =>
    (entry.bounds || [1, 1.8, 1]).map((v, i) => Math.max(0.15, v * 0.5 * scaleVec[i]))
  );
  const inPhysics = useIsInsidePhysics();
  const isSensor = sensor ?? Boolean(entry.sensor);
  const prefabNode = <PrefabSwitch prefab={entry.prefab} variant={variant || entry.variant} color={color} />;

  const visual = (
    <SubwayToonGroup outline thickness={0.03} color="#1E1B4B">
      <group scale={scaleVec}>
        {useGlb && entry.url ? (
          <EntityBoundary fallback={prefabNode}>
            <Suspense fallback={prefabNode}>
              <LoadedCartoonGlb
                url={entry.url} targetHeight={entry.targetHeight} rotationY={entry.rotationY || 0}
                animationState={animationState} clips={entry.clips}
                onBounds={(he) => setHalfExtents([he[0] * scaleVec[0], he[1] * scaleVec[1], he[2] * scaleVec[2]])}
              />
            </Suspense>
          </EntityBoundary>
        ) : prefabNode}
      </group>
    </SubwayToonGroup>
  );

  if (!physics || solid === false || !inPhysics) {
    return <group position={position} rotation={rotation}>{visual}</group>;
  }
  return (
    <RigidBody type={bodyType} colliders={false} position={position} rotation={rotation} onCollisionEnter={onCollide}>
      {entry.prefab === 'train_ramp' ? (
        <CuboidCollider args={[1.3, 0.28, 3.05]} position={[0, 1.25, 0]} rotation={[-0.42, 0, 0]} />
      ) : (
        <CuboidCollider args={halfExtents} position={[0, halfExtents[1], 0]} sensor={isSensor} onIntersectionEnter={onSensorEnter} />
      )}
      {visual}
    </RigidBody>
  );
}
