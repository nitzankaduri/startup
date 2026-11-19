import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { SkeletalActor } from '../assets/SkeletalActor';
import { getFeelDelta, spawnFloatingNumber, triggerHitStop } from '../gameFeel';
import { motionBus } from '../spawnSdk';
import { ExplosionBurst } from '../vfx/ExplosionBurst';
import { BEHAVIOR_DEFAULTS, computeAvoidanceSteer } from './entitySteering';

/** Autonomous state-machine AI actor with knockback, 0.12s hit-flash, floating damage numbers, and hit-stop. */
export const SmartEntity = forwardRef(function SmartEntity(
  { behavior = 'patrol_chase', model = 'hero', hp = 100, position = [0, 0, -12], waypoints = [], scale = 1, damage = 12, onAttack, onDefeat },
  ref
) {
  const { scene, camera } = useThree();
  const rootRef = useRef(null);
  const telegraphRef = useRef(null);
  const animRef = useRef('Idle');
  const raycaster = useRef(new THREE.Raycaster());
  const spec = BEHAVIOR_DEFAULTS[behavior] || BEHAVIOR_DEFAULTS.patrol_chase;
  const maxHp = hp;
  const [curHp, setCurHp] = useState(hp);
  const [anim, setAnim] = useState('Idle');
  const [hitFlashAt, setHitFlashAt] = useState(0);
  const [deadAt, setDeadAt] = useState(0);
  const [gone, setGone] = useState(false);

  const stRef = useRef({
    wpIdx: 0, attackPhase: 'none', timer: 0, cooldown: 0,
    pos: new THREE.Vector3(...position), yaw: 0, knockVel: new THREE.Vector3(),
    flank: behavior === 'patrol_chase' ? (Math.random() > 0.5 ? 1 : -1) : 0,
  });

  const route = useMemo(() => {
    if (waypoints.length) return waypoints;
    const [x, y, z] = position;
    return [[x - 3.5, y, z], [x, y, z + 3.5], [x + 3.5, y, z], [x, y, z - 3.5]];
  }, [waypoints, position]);

  const takeDamage = useCallback((amt = 25, impulse) => {
    if (deadAt > 0) return;
    const st = stRef.current;
    setHitFlashAt(performance.now());
    const dir = impulse?.lengthSq?.() > 0.001 ? impulse.clone().setY(0).normalize() : new THREE.Vector3(0, 0, -1);
    st.knockVel.copy(dir).multiplyScalar(amt >= 45 ? 9.5 : 6.2);
    triggerHitStop(amt >= 45 ? 55 : 38, 0.08);
    spawnFloatingNumber([st.pos.x, st.pos.y + 1.95, st.pos.z], `-${Math.round(amt)}`, amt >= 45 ? 'crit' : 'damage');

    setCurHp((prev) => {
      const next = Math.max(0, prev - amt);
      if (next <= 0) {
        setDeadAt(performance.now());
        st.knockVel.copy(dir).multiplyScalar(8.5).setY(2.2);
        spawnFloatingNumber([st.pos.x, st.pos.y + 2.3, st.pos.z], '+100', 'score');
      }
      return next;
    });
  }, [deadAt]);

  useImperativeHandle(ref, () => ({ takeDamage }), [takeDamage]);
  useEffect(() => { if (rootRef.current) rootRef.current.userData = { takeDamage, smartEntity: true }; }, [takeDamage]);

  useFrame((_, rawDelta) => {
    if (gone || !rootRef.current) return;
    const dt = getFeelDelta(rawDelta);
    const st = stRef.current;

    if (deadAt > 0) {
      if (telegraphRef.current) telegraphRef.current.visible = false;
      const age = (performance.now() - deadAt) / 1000;
      st.pos.addScaledVector(st.knockVel, dt);
      st.knockVel.multiplyScalar(Math.max(0, 1 - dt * 4));
      rootRef.current.position.copy(st.pos);
      rootRef.current.rotation.x = Math.min(Math.PI * 0.48, age * 3.4);
      if (age > 0.65) { setGone(true); onDefeat?.(); }
      return;
    }

    if (st.knockVel.lengthSq() > 0.01) {
      st.pos.x += st.knockVel.x * dt;
      st.pos.z += st.knockVel.z * dt;
      st.knockVel.multiplyScalar(Math.max(0, 1 - dt * 9));
    }

    const p = motionBus.pos;
    const distPlayer = Math.hypot(p.x - st.pos.x, p.z - st.pos.z);
    if (behavior === 'boss' || distPlayer < spec.detect) soundEngine.setCombatIntensity(true);
    st.cooldown = Math.max(0, st.cooldown - dt);

    if (st.attackPhase === 'windup') {
      st.timer += dt;
      const prog = Math.min(1, st.timer / spec.windup);
      if (telegraphRef.current) { telegraphRef.current.visible = true; telegraphRef.current.scale.setScalar(0.45 + prog * 0.55); }
      if (st.timer >= spec.windup) {
        st.attackPhase = 'none'; st.cooldown = spec.cooldown;
        if (telegraphRef.current) telegraphRef.current.visible = false;
        if (distPlayer <= spec.attack + 0.8) {
          if (onAttack) onAttack({ position: st.pos.clone(), damage, behavior });
          else useGameStore.getState().damagePlayer(damage);
        }
      }
      rootRef.current.position.copy(st.pos);
      return;
    }
    if (telegraphRef.current) telegraphRef.current.visible = false;

    let targetX = p.x; let targetZ = p.z; let moveSpd = spec.chaseSpeed; let nextAnim = 'Run';
    if (behavior === 'ranged_turret') { moveSpd = 0; nextAnim = 'Idle'; }
    else if (distPlayer > spec.detect && behavior === 'patrol_chase') {
      const wp = route[st.wpIdx % route.length];
      targetX = wp[0]; targetZ = wp[2]; moveSpd = spec.speed; nextAnim = 'Walk';
      if (Math.hypot(targetX - st.pos.x, targetZ - st.pos.z) < 0.9) st.wpIdx += 1;
    }

    const steer = computeAvoidanceSteer(raycaster.current, scene, rootRef.current, st.pos, targetX, targetZ, distPlayer < spec.detect ? st.flank : 0, camera);
    if (distPlayer <= spec.attack && st.cooldown <= 0) { st.attackPhase = 'windup'; st.timer = 0; nextAnim = 'Attack'; }
    else if (moveSpd > 0 && distPlayer > spec.attack * 0.8) { st.pos.x += steer.dx * moveSpd * dt; st.pos.z += steer.dz * moveSpd * dt; }

    const targetYaw = Math.atan2(steer.dx, steer.dz);
    const diff = Math.atan2(Math.sin(targetYaw - st.yaw), Math.cos(targetYaw - st.yaw));
    st.yaw += diff * Math.min(1, dt * 8);
    rootRef.current.position.copy(st.pos);
    rootRef.current.rotation.y = st.yaw;
    if (animRef.current !== nextAnim) { animRef.current = nextAnim; setAnim(nextAnim); }
  });

  const finalScale = scale * spec.scale;
  return (
    <>
      {!gone && (
        <group ref={rootRef} position={position}>
          <SkeletalActor model={model} animationState={anim} scale={finalScale} hitFlashAt={hitFlashAt} />
          <mesh ref={telegraphRef} visible={false} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[spec.attack * 0.55, spec.attack * 0.85, 24]} /><meshBasicMaterial color="#D96B27" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
          {curHp < maxHp && deadAt === 0 && (
            <Html position={[0, 2.25 * finalScale, 0]} center distanceFactor={12}>
              <div className="pointer-events-none w-16 h-2 rounded-full bg-[#181715]/85 border border-[#E6E2D8]/60 overflow-hidden p-[1px]"><div className="h-full rounded-full bg-[#D96B27] transition-all" style={{ width: `${(curHp / maxHp) * 100}%` }} /></div>
            </Html>
          )}
        </group>
      )}
      {deadAt > 0 && <ExplosionBurst active position={[stRef.current.pos.x, stRef.current.pos.y + 0.8, stRef.current.pos.z]} scale={0.75 * finalScale} />}
    </>
  );
});
