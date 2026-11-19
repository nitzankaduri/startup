import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { triggerAncestorDamage } from '../ai/entitySteering';
import { getFeelDelta } from '../gameFeel';

export { ExplosionBurst } from './ExplosionBurst';

const MAX_PROJ = 24;
const TMP_NEXT = new THREE.Vector3();
const TMP_DIR = new THREE.Vector3();

/** Fast physical projectile pool with emissive tracer tails and raycast hit detection. */
export const ProjectilePool = forwardRef(function ProjectilePool(
  { speed = 42, gravity = 0, damage = 34, color = '#E5B869', onHit },
  ref
) {
  const { scene, camera } = useThree();
  const groupRef = useRef(null);
  const meshRefs = useRef([]);
  const raycaster = useRef(new THREE.Raycaster());
  const pool = useMemo(
    () => Array.from({ length: MAX_PROJ }, () => ({ active: false, life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3() })),
    []
  );

  useImperativeHandle(ref, () => ({
    fire(origin, direction, customSpeed) {
      const slot = pool.find((p) => !p.active) || pool[0];
      slot.active = true;
      slot.life = 2.2;
      slot.pos.set(origin[0], origin[1], origin[2]);
      TMP_DIR.set(direction[0], direction[1], direction[2]).normalize();
      slot.vel.copy(TMP_DIR).multiplyScalar(customSpeed || speed);
    },
  }), [pool, speed]);

  useFrame((_, rawDelta) => {
    const dt = getFeelDelta(rawDelta);
    for (let i = 0; i < MAX_PROJ; i += 1) {
      const p = pool[i];
      const m = meshRefs.current[i];
      if (!m) continue;
      if (!p.active) { m.visible = false; continue; }

      p.life -= dt;
      if (p.life <= 0) { p.active = false; m.visible = false; continue; }

      p.vel.y -= gravity * dt;
      TMP_NEXT.copy(p.pos).addScaledVector(p.vel, dt);
      TMP_DIR.subVectors(TMP_NEXT, p.pos);
      const stepDist = TMP_DIR.length();
      if (stepDist > 0.001) {
        TMP_DIR.divideScalar(stepDist);
        raycaster.current.camera = camera;
        raycaster.current.set(p.pos, TMP_DIR);
        raycaster.current.near = 0;
        raycaster.current.far = stepDist + 0.15;
        const hits = raycaster.current.intersectObjects(scene.children, true);
        const hit = hits.find((h) => h.object?.isMesh && h.object.visible && !groupRef.current?.children.includes(h.object));
        if (hit) {
          p.active = false;
          m.visible = false;
          triggerAncestorDamage(hit.object, damage, p.vel);
          onHit?.({ point: hit.point.clone(), object: hit.object, velocity: p.vel.clone() });
          continue;
        }
      }
      p.pos.copy(TMP_NEXT);
      m.visible = true;
      m.position.copy(p.pos);
      m.lookAt(TMP_NEXT.copy(p.pos).add(p.vel));
    }
  });

  return (
    <group ref={groupRef}>
      {pool.map((_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }} visible={false}>
          <boxGeometry args={[0.09, 0.09, 0.85]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.65} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
});
