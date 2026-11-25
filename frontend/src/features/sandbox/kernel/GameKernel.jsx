import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveWorldThemePalette } from '../components/DynamicThemeStyler';
import { OpenWorldEntitiesLayer } from '../components/OpenWorldEntitiesLayer';
import { motionBus } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { stepAnimatedRig } from './AnimatedCharacterRig';
import { ArcadeVFXSystem } from './ArcadeVFXSystem';
import { animateCharacterJoints } from './CharacterAnimator';
import { animateComposedParts } from './CompositionalMeshBuilder';
import { buildBossMesh, buildEnemyMesh, buildObstacleMesh, buildPlayerMesh, buildPowerupMesh } from './EntityMeshFactory';
import { EntityShadowPool } from './EntityShadowPool';
import { createDirectorState, fireAutoAimShot, spawnBurst, stepDirector } from './GameplayDirector';
import { formatGoalHud } from './GoalEngine';
import { kernelFreezeBus, setKernelPaused } from './kernelFreezeBus';
import { preloadStudioModels } from './ModelAssetLoader';
import { stepModeMovement } from './ModePhysics';
import { addWantedHeat, formatSandboxHud, syncSandboxRadarBlips } from './OpenWorldMissions';
import { bindKernelKeys, createFeelState, stepPlayerFeel } from './PlayerMovementFeel';
import { getContactShadowTexture } from './ProceduralTextureAtlas';
import { toggleEnterExitVehicle } from './SandboxVehicleSystem';
import { createStudioWorldRuntime, stepStudioCamera } from './StudioEngineCore';
import { applyHitFlash, getStudioMatcapMaterial } from './StudioShaderPool';
import { updateDynamicContactShadow } from './StudioVisualRig';

const COIN_DUM = new THREE.Object3D();
const applyLiveSpecPatch = (st, next) => Object.assign(st, {
  obstacleType: next.obstacleType, isTrain: next.isTrain, canShoot: next.canShoot, enemiesShoot: next.enemiesShoot,
  doubleJump: next.doubleJump, baseSpeed: next.baseSpeed, jumpPower: next.jumpPower, spawnRate: next.spawnRate,
  goalType: next.goalType, targetCount: next.targetCount, waveCount: next.waveCount, targetDistance: next.targetDistance,
});

export function GameKernel({ world }) {
  const { camera } = useThree();
  const stRef = useRef(null); if (!stRef.current) stRef.current = createStudioWorldRuntime(world).state;
  const feelRef = useRef(null); if (!feelRef.current) feelRef.current = createFeelState();
  const keysRef = useRef({}); const clickRef = useRef(false); const prevFRef = useRef(false); const lastHudRef = useRef(0); const attackUntilRef = useRef(0);
  const playerRef = useRef(null); const shadowRef = useRef(null); const bossRef = useRef(null); const coinInstRef = useRef(null);
  const playerRigCtrlRef = useRef(null); const enemyRigCtrlsRef = useRef([]);
  const enemyRefs = useRef([]); const obsRefs = useRef([]); const powRefs = useRef([]); const shotRefs = useRef([]); const eShotRefs = useRef([]);
  const gameState = useGameStore((s) => s.gameState); const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const settingsPaused = useSettingsStore((s) => s.isPaused); const runId = useGameStore((s) => s.runId); const prevRunRef = useRef(runId);
  useEffect(() => {
    if (isEditorOpen) { setKernelPaused(true); useSettingsStore.getState().setPaused(true); }
    else { useSettingsStore.getState().setPaused(false); if (!kernelFreezeBus.countdownText) setKernelPaused(false); }
  }, [isEditorOpen]);
  useEffect(() => { useSettingsStore.getState().setPaused(false); setKernelPaused(false); }, [runId]);
  const setTelemetry = useGameStore((s) => s.setTelemetry); const registerHud = useGameStore((s) => s.registerHud); const triggerWin = useGameStore((s) => s.triggerWin); const triggerGameOver = useGameStore((s) => s.triggerGameOver);
  const pal = useMemo(() => resolveWorldThemePalette(world), [world]); const specPal = useMemo(() => ({ ...pal, ...(world?.palette || {}) }), [pal, world]);

  const playerMesh = useMemo(() => buildPlayerMesh(world?.playerType, specPal, world?.playerParts, (r) => { playerRigCtrlRef.current = r; }), [world?.playerType, world?.playerParts, specPal]);
  const shadowMap = useMemo(() => getContactShadowTexture(), []);
  const coinGeo = useMemo(() => (world?.collectibleType && world.collectibleType !== 'gold_coin' ? new THREE.OctahedronGeometry(0.44, 0) : new THREE.CylinderGeometry(0.45, 0.45, 0.14, 14)), [world?.collectibleType]);
  const coinMat = useMemo(() => getStudioMatcapMaterial(specPal.secondary || '#FBBF24', 'toon_metallic'), [specPal.secondary]);
  const bossMesh = useMemo(() => buildBossMesh(world?.bossConfig, specPal), [world?.bossConfig, specPal]);
  const obsMeshes = useMemo(() => stRef.current.obstacles.map((o, idx) => buildObstacleMesh(world?.obstacleType, specPal, world?.obstacleParts, o.isRamp, idx)), [world?.obstacleType, world?.obstacleParts, specPal, world?.mode]);
  const enemyMeshes = useMemo(() => stRef.current.enemies.map((_, idx) => buildEnemyMesh(world?.enemyType, specPal, world?.enemyParts, (r) => { enemyRigCtrlsRef.current[idx] = r; })), [world?.enemyType, world?.enemyParts, specPal, world?.mode]);
  const powMeshes = useMemo(() => stRef.current.powerups.map(() => buildPowerupMesh()), []);

  useEffect(() => {
    const nextState = createDirectorState(world);
    if (prevRunRef.current !== runId || !stRef.current || stRef.current.mode !== nextState.mode) {
      prevRunRef.current = runId; stRef.current = nextState; feelRef.current = createFeelState();
      const hud = nextState.isSandbox ? formatSandboxHud(nextState) : formatGoalHud(nextState);
      setTelemetry({ hp: 100, cash: 0, runnerScore: 0, timeLeft: nextState.timer, ...hud }); registerHud({ meters: [] });
    } else applyLiveSpecPatch(stRef.current, nextState);
  }, [runId, world, setTelemetry, registerHud]);

  useEffect(() => { preloadStudioModels(); return bindKernelKeys(keysRef, clickRef); }, []);

  useFrame(({ clock }, rawDelta) => {
    const st = stRef.current; const feel = feelRef.current; const t = clock.elapsedTime; const now = performance.now();
    if (kernelFreezeBus.shouldGrantInvuln) { kernelFreezeBus.shouldGrantInvuln = false; st.invulnUntil = now + kernelFreezeBus.invulnDurationMs; }
    const isFrozen = isEditorOpen || kernelFreezeBus.paused || settingsPaused;
    const isEnded = gameState === 'won' || gameState === 'gameover';
    const k = keysRef.current;
    const boosting = !isFrozen && !isEnded && (Boolean(k.ShiftLeft || k.ShiftRight) || st.activePow === 'jetpack_boost' || (st.isPursuit && Boolean(k.Space)));
    const dt = Math.min(rawDelta, 0.05);

    if (isFrozen || isEnded) { stepAnimatedRig(playerRigCtrlRef.current, 'idle', 0.016); }
    else if (now >= st.hitStopUntil) {
      const prevPx = st.px; const prevPz = st.pz;
      st.timer = Math.max(0, st.timer - dt);
      if (st.timer <= 0) { triggerGameOver(false); return; }
      if (st.isSandbox && k.KeyF && !prevFRef.current) toggleEnterExitVehicle(st, now, (s, tm) => addWantedHeat(s, 0.6, tm));
      prevFRef.current = Boolean(k.KeyF);
      stepPlayerFeel({ st, feel, keys: k, playerMeshGroup: playerRef.current, dt, now, onLandShockwave: (x, y, z) => spawnBurst(st, x, y, z, 'dust', 10) });
      stepModeMovement({ st, feel, keys: k, dt, boosting });
      const wantFire = st.isSandbox ? (st.inVehicleIdx < 0 && (clickRef.current || k.KeyE)) : (clickRef.current || k.KeyF || (st.isArena && (k.Space || k.KeyE)) || (st.isSky && k.Space) || (st.isRunner && k.KeyE));
      if (wantFire) { if (fireAutoAimShot(st, now)) attackUntilRef.current = now + 220; clickRef.current = false; }
      stepDirector(st, prevPx, prevPz, dt, now, { onEvent: (_, s) => setTelemetry({ hp: s.hp, cash: s.score, runnerScore: s.score }), onWin: () => triggerWin(), onLose: () => triggerGameOver(true) });
      if (!st.isSky && st.py <= st.groundY) { st.py = st.groundY; if (st.vy < 0) st.vy = 0; st.jumpsLeft = st.doubleJump ? 2 : 1; }
      const animState = now < attackUntilRef.current ? 'attack' : (!st.isSky && st.py > st.groundY + 0.15 ? 'jump' : ((st.isArena || st.isSandbox) && (st.curSpeed || 0) < 0.8 ? 'idle' : 'run'));
      stepAnimatedRig(playerRigCtrlRef.current, animState, dt);
    }

    const dtVis = isFrozen ? 0.016 : Math.min(0.05, rawDelta);
    const grounded = !st.isSky && st.py <= st.groundY + 0.15;
    motionBus.pos = { x: st.px, y: st.py, z: st.pz }; motionBus.yaw = st.yaw || 0;
    motionBus.vel = { x: st.vx || 0, y: st.vy, z: isFrozen ? 0 : -(st.curSpeed || st.baseSpeed) };
    if (playerRef.current) {
      playerRef.current.visible = !st.isSandbox || st.inVehicleIdx < 0;
      playerRef.current.position.set(st.px, st.py - 1.0, st.pz);
      playerRef.current.rotation.set(st.pitch || 0, Math.PI + (st.yaw || 0), feel.bankRoll || 0);
      if (!isFrozen && playerRef.current.visible) { animateCharacterJoints(playerMesh, { t, speed: st.curSpeed || st.baseSpeed, grounded, sliding: feel.sliding, boosting }); animateComposedParts(playerMesh, t); }
    }
    if (shadowRef.current) { shadowRef.current.visible = !st.isSky; if (!st.isSky) updateDynamicContactShadow(shadowRef.current, st.px, st.pz, st.py, st.groundY); }
    if (bossRef.current) { bossRef.current.visible = st.boss.alive; if (st.boss.alive) { bossRef.current.position.set(st.boss.x, st.boss.y, st.boss.z); applyHitFlash(bossRef.current, st.boss.flash > 0); } }
    for (let i = 0; i < st.enemies.length; i += 1) { const m = enemyRefs.current[i]; const e = st.enemies[i]; if (m) { m.visible = e.alive; if (e.alive) { m.position.set(e.x, e.y - 1.0, e.z); if (st.isArena || st.isSandbox) m.rotation.y = e.yaw || 0; if (!isFrozen) { stepAnimatedRig(enemyRigCtrlsRef.current[i], 'run', dtVis); animateCharacterJoints(enemyMeshes[i], { t, speed: 10, grounded: true }); } applyHitFlash(m, e.flash > 0); } } }
    if (coinInstRef.current) { for (let i = 0; i < st.coins.length; i += 1) { const c = st.coins[i]; COIN_DUM.position.set(c.x, c.alive ? c.y : -99, c.z); COIN_DUM.rotation.set(Math.PI / 2, t * 3.2, 0); COIN_DUM.scale.setScalar(c.alive ? 1 : 0.001); COIN_DUM.updateMatrix(); coinInstRef.current.setMatrixAt(i, COIN_DUM.matrix); } coinInstRef.current.instanceMatrix.needsUpdate = true; }
    const sync = (list, refs, rotY = 0) => { for (let i = 0; i < list.length; i += 1) { const m = refs.current[i]; const it = list[i]; if (m) { m.visible = it.alive; if (it.alive) { m.position.set(it.x, it.y, it.z); if (rotY) m.rotation.y = rotY; } } } };
    sync(st.obstacles, obsRefs); sync(st.powerups, powRefs, t * 2.4); sync(st.shots, shotRefs); sync(st.enemyShots, eShotRefs);
    const spdRatio = THREE.MathUtils.clamp((Math.abs(st.curSpeed || st.baseSpeed) - st.baseSpeed * 0.6) / Math.max(1, st.baseSpeed * 1.4), 0, 1);
    st.shake = stepStudioCamera(camera, motionBus.pos, { mode: st.mode, boosting, shake: st.shake, vx: st.vx, speedRatio: spdRatio, enemies: st.enemies, yaw: st.yaw, inVehicle: st.inVehicleIdx >= 0 }, dtVis);
    if (now - lastHudRef.current > 100) {
      lastHudRef.current = now; syncSandboxRadarBlips(st);
      const curKmh = isFrozen || isEnded ? 0 : Math.round(Math.abs(st.curSpeed || st.baseSpeed) * 9);
      const hud = st.isSandbox ? formatSandboxHud(st) : formatGoalHud(st);
      const acc = st.shotsFired > 0 ? Math.min(100, Math.round((st.shotsHit / st.shotsFired) * 100)) : 100;
      setTelemetry({ hp: st.hp, speedKmh: curKmh, timeLeft: st.timer, cash: st.score, runnerScore: st.score, kills: st.kills, currentWave: st.wave, totalWaves: st.waveCount, accuracy: acc, maxCombo: st.maxCombo || 1, ...hud });
      const meters = [];
      if (st.boss.alive) meters.push({ label: 'BOSS', value: `${st.boss.hp}/${st.boss.maxHp}`, pct: (st.boss.hp / st.boss.maxHp) * 100 });
      if (st.activePow) meters.push({ label: 'POWERUP', value: `${st.activePow.replace('_', ' ').toUpperCase()} (${Math.max(1, Math.ceil((st.powUntil - now) / 1000))}s)` });
      registerHud({ meters });
    }
  });
  const st = stRef.current; return (<group>
    <group ref={playerRef} position={[0, 0, 0]}><primitive object={playerMesh} /></group>
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.65, 1.65]} /><meshBasicMaterial map={shadowMap} transparent opacity={0.55} depthWrite={false} /></mesh>
      <group ref={bossRef} visible={false}><primitive object={bossMesh} /></group>
      {st.enemies.map((_, i) => <group key={`e${i}`} ref={(el) => { enemyRefs.current[i] = el; }}><primitive object={enemyMeshes[i]} /></group>)}
      {st.obstacles.map((_, i) => <primitive key={`o${i}`} object={obsMeshes[i]} ref={(el) => { obsRefs.current[i] = el; }} />)}
      <instancedMesh ref={coinInstRef} args={[coinGeo, coinMat, st.coins.length]} frustumCulled={false} />
      {st.powerups.map((_, i) => <primitive key={`pw${i}`} object={powMeshes[i]} ref={(el) => { powRefs.current[i] = el; }} />)}
      {st.shots.map((_, i) => <mesh key={`s${i}`} ref={(el) => { shotRefs.current[i] = el; }} visible={false}><sphereGeometry args={[0.24, 8, 8]} /><meshBasicMaterial color={pal.projectileColor} /></mesh>)}
      {st.enemyShots.map((_, i) => <mesh key={`es${i}`} ref={(el) => { eShotRefs.current[i] = el; }} visible={false}><sphereGeometry args={[0.28, 8, 8]} /><meshBasicMaterial color="#EF4444" /></mesh>)}
      <OpenWorldEntitiesLayer stRef={stRef} specPal={specPal} />
      <EntityShadowPool stRef={stRef} />
      <ArcadeVFXSystem boosting={Boolean(st.activePow === 'jetpack_boost' || (st.isPursuit && (st.curSpeed || 0) > st.baseSpeed * 1.4) || (st.isSandbox && st.inVehicleIdx >= 0 && Math.abs(st.curSpeed) > st.baseSpeed * 1.8))} />
  </group>);
}
