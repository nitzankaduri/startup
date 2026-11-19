import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { attachCameraInputs, avoidCameraCollision, dampVec3, smoothDamp } from './cameraMath';
import { noise2D } from './pbrNoise';
import { motionBus } from './spawnSdk';

const DESIRED_POS = new THREE.Vector3();
const LOOK_ORIGIN = new THREE.Vector3();
const PIVOT_POS = new THREE.Vector3();
const resolveTarget = (t) => (typeof t === 'function' ? t() : Array.isArray(t) ? { x: t[0], y: t[1], z: t[2] } : t || motionBus.pos);

/** Cinematic gimbal camera: Perlin micro-breathing, critically-damped spring follow, collision avoidance & speed FOV. */
export function SmartCamera({
  mode = 'follow', target, distance = 8.6, height = 4.5, fov = 60, zoom = 16, minZoom = 7, maxZoom = 34,
  panSpeed = 16, isRacer = false, pointerLock = false,
}) {
  const { camera, gl, scene } = useThree();
  const shakeAt = useGameStore((s) => s.shakeAt);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const sensitivity = useSettingsStore((s) => s.cameraSensitivity);
  const smoothPos = useRef(new THREE.Vector3(0, 6, 10));
  const posVel = useRef({ x: 0, y: 0, z: 0 });
  const lookVel = useRef({ x: 0, y: 0, z: 0 });
  const fovVel = useRef({ fov: 0 });
  const smoothLook = useRef(new THREE.Vector3(0, 1, -2));
  const raycaster = useRef(new THREE.Raycaster());
  const panRef = useRef({ x: 0, z: 0, zoom });
  const lookRef = useRef({ yaw: 0, pitch: 0, drag: false, lx: 0, ly: 0 });
  const keysRef = useRef({});

  useEffect(() => { panRef.current.zoom = THREE.MathUtils.clamp(zoom, minZoom, maxZoom); }, [zoom, minZoom, maxZoom]);

  useEffect(
    () => attachCameraInputs(gl.domElement, { mode, minZoom, maxZoom, pointerLock, sensitivity, keysRef, panRef, lookRef, motionBus }),
    [gl, mode, minZoom, maxZoom, pointerLock, sensitivity]
  );

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const p = resolveTarget(target);
    if (!hasStarted) {
      const swayX = Math.sin(clock.elapsedTime * 0.45) * 0.65;
      const swayY = Math.cos(clock.elapsedTime * 0.6) * 0.22;
      dampVec3(smoothPos.current, p.x + swayX, p.y + 3.6 + swayY, p.z + 7.6, posVel.current, 0.24, 0.24, 0.24, dt);
      camera.position.copy(smoothPos.current);
      camera.lookAt(p.x, p.y + 0.9, p.z - 2.5);
      return;
    }
    if (mode === 'orbit') return;
    const v = motionBus.vel;

    if (mode === 'isometric') {
      const k = keysRef.current;
      const mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      const mz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
      panRef.current.x += (mx + mz) * panSpeed * 0.7 * dt;
      panRef.current.z += (mz - mx) * panSpeed * 0.7 * dt;
      const zVal = panRef.current.zoom;
      dampVec3(smoothPos.current, panRef.current.x + zVal * 0.75, zVal * 0.9, panRef.current.z + zVal * 0.75, posVel.current, 0.16, 0.16, 0.16, dt);
      camera.position.copy(smoothPos.current);
      camera.lookAt(panRef.current.x, 0, panRef.current.z);
      return;
    }

    if (mode === 'first_person') {
      camera.position.set(p.x, p.y + 1.35, p.z);
      const { yaw, pitch } = lookRef.current;
      camera.lookAt(p.x - Math.sin(yaw) * Math.cos(pitch) * 6, p.y + 1.35 + Math.sin(pitch) * 6, p.z - Math.cos(yaw) * Math.cos(pitch) * 6);
      return;
    }

    if (mode === 'side_scroller') {
      DESIRED_POS.set(p.x + 1.5, p.y + 2.2, p.z + distance + 4);
      LOOK_ORIGIN.set(p.x + 1.5, p.y + 0.8, p.z);
    } else {
      const back = isRacer ? 8.2 : distance;
      const hOff = isRacer ? 4.0 : height;
      const tx = p.x + (isRacer ? Math.sin(motionBus.yaw) * back : v.x * 0.08);
      const tz = p.z + (isRacer ? Math.cos(motionBus.yaw) * back : back);
      DESIRED_POS.set(tx, p.y + hOff, tz);
      LOOK_ORIGIN.set(p.x + (isRacer ? -Math.sin(motionBus.yaw) * 4.5 : v.x * 0.14), p.y + 0.85, p.z + (isRacer ? -Math.cos(motionBus.yaw) * 4.5 : -2.6 + v.z * 0.1));
    }

    PIVOT_POS.set(p.x, p.y + 1.5, p.z);
    const { blocked } = avoidCameraCollision(raycaster.current, scene, PIVOT_POS, DESIRED_POS, Math.max(0.75, p.y + 0.4), camera);
    const camSmooth = blocked ? 0.05 : 0.12;
    dampVec3(smoothPos.current, DESIRED_POS.x, DESIRED_POS.y, DESIRED_POS.z, posVel.current, camSmooth, blocked ? 0.08 : 0.18, camSmooth, dt);
    camera.position.copy(smoothPos.current);

    const horizSpeed = Math.hypot(v.x, v.z);
    const idleWeight = 1 - THREE.MathUtils.clamp(horizSpeed / 3.0, 0, 1);
    const t = clock.elapsedTime;
    camera.position.x += (noise2D(t * 0.42, 1.3) - 0.5) * 0.08 * idleWeight;
    camera.position.y += (noise2D(t * 0.36, 7.9) - 0.5) * 0.06 * idleWeight;

    dampVec3(smoothLook.current, LOOK_ORIGIN.x, LOOK_ORIGIN.y, LOOK_ORIGIN.z, lookVel.current, 0.11, 0.13, 0.11, dt);
    camera.lookAt(smoothLook.current);

    const shakeAge = (performance.now() - shakeAt) / 1000;
    const storeTrauma = shakeAt > 0 && shakeAge < 0.45 ? 1 - shakeAge / 0.45 : 0;
    motionBus.trauma = Math.max(0, motionBus.trauma - dt * 2.2);
    const totalTrauma = Math.min(1, Math.max(motionBus.trauma, storeTrauma));
    if (totalTrauma > 0.01) {
      const sq = totalTrauma * totalTrauma;
      camera.rotation.x += (noise2D(t * 28, 3.1) - 0.5) * sq * 0.08 + Math.sin(t * 46) * sq * 0.025;
      camera.rotation.y += (noise2D(t * 26, 7.4) - 0.5) * sq * 0.08;
      camera.rotation.z += Math.cos(t * 38) * sq * 0.045;
    }

    const speedNorm = THREE.MathUtils.clamp((horizSpeed - 6) / 16, 0, 1);
    const baseFov = motionBus.targetFov ?? fov;
    const desiredFov = motionBus.targetFov != null ? baseFov : motionBus.isBoosting ? baseFov + 12 : baseFov + speedNorm * 10;
    const nextFov = smoothDamp(camera.fov, desiredFov, fovVel.current, 'fov', 0.18, dt);
    if (Math.abs(camera.fov - nextFov) > 0.03) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  });

  if (mode === 'orbit') {
    const p = resolveTarget(target);
    return <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={42} target={[p.x, p.y, p.z]} />;
  }
  return null;
}
