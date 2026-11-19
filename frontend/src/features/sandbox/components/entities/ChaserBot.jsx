import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { combatBus } from '../../modes/combatBus';
import { useGameStore } from '../../store/useGameStore';
import { EnemyHPBar } from './EnemyHPBar';

export function ChaserBot({ entity, onDefeated }) {
  const groupRef = useRef(null);
  const posRef = useRef([...entity.position]);
  const knockRef = useRef({ x: 0, z: 0 });
  const hpRef = useRef(100);
  const lastBiteRef = useRef(0);

  const [hpRatio, setHpRatio] = useState(1);
  const [dead, setDead] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const gameState = useGameStore((s) => s.gameState);
  const damagePlayer = useGameStore((s) => s.damagePlayer);
  const registerKill = useGameStore((s) => s.registerKill);
  const triggerHitMarker = useGameStore((s) => s.triggerHitMarker);

  const scale = entity.scale || [0.9, 0.9, 0.9];
  const color = entity.color || '#7F1D1D';

  useEffect(() => {
    if (dead) {
      combatBus.enemies.delete(entity.id);
      return;
    }
    combatBus.enemies.set(entity.id, {
      id: entity.id,
      pos: posRef.current,
      radius: 0.8,
      onHit: (dmg, dir) => {
        hpRef.current = Math.max(0, hpRef.current - dmg);
        setHpRatio(hpRef.current / 100);
        knockRef.current = { x: dir.x * 8, z: dir.z * 8 };
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
  }, [dead, entity.id, onDefeated, registerKill, triggerHitMarker]);

  useFrame(({ clock }, delta) => {
    if (dead || !groupRef.current || gameState !== 'playing') return;
    const p = combatBus.playerPos;
    const cur = posRef.current;
    const dx = p.x - cur[0];
    const dz = p.z - cur[2];
    const dist = Math.hypot(dx, dz) || 0.001;

    const speed = 3.8;
    cur[0] += ((dx / dist) * speed + knockRef.current.x) * delta;
    cur[2] += ((dz / dist) * speed + knockRef.current.z) * delta;
    knockRef.current.x *= Math.max(0, 1 - delta * 10);
    knockRef.current.z *= Math.max(0, 1 - delta * 10);

    groupRef.current.position.set(cur[0], cur[1] + Math.abs(Math.sin(clock.elapsedTime * 8)) * 0.08, cur[2]);
    groupRef.current.rotation.y = Math.atan2(-dx, -dz);

    const now = performance.now();
    if (dist < 1.2 && Math.abs(p.y - cur[1]) < 1.5 && now - lastBiteRef.current > 750) {
      lastBiteRef.current = now;
      damagePlayer(18);
    }
  });

  if (dead) return null;

  return (
    <group ref={groupRef} position={entity.position}>
      <EnemyHPBar ratio={hpRatio} yOffset={scale[1] + 0.55} />
      <RoundedBox args={scale} radius={0.14} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={flashing ? '#FAFAFA' : '#18181B'} roughness={0.55} metalness={0.22} />
      </RoundedBox>
      <RoundedBox args={[scale[0] * 0.72, scale[1] * 0.22, 0.14]} radius={0.04} position={[0, scale[1] * 0.16, -scale[2] / 2 - 0.02]}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}
