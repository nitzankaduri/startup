import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { avoidCameraCollision, dampVec3, resolveCameraTarget } from '../sdk/cameraMath';
import { motionBus, stepSpring } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';

const DESIRED = new THREE.Vector3();
const PIVOT = new THREE.Vector3();
const LOOK = new THREE.Vector3();

/**
 * Dynamic Subway Surfers spring-arm action camera with boost FOV kick,
 * gentle lane/turn banking, and bouncy micro-shake on coin combos & crashes.
 */
export function DynamicActionCamera({
  rig = 'three_lane_runner',
  target,
  targetRef,
  distance = 7.8,
  height = 3.8,
  baseFov = 62,
}) {
  const { camera, scene } = useThree();
  const hasStarted = useGameStore((s) => s.hasStarted);
  const shakeAt = useGameStore((s) => s.shakeAt);

  const smoothPos = useRef(new THREE.Vector3(0, 5.5, 9));
  const smoothLook = useRef(new THREE.Vector3(0, 1.2, -3));
  const posVel = useRef({ x: 0, y: 0, z: 0 });
  const lookVel = useRef({ x: 0, y: 0, z: 0 });
  const fovSpring = useRef({ value: baseFov, velocity: 0 });
  const bankSpring = useRef({ value: 0, velocity: 0 });
  const bounceSpring = useRef({ value: 0, velocity: 0 });
  const lastComboBounce = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const { pos: p } = resolveCameraTarget(target ?? targetRef, motionBus.pos);

    if (!hasStarted) {
      const sway = Math.sin(clock.elapsedTime * 0.55) * 0.65;
      dampVec3(smoothPos.current, p.x + sway, p.y + height, p.z + distance, posVel.current, 0.22, 0.22, 0.22, dt);
      camera.position.copy(smoothPos.current);
      camera.lookAt(p.x, p.y + 1.0, p.z - 2.5);
      return;
    }

    const v = motionBus.vel || { x: 0, y: 0, z: 0 };
    const headingFollow = rig === 'arcade_car' || rig === 'flight_combat';
    const isRunner = rig === 'three_lane_runner';
    const armDist = rig === 'arcade_car' ? Math.max(7.8, distance) : rig === 'flight_combat' ? Math.max(9.0, distance) : isRunner ? 4.9 : distance;
    const armH = isRunner ? 3.25 : height;

    const bx = headingFollow ? Math.sin(motionBus.yaw) * armDist : v.x * 0.08;
    const bz = headingFollow ? Math.cos(motionBus.yaw) * armDist : armDist;
    DESIRED.set(p.x + bx, p.y + armH, p.z + bz);
    LOOK.set(
      p.x + (headingFollow ? -Math.sin(motionBus.yaw) * 4.5 : v.x * 0.14),
      p.y + (rig === 'flight_combat' ? 0.5 : isRunner ? 1.35 : 1.05),
      p.z + (headingFollow ? -Math.cos(motionBus.yaw) * 4.5 : isRunner ? -8.5 : -3.2)
    );

    PIVOT.set(p.x, p.y + 1.3, p.z);
    const { blocked } = avoidCameraCollision(raycaster.current, scene, PIVOT, DESIRED, Math.max(0.7, p.y + 0.3), camera);
    const st = blocked ? 0.05 : 0.1;
    dampVec3(smoothPos.current, DESIRED.x, DESIRED.y, DESIRED.z, posVel.current, st, blocked ? 0.08 : 0.13, st, dt);
    dampVec3(smoothLook.current, LOOK.x, LOOK.y, LOOK.z, lookVel.current, 0.08, 0.1, 0.08, dt);

    const spd = Math.hypot(v.x, v.y, v.z);
    const kickFov = motionBus.isBoosting ? 11 : Math.min(10, Math.max(0, spd - 8) * 0.55);
    const nextFov = stepSpring(fovSpring.current, motionBus.targetFov ?? (baseFov + kickFov), 80, 14, dt);
    if (camera.isPerspectiveCamera && Math.abs(camera.fov - nextFov) > 0.04) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    const bankTarget = THREE.MathUtils.clamp((motionBus.steer || -v.x * 0.045) * 0.06, -0.075, 0.075);
    const bank = stepSpring(bankSpring.current, bankTarget, 92, 14, dt);

    if ((motionBus.comboBounceAt || 0) > lastComboBounce.current) {
      lastComboBounce.current = motionBus.comboBounceAt;
      bounceSpring.current.velocity += 2.2;
    }
    const comboHop = stepSpring(bounceSpring.current, 0, 180, 12, dt);

    camera.position.copy(smoothPos.current);
    camera.position.y += comboHop * 0.25;
    camera.lookAt(smoothLook.current);
    camera.rotation.z += bank;

    const age = (performance.now() - shakeAt) / 1000;
    const storeTrauma = shakeAt > 0 && age < 0.42 ? 1 - age / 0.42 : 0;
    motionBus.trauma = Math.max(0, motionBus.trauma - dt * 2.5);
    const trauma = Math.min(1, Math.max(motionBus.trauma, storeTrauma));
    if (trauma > 0.01) {
      const m = trauma * trauma * 0.3;
      const t = clock.elapsedTime * 48;
      camera.position.x += Math.sin(t) * m;
      camera.position.y += Math.cos(t * 1.3) * m * 0.8;
      camera.rotation.z += Math.sin(t * 1.6) * m * 0.16;
    }
  });

  return null;
}
