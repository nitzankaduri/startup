import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { StylizedEntity } from '../assets/StylizedEntity';
import { emitJuice } from '../assets/JuiceFX';
import { motionBus } from '../sdk/motionBus';
import { registerRadarBlip, unregisterRadarBlip } from '../sdk/navigation/radarBus';

/** Live moving trains, patrolling/chasing guards, vehicles & bosses with real kinematic Rapier roof colliders. */
export function WorldDynamicActor({ ent, attackRef, onDefeated, onHitPlayer }) {
  const wrapRef = useRef(null);
  const isTrain = ent.behavior === 'moving_train' || ent.modelId === 'subway_train';
  const stRef = useRef({
    x: ent.position[0], y: ent.position[1], z: ent.position[2],
    hp: ent.hp || (ent.kind === 'boss' ? 160 : 45), lastHit: 0, lastHurt: 0, dead: false,
  });

  useEffect(() => {
    const type = ent.kind === 'boss' || ent.kind === 'enemy' ? 'enemy' : 'collectible';
    registerRadarBlip(ent.id, [stRef.current.x, stRef.current.y, stRef.current.z], type);
    return () => unregisterRadarBlip(ent.id);
  }, [ent.id, ent.kind]);

  useFrame(({ clock }, rawDelta) => {
    const s = stRef.current;
    if (s.dead) return;
    const dt = Math.min(0.05, rawDelta);
    const now = performance.now();
    const p = motionBus.pos;

    if (isTrain && ent.behavior === 'moving_train') {
      s.z += (ent.speed || 11) * dt;
      if (s.z > p.z + 24) s.z = p.z - 150;
      wrapRef.current?.position.set(s.x, s.y, s.z);
      if (Math.abs(p.x - s.x) < 1.35 && Math.abs(p.z - s.z) < 5.3 && p.y < s.y + 1.8 && now - s.lastHurt > 900) {
        s.lastHurt = now;
        onHitPlayer?.(25, [s.x, s.y + 1.2, s.z]);
      }
      return;
    }

    const grp = wrapRef.current;
    if (!grp) return;
    const dx = p.x - s.x; const dz = p.z - s.z; const dist = Math.hypot(dx, dz);
    const spd = ent.speed || (ent.kind === 'vehicle' ? 9 : 5.5);
    if (ent.behavior === 'chase' || ent.behavior === 'boss_ai') {
      if (dist > 1.8 && dist < 48) { s.x += (dx / dist) * spd * dt; s.z += (dz / dist) * spd * dt; grp.rotation.y = Math.atan2(dx, dz); }
    } else if (ent.kind === 'enemy' || ent.kind === 'boss' || ent.kind === 'vehicle') {
      const rad = ent.patrolRadius || 10; const t = clock.elapsedTime * (spd * 0.1) + ent.position[0];
      s.x = ent.position[0] + Math.sin(t) * rad;
      s.z = ent.position[2] + Math.cos(t) * (ent.behavior === 'lane_traffic' ? rad * 1.6 : rad * 0.5);
    }
    grp.position.set(s.x, s.y, s.z);
    registerRadarBlip(ent.id, [s.x, s.y, s.z], 'enemy');

    if (attackRef.current > s.lastHit && dist < 8.5) {
      s.lastHit = attackRef.current; s.hp -= 35;
      emitJuice({ kind: 'spark', position: [s.x, s.y + 1, s.z], count: 10 });
      if (s.hp <= 0) {
        s.dead = true; grp.visible = false;
        emitJuice({ kind: 'explosion', position: [s.x, s.y + 1, s.z], count: 24 });
        unregisterRadarBlip(ent.id); onDefeated?.(ent); return;
      }
    }
    if ((ent.kind === 'enemy' || ent.kind === 'boss') && dist < 1.9 && now - s.lastHurt > 900) {
      s.lastHurt = now; onHitPlayer?.(ent.kind === 'boss' ? 18 : 10, [s.x, s.y + 1, s.z]);
    }
  });

  return (
    <group ref={wrapRef} position={ent.position} rotation={ent.rotation}>
      <StylizedEntity
        name={ent.modelId} position={[0, 0, 0]}
        scale={(ent.scale || 1) * (ent.kind === 'boss' ? 1.85 : 1)}
        color={ent.color || '#D96B27'} physics={false}
      />
    </group>
  );
}
