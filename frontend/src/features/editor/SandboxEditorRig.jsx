import { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sandbox/sdk/spawnSdk';
import { useSceneEditorStore } from '../sandbox/store/useSceneEditorStore';
import { findEditableAncestor } from './sceneEditUtils';

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _ptr = new THREE.Vector2();
const _ray = new THREE.Raycaster();

/** Free-orbit camera + click-to-select 3D warm gizmo ring active when Edit World mode is enabled. */
export function SandboxEditorRig() {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const gizmoRef = useRef(null);
  const ringMatRef = useRef(null);
  const downPos = useRef({ x: 0, y: 0 });

  const isEditMode = useSceneEditorStore((s) => s.isEditMode);
  const sceneRootRef = useSceneEditorStore((s) => s.sceneRootRef);
  const selectedObject = useSceneEditorStore((s) => s.selectedObject);
  const selectObject = useSceneEditorStore((s) => s.selectObject);
  const clearSelection = useSceneEditorStore((s) => s.clearSelection);

  const initialTarget = useMemo(() => [motionBus.pos.x || 0, (motionBus.pos.y || 0) + 1.2, motionBus.pos.z || 0], [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !gl?.domElement) return undefined;
    const dom = gl.domElement;
    const onDown = (e) => { downPos.current = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y) > 6) return;
      if (!sceneRootRef) return;
      const rect = dom.getBoundingClientRect();
      _ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      _ray.setFromCamera(_ptr, camera);
      const hits = _ray.intersectObjects(sceneRootRef.children, true);
      for (const hit of hits) {
        const picked = findEditableAncestor(hit.object, sceneRootRef);
        if (picked) { selectObject(picked); return; }
      }
      clearSelection();
    };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointerup', onUp);
    return () => { dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp); };
  }, [isEditMode, sceneRootRef, camera, gl, selectObject, clearSelection]);

  useFrame((state) => {
    const g = gizmoRef.current;
    if (!g || !isEditMode || !selectedObject || !selectedObject.visible) {
      if (g) g.visible = false;
      return;
    }
    _box.setFromObject(selectedObject);
    if (_box.isEmpty()) { g.visible = false; return; }
    _box.getCenter(_center);
    _box.getSize(_size);
    const rad = Math.max(0.85, Math.hypot(_size.x, _size.z) * 0.54);
    g.visible = true;
    g.position.set(_center.x, _box.min.y + 0.08, _center.z);
    g.scale.setScalar(rad);
    g.rotation.z = state.clock.elapsedTime * 0.55;
    if (ringMatRef.current) ringMatRef.current.opacity = 0.72 + Math.sin(state.clock.elapsedTime * 3.5) * 0.16;
  });

  if (!isEditMode) return null;

  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault target={initialTarget} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.48} />
      <group ref={gizmoRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} userData={{ ignoreEditSelect: true }}>
        <mesh>
          <ringGeometry args={[0.9, 1.04, 48]} />
          <meshBasicMaterial ref={ringMatRef} color="#D96B27" transparent opacity={0.85} depthTest={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.08, 1.13, 48, 1, 0, Math.PI * 0.4]} />
          <meshBasicMaterial color="#F6F4EF" transparent opacity={0.9} depthTest={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.08, 1.13, 48, 1, Math.PI, Math.PI * 0.4]} />
          <meshBasicMaterial color="#F6F4EF" transparent opacity={0.9} depthTest={false} />
        </mesh>
      </group>
    </>
  );
}
