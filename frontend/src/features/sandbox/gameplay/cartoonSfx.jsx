import { isAudioMuted } from '../../../shared/audio/audioLoops';

let ctx = null;
let coinIdx = 0;
let lastCoinAt = 0;
const DING_NOTES = [659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

/** Unlock Web Audio context cleanly on first keypress or pointerdown. */
export function unlockArcadeAudio() {
  if (isAudioMuted() || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function bindArcadeUnlock() {
  if (typeof window === 'undefined') return () => {};
  const wake = () => unlockArcadeAudio();
  window.addEventListener('keydown', wake, { once: true });
  window.addEventListener('pointerdown', wake, { once: true });
  return () => {
    window.removeEventListener('keydown', wake);
    window.removeEventListener('pointerdown', wake);
  };
}

function tone(freq0, freq1, dur, type = 'triangle', gain = 0.08, delay = 0, pan = 0) {
  const c = unlockArcadeAudio();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq0, t);
  if (freq1) osc.frequency.exponentialRampToValueAtTime(Math.max(24, freq1), t + dur);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (pan && typeof c.createStereoPanner === 'function') {
    const p = c.createStereoPanner(); p.pan.value = Math.max(-0.85, Math.min(0.85, pan));
    osc.connect(g); g.connect(p); p.connect(c.destination);
  } else {
    osc.connect(g); g.connect(c.destination);
  }
  osc.start(t); osc.stop(t + dur + 0.02);
}

export function sfxCoinDing(stepHint = -1) {
  const now = performance.now();
  coinIdx = stepHint >= 0 ? stepHint % DING_NOTES.length : (now - lastCoinAt < 1000 ? Math.min(DING_NOTES.length - 1, coinIdx + 1) : 0);
  lastCoinAt = now;
  const f = DING_NOTES[coinIdx];
  tone(f, f * 1.02, 0.14, 'sine', 0.09);
  tone(f * 2, f * 2, 0.08, 'triangle', 0.04, 0.015);
}

export function sfxWhooshJump() {
  tone(210, 560, 0.14, 'sine', 0.08);
  tone(420, 880, 0.09, 'triangle', 0.035, 0.02);
}

export function sfxLaneSwipe(dir = 0) {
  const c = unlockArcadeAudio();
  if (!c) return;
  const t = c.currentTime;
  const len = Math.floor(c.sampleRate * 0.08);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1450; bp.Q.value = 1.6;
  const g = c.createGain(); g.gain.setValueAtTime(0.065, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  src.connect(bp); bp.connect(g);
  if (typeof c.createStereoPanner === 'function') {
    const p = c.createStereoPanner(); p.pan.value = Math.max(-0.6, Math.min(0.6, dir * 0.45));
    g.connect(p); p.connect(c.destination);
  } else g.connect(c.destination);
  src.start(t);
}

export function sfxComboChime() {
  [523.25, 659.25, 987.77].forEach((f, i) => tone(f, f * 1.01, 0.18, 'triangle', 0.065, i * 0.05));
}

export function sfxCrashStars() {
  tone(150, 38, 0.24, 'sawtooth', 0.11);
  tone(480, 120, 0.18, 'triangle', 0.08, 0.02);
}
