import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SmartModel } from '../assets/SmartModel';
import { CharacterModel } from '../components/CharacterModel';
import { isPowerupActive, motionBus } from '../sdk/motionBus';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';
import { ArcadeCarVisual } from '../sdk/vehicles/ArcadeCarVisual';
import { VehicleHeadlights } from '../sdk/vehicles/VehicleHeadlights';

const L = THREE.MathUtils.lerp;

/** Grounded blob shadow projected directly beneath player onto terrain/floor, scaling with jump height. */
export function GroundedBlobShadow({ shadowRef }) {
  return (
    <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <circleGeometry args={[0.85, 24]} />
      <meshBasicMaterial color="#1E1B4B" transparent opacity={0.38} depthWrite={false} />
    </mesh>
  );
}

/**
 * Expressive Subway Surfers cartoon character/vehicle/ship visual rig with
 * squash-and-stretch springs, limb/hoverboard bobbing, bumpy suspension, and #1E1B4B outlines.
 */
export function CartoonVisualMesh({ rig, color = '#D96B27', animRef, carFxRef, nitroRef, visualGroupRef }) {
  const squashRef = useRef(null);
  const hoverRef = useRef(null);
  const sqState = useRef({ y: 1, vel: 0, lastJump: 0, lastLand: 0, wasGrounded: true });
  const charRefs = useRef({
    visual: useRef(null), body: useRef(null), head: useRef(null), pack: useRef(null),
    scarf: useRef(null), lArm: useRef(null), lFore: useRef(null), rArm: useRef(null),
    rFore: useRef(null), lLeg: useRef(null), lKnee: useRef(null), rLeg: useRef(null),
    rKnee: useRef(null), dizzy: useRef(null), shadow: useRef(null), slideDust: useRef(null),
  }).current;

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = clock.elapsedTime;
    const fx = animRef.current;
    const sq = sqState.current;
    if (charRefs.shadow.current) charRefs.shadow.current.visible = false;

    if (motionBus.jumpAt > sq.lastJump) { sq.lastJump = motionBus.jumpAt; sq.y = 1.32; sq.vel = 0; }
    if (motionBus.landAt > sq.lastLand) { sq.lastLand = motionBus.landAt; sq.y = 0.68; sq.vel = 0; }
    const targetSy = fx.sliding ? 0.56 : 1.0;
    const force = (targetSy - sq.y) * 140;
    sq.vel = (sq.vel + force * dt) * Math.max(0, 1 - 14 * dt);
    sq.y = THREE.MathUtils.clamp(sq.y + sq.vel * dt, 0.45, 1.45);
    const inv = 1 / Math.sqrt(Math.max(0.4, sq.y));
    squashRef.current?.scale.set(inv, sq.y, inv);

    if (rig === 'arcade_car') {
      const spd = Math.hypot(motionBus.vel?.x || 0, motionBus.vel?.z || 0);
      if (squashRef.current) squashRef.current.position.y = Math.sin(t * 18) * Math.min(0.045, spd * 0.002);
      return;
    }
    if (rig === 'flight_combat') return;

    const onBoard = isPowerupActive('hoverboard') && !fx.sliding;
    if (hoverRef.current) {
      hoverRef.current.visible = onBoard;
      if (onBoard) hoverRef.current.position.y = -0.68 + Math.sin(t * 9) * 0.06;
    }

    const spd = Math.hypot(motionBus.vel?.x || 0, motionBus.vel?.z || 0);
    const k = Math.min(1, dt * 16);
    if (fx.sliding) {
      if (charRefs.body.current) { charRefs.body.current.rotation.x = L(charRefs.body.current.rotation.x, -0.55, k); }
      if (charRefs.lLeg.current) charRefs.lLeg.current.rotation.x = L(charRefs.lLeg.current.rotation.x, -1.25, k);
      if (charRefs.rLeg.current) charRefs.rLeg.current.rotation.x = L(charRefs.rLeg.current.rotation.x, -1.25, k);
    } else if (!fx.grounded) {
      if (charRefs.lArm.current) charRefs.lArm.current.rotation.x = L(charRefs.lArm.current.rotation.x, -2.1, k);
      if (charRefs.rArm.current) charRefs.rArm.current.rotation.x = L(charRefs.rArm.current.rotation.x, -1.9, k);
      if (charRefs.lLeg.current) charRefs.lLeg.current.rotation.x = L(charRefs.lLeg.current.rotation.x, -0.85, k);
      if (charRefs.rLeg.current) charRefs.rLeg.current.rotation.x = L(charRefs.rLeg.current.rotation.x, 0.45, k);
    } else if (onBoard) {
      if (charRefs.body.current) charRefs.body.current.position.y = Math.sin(t * 9) * 0.06;
      if (charRefs.lArm.current) charRefs.lArm.current.rotation.z = L(charRefs.lArm.current.rotation.z, 0.65, k);
      if (charRefs.rArm.current) charRefs.rArm.current.rotation.z = L(charRefs.rArm.current.rotation.z, -0.65, k);
    } else if (spd > 0.4) {
      const cyc = t * (9 + spd * 0.45);
      const sw = Math.sin(cyc) * Math.min(0.95, 0.35 + spd * 0.045);
      if (charRefs.body.current) { charRefs.body.current.rotation.x = L(charRefs.body.current.rotation.x, 0.18, k); charRefs.body.current.position.y = Math.abs(Math.sin(cyc)) * 0.06; }
      if (charRefs.lLeg.current) charRefs.lLeg.current.rotation.x = sw;
      if (charRefs.rLeg.current) charRefs.rLeg.current.rotation.x = -sw;
      if (charRefs.lKnee.current) charRefs.lKnee.current.rotation.x = Math.max(0, -sw) * 1.15;
      if (charRefs.rKnee.current) charRefs.rKnee.current.rotation.x = Math.max(0, sw) * 1.15;
      if (charRefs.lArm.current) charRefs.lArm.current.rotation.x = -sw * 0.95;
      if (charRefs.rArm.current) charRefs.rArm.current.rotation.x = sw * 0.95;
      if (charRefs.scarf.current) charRefs.scarf.current.rotation.x = 0.45 + Math.sin(cyc) * 0.2;
    } else {
      [charRefs.lLeg, charRefs.rLeg, charRefs.lArm, charRefs.rArm].forEach((r) => { if (r.current) r.current.rotation.x = L(r.current.rotation.x, 0, k); });
      if (charRefs.body.current) { charRefs.body.current.rotation.x = L(charRefs.body.current.rotation.x, 0, k); charRefs.body.current.position.y = Math.sin(t * 3) * 0.03; }
    }
  });

  return (
    <group ref={visualGroupRef}>
      <group ref={squashRef}>
        <SubwayToonGroup outline thickness={0.03} color="#1E1B4B">
          {rig === 'arcade_car' ? (
            <ArcadeCarVisual color={color} telemetryRef={carFxRef} />
          ) : rig === 'flight_combat' ? (
            <SmartModel name="spaceship" physics={false} color={color} />
          ) : (
            <group>
              <CharacterModel color={color} refs={charRefs} />
              <group ref={hoverRef} visible={false} position={[0, -0.68, 0]}>
                <mesh castShadow><boxGeometry args={[0.56, 0.08, 1.45]} /><meshStandardMaterial color="#D96B27" /></mesh>
                <mesh position={[0, -0.02, 0.72]}><sphereGeometry args={[0.14, 10, 10]} /><meshBasicMaterial color="#FBBF24" /></mesh>
              </group>
            </group>
          )}
        </SubwayToonGroup>
      </group>
      {rig === 'arcade_car' && <VehicleHeadlights nitroRef={nitroRef} />}
    </group>
  );
}
