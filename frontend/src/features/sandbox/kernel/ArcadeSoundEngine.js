import { useGameStore } from '../store/useGameStore';

let CTX = null;

function ensureCtx() {
  if (typeof window === 'undefined' || useGameStore.getState().isMuted) return null;
  if (!CTX) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    CTX = new AudioCtx();
  }
  if (CTX.state === 'suspended') CTX.resume().catch(() => {});
  return CTX;
}

function tone(ctx, freq, endFreq, dur, type = 'triangle', gain = 0.12, delay = 0) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.01);
}

/** Zero-dependency procedural Web Audio arcade SFX synthesizer with mute & combo pitch support. */
export function playArcadeSfx(kind, combo = 1) {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (kind === 'jump') return tone(ctx, 240, 520, 0.14, 'triangle', 0.12);
  if (kind === 'shoot') return tone(ctx, 720, 220, 0.09, 'square', 0.07);
  if (kind === 'coin') {
    const base = 760 + Math.min(8, combo) * 45;
    tone(ctx, base, base * 1.25, 0.08, 'sine', 0.11, 0);
    return tone(ctx, base * 1.35, base * 1.5, 0.1, 'sine', 0.1, 0.05);
  }
  if (kind === 'powerup') {
    [440, 554, 659, 880].forEach((f, i) => tone(ctx, f, f, 0.09, 'triangle', 0.1, i * 0.05));
    return;
  }
  if (kind === 'hit') return tone(ctx, 160, 55, 0.18, 'sawtooth', 0.16);
  if (kind === 'explosion') {
    tone(ctx, 190, 42, 0.28, 'sawtooth', 0.16, 0);
    return tone(ctx, 120, 35, 0.3, 'triangle', 0.14, 0.03);
  }
  if (kind === 'boss_warning') {
    tone(ctx, 220, 180, 0.22, 'sawtooth', 0.14, 0);
    return tone(ctx, 220, 180, 0.22, 'sawtooth', 0.14, 0.26);
  }
  if (kind === 'victory') {
    [523, 659, 784, 1046].forEach((f, i) => tone(ctx, f, f, 0.18, 'triangle', 0.13, i * 0.09));
  }
}
