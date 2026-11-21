import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { avoidCameraCollision, dampVec3, resolveCameraTarget } from '../sdk/cameraMath';
import { motionBus, stepSpring } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';

const DESIRED_POS = new THREE.Vector3();
const PIVOT_POS = new THREE.Vector3();
const LOOK_TARGET = new THREE.Vector3();

/**
 * Smooth spring-arm follow camera with velocity FOV punch, corner roll tilt,
 * raycast wall push-in, and trauma-decayed micro camera-shake on collisions.
 */
export function ChaseCameraRig({
  rig = 'third_person_action',
  target,
  targetRef,
  distance = 8.2,
  height = 3.8,
  baseFov = 60,
  followHeading = false,
}) {
  const { camera, scene } = useThree();
  const hasStarted = useGameStore((s) => s.hasStarted);
  const shakeAt = useGameStore((s) => s.shakeAt);

  const smoothPos = useRef(new THREE.Vector3(0, 6, 10));
  const smoothLook = useRef(new THREE.Vector3(0, 1, -2));
  const posVel = useRef({ x: 0, y: 0, z: 0 });
  const lookVel = useRef({ x: 0, y: 0, z: 0 });
  const fovSpring = useRef({ value: baseFov, velocity: 0 });
  const tiltSpring = useRef({ value: 0, velocity: 0 });
  const raycaster = useRef(new THREE.Raycaster());

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const { pos: p } = resolveCameraTarget(target ?? targetRef, motionBus.pos);

    if (!hasStarted) {
      const swayX = Math.sin(clock.elapsedTime * 0.45) * 0.7;
      dampVec3(smoothPos.current, p.x + swayX, p.y + height, p.z + distance, posVel.current, 0.24, 0.24, 0.24, dt);
      camera.position.copy(smoothPos.current);
      camera.lookAt(p.x, p.y + 0.9, p.z - 2);
      return;
    }

    const v = motionBus.vel || { x: 0, y: 0, z: 0 };
    const headingFollow = followHeading || rig === 'arcade_car' || rig === 'flight_combat';
    const armDist = rig === 'arcade_car' ? Math.max(7.8, distance) : rig === 'flight_combat' ? Math.max(9.2, distance) : distance;
    const armHeight = rig === 'three_lane_runner' ? 3.5 : height;

    const backX = headingFollow ? Math.sin(motionBus.yaw) * armDist : v.x * 0.06;
    const backZ = headingFollow ? Math.cos(motionBus.yaw) * armDist : armDist;
    DESIRED_POS.set(p.x + backX, p.y + armHeight, p.z + backZ);
    LOOK_TARGET.set(
      p.x + (headingFollow ? -Math.sin(motionBus.yaw) * 4.2 : v.x * 0.12),
      p.y + (rig === 'flight_combat' ? 0.4 : 0.9),
      p.z + (headingFollow ? -Math.cos(motionBus.yaw) * 4.2 : -2.6 + v.z * 0.08)
    );

    PIVOT_POS.set(p.x, p.y + 1.35, p.z);
    const { blocked } = avoidCameraCollision(raycaster.current, scene, PIVOT_POS, DESIRED_POS, Math.max(0.65, p.y + 0.35), camera);
    const smoothTime = blocked ? 0.05 : 0.11;
    dampVec3(smoothPos.current, DESIRED_POS.x, DESIRED_POS.y, DESIRED_POS.z, posVel.current, smoothTime, blocked ? 0.08 : 0.14, smoothTime, dt);
    dampVec3(smoothLook.current, LOOK_TARGET.x, LOOK_TARGET.y, LOOK_TARGET.z, lookVel.current, 0.09, 0.11, 0.09, dt);

    const speedMag = Math.hypot(v.x, v.y, v.z);
    const boostFov = motionBus.isBoosting ? 7.5 : 0;
    const targetFov = motionBus.targetFov ?? (baseFov + Math.min(16, speedMag * 0.42 + boostFov));
    const nextFov = stepSpring(fovSpring.current, targetFov, 72, 14, dt);
    if (camera.isPerspectiveCamera && Math.abs(camera.fov - nextFov) > 0.05) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    const cornerInput = THREE.MathUtils.clamp(-(motionBus.steer || v.x * 0.04) * 0.048, -0.068, 0.068);
    const rollTilt = stepSpring(tiltSpring.current, cornerInput, 88, 15, dt);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
    camera.rotation.z += rollTilt;

    const shakeAge = (performance.now() - shakeAt) / 1000;
    const storeTrauma = shakeAt > 0 && shakeAge < 0.42 ? 1 - shakeAge / 0.42 : 0;
    motionBus.trauma = Math.max(0, motionBus.trauma - dt * 2.4);
    const t = Math.min(1, Math.max(motionBus.trauma, storeTrauma));
    if (t > 0.01) {
      const mag = t * t * 0.28;
      const elapsed = clock.elapsedTime * 46;
      camera.position.x += Math.sin(elapsed) * mag;
      camera.position.y += Math.cos(elapsed * 1.27) * mag * 0.75;
      camera.rotation.z += Math.sin(elapsed * 1.55) * mag * 0.14;
    }
  });

  return null;
}
