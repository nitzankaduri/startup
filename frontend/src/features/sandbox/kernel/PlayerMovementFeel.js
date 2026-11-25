import * as THREE from 'three';
import { playArcadeSfx } from './ArcadeSoundEngine';
import { emitArcadeVfx } from './ArcadeVFXSystem';

export function bindKernelKeys(keysRef, clickRef) {
  const nav = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const down = (e) => {
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) && nav.has(e.code)) e.preventDefault();
    keysRef.current[e.code] = true;
  };
  const up = (e) => { keysRef.current[e.code] = false; };
  const mdown = (e) => { if (!e.target?.closest?.('button,aside,input,select')) clickRef.current = true; };
  window.addEventListener('keydown', down, { passive: false });
  window.addEventListener('keyup', up);
  window.addEventListener('pointerdown', mdown);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('pointerdown', mdown);
  };
}

export function createFeelState() {
  return {
    jumpBufUntil: 0, laneBufDir: 0, laneBufUntil: 0, slideUntil: 0, lastDustAt: 0,
    prevDown: false, prevJump: false, prevL: false, prevR: false, prevRoll: false, slamming: false,
    bankRoll: 0, sx: 1, sy: 1, sz: 1, wasGrounded: true,
  };
}

export function stepPlayerFeel({ st, feel, keys, playerMeshGroup, dt, now, onLandShockwave }) {
  const goL = Boolean(keys.KeyA || keys.ArrowLeft);
  const goR = Boolean(keys.KeyD || keys.ArrowRight);
  const canJump = st.isRunner || (st.isSandbox && st.inVehicleIdx < 0);
  const goJ = canJump ? Boolean(keys.Space || (st.isRunner && (keys.KeyW || keys.ArrowUp))) : false;
  const goD = st.isRunner ? Boolean(keys.KeyS || keys.ArrowDown) : false;
  const goRoll = st.isSky ? Boolean(keys.KeyQ || keys.KeyE) : false;

  if (goJ && !feel.prevJump) feel.jumpBufUntil = now + 120;
  if (goL && !feel.prevL) { feel.laneBufDir = -1; feel.laneBufUntil = now + 120; }
  if (goR && !feel.prevR) { feel.laneBufDir = 1; feel.laneBufUntil = now + 120; }

  const isGround = st.isSky ? false : st.py <= (st.groundY || 1.0) + 0.05;

  if (st.isRunner && now <= feel.laneBufUntil && feel.laneBufDir !== 0) {
    const next = Math.max(-1, Math.min(1, st.lane + feel.laneBufDir));
    if (next !== st.lane) { st.prevLane = st.lane; st.lane = next; }
    feel.laneBufUntil = 0;
  }

  if (canJump && now <= feel.jumpBufUntil && (isGround || st.jumpsLeft > 0)) {
    st.vy = st.jumpPower || 13.0;
    st.jumpsLeft = isGround ? (st.doubleJump ? 1 : 0) : Math.max(0, st.jumpsLeft - 1);
    feel.jumpBufUntil = 0; feel.slamming = false; feel.slideUntil = 0;
    feel.sx = 0.82; feel.sy = 1.25; feel.sz = 0.82;
    emitArcadeVfx('dust', st.px, st.groundY - 0.8, st.pz, 6);
    playArcadeSfx('jump');
  }

  if (st.isRunner && goD && !feel.prevDown) {
    if (!isGround) { st.vy = -34; feel.slamming = true; }
    else feel.slideUntil = now + 550;
  }

  if (st.isSky && goRoll && !feel.prevRoll && now > st.barrelRollUntil) {
    st.barrelRollUntil = now + 420;
    st.invulnUntil = Math.max(st.invulnUntil || 0, now + 450);
    playArcadeSfx('jump');
  }

  if (isGround && now - feel.lastDustAt > 240 && !st.isSky) {
    feel.lastDustAt = now;
    emitArcadeVfx('dust', st.px, st.groundY - 0.85, st.pz + 0.3, 2);
  }
  feel.sliding = st.isRunner && now < feel.slideUntil;
  feel.prevL = goL; feel.prevR = goR; feel.prevJump = goJ; feel.prevDown = goD; feel.prevRoll = goRoll;

  const landedNow = !st.isSky && !feel.wasGrounded && st.py <= (st.groundY || 1.0) + 0.05 && st.vy <= 0;
  if (landedNow) {
    feel.sx = 1.22; feel.sy = 0.78; feel.sz = 1.22;
    if (feel.slamming) {
      feel.slamming = false; st.shake = Math.max(st.shake || 0, 0.35);
      onLandShockwave?.(st.px, st.py, st.pz);
    }
  }
  feel.wasGrounded = isGround;

  let targetRoll = 0;
  if (st.isRunner) targetRoll = THREE.MathUtils.clamp((st.px - st.lane * 3.2) * 0.14, -0.32, 0.32);
  else if (st.isSky) {
    targetRoll = now < st.barrelRollUntil ? ((st.barrelRollUntil - now) / 420) * Math.PI * 2 : THREE.MathUtils.clamp(-st.vx * 0.035, -0.55, 0.55);
  } else if (st.isPursuit) {
    targetRoll = THREE.MathUtils.clamp(st.steerVel * 0.014, -0.18, 0.18);
  }

  feel.bankRoll = now < st.barrelRollUntil ? targetRoll : THREE.MathUtils.lerp(feel.bankRoll, targetRoll, 1 - Math.exp(-14 * dt));
  const spring = 1 - Math.exp(-18 * dt);
  feel.sx = THREE.MathUtils.lerp(feel.sx, 1, spring);
  feel.sy = THREE.MathUtils.lerp(feel.sy, 1, spring);
  feel.sz = THREE.MathUtils.lerp(feel.sz, 1, spring);

  if (playerMeshGroup) {
    playerMeshGroup.rotation.z = feel.bankRoll;
    playerMeshGroup.scale.set(feel.sx, feel.sy, feel.sz);
  }
}
