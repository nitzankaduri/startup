import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { StylizedEntity } from '../assets/StylizedEntity';
import { emitJuice } from '../assets/JuiceFX';
import { CartoonPlayerRig } from '../gameplay/CartoonPlayerRig';
import { DynamicActionCamera } from '../gameplay/DynamicActionCamera';
import { BiomeStage } from '../sdk/assets/BiomeStage';
import { WeatherSystem } from '../sdk/atmosphere/WeatherSystem';
import { CityGridGenerator, TrackGenerator } from '../sdk/world/CityRoadBuilder';
import { motionBus } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { SubwayCorridorScene } from './SubwayCorridorScene';
import { WorldDynamicActor } from './worldEntityActors';

/** Deterministic renderer for Stylized Cartoon World Blueprints with endless 3-rail streaming, telemetry & win/lose states. */
export function WorldJsonScene({ world }) {
  const [goneIds, setGoneIds] = useState(() => new Set());
  const attackAtRef = useRef(0);
  const statsRef = useRef({ score: 0, cash: 0, timer: world?.rules?.timeLimit ?? 90, lastSync: 0, bossLeft: 0 });

  const gameState = useGameStore((s) => s.gameState);
  const hasStarted = useGameStore((s) => s.hasStarted);
  const activatePowerup = useGameStore((s) => s.activatePowerup);
  const collectItem = useGameStore((s) => s.collectItem);
  const registerKill = useGameStore((s) => s.registerKill);
  const setTelemetry = useGameStore((s) => s.setTelemetry);
  const triggerWin = useGameStore((s) => s.triggerWin);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);

  const entities = world?.entities || [];
  useEffect(() => {
    statsRef.current.timer = world?.rules?.timeLimit ?? 90;
    statsRef.current.bossLeft = entities.filter((e) => e.kind === 'boss').length;
    setTelemetry({ cash: statsRef.current.cash, timeLeft: statsRef.current.timer, maxHp: 100 });
  }, [world?.rules?.timeLimit, entities.length, setTelemetry]);

  useFrame((_, rawDelta) => {
    if (!world || !hasStarted || gameState !== 'playing') return;
    const dt = Math.min(0.05, rawDelta);
    const st = statsRef.current;
    st.timer = Math.max(0, st.timer - dt);
    const now = performance.now();
    if (now - st.lastSync > 100) {
      st.lastSync = now;
      const spd = Math.round(Math.hypot(motionBus.vel?.x || 0, motionBus.vel?.z || 0) * 6.5);
      setTelemetry({ speedKmh: spd, timeLeft: st.timer, cash: st.cash });
    }
    if (st.timer <= 0) {
      if (world.rules?.winCondition === 'survive_time') triggerWin();
      else triggerGameOver(false);
    }
  });

  if (!world) return null;
  const layout = world.worldLayout || 'open_biome';
  const rig = world.playerRig || 'third_person_action';
  const spawnPos = world.spawn?.position || [0, rig === 'flight_combat' ? 8 : 1.8, 0];
  const targetScore = world.rules?.targetScore || 500;
  const stageTime = world.lightingPreset === 'night' ? 'midnight' : world.lightingPreset === 'dawn' ? 'dawn' : 'golden_hour';

  const awardAndCheckWin = (pts, ent) => {
    const st = statsRef.current;
    st.score += pts; st.cash += pts;
    setTelemetry({ cash: st.cash, runnerScore: st.score });
    if (ent.kind === 'boss') st.bossLeft = Math.max(0, st.bossLeft - 1);
    if ((world.rules?.winCondition === 'defeat_boss' && st.bossLeft === 0) || st.score >= targetScore) triggerWin();
  };

  const handleSensorPickup = (ent) => (other) => {
    if (other?.rigidBodyObject?.name !== 'player' || goneIds.has(ent.id)) return;
    setGoneIds((prev) => new Set(prev).add(ent.id));
    if (ent.kind === 'powerup') {
      const pType = String(ent.modelId || '').includes('magnet') ? 'magnet' : 'jetpack';
      activatePowerup(pType, pType === 'jetpack' ? 8000 : 10000);
    }
    collectItem(ent.id, ent.position, ent.color || '#FBBF24');
    emitJuice({ kind: 'coin', position: ent.position, count: 14 });
    awardAndCheckWin(ent.points || 50, ent);
  };

  const handleRampBoost = (other) => {
    if (other?.rigidBodyObject?.name !== 'player' || !other.rigidBody) return;
    const v = other.rigidBody.linvel();
    other.rigidBody.setLinvel({ x: v.x * 1.25, y: 15.5, z: v.z * 1.25 }, true);
    emitJuice({ kind: 'spark', position: [other.rigidBody.translation().x, 0.5, other.rigidBody.translation().z], count: 10 });
  };

  const handleHitPlayer = (dmg, pos) => {
    emitJuice({ kind: 'spark', position: pos, count: 10 });
    const nextHp = Math.max(0, useGameStore.getState().hp - dmg);
    setTelemetry({ hp: nextHp, shakeAt: performance.now() });
    if (nextHp <= 0) triggerGameOver(true);
  };

  return (
    <group>
      {layout === 'city_grid' && <CityGridGenerator blocks={4} roadWidth={14} blockSize={36} />}
      {layout === 'race_circuit' && <TrackGenerator width={16} />}
      {layout === 'three_lane_track' && <SubwayCorridorScene theme={world.theme || 'sunny_city'} signLabel={world.signLabel || 'METRO'} />}
      {layout === 'open_biome' && (
        <BiomeStage theme={world.theme === 'alpine_meadow' || world.theme === 'cyber_dusk' ? world.theme : 'sunset_canyon'} timeOfDay={stageTime} weather={world.weather || 'clear'} size={200} />
      )}
      {layout !== 'open_biome' && world.weather && world.weather !== 'clear' && <WeatherSystem type={world.weather} intensity={0.85} />}

      {entities.map((ent) => {
        if (goneIds.has(ent.id)) return null;
        if (ent.kind === 'collectible' || ent.kind === 'checkpoint' || ent.kind === 'powerup') {
          return <StylizedEntity key={ent.id} name={ent.modelId} variant={ent.variant} position={ent.position} rotation={ent.rotation} scale={ent.scale || 1} sensor onSensorEnter={handleSensorPickup(ent)} />;
        }
        if (ent.kind === 'jump_ramp') {
          return <StylizedEntity key={ent.id} name={ent.modelId} variant={ent.variant} position={ent.position} rotation={ent.rotation} scale={ent.scale || 1} onCollide={handleRampBoost} />;
        }
        if (ent.kind === 'enemy' || ent.kind === 'boss' || ent.kind === 'vehicle' || ent.behavior === 'moving_train') {
          return (
            <WorldDynamicActor
              key={ent.id}
              ent={ent}
              attackRef={attackAtRef}
              onHitPlayer={handleHitPlayer}
              onDefeated={(e) => { registerKill(); awardAndCheckWin(e.points || 100, e); }}
            />
          );
        }
        return <StylizedEntity key={ent.id} name={ent.modelId} variant={ent.variant} position={ent.position} rotation={ent.rotation} scale={ent.scale || 1} color={ent.color || '#D96B27'} />;
      })}

      <CartoonPlayerRig key={rig} rig={rig} position={spawnPos} color="#10B981" jumpForce={rig === 'three_lane_runner' ? 14.2 : 11.5} onAttack={() => { attackAtRef.current = performance.now(); }} />
      <DynamicActionCamera rig={rig} />
    </group>
  );
}
