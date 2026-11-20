import { forwardRef, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceshipMesh } from '../assets/studioPropParts';
import { ArcadeCarVisual } from '../vehicles/ArcadeCarVisual';
import { SkidMarks } from '../vehicles/SkidMarks';
import { SkeletalActor } from '../assets/SkeletalActor';
import { useGameLoop } from '../gameFeel';
import { motionBus } from '../motionBus';
import { useGameInput } from '../useGameInput';
import { ProjectilePool } from '../vfx/CombatVFX';
import { SmokeTrail } from '../SmokeTrail';
import { stepArcadeVehicle, stepFlightShooter, stepThirdPersonAction } from './runtimeRigHelpers';
import { getTerrainHeight, resolveMovement } from './useArenaPhysics';

/** Deterministic plug-and-play PlayerController supporting 4 presets: third_person_action, arcade_vehicle, flight_shooter, tactical_isometric. */
export const PlayerController = forwardRef(function PlayerController({
  preset = 'third_person_action', model = 'hero', color = '#D96B27', position = [0, 0, 0],
  speed = 10, jumpForce = 12, maxSpeed = 26, boostSpeed = 34, scale = 1,
  onAttack, onAbility, onCollide, onTelemetry, children,
}, fwdRef) {
  const { camera } = useThree();
  const rootRef = useRef(null);
  const cursorRef = useRef(null);
  const projRef = useRef(null);
  const driftSmokeRef = useRef(false);
  const carFxRef = useRef({ fwdSpeed: 0, steer: 0, braking: false, nitro: false });
  const driftRef = useRef({ active: false, x: position[0], z: position[2], yaw: 0 });
  const [anim, setAnim] = useState('Idle');
  const waypointRef = useRef(null);

  const stRef = useRef({
    x: position[0], y: preset === 'flight_shooter' ? Math.max(8, position[1]) : position[1], z: position[2],
    vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, roll: 0, nitro: 100, spd: speed,
    lastGround: 0, jumpBuf: 0, prevJump: false, dashUntil: 0, lastDash: 0, prevDash: false,
    dashVx: 0, dashVz: 0, attackUntil: 0, lastAttack: 0, prevAtk: false, lastFire: 0, lastFlip: 0,
  });

  const input = useGameInput({
    onPointerDown: ({ groundPoint, button }) => {
      if (preset !== 'tactical_isometric' || !groundPoint) return;
      if (button === 0) waypointRef.current = { x: groundPoint.x, z: groundPoint.z };
      if (button === 2) onAbility?.([groundPoint.x, getTerrainHeight(groundPoint.x, groundPoint.z), groundPoint.z]);
    },
  });

  useEffect(() => {
    const s = stRef.current;
    rootRef.current?.position.set(s.x, s.y, s.z);
    motionBus.pos = { x: s.x, y: s.y, z: s.z };
  }, []);

  const bindRoot = (el) => {
    rootRef.current = el;
    if (el) el.userData = { ...el.userData, playerEntity: true, entityLabel: `Player (${preset.replace('_', ' ')})` };
    if (typeof fwdRef === 'function') fwdRef(el);
    else if (fwdRef) fwdRef.current = el;
  };

  const syncMotionBus = (st, vel, grounded, boosting) => {
    motionBus.pos = { x: st.x, y: st.y, z: st.z }; motionBus.vel = vel; motionBus.yaw = st.yaw;
    motionBus.isGrounded = grounded; motionBus.isBoosting = boosting;
  };

  useGameLoop((_, dt) => {
    const st = stRef.current; const now = performance.now();
    const activeSpeed = rootRef.current?.userData?.editSpeed ?? speed;

    if (preset === 'arcade_vehicle') {
      const car = stepArcadeVehicle({ st, input, maxSpeed, accel: 24, dt, now, onTelemetry, onCollide, syncMotionBus });
      driftSmokeRef.current = car.drifting || car.nitro;
      carFxRef.current = car; driftRef.current = { active: car.isSkid, x: st.x, z: st.z, yaw: st.yaw };
      rootRef.current?.position.set(st.x, st.y, st.z); rootRef.current?.rotation.set(0, st.yaw, st.roll);
      return;
    }

    if (preset === 'flight_shooter') {
      stepFlightShooter({ st, input, speed: Math.max(14, speed), boostSpeed, dt, now, projRef, onFire: onAttack, syncMotionBus });
      driftSmokeRef.current = motionBus.isBoosting;
      rootRef.current?.position.set(st.x, st.y, st.z);
      rootRef.current?.rotation.set(st.pitch, st.yaw, st.roll, 'YXZ');
      return;
    }

    if (preset === 'tactical_isometric') {
      const gp = input.getGroundPoint(st.y);
      if (gp && cursorRef.current) cursorRef.current.position.set(gp.x, getTerrainHeight(gp.x, gp.z) + 0.08, gp.z);
      const mx = (input.isPressed('KeyD') || input.isPressed('ArrowRight') ? 1 : 0) - (input.isPressed('KeyA') || input.isPressed('ArrowLeft') ? 1 : 0);
      const mz = (input.isPressed('KeyS') || input.isPressed('ArrowDown') ? 1 : 0) - (input.isPressed('KeyW') || input.isPressed('ArrowUp') ? 1 : 0);
      let vx = 0; let vz = 0;
      if (mx !== 0 || mz !== 0) {
        waypointRef.current = null;
        const len = Math.hypot(mx, mz);
        vx = (mx / len) * speed; vz = (mz / len) * speed;
      } else if (waypointRef.current) {
        const dx = waypointRef.current.x - st.x; const dz = waypointRef.current.z - st.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.35) { vx = (dx / dist) * speed; vz = (dz / dist) * speed; }
        else waypointRef.current = null;
      }
      if (Math.hypot(vx, vz) > 0.2) st.yaw = Math.atan2(vx, vz);
      if ((input.isPressed('KeyF') || input.isPressed('Space')) && gp && now - st.lastFire > 400) {
        st.lastFire = now;
        onAbility?.([gp.x, getTerrainHeight(gp.x, gp.z), gp.z]);
      }
      const res = resolveMovement({ x: st.x + vx * dt, y: st.y, z: st.z + vz * dt }, 0.65, { x: vx, y: 0, z: vz }, onCollide);
      st.x = res.x; st.y = res.groundY; st.z = res.z;
      syncMotionBus(st, { x: vx, y: 0, z: vz }, true, false);
      const nextA = Math.hypot(vx, vz) > 0.2 ? 'Run' : 'Idle';
      if (nextA !== anim) setAnim(nextA);
      rootRef.current?.position.set(st.x, st.y, st.z);
      rootRef.current?.rotation.set(0, st.yaw, 0);
      return;
    }

    const nextAnim = stepThirdPersonAction({ st, input, camera, speed: activeSpeed, jumpForce, dt, now, onAttack, onCollide, syncMotionBus });
    if (nextAnim !== anim) setAnim(nextAnim);
    rootRef.current?.position.set(st.x, st.y, st.z);
    rootRef.current?.rotation.set(0, st.yaw, 0);
  });

  return (
    <>
      <group ref={bindRoot} scale={scale}>
        {children || (
          preset === 'arcade_vehicle' ? <ArcadeCarVisual color={color} fxRef={carFxRef} />
            : preset === 'flight_shooter' ? <SpaceshipMesh color={color} /> : <SkeletalActor model={model} animationState={anim} />
        )}
      </group>
      {preset === 'arcade_vehicle' && <SkidMarks driftRef={driftRef} />}
      {(preset === 'arcade_vehicle' || preset === 'flight_shooter') && <SmokeTrail activeRef={driftSmokeRef} color="#E6DDD0" />}
      {preset === 'flight_shooter' && <ProjectilePool ref={projRef} speed={56} color="#E5B869" />}
      {preset === 'tactical_isometric' && (
        <mesh ref={cursorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[0.45, 0.62, 24]} />
          <meshBasicMaterial color="#D96B27" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
});
