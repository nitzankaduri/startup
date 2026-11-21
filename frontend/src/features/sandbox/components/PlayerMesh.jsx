import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../sdk/spawnSdk';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';
import { useGameStore } from '../store/useGameStore';
import { CharacterModel } from './CharacterModel';
import { VehicleMesh } from './VehicleMesh';

const L = THREE.MathUtils.lerp;

export function PlayerMesh({ mode = 'platformer', color = '#FAFAFA', velRef, groundDistRef, telemetryRef }) {
  const gameState = useGameStore((s) => s.gameState);
  const yawRef = useRef(0);
  const refs = {
    visual: useRef(null), body: useRef(null), head: useRef(null), pack: useRef(null),
    scarf: useRef(null), lArm: useRef(null), lFore: useRef(null), rArm: useRef(null),
    rFore: useRef(null), lLeg: useRef(null), lKnee: useRef(null), rLeg: useRef(null),
    rKnee: useRef(null), dizzy: useRef(null), shadow: useRef(null), slideDust: useRef(null),
  };

  useFrame((state, delta) => {
    if (mode === 'time_trial_racer') return;
    const dt = Math.min(1, delta * 15);
    const t = state.clock.elapsedTime;
    const { vx, vz } = velRef.current;
    const speed = Math.hypot(vx, vz);

    if (refs.visual.current && speed > 0.35 && gameState === 'playing') {
      const targetYaw = Math.atan2(-vx, -vz);
      let diff = targetYaw - yawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      yawRef.current += diff * dt;
      refs.visual.current.rotation.y = yawRef.current;
    }

    const crashed = gameState === 'gameover';
    if (refs.dizzy.current) {
      refs.dizzy.current.visible = crashed;
      if (crashed) refs.dizzy.current.rotation.y = t * 5.2;
    }

    if (refs.slideDust.current) {
      const rolling = motionBus.isRolling && !crashed;
      refs.slideDust.current.visible = rolling;
      if (rolling) {
        refs.slideDust.current.children.forEach((m, i) => {
          const p = ((t * 5 + i * 0.2) % 1);
          m.position.z = 0.35 + p * 0.9;
          m.scale.setScalar(Math.max(0.05, 1 - p));
        });
      }
    }

    if (crashed) {
      if (refs.body.current) {
        refs.body.current.rotation.x = L(refs.body.current.rotation.x, -1.1, dt);
        refs.body.current.position.y = L(refs.body.current.position.y, -0.25, dt);
      }
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -0.9, dt);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -0.6, dt);
    } else if (motionBus.isRolling) {
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0, dt); refs.body.current.position.y = 0; }
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = L(refs.lLeg.current.rotation.x, -1.15, dt);
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = L(refs.rLeg.current.rotation.x, -1.15, dt);
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = L(refs.lKnee.current.rotation.x, 1.45, dt);
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = L(refs.rKnee.current.rotation.x, 1.45, dt);
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -0.8, dt);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -0.8, dt);
    } else if (!motionBus.isGrounded) {
      if (refs.body.current) refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0.12, dt);
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -2.15, dt);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -1.85, dt);
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = L(refs.lLeg.current.rotation.x, -0.95, dt);
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = L(refs.lKnee.current.rotation.x, 1.25, dt);
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = L(refs.rLeg.current.rotation.x, 0.45, dt);
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = L(refs.rKnee.current.rotation.x, 0.5, dt);
      if (refs.scarf.current) refs.scarf.current.rotation.x = L(refs.scarf.current.rotation.x, 0.8, dt);
    } else if (speed > 0.4) {
      const cyc = t * (8 + speed * 0.42);
      const sw = Math.sin(cyc) * Math.min(0.85, 0.3 + speed * 0.045);
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0.14, dt); refs.body.current.position.y = Math.abs(Math.sin(cyc)) * 0.04; }
      if (refs.head.current) refs.head.current.position.y = 0.46 + Math.sin(cyc * 2) * 0.025;
      if (refs.pack.current) refs.pack.current.position.y = 0.06 + Math.abs(Math.cos(cyc)) * 0.035;
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = sw;
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = -sw;
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = Math.max(0, -sw) * 1.1;
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = Math.max(0, sw) * 1.1;
      if (refs.lArm.current) refs.lArm.current.rotation.x = -sw * 0.9;
      if (refs.rArm.current) refs.rArm.current.rotation.x = sw * 0.9;
      if (refs.lFore.current) refs.lFore.current.rotation.x = -0.65;
      if (refs.rFore.current) refs.rFore.current.rotation.x = -0.65;
      if (refs.scarf.current) refs.scarf.current.rotation.x = 0.4 + Math.sin(cyc) * 0.16;
    } else {
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0, dt); refs.body.current.position.y = Math.sin(t * 2.6) * 0.02; }
      [refs.lLeg, refs.rLeg, refs.lKnee, refs.rKnee, refs.lArm, refs.rArm, refs.lFore, refs.rFore].forEach((r) => {
        if (r.current) r.current.rotation.x = L(r.current.rotation.x, 0, dt);
      });
      if (refs.scarf.current) refs.scarf.current.rotation.x = L(refs.scarf.current.rotation.x, 0.15, dt);
    }

    if (refs.shadow.current) {
      const dist = groundDistRef.current;
      const visible = dist !== null && dist < 9;
      refs.shadow.current.visible = visible;
      if (visible) {
        const k = Math.max(0, 1 - dist / 9);
        refs.shadow.current.position.y = -dist + 0.02;
        refs.shadow.current.scale.setScalar(0.38 + k * 0.62);
        refs.shadow.current.material.opacity = 0.4 * k;
      }
    }
  });

  if (mode === 'time_trial_racer') {
    return <SubwayToonGroup outline thickness={0.03} color="#1E1B4B"><VehicleMesh color={color} telemetryRef={telemetryRef} /></SubwayToonGroup>;
  }
  return <SubwayToonGroup outline thickness={0.03} color="#1E1B4B"><CharacterModel color={color} refs={refs} /></SubwayToonGroup>;
}
