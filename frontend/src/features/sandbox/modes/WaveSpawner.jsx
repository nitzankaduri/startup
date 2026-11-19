import { useCallback, useEffect, useRef, useState } from 'react';
import { ChaserBot } from '../components/entities/ChaserBot';
import { HealPickup } from '../components/entities/HealPickup';
import { TurretBot } from '../components/entities/TurretBot';
import { useGameStore } from '../store/useGameStore';

function buildWave(waveNum) {
  const count = 2 + waveNum * 2;
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 12 + (i % 2) * 3;
    const isTurret = waveNum >= 2 && i % 3 === 0;
    list.push({
      id: `w${waveNum}-e${i}`,
      type: isTurret ? 'turret_bot' : 'chaser_bot',
      position: [Math.cos(angle) * radius, 0.85, Math.sin(angle) * radius],
      scale: isTurret ? [1.1, 1.1, 1.1] : [0.9, 0.9, 0.9],
      color: isTurret ? '#991B1B' : '#7F1D1D',
    });
  }
  return list;
}

export function WaveSpawner() {
  const totalWaves = useGameStore((s) => s.totalWaves);
  const runId = useGameStore((s) => s.runId);
  const advanceWave = useGameStore((s) => s.advanceWave);
  const triggerWin = useGameStore((s) => s.triggerWin);

  const [wave, setWave] = useState(1);
  const [enemies, setEnemies] = useState(() => buildWave(1));
  const [heals, setHeals] = useState([]);
  const remainingRef = useRef(enemies.length);
  const timerRef = useRef(null);

  useEffect(() => {
    const initial = buildWave(1);
    setWave(1);
    setEnemies(initial);
    setHeals([]);
    remainingRef.current = initial.length;
    return () => clearTimeout(timerRef.current);
  }, [runId]);

  const handleDefeated = useCallback(() => {
    remainingRef.current -= 1;
    if (remainingRef.current > 0) return;

    if (wave >= totalWaves) {
      triggerWin();
      return;
    }

    const nextWave = wave + 1;
    setHeals((prev) => [...prev, { id: `wave-heal-${wave}`, position: [0, 0.9, 0] }]);
    advanceWave(nextWave);

    timerRef.current = setTimeout(() => {
      const spawned = buildWave(nextWave);
      remainingRef.current = spawned.length;
      setWave(nextWave);
      setEnemies(spawned);
    }, 1500);
  }, [advanceWave, totalWaves, triggerWin, wave]);

  return (
    <group>
      {enemies.map((entity) =>
        entity.type === 'turret_bot' ? (
          <TurretBot key={entity.id} entity={entity} onDefeated={handleDefeated} />
        ) : (
          <ChaserBot key={entity.id} entity={entity} onDefeated={handleDefeated} />
        )
      )}
      {heals.map((heal) => (
        <HealPickup key={heal.id} entity={heal} />
      ))}
    </group>
  );
}
