import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const PREVENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

// Layout-independent physical code -> universal key aliases (works on English, Hebrew, etc.)
const CODE_ALIASES = {
  KeyW: ['w', 'W', 'forward', 'up'],
  KeyS: ['s', 'S', 'backward', 'down'],
  KeyA: ['a', 'A', 'left'],
  KeyD: ['d', 'D', 'right'],
  ArrowUp: ['ArrowUp', 'arrowup', 'up', 'forward'],
  ArrowDown: ['ArrowDown', 'arrowdown', 'down', 'backward'],
  ArrowLeft: ['ArrowLeft', 'arrowleft', 'left'],
  ArrowRight: ['ArrowRight', 'arrowright', 'right'],
  Space: ['Space', 'space', ' ', 'jump'],
  ShiftLeft: ['ShiftLeft', 'Shift', 'shift', 'dash'],
  ShiftRight: ['ShiftRight', 'Shift', 'shift', 'dash'],
};

const globalKeys = {};
Object.defineProperty(globalKeys, 'current', { get: () => globalKeys, enumerable: false });

let keyboardBound = false;
function ensureGlobalKeyboard() {
  if (keyboardBound || typeof window === 'undefined') return;
  keyboardBound = true;

  const setKeyState = (e, down) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (down && PREVENT_KEYS.has(e.code)) e.preventDefault();
    globalKeys[e.code] = down;
    if (e.key) {
      globalKeys[e.key] = down;
      globalKeys[e.key.toLowerCase()] = down;
    }
    const aliases = CODE_ALIASES[e.code];
    if (aliases) aliases.forEach((a) => { globalKeys[a] = down; });
  };

  const onDown = (e) => setKeyState(e, true);
  const onUp = (e) => setKeyState(e, false);
  const onBlur = () => { Object.keys(globalKeys).forEach((k) => { globalKeys[k] = false; }); };

  window.addEventListener('keydown', onDown, { capture: true });
  window.addEventListener('keyup', onUp, { capture: true });
  window.addEventListener('blur', onBlur);
}

/** Universal input hook: layout-independent capture-phase keyboard state (direct & .current), pointer NDC & raycast. */
export function useGameInput({ groundY = 0, onPointerDown, onPointerMove, onPointerUp } = {}) {
  ensureGlobalKeyboard();
  const { camera, gl } = useThree();
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

    el.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      el.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [gl, getGroundPoint]);

  const isPressed = useCallback((code) => Boolean(globalKeys[code] || globalKeys[code?.toLowerCase?.()]), []);
  const bindMesh = useCallback((meshHandlers = {}) => ({
    onPointerDown: (e) => { e.stopPropagation(); meshHandlers.onPointerDown?.(e); },
    onPointerMove: (e) => { meshHandlers.onPointerMove?.(e); },
    onPointerUp: (e) => { meshHandlers.onPointerUp?.(e); },
  }), []);

  return { keys: globalKeys, pointer, isPressed, getGroundPoint, bindMesh };
}
