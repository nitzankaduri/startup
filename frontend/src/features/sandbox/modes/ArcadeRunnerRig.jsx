import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { MotionRig } from '../components/MotionRig';
import { PlayerMesh } from '../components/PlayerMesh';
import { touchInput } from '../hooks/touchInputState';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { addImpactTrauma, isPowerupActive, motionBus, triggerJumpMotion, triggerLandMotion } from '../sdk/spawnSdk';
import { createTrackChunks, stepRunnerCollisions } from './trackChunks';
import { useGameStore } from '../store/useGameStore';
import { RunnerWorldStream } from './RunnerWorldStream';

const DURATIONS = { jetpack: 8000, magnet: 10000, sneakers: 10000, multiplier: 10000 };

export function ArcadeRunnerRig({ playerConfig, groundColor }) {
  const playerGroupRef = useRef(null);
  const velRef = useRef({ vx: 0, vz: -12 });
  const groundDistRef = useRef(0.1);
  const chunksRef = useRef(createTrackChunks(10, -24, 24));
  const nearMissedIds = useRef(new Set());
  const keysRef = useKeyboardInput();
  const stateRef = useRef({
    x: 0, y: 0.75, z: 0, vy: 0, lane: 0, speed: 12.5, prevL: false, prevR: false, prevUp: false,
    prevDown: false, lastGround: 0, jumpBuf: 0, rollUntil: 0, slowMoUntil: 0, graceUntil: 0, crashAt: 0, lastHud: 0,
  });

  const gameState = useGameStore((s) => s.gameState);
  const activatePowerup = useGameStore((s) => s.activatePowerup);
  const shatterHoverboard = useGameStore((s) => s.shatterHoverboard);
  const registerNearMiss = useGameStore((s) => s.registerNearMiss);
  const addRunnerPoints = useGameStore((s) => s.addRunnerPoints);
  const collectItem = useGameStore((s) => s.collectItem);
  const setTelemetry = useGameStore((s) => s.setTelemetry);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);

  useEffect(() => {
    let sx = 0; let sy = 0;
    const onStart = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - sx; const dy = e.changedTouches[0].clientY - sy;
      const r = stateRef.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 28) r.lane = THREE.MathUtils.clamp(r.lane + (dx > 0 ? 1 : -1), -1, 1);
      else if (dy < -28) r.jumpBuf = performance.now();
      else if (dy > 28) r.rollUntil = performance.now() + 650;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, []);

  useFrame((_, rawDelta) => {
    const now = performance.now();
    const s = stateRef.current;
    if (gameState !== 'playing') return;
    if (s.crashAt > 0) {
      if (now >= s.crashAt) { s.crashAt = 0; triggerGameOver(true); }
      return;
    }
    const dt = Math.min(0.05, rawDelta) * (now < s.slowMoUntil ? 0.35 : 1);

    const k = keysRef.current;
    const goL = k.left || touchInput.moveX < -0.45; const goR = k.right || touchInput.moveX > 0.45;
    const goUp = k.jump || k.forward || touchInput.jump; const goDown = k.backward || touchInput.moveZ > 0.55;
    if (goL && !s.prevL && s.lane > -1) { s.lane -= 1; soundEngine.playLaneWhoosh(); }
    if (goR && !s.prevR && s.lane < 1) { s.lane += 1; soundEngine.playLaneWhoosh(); }
    if (goUp && !s.prevUp) s.jumpBuf = now;
    if (goDown && !s.prevDown) { if (s.y > 0.85) s.vy = -26; s.rollUntil = now + 650; soundEngine.playDash(); }
    s.prevL = goL; s.prevR = goR; s.prevUp = goUp; s.prevDown = goDown;

    const jetpack = isPowerupActive('jetpack');
    const magnet = isPowerupActive('magnet');
    const sneakers = isPowerupActive('sneakers');
    s.speed = Math.min(27, s.speed + dt * 0.28);

    const prevX = s.x; const targetX = s.lane * 3.2;
    s.x = THREE.MathUtils.lerp(s.x, targetX, 1 - Math.exp(-16 * dt));
    const vx = (s.x - prevX) / Math.max(0.001, dt);
    s.z -= s.speed * (jetpack ? 1.35 : 1) * dt;

    let groundY = 0.75;
    if (jetpack) {
      s.y = THREE.MathUtils.lerp(s.y, 6.2, 1 - Math.exp(-6 * dt));
      s.vy = 0;
    } else {
      s.vy -= 34 * dt; s.y += s.vy * dt;
      for (const ch of chunksRef.current) {
        for (const o of ch.obstacles) {
          if (Math.abs(s.x - o.x) < o.w * 0.52 && Math.abs(s.z - o.z) < o.d * 0.52) {
            const topY = o.y + o.h * 0.5 + 0.72;
            if (o.climbable && s.y >= topY - 0.55 && s.vy <= 0.5) groundY = Math.max(groundY, topY);
          }
        }
      }
      if (s.y <= groundY + 0.04) {
        if (!motionBus.isGrounded && s.vy < -3) triggerLandMotion(s.x, s.y, s.z);
        s.y = groundY; s.vy = 0; s.lastGround = now;
      }
      if (now - s.jumpBuf <= 120 && now - s.lastGround <= 120) {
        s.vy = sneakers ? 18.8 : 13.6; s.jumpBuf = 0; s.lastGround = 0; s.rollUntil = 0;
        triggerJumpMotion(); soundEngine.playJump();
      }
    }

    const isRolling = !jetpack && now < s.rollUntil;
    const crashed = stepRunnerCollisions({
      chunks: chunksRef.current, s, dt, isRolling, magnetActive: magnet, jetpackActive: jetpack, shieldGraceUntil: s.graceUntil, now,
      nearMissedIds: nearMissedIds.current, onCoin: (c) => collectItem(c.id, [c.x, c.y, c.z], '#E5B869'),
      onPowerup: (p) => {
        activatePowerup(p.type, DURATIONS[p.type] || 8000);
        if (p.type === 'jetpack') chunksRef.current.forEach((ch) => ch.coins.forEach((c) => { if (c.z < s.z) c.y = 6.2; }));
      },
      onNearMiss: registerNearMiss,
    });

    if (crashed) {
      if (isPowerupActive('hoverboard')) {
        shatterHoverboard();
        s.slowMoUntil = now + 420; s.graceUntil = now + 1300; addImpactTrauma(0.7);
        chunksRef.current.forEach((ch) => ch.obstacles.forEach((o) => { if (Math.abs(o.z - s.z) < 15) o.blasted = true; }));
      } else {
        addImpactTrauma(0.95); s.crashAt = now + 120; return;
      }
    }

    playerGroupRef.current?.position.set(s.x, s.y, s.z);
    velRef.current = { vx, vz: -s.speed };
    groundDistRef.current = Math.max(0, s.y - groundY);
    Object.assign(motionBus, {
      pos: { x: s.x, y: s.y, z: s.z }, vel: { x: vx, y: s.vy, z: -s.speed },
      steer: THREE.MathUtils.clamp((targetX - s.x) * 0.5, -1, 1),
      isGrounded: s.y <= groundY + 0.08, isRolling, isBoosting: jetpack || s.speed > 18,
    });

    if (now - s.lastHud > 120) { s.lastHud = now; addRunnerPoints(Math.round(s.speed * 0.6)); setTelemetry({ speedKmh: Math.round(s.speed * 5.2) }); }
  });

  return (
    <>
      <RunnerWorldStream chunksRef={chunksRef} groundColor={groundColor} />
      <group ref={playerGroupRef} position={[0, 0.75, 0]}>
        <MotionRig><PlayerMesh color={playerConfig?.color} velRef={velRef} groundDistRef={groundDistRef} /></MotionRig>
      </group>
    </>
  );
}
