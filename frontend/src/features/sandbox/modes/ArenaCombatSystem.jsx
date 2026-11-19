import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';
import { combatBus } from './combatBus';

const MAX_SHOTS = 16;

export function ArenaCombatSystem() {
  const groupRef = useRef(null);
  const shotsRef = useRef([]);
  const lastShotAt = useRef(0);
  const { camera } = useThree();
  const gameState = useGameStore((s) => s.gameState);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);

  const spawnShot = useCallback((dirX, dirZ) => {
    const now = performance.now();
    if (now - lastShotAt.current < 150) return;
    lastShotAt.current = now;

    const len = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / len;
    const nz = dirZ / len;
    const p = combatBus.playerPos;

    shotsRef.current.push({
      x: p.x + nx * 0.65,
      y: p.y + 0.18,
      z: p.z + nz * 0.65,
      vx: nx * 30,
      vz: nz * 30,
      nx,
      nz,
      life: 1.1,
    });
    if (shotsRef.current.length > MAX_SHOTS) shotsRef.current.shift();
    soundEngine.playShoot();
  }, []);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (gameState !== 'playing' || e.button !== 0 || e.target?.tagName !== 'CANVAS') return;
      const rect = e.target.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const p = combatBus.playerPos;
      plane.constant = -p.y;
      if (raycaster.ray.intersectPlane(plane, hitPoint)) {
        spawnShot(hitPoint.x - p.x, hitPoint.z - p.z);
      } else {
        spawnShot(combatBus.playerFacing.x, combatBus.playerFacing.z);
      }
    };

    const onKeyDown = (e) => {
      if (gameState !== 'playing' || e.code !== 'KeyF') return;
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      spawnShot(combatBus.playerFacing.x, combatBus.playerFacing.z);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [camera, gameState, hitPoint, plane, pointer, raycaster, spawnShot]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const next = [];
    for (const shot of shotsRef.current) {
      shot.x += shot.vx * delta;
      shot.z += shot.vz * delta;
      shot.life -= delta;

      let hit = false;
      for (const enemy of combatBus.enemies.values()) {
        const ex = enemy.pos[0];
        const ez = enemy.pos[2];
        if (Math.hypot(shot.x - ex, shot.z - ez) <= enemy.radius + 0.25) {
          enemy.onHit(35, { x: shot.nx, z: shot.nz });
          hit = true;
          break;
        }
      }
      if (!hit && shot.life > 0) next.push(shot);
    }
    shotsRef.current = next;

    for (let i = 0; i < MAX_SHOTS; i += 1) {
      const mesh = group.children[i];
      const s = shotsRef.current[i];
      if (!mesh) continue;
      mesh.visible = Boolean(s);
      if (s) {
        mesh.position.set(s.x, s.y, s.z);
        mesh.rotation.y = Math.atan2(-s.nx, -s.nz);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_SHOTS }).map((_, idx) => (
        <mesh key={idx} visible={false}>
          <boxGeometry args={[0.14, 0.14, 0.55]} />
          <meshStandardMaterial color="#FAFAFA" roughness={0.3} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
