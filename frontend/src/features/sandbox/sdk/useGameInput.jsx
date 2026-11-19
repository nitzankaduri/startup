import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/** Universal input hook providing keyboard state, pointer NDC, mesh event binders, and world ground raycasting. */
export function useGameInput({ groundY = 0, onPointerDown, onPointerMove, onPointerUp } = {}) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const pointer = useRef({ x: 0, y: 0, isDown: false, button: 0, dragStart: null });
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(UP, -groundY));
  const hitVec = useRef(new THREE.Vector3());
  const handlersRef = useRef({ onPointerDown, onPointerMove, onPointerUp });
  handlersRef.current = { onPointerDown, onPointerMove, onPointerUp };

  const getGroundPoint = useCallback((planeY = groundY) => {
    plane.current.constant = -planeY;
    raycaster.current.setFromCamera(pointer.current, camera);
    const hit = raycaster.current.ray.intersectPlane(plane.current, hitVec.current);
    return hit ? hit.clone() : null;
  }, [camera, groundY]);

  useEffect(() => {
    const el = gl.domElement;
    const updatePointer = (e) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      keys.current[e.code] = true;
      keys.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e) => {
      keys.current[e.code] = false;
      keys.current[e.key.toLowerCase()] = false;
    };
    const clearKeys = () => { keys.current = {}; pointer.current.isDown = false; };

    const handleDown = (e) => {
      updatePointer(e);
      pointer.current.isDown = true;
      pointer.current.button = e.button;
      const gp = getGroundPoint();
      pointer.current.dragStart = gp ? gp.clone() : null;
      handlersRef.current.onPointerDown?.({ event: e, ndc: { ...pointer.current }, groundPoint: gp, button: e.button });
    };
    const handleMove = (e) => {
      updatePointer(e);
      const gp = getGroundPoint();
      handlersRef.current.onPointerMove?.({ event: e, ndc: { ...pointer.current }, groundPoint: gp, isDown: pointer.current.isDown });
    };
    const handleUp = (e) => {
      updatePointer(e);
      pointer.current.isDown = false;
      const gp = getGroundPoint();
      handlersRef.current.onPointerUp?.({ event: e, ndc: { ...pointer.current }, groundPoint: gp, button: e.button });
      pointer.current.dragStart = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    el.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      el.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [gl, getGroundPoint]);

  const isPressed = useCallback((code) => Boolean(keys.current[code] || keys.current[code?.toLowerCase?.()]), []);

  const bindMesh = useCallback((meshHandlers = {}) => ({
    onPointerDown: (e) => { e.stopPropagation(); meshHandlers.onPointerDown?.(e); },
    onPointerMove: (e) => { meshHandlers.onPointerMove?.(e); },
    onPointerUp: (e) => { meshHandlers.onPointerUp?.(e); },
  }), []);

  return { keys, pointer, isPressed, getGroundPoint, bindMesh };
}
