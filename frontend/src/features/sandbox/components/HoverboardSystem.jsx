import { useEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { isPowerupActive, motionBus } from '../sdk/spawnSdk';
import { useGameStore } from '../store/useGameStore';

export function HoverboardSystem() {
  const boardRef = useRef(null);
  const lastSpaceAt = useRef(0);
  const gameState = useGameStore((s) => s.gameState);
  const hoverboardCooldownUntil = useGameStore((s) => s.hoverboardCooldownUntil);
  const activatePowerup = useGameStore((s) => s.activatePowerup);

  useEffect(() => {
    const triggerBoard = () => {
      const now = performance.now();
      if (gameState !== 'playing' || isPowerupActive('hoverboard') || now < hoverboardCooldownUntil) return;
      activatePowerup('hoverboard', 15000);
    };

    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.code === 'KeyE') {
        triggerBoard();
      } else if (e.code === 'Space') {
        const now = performance.now();
        if (now - lastSpaceAt.current < 320) triggerBoard();
        lastSpaceAt.current = now;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activatePowerup, gameState, hoverboardCooldownUntil]);

  useFrame(({ clock }) => {
    if (!boardRef.current) return;
    const active = isPowerupActive('hoverboard') && gameState === 'playing';
    boardRef.current.visible = active;
    if (!active) return;

    const p = motionBus.pos;
    const hoverBob = Math.sin(clock.elapsedTime * 7) * 0.05;
    boardRef.current.position.set(p.x, p.y - 0.62 + hoverBob, p.z);
    boardRef.current.rotation.set(0.06, motionBus.yaw, -motionBus.steer * 0.3);
  });

  return (
    <group ref={boardRef} visible={false}>
      <RoundedBox args={[0.78, 0.1, 1.85]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial color="#181715" roughness={0.4} metalness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.24, 0.11, 1.75]} radius={0.02} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#D96B27" roughness={0.45} />
      </RoundedBox>
      {[-0.4, 0.4].map((x) => (
        <RoundedBox key={x} args={[0.06, 0.08, 1.6]} radius={0.02} position={[x, 0.01, 0]}>
          <meshStandardMaterial color="#E5B869" metalness={0.75} roughness={0.22} />
        </RoundedBox>
      ))}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.96]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.32, 10]} />
          <meshBasicMaterial color="#FFF3E0" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
