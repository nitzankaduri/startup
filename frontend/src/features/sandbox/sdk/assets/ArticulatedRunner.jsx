import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { CharacterModel } from '../../components/CharacterModel';
import { motionBus } from '../motionBus';

const L = THREE.MathUtils.lerp;

/** Subway-Surfers articulated 3D character: IK stride, banking tilt, squash/stretch, head turn, slide dust & foley. */
export function ArticulatedRunner({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.25,
  color = '#58B947',
  animationState = 'Run',
  steer = 0,
  speed = 15,
  isGrounded = true,
  isRolling = false,
  crashed = false,
}) {
  const rootRef = useRef(null);
  const prevAirRef = useRef(false);
  const prevXRef = useRef(0);
  const squashRef = useRef({ sy: 1, sxz: 1 });
  const refs = {
    visual: useRef(null), body: useRef(null), head: useRef(null), pack: useRef(null),
    scarf: useRef(null), lArm: useRef(null), lFore: useRef(null), rArm: useRef(null),
    rFore: useRef(null), lLeg: useRef(null), lKnee: useRef(null), rLeg: useRef(null),
    rKnee: useRef(null), dizzy: useRef(null), shadow: useRef(null), slideDust: useRef(null),
  };

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const k = Math.min(1, dt * 16);
    const t = state.clock.elapsedTime;
    const anim = String(animationState || 'Run').toLowerCase();
    const sliding = isRolling || anim === 'slide' || anim === 'roll' || motionBus.isRolling;
    const airborne = !isGrounded || anim === 'jump';
    const dead = crashed || anim === 'crash' || anim === 'dead';
    const spd = anim === 'idle' ? 0 : Math.max(speed, Math.hypot(motionBus.vel.x || 0, motionBus.vel.z || 0));

    // Jump launch stretch & landing squash + foley
    if (airborne && !prevAirRef.current) {
      squashRef.current = { sy: 1.24, sxz: 0.86 };
      soundEngine.playJump();
    } else if (!airborne && prevAirRef.current) {
      squashRef.current = { sy: 0.78, sxz: 1.2 };
      soundEngine.playLandThump();
    }
    prevAirRef.current = airborne;
    squashRef.current.sy = L(squashRef.current.sy, sliding ? 0.56 : 1, Math.min(1, dt * 12));
    squashRef.current.sxz = L(squashRef.current.sxz, sliding ? 1.18 : 1, Math.min(1, dt * 12));

    // Auto-detect lateral lane velocity for snappy banking & head look-into-turn
    const worldX = motionBus.pos.x || 0;
    const latVel = (worldX - prevXRef.current) / Math.max(0.008, dt);
    prevXRef.current = worldX;
    const effSteer = steer || THREE.MathUtils.clamp(latVel * 0.14, -1.2, 1.2);
    const bank = THREE.MathUtils.clamp(-effSteer * 0.34, -0.42, 0.42);
    motionBus.steer = effSteer;

    if (refs.visual.current) {
      refs.visual.current.rotation.z = L(refs.visual.current.rotation.z, bank, k);
      refs.visual.current.rotation.y = L(refs.visual.current.rotation.y, -effSteer * 0.22, k);
      refs.visual.current.scale.set(squashRef.current.sxz, squashRef.current.sy, squashRef.current.sxz);
      refs.visual.current.position.y = L(refs.visual.current.position.y, sliding ? -0.26 : 0, k);
    }
    if (refs.head.current) refs.head.current.rotation.y = L(refs.head.current.rotation.y, -effSteer * 0.28, k);

    if (refs.dizzy.current) {
      refs.dizzy.current.visible = dead;
      if (dead) refs.dizzy.current.rotation.y = t * 5.6;
    }
    if (refs.slideDust.current) {
      refs.slideDust.current.visible = sliding && !dead;
      if (sliding && !dead) {
        refs.slideDust.current.children.forEach((m, i) => {
          const p = (t * 5.4 + i * 0.2) % 1;
          m.position.z = 0.35 + p * 0.95;
          m.scale.setScalar(Math.max(0.05, 1 - p));
        });
      }
    }

    if (dead) {
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, -1.1, k); refs.body.current.position.y = L(refs.body.current.position.y, -0.25, k); }
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -0.9, k);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -0.6, k);
    } else if (sliding) {
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0.42, k); refs.body.current.position.y = 0; }
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = L(refs.lLeg.current.rotation.x, -1.18, k);
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = L(refs.rLeg.current.rotation.x, -1.18, k);
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = L(refs.lKnee.current.rotation.x, 1.48, k);
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = L(refs.rKnee.current.rotation.x, 1.48, k);
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -0.85, k);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -0.85, k);
    } else if (airborne) {
      if (refs.body.current) refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0.18, k);
      if (refs.lArm.current) refs.lArm.current.rotation.x = L(refs.lArm.current.rotation.x, -2.25, k);
      if (refs.rArm.current) refs.rArm.current.rotation.x = L(refs.rArm.current.rotation.x, -1.95, k);
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = L(refs.lLeg.current.rotation.x, -1.0, k);
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = L(refs.lKnee.current.rotation.x, 1.35, k);
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = L(refs.rLeg.current.rotation.x, 0.5, k);
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = L(refs.rKnee.current.rotation.x, 0.55, k);
      if (refs.scarf.current) refs.scarf.current.rotation.x = L(refs.scarf.current.rotation.x, 0.9, k);
    } else if (spd > 0.4) {
      const cyc = t * (10.5 + Math.min(20, spd) * 0.48);
      const sw = Math.sin(cyc) * Math.min(1.05, 0.4 + spd * 0.045);
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0.2, k); refs.body.current.position.y = Math.abs(Math.sin(cyc)) * 0.075; }
      if (refs.head.current) refs.head.current.position.y = 0.46 + Math.sin(cyc * 2) * 0.032;
      if (refs.pack.current) refs.pack.current.position.y = 0.06 + Math.abs(Math.cos(cyc)) * 0.045;
      if (refs.lLeg.current) refs.lLeg.current.rotation.x = sw;
      if (refs.rLeg.current) refs.rLeg.current.rotation.x = -sw;
      if (refs.lKnee.current) refs.lKnee.current.rotation.x = Math.max(0, -sw) * 1.2;
      if (refs.rKnee.current) refs.rKnee.current.rotation.x = Math.max(0, sw) * 1.2;
      if (refs.lArm.current) refs.lArm.current.rotation.x = -sw * 1.0;
      if (refs.rArm.current) refs.rArm.current.rotation.x = sw * 1.0;
      if (refs.lFore.current) refs.lFore.current.rotation.x = -0.75;
      if (refs.rFore.current) refs.rFore.current.rotation.x = -0.75;
      if (refs.scarf.current) refs.scarf.current.rotation.x = 0.5 + Math.sin(cyc) * 0.22;
    } else {
      if (refs.body.current) { refs.body.current.rotation.x = L(refs.body.current.rotation.x, 0, k); refs.body.current.position.y = Math.sin(t * 2.6) * 0.02; }
      [refs.lLeg, refs.rLeg, refs.lKnee, refs.rKnee, refs.lArm, refs.rArm, refs.lFore, refs.rFore].forEach((r) => {
        if (r.current) r.current.rotation.x = L(r.current.rotation.x, 0, k);
      });
    }

    if (refs.shadow.current) {
      const alt = Math.max(0, motionBus.pos.y || 0);
      const fade = THREE.MathUtils.clamp(1 - alt / 6, 0.25, 1);
      refs.shadow.current.scale.setScalar(0.55 + fade * 0.45);
      refs.shadow.current.material.opacity = 0.36 * fade;
    }
  });

  const sNum = Array.isArray(scale) ? (Number(scale[1]) || 1.25) : (Number(scale) || 1.25);
  return (
    <group ref={rootRef} position={position} rotation={rotation}>
      <group position={[0, 0.72 * sNum, 0]} scale={scale}>
        <CharacterModel color={color} refs={refs} />
      </group>
    </group>
  );
}
