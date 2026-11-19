import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { combatBus } from '../../modes/combatBus';
import { useGameStore } from '../../store/useGameStore';
import { EnemyHPBar } from './EnemyHPBar';

export function TurretBot({ entity, onDefeated }) {
  const headRef = useRef(null);
  const shotsRef = useRef(null);
  const activeShots = useRef([]);
  const hpRef = useRef(135);
  const lastShotAt = useRef(0);

  const [hpRatio, setHpRatio] = useState(1);
  const [dead, setDead] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const gameState = useGameStore((s) => s.gameState);
  const damagePlayer = useGameStore((s) => s.damagePlayer);
  const registerKill = useGameStore((s) => s.registerKill);
  const triggerHitMarker = useGameStore((s) => s.triggerHitMarker);

  const pos = entity.position;
  const color = entity.color || '#991B1B';

  useEffect(() => {
    if (dead) {
      combatBus.enemies.delete(entity.id);
      return;
    }
    combatBus.enemies.set(entity.id, {
      id: entity.id,
      pos,
      radius: 0.9,
      onHit: (dmg) => {
        hpRef.current = Math.max(0, hpRef.current - dmg);
        setHpRatio(hpRef.current / 135);
        triggerHitMarker();
        soundEngine.playHit();
        setFlashing(true);
        setTimeout(() => setFlashing(false), 90);
        if (hpRef.current <= 0) {
          setDead(true);
          combatBus.enemies.delete(entity.id);
          registerKill();
          onDefeated?.(entity.id);
        }
      },
    });
    return () => combatBus.enemies.delete(entity.id);
  }, [dead, entity.id, onDefeated, pos, registerKill, triggerHitMarker]);

  useFrame((_, delta) => {
    if (dead || gameState !== 'playing') return;
    const p = combatBus.playerPos;
    const dx = p.x - pos[0];
    const dz = p.z - pos[2];
    const dist = Math.hypot(dx, dz) || 1;

    if (headRef.current) headRef.current.rotation.y = Math.atan2(-dx, -dz);

    const now = performance.now();
    if (dist < 26 && now - lastShotAt.current > 2100) {
      lastShotAt.current = now;
      activeShots.current.push({ x: pos[0], y: pos[1] + 0.5, z: pos[2], vx: (dx / dist) * 11, vz: (dz / dist) * 11, life: 2.5 });
    }

    const next = [];
    for (const s of activeShots.current) {
      s.x += s.vx * delta;
      s.z += s.vz * delta;
      s.life -= delta;
      if (Math.hypot(s.x - p.x, s.z - p.z) < 0.75 && Math.abs(s.y - p.y) < 1.2) {
        damagePlayer(15);
        continue;
      }
      if (s.life > 0) next.push(s);
    }
    activeShots.current = next.slice(-6);

    shotsRef.current?.children.forEach((m, idx) => {
      const s = activeShots.current[idx];
      m.visible = Boolean(s);
      if (s) m.position.set(s.x, s.y, s.z);
    });
  });

  if (dead) return null;

  return (
    <>
      <group position={pos}>
        <EnemyHPBar ratio={hpRatio} yOffset={1.65} />
        <RoundedBox args={[1.1, 0.55, 1.1]} radius={0.08} position={[0, -0.2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#27272A" roughness={0.75} metalness={0.18} />
        </RoundedBox>
        <group ref={headRef} position={[0, 0.42, 0]}>
          <RoundedBox args={[0.75, 0.55, 0.85]} radius={0.1} castShadow>
            <meshStandardMaterial color={flashing ? '#FAFAFA' : '#18181B'} roughness={0.5} metalness={0.28} />
          </RoundedBox>
          <RoundedBox args={[0.18, 0.18, 0.55]} radius={0.04} position={[0, 0.05, -0.5]} castShadow>
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
          </RoundedBox>
        </group>
      </group>
      <group ref={shotsRef}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </>
  );
}
