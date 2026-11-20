import { forwardRef, useEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePbrMaterial } from '../pbrMaterials';
import { resolveMovement } from '../runtime/useArenaPhysics';
import { SmokeTrail } from '../SmokeTrail';
import { motionBus, stepSpring } from '../motionBus';
import { useGameInput } from '../useGameInput';
import { SkidMarks } from './SkidMarks';
import { VehicleHeadlights } from './VehicleHeadlights';

/** Arcade-sim wheeled vehicle with lateral grip vs drift slip, body roll/pitch suspension, rotating wheels & skid marks. */
export const DrivableVehicle = forwardRef(function DrivableVehicle(
  { position = [0, 0, 0], color = '#D96B27', maxSpeed = 24, accel = 22, onTelemetry, onCollide, children },
  fwdRef
) {
  const { isPressed } = useGameInput();
  const rootRef = useRef(null);
  const bindRoot = (el) => { rootRef.current = el; if (typeof fwdRef === 'function') fwdRef(el); else if (fwdRef) fwdRef.current = el; };
  const bodyRef = useRef(null);
  const wheelRefs = useRef([]);
  const steerRefs = useRef([]);
  const brakeMatRef = useRef(null);
  const driftRef = useRef({ active: false, x: position[0], z: position[2], yaw: 0 });
  const smokeActiveRef = useRef(false);
  const nitroRef = useRef(false);
  const sim = useRef({ x: position[0], y: position[1], z: position[2], vx: 0, vy: 0, vz: 0, yaw: 0, wheelRot: 0, prevSpd: 0 });
  const roll = useRef({ value: 0, velocity: 0 });
  const pitch = useRef({ value: 0, velocity: 0 });
  const paintMat = usePbrMaterial({ surface: 'automotive_paint', color });
  const glassMat = usePbrMaterial({ surface: 'architectural_glass', color: '#DCE8F0' });
  useEffect(() => { rootRef.current?.position.set(position[0], position[1], position[2]); }, []);

  useFrame((_, rawDelta) => {
    const gs = useGameStore.getState();
    if (!gs.hasStarted || gs.gameState !== 'playing' || useSettingsStore.getState().isPaused) return;
    const dt = Math.min(0.05, Math.max(0.001, rawDelta));
    const s = sim.current;
    const throttle = (isPressed('KeyW') || isPressed('ArrowUp') ? 1 : 0) - (isPressed('KeyS') || isPressed('ArrowDown') ? 1 : 0);
    const steerIn = (isPressed('KeyA') || isPressed('ArrowLeft') ? 1 : 0) - (isPressed('KeyD') || isPressed('ArrowRight') ? 1 : 0);
    const drifting = Boolean(isPressed('Space'));
    const nitro = Boolean(isPressed('ShiftLeft') || isPressed('ShiftRight'));
    nitroRef.current = nitro;
    const fwdX = -Math.sin(s.yaw); const fwdZ = -Math.cos(s.yaw);
    const rightX = Math.cos(s.yaw); const rightZ = -Math.sin(s.yaw);
    let fwdSpeed = s.vx * fwdX + s.vz * fwdZ; let latSpeed = s.vx * rightX + s.vz * rightZ;
    const topSpd = maxSpeed * (nitro ? 1.45 : 1);
    const power = accel * (nitro ? 1.55 : throttle < 0 ? 1.25 : 1);
    fwdSpeed = THREE.MathUtils.clamp((fwdSpeed + throttle * power * dt) * Math.exp(-(throttle === 0 ? 1.8 : 0.65) * dt), -maxSpeed * 0.45, topSpd);

    const speedFactor = Math.max(0.45, THREE.MathUtils.clamp(Math.abs(fwdSpeed) / 5.5, 0, 1));
    const steerRate = (drifting ? 2.8 : 2.15) * speedFactor * (fwdSpeed >= -0.2 ? 1 : -1);
    s.yaw += steerIn * steerRate * dt;

    latSpeed *= Math.exp(-(drifting ? 2.2 : 9.2) * dt);
    const nfX = -Math.sin(s.yaw); const nfZ = -Math.cos(s.yaw);
    const nrX = Math.cos(s.yaw); const nrZ = -Math.sin(s.yaw);
    const col = resolveMovement({ x: s.x + (nfX * fwdSpeed + nrX * latSpeed) * dt, y: s.y, z: s.z + (nfZ * fwdSpeed + nrZ * latSpeed) * dt }, 1.25, { x: nfX * fwdSpeed + nrX * latSpeed, y: 0, z: nfZ * fwdSpeed + nrZ * latSpeed }, onCollide);
    s.x = col.x; s.z = col.z; s.vx = col.vx; s.vz = col.vz;
    s.wheelRot -= fwdSpeed * dt * 2.1;

    const longAccel = (fwdSpeed - s.prevSpd) / dt;
    s.prevSpd = fwdSpeed;
    soundEngine.updateMotionAudio(Math.abs(fwdSpeed), true, true);
    const rz = stepSpring(roll.current, -steerIn * speedFactor * (drifting ? 0.19 : 0.12), 180, 15, dt);
    const rx = stepSpring(pitch.current, THREE.MathUtils.clamp(-longAccel * 0.006, -0.09, 0.11), 170, 14, dt);
    if (rootRef.current) { rootRef.current.position.set(s.x, s.y, s.z); rootRef.current.rotation.set(0, s.yaw, 0); }
    if (bodyRef.current) bodyRef.current.rotation.set(rx, 0, rz);
    steerRefs.current.forEach((el) => { if (el) el.rotation.y = steerIn * 0.42; });
    wheelRefs.current.forEach((el) => { if (el) el.rotation.x = s.wheelRot; });
    if (brakeMatRef.current) brakeMatRef.current.emissiveIntensity = throttle < 0 || drifting ? 2.5 : 0.45;
    motionBus.pos = { x: s.x, y: s.y + 0.8, z: s.z }; motionBus.vel = { x: s.vx, y: s.vy, z: s.vz };
    motionBus.yaw = s.yaw; motionBus.steer = steerIn; motionBus.isGrounded = true;
    motionBus.isBoosting = nitro || (drifting && Math.abs(fwdSpeed) > 6);
    const isSkid = (drifting && Math.abs(fwdSpeed) > 4.5) || Math.abs(latSpeed) > 3.0;
    driftRef.current = { active: isSkid, x: s.x, z: s.z, yaw: s.yaw };
    smokeActiveRef.current = isSkid || nitro;
    onTelemetry?.({ speedKmh: Math.round(Math.abs(fwdSpeed) * 4.2), isDrifting: isSkid, x: s.x, z: s.z, yaw: s.yaw });
  });

  const wheelPos = [[-0.82, 0.34, -0.95], [0.82, 0.34, -0.95], [-0.82, 0.34, 0.95], [0.82, 0.34, 0.95]];
  return (
    <>
      <group ref={bindRoot}>
        <group ref={bodyRef}>
          {children || (
            <>
              <RoundedBox args={[1.55, 0.48, 2.7]} radius={0.1} smoothness={3} position={[0, 0.56, 0]} castShadow receiveShadow><meshPhysicalMaterial {...paintMat} /></RoundedBox>
              <RoundedBox args={[1.25, 0.42, 1.3]} radius={0.09} smoothness={3} position={[0, 0.96, 0.15]} castShadow><meshPhysicalMaterial {...glassMat} /></RoundedBox>
              {[-0.52, 0.52].map((hx, i) => (
                <mesh key={`h-${i}`} position={[hx, 0.58, -1.36]}><boxGeometry args={[0.26, 0.12, 0.04]} /><meshStandardMaterial color="#FFF3E0" emissive="#FFF3E0" emissiveIntensity={1.6} toneMapped={false} /></mesh>
              ))}
              {[-0.52, 0.52].map((bx, i) => (
                <mesh key={`b-${i}`} position={[bx, 0.62, 1.36]}><boxGeometry args={[0.28, 0.12, 0.04]} /><meshStandardMaterial ref={i === 0 ? brakeMatRef : undefined} color="#DC2626" emissive="#DC2626" emissiveIntensity={0.45} toneMapped={false} /></mesh>
              ))}
            </>
          )}
        </group>
        {wheelPos.map(([wx, wy, wz], i) => (
          <group key={i} position={[wx, wy, wz]} ref={(el) => { if (i < 2) steerRefs.current[i] = el; }}>
            <group ref={(el) => { wheelRefs.current[i] = el; }} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow><cylinderGeometry args={[0.34, 0.34, 0.24, 18]} /><meshStandardMaterial color="#181715" roughness={0.86} /></mesh>
              <mesh><cylinderGeometry args={[0.2, 0.2, 0.25, 12]} /><meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.8} /></mesh>
            </group>
          </group>
        ))}
        <VehicleHeadlights nitroRef={nitroRef} zFront={-1.36} zRear={1.36} />
      </group>
      <SmokeTrail activeRef={smokeActiveRef} color="#D8D0C4" baseSize={0.45} maxSize={2.1} />
      <SkidMarks driftRef={driftRef} />
    </>
  );
});
