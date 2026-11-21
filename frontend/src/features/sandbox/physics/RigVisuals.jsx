import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerMesh } from '../components/PlayerMesh';
import { SmartModel } from '../assets/SmartModel';
import { SmokeTrail } from '../sdk/SmokeTrail';
import { SubwayToonGroup } from '../sdk/ToonMaterialHelper';
import { ArcadeCarVisual } from '../sdk/vehicles/ArcadeCarVisual';
import { VehicleHeadlights } from '../sdk/vehicles/VehicleHeadlights';

const BOLT_COUNT = 24;

/** Pooled non-neon warm amber/terracotta twin laser or projectile bolts rendered in world space. */
export function RigProjectilePool({ shotsRef }) {
  const meshRefs = useRef([]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const list = shotsRef.current;
    for (let i = 0; i < BOLT_COUNT; i += 1) {
      const m = meshRefs.current[i];
      const shot = list[i];
      if (!m || !shot || !shot.alive) {
        if (m) m.visible = false;
        continue;
      }
      shot.age += dt;
      if (shot.age >= shot.life) {
        shot.alive = false;
        m.visible = false;
        continue;
      }
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.z += shot.vz * dt;
      m.visible = true;
      m.position.set(shot.x, shot.y, shot.z);
      m.quaternion.copy(shot.quat);
    }
  });

  return (
    <group>
      {Array.from({ length: BOLT_COUNT }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }} visible={false}>
          <boxGeometry args={[0.14, 0.14, 1.45]} />
          <meshStandardMaterial color="#F59E0B" emissive="#FFF3D6" emissiveIntensity={2.1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Shared helper to spawn a pooled bolt cleanly into shotsRef. */
export function pushRigShot(shotsRef, cursorRef, origin, dir, quat, speed = 78, life = 1.1) {
  const list = shotsRef.current;
  if (list.length < BOLT_COUNT) {
    while (list.length < BOLT_COUNT) list.push({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life, quat: new THREE.Quaternion() });
  }
  const idx = cursorRef.current % BOLT_COUNT;
  cursorRef.current += 1;
  const s = list[idx];
  s.alive = true; s.age = 0; s.life = life;
  s.x = origin[0]; s.y = origin[1]; s.z = origin[2];
  s.vx = dir[0] * speed; s.vy = dir[1] * speed; s.vz = dir[2] * speed;
  s.quat.copy(quat);
}

/** Visual mesh switcher across all 4 universal player rigs (zero neon). */
export function RigVisuals({ rig, color = '#D96B27', carFxRef, nitroRef, smokeRef, actionFxRef, visualGroupRef }) {
  const slashRef = useRef(null);

  useFrame(() => {
    const g = visualGroupRef.current;
    const fx = actionFxRef.current;
    if (!g) return;
    if (rig === 'three_lane_runner') {
      g.scale.set(fx.sliding ? 1.18 : 1, fx.sliding ? 0.52 : 1, fx.sliding ? 1.18 : 1);
      g.position.y = fx.sliding ? -0.32 : 0;
    }
    if (slashRef.current) {
      slashRef.current.visible = Boolean(fx.attacking);
      if (fx.attacking) slashRef.current.rotation.y += 0.35;
    }
  });

  if (rig === 'arcade_car') {
    return (
      <group ref={visualGroupRef}>
        <SubwayToonGroup outline thickness={0.03} color="#1E1B4B">
          <ArcadeCarVisual color={color} telemetryRef={carFxRef} />
        </SubwayToonGroup>
        <VehicleHeadlights nitroRef={nitroRef} />
        <SmokeTrail activeRef={smokeRef} color="#E6E2D8" baseSize={0.38} maxSize={1.5} />
      </group>
    );
  }

  if (rig === 'flight_combat') {
    return (
      <group ref={visualGroupRef}>
        <SmartModel name="spaceship" physics={false} color={color} />
        <SmokeTrail activeRef={smokeRef} color="#F59E0B" baseSize={0.28} maxSize={1.15} life={0.45} />
      </group>
    );
  }

  return (
    <group ref={visualGroupRef}>
      <PlayerMesh color={color} isMovingRef={{ current: true }} velRef={{ current: { vx: 0, vz: 0 } }} groundDistRef={{ current: 0 }} />
      {rig === 'third_person_action' && (
        <mesh ref={slashRef} visible={false} position={[0, 0.2, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.08, 6, 18, Math.PI * 1.15]} />
          <meshStandardMaterial color="#D96B27" emissive="#F59E0B" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}
      <SmokeTrail activeRef={smokeRef} color="#E6E2D8" baseSize={0.3} maxSize={1.1} />
    </group>
  );
}
