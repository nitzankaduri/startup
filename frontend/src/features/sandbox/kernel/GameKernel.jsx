import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveWorldThemePalette } from '../components/DynamicThemeStyler';
import { motionBus } from '../sdk/motionBus';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { stepActionCamera } from './ActionCameraRig';
import { stepAnimatedRig } from './AnimatedCharacterRig';
import { ArcadeVFXSystem } from './ArcadeVFXSystem';
import { animateCharacterJoints } from './CharacterAnimator';
import { animateComposedParts } from './CompositionalMeshBuilder';
import { buildBossMesh, buildEnemyMesh, buildObstacleMesh, buildPlayerMesh, buildPowerupMesh } from './EntityMeshFactory';
import { createDirectorState, fireAutoAimShot, spawnBurst, stepDirector } from './GameplayDirector';
import { kernelFreezeBus, setKernelPaused } from './kernelFreezeBus';
import { bindKernelKeys, createFeelState, stepPlayerFeel } from './PlayerMovementFeel';
import { getContactShadowTexture } from './ProceduralTextureAtlas';
import { attachRiggedGlbAsync } from './RiggedActorLoader';
import { applyHitFlash, getStudioMatcapMaterial } from './StudioShaderPool';
import { updateDynamicContactShadow } from './StudioVisualRig';

const COIN_DUM = new THREE.Object3D();

const applyLiveSpecPatch = (st, next) => Object.assign(st, { arch: next.arch, isRunner: next.isRunner, isArena: next.isArena, obstacleType: next.obstacleType, isTrain: next.isTrain, canShoot: next.canShoot, enemiesShoot: next.enemiesShoot, doubleJump: next.doubleJump, baseSpeed: next.baseSpeed, jumpPower: next.jumpPower, spawnRate: next.spawnRate, objective: next.objective });

export function GameKernel({ world }) {
  const { camera } = useThree();
  const stRef = useRef(null); if (!stRef.current) stRef.current = createDirectorState(world);
  const feelRef = useRef(null); if (!feelRef.current) feelRef.current = createFeelState();
  const keysRef = useRef({}); const clickRef = useRef(false); const lastHudRef = useRef(0); const attackUntilRef = useRef(0);
  const playerRef = useRef(null); const shadowRef = useRef(null); const bossRef = useRef(null); const coinInstRef = useRef(null);
  const playerRigCtrlRef = useRef(null); const enemyRigCtrlsRef = useRef([]);
  const enemyRefs = useRef([]); const obsRefs = useRef([]); const powRefs = useRef([]); const shotRefs = useRef([]); const eShotRefs = useRef([]);
  const gameState = useGameStore((s) => s.gameState);
  const isEditorOpen = useGameStore((s) => s.isEditorOpen);
  const settingsPaused = useSettingsStore((s) => s.isPaused);
  const runId = useGameStore((s) => s.runId); const prevRunRef = useRef(runId);
  useEffect(() => { setKernelPaused(isEditorOpen); }, [isEditorOpen]);
  useEffect(() => { useSettingsStore.getState().setPaused(false); setKernelPaused(false); }, [runId]);
  const setTelemetry = useGameStore((s) => s.setTelemetry); const registerHud = useGameStore((s) => s.registerHud);
  const triggerWin = useGameStore((s) => s.triggerWin); const triggerGameOver = useGameStore((s) => s.triggerGameOver);
  const pal = useMemo(() => resolveWorldThemePalette(world), [world]);
  const specPal = useMemo(() => ({ ...pal, ...(world?.palette || {}) }), [pal, world]);

  const playerMesh = useMemo(() => buildPlayerMesh(world?.playerType, specPal, world?.playerParts), [world?.playerType, world?.playerParts, specPal]);
  const shadowMap = useMemo(() => getContactShadowTexture(), []);
  const coinGeo = useMemo(() => (world?.collectibleType && world.collectibleType !== 'gold_coin' ? new THREE.OctahedronGeometry(0.44, 0) : new THREE.CylinderGeometry(0.45, 0.45, 0.14, 14)), [world?.collectibleType]);
  const coinMat = useMemo(() => getStudioMatcapMaterial(specPal.secondary || '#FBBF24', 'toon_metallic'), [specPal.secondary]);
  const bossMesh = useMemo(() => buildBossMesh(world?.bossConfig, specPal), [world?.bossConfig, specPal]);
  const obsMeshes = useMemo(() => stRef.current.obstacles.map((o, idx) => buildObstacleMesh(world?.obstacleType, specPal, world?.obstacleParts, o.isRamp, idx)), [world?.obstacleType, world?.obstacleParts, specPal]);
  const enemyMeshes = useMemo(() => stRef.current.enemies.map(() => buildEnemyMesh(world?.enemyType, specPal, world?.enemyParts)), [world?.enemyType, world?.enemyParts, specPal]);
  const powMeshes = useMemo(() => stRef.current.powerups.map(() => buildPowerupMesh()), []);

  useEffect(() => {
    if (prevRunRef.current !== runId || !stRef.current) {
      prevRunRef.current = runId; stRef.current = createDirectorState(world); feelRef.current = createFeelState();
      setTelemetry({ hp: 100, cash: 0, runnerScore: 0, timeLeft: stRef.current.timer }); registerHud({ meters: [] });
    } else applyLiveSpecPatch(stRef.current, createDirectorState(world));
    const skins = world?.entitySkins || {};
    if (!world?.playerParts && playerRef.current && ['runner_kid', 'pirate', 'knight'].includes(world?.playerType || 'runner_kid')) {
      attachRiggedGlbAsync('/models/rigged/player_runner.glb', playerRef.current, { color: specPal.primary || '#10B981', accentColor: specPal.accent || pal.projectileColor, headAccessory: world?.playerType === 'pirate' || skins.playerAttachment === 'pirate_hat' ? 'pirate_hat' : null, handWeapon: stRef.current.canShoot ? 'laser_blaster' : null, backProp: skins.playerAttachment === 'wings' ? 'wings' : 'jetpack' }, (r) => { playerRigCtrlRef.current = r; });
    }
    if (!world?.enemyParts && ['chaser_guard', 'skeleton'].includes(world?.enemyType || 'chaser_guard')) {
      const url = world?.enemyType === 'skeleton' ? '/models/rigged/enemy_robot.glb' : '/models/rigged/enemy_guard.glb';
      enemyRefs.current.forEach((g, idx) => { if (g) attachRiggedGlbAsync(url, g, { color: specPal.accent || '#E11D48', targetHeight: 1.7 }, (r) => { enemyRigCtrlsRef.current[idx] = r; }); });
    }
  }, [runId, world, pal.projectileColor, specPal, setTelemetry, registerHud]);

  useEffect(() => bindKernelKeys(keysRef, clickRef), []);

  useFrame(({ clock }, rawDelta) => {
    const st = stRef.current; const feel = feelRef.current; const t = clock.elapsedTime; const now = performance.now();
    if (kernelFreezeBus.shouldGrantInvuln) { kernelFreezeBus.shouldGrantInvuln = false; st.invulnUntil = now + kernelFreezeBus.invulnDurationMs; }
    const isFrozen = isEditorOpen || kernelFreezeBus.paused || settingsPaused;
    const isEnded = gameState === 'won' || gameState === 'gameover';
    const k = keysRef.current;
    const boosting = !isFrozen && !isEnded && (Boolean(k.ShiftLeft || k.ShiftRight) || st.activePow === 'jetpack_boost');
    const dt = Math.min(rawDelta, 0.05);

    if (isFrozen || isEnded) {
      stepAnimatedRig(playerRigCtrlRef.current, 'idle', 0.016);
    } else if (now >= st.hitStopUntil) {
      const prevPx = st.px; const prevPz = st.pz;
      st.timer = Math.max(0, st.timer - dt);
      if (st.timer <= 0) { triggerGameOver(false); return; }
      stepPlayerFeel({ st, feel, keys: k, playerMeshGroup: playerRef.current, dt, now, onLandShockwave: (x, y, z) => spawnBurst(st, x, y, z, 'dust', 10) });
      if (st.isRunner) {
        st.px = THREE.MathUtils.lerp(st.px, st.lane * 3.2, 1 - Math.exp(-15 * dt));
        st.pz -= (st.baseSpeed * (boosting ? 1.45 : 1.0)) * dt;
      } else {
        const mx = ((k.KeyD || k.ArrowRight) ? 1 : 0) - ((k.KeyA || k.ArrowLeft) ? 1 : 0);
        const mz = ((k.KeyS || k.ArrowDown) ? 1 : 0) - ((k.KeyW || k.ArrowUp) ? 1 : 0.7);
        st.px = THREE.MathUtils.clamp(st.px + mx * st.baseSpeed * dt, -6.5, 6.5); st.pz += mz * st.baseSpeed * (boosting ? 1.4 : 1.0) * dt;
      }
      if (st.activePow === 'jetpack_boost') { st.py = THREE.MathUtils.lerp(st.py, 4.2, 1 - Math.exp(-8 * dt)); st.vy = 0; }
      else { st.vy -= 28 * dt; st.py += st.vy * dt; }
      if (clickRef.current || k.KeyF || k.KeyE) { if (fireAutoAimShot(st, now)) attackUntilRef.current = now + 220; clickRef.current = false; }
      stepDirector(st, prevPx, prevPz, dt, now, { onEvent: (_, s) => setTelemetry({ hp: s.hp, cash: s.score, runnerScore: s.score }), onWin: () => triggerWin(), onLose: () => triggerGameOver(true) });
      if (st.py <= st.groundY) { st.py = st.groundY; if (st.vy < 0) st.vy = 0; st.jumpsLeft = st.doubleJump ? 2 : 1; }
      stepAnimatedRig(playerRigCtrlRef.current, now < attackUntilRef.current ? 'attack' : (st.py > st.groundY + 0.15 ? 'jump' : 'run'), dt);
    }

    const dtVis = isFrozen ? 0.016 : Math.min(0.05, rawDelta);
    const grounded = st.py <= st.groundY + 0.15;
    motionBus.pos = { x: st.px, y: st.py, z: st.pz };
    motionBus.vel = { x: 0, y: st.vy, z: isFrozen ? 0 : -st.baseSpeed * (boosting ? 1.45 : 1.0) };
    if (playerRef.current) { playerRef.current.position.set(st.px, st.py - 1.0, st.pz); playerRef.current.rotation.y = Math.PI; if (!isFrozen) { animateCharacterJoints(playerMesh, { t, speed: st.baseSpeed, grounded, sliding: feel.sliding, boosting }); animateComposedParts(playerMesh, t); } }
    updateDynamicContactShadow(shadowRef.current, st.px, st.pz, st.py, st.groundY);
    if (bossRef.current) { bossRef.current.visible = st.boss.alive; if (st.boss.alive) { bossRef.current.position.set(st.boss.x, st.boss.y, st.boss.z); applyHitFlash(bossRef.current, st.boss.flash > 0); } }
    for (let i = 0; i < st.enemies.length; i += 1) { const m = enemyRefs.current[i]; const e = st.enemies[i]; if (m) { m.visible = e.alive; if (e.alive) { m.position.set(e.x, e.y - 1.0, e.z); if (!isFrozen) { stepAnimatedRig(enemyRigCtrlsRef.current[i], 'run', dtVis); animateCharacterJoints(enemyMeshes[i], { t, speed: 10, grounded: true }); } applyHitFlash(m, e.flash > 0); } } }
    if (coinInstRef.current) {
      for (let i = 0; i < st.coins.length; i += 1) {
        const c = st.coins[i];
        COIN_DUM.position.set(c.x, c.alive ? c.y : -99, c.z); COIN_DUM.rotation.set(Math.PI / 2, t * 3.2, 0); COIN_DUM.scale.setScalar(c.alive ? 1 : 0.001); COIN_DUM.updateMatrix();
        coinInstRef.current.setMatrixAt(i, COIN_DUM.matrix);
      }
      coinInstRef.current.instanceMatrix.needsUpdate = true;
    }
    const sync = (list, refs, rotY = 0) => { for (let i = 0; i < list.length; i += 1) { const m = refs.current[i]; const it = list[i]; if (m) { m.visible = it.alive; if (it.alive) { m.position.set(it.x, it.y, it.z); if (rotY) m.rotation.y = rotY; } } } };
    sync(st.obstacles, obsRefs); sync(st.powerups, powRefs, t * 2.4); sync(st.shots, shotRefs); sync(st.enemyShots, eShotRefs);
    st.shake = stepActionCamera(camera, motionBus.pos, { isArena: st.isArena, boosting, shake: st.shake }, dtVis);
    if (now - lastHudRef.current > 100) {
      lastHudRef.current = now;
      const curKmh = isFrozen || isEnded ? 0 : Math.round(st.baseSpeed * (boosting ? 14 : 9));
      setTelemetry({ speedKmh: curKmh, timeLeft: st.timer, cash: st.score, runnerScore: st.score });
      const meters = [];
      if (st.boss.alive) meters.push({ label: 'BOSS', value: `${st.boss.hp}/${st.boss.maxHp}`, pct: (st.boss.hp / st.boss.maxHp) * 100 });
      if (st.activePow) meters.push({ label: 'POWERUP', value: `${st.activePow.replace('_', ' ').toUpperCase()} (${Math.max(1, Math.ceil((st.powUntil - now) / 1000))}s)` });
      registerHud({ meters });
    }
  });

  const st = stRef.current;
  return (
    <group>
      <group ref={playerRef} position={[0, 0, 0]}><primitive object={playerMesh} /></group>
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.65, 1.65]} /><meshBasicMaterial map={shadowMap} transparent opacity={0.55} depthWrite={false} /></mesh>
      <group ref={bossRef} visible={false}><primitive object={bossMesh} /></group>
      {st.enemies.map((_, i) => <group key={`e${i}`} ref={(el) => { enemyRefs.current[i] = el; }}><primitive object={enemyMeshes[i]} /></group>)}
      {st.obstacles.map((_, i) => <primitive key={`o${i}`} object={obsMeshes[i]} ref={(el) => { obsRefs.current[i] = el; }} />)}
      <instancedMesh ref={coinInstRef} args={[coinGeo, coinMat, st.coins.length]} frustumCulled={false} />
      {st.powerups.map((_, i) => <primitive key={`pw${i}`} object={powMeshes[i]} ref={(el) => { powRefs.current[i] = el; }} />)}
      {st.shots.map((_, i) => <mesh key={`s${i}`} ref={(el) => { shotRefs.current[i] = el; }} visible={false}><sphereGeometry args={[0.24, 8, 8]} /><meshBasicMaterial color={pal.projectileColor} /></mesh>)}
      {st.enemyShots.map((_, i) => <mesh key={`es${i}`} ref={(el) => { eShotRefs.current[i] = el; }} visible={false}><sphereGeometry args={[0.28, 8, 8]} /><meshBasicMaterial color="#EF4444" /></mesh>)}
      <ArcadeVFXSystem boosting={Boolean(st.activePow === 'jetpack_boost')} />
    </group>
  );
}
