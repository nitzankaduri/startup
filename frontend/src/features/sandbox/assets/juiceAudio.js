import { isAudioMuted, updateEngineHum } from '../../../shared/audio/audioLoops';
import { motionBus } from '../sdk/motionBus';

let ctx = null;
let unlocked = false;
let coinIdx = 0;
let lastCoinAt = 0;
let lastScreechAt = 0;
const CHIMES = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

/** Lazily obtain and unlock Web Audio context on first user gesture/keypress. */
export function unlockSpatialAudio() {
  if (isAudioMuted() || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  unlocked = ctx.state === 'running';
  return ctx;
}

/** Attach one-time keydown + pointerdown unlock listeners and return cleanup. */
export function bindAudioUnlockOnKeypress() {
  if (typeof window === 'undefined') return () => {};
  const wake = () => unlockSpatialAudio();
  window.addEventListener('keydown', wake, { once: true });
  window.addEventListener('pointerdown', wake, { once: true });
  return () => {
    window.removeEventListener('keydown', wake);
    window.removeEventListener('pointerdown', wake);
  };
}

function connectSpatial(node, audio, worldPos) {
  if (!worldPos || typeof audio.createStereoPanner !== 'function') {
    node.connect(audio.destination);
    return 1;
  }
  const lp = motionBus.pos || { x: 0, y: 0, z: 0 };
  const yaw = motionBus.yaw || 0;
  const dx = (worldPos[0] || 0) - lp.x;
  const dz = (worldPos[2] || 0) - lp.z;
  const rightProj = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  const dist = Math.hypot(dx, dz);
  const panner = audio.createStereoPanner();
  panner.pan.value = Math.max(-0.85, Math.min(0.85, rightProj / 16));
  node.connect(panner);
  panner.connect(audio.destination);
  return 1 / (1 + dist * 0.05);
}

export function sfxEngineHum(speed = 0, boosting = false) {
  if (!unlocked && !ctx) return;
  updateEngineHum(boosting ? Math.max(22, speed * 1.35) : speed);
}

export function sfxCoinChime(worldPos) {
  const audio = unlockSpatialAudio();
  if (!audio) return;
  const nowMs = performance.now();
  coinIdx = nowMs - lastCoinAt < 1100 ? Math.min(CHIMES.length - 1, coinIdx + 1) : 0;
  lastCoinAt = nowMs;
  const t = audio.currentTime;
  const f = CHIMES[coinIdx];
  [1, 1.5].forEach((mul, i) => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(f * mul, t);
    const atten = connectSpatial(g, audio, worldPos);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime((i === 0 ? 0.08 : 0.035) * atten, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

export function sfxDriftScreech(intensity = 0.6, worldPos) {
  const audio = unlockSpatialAudio();
  if (!audio) return;
  const nowMs = performance.now();
  if (nowMs - lastScreechAt < 95) return;
  lastScreechAt = nowMs;
  const t = audio.currentTime;
  const len = Math.floor(audio.sampleRate * 0.11);
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) ch[i] = (Math.random() * 2 - 1) * 0.8;
  const src = audio.createBufferSource();
  src.buffer = buf;
  const bp = audio.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1850 + intensity * 650; bp.Q.value = 4.2;
  const g = audio.createGain();
  const atten = connectSpatial(g, audio, worldPos);
  g.gain.setValueAtTime(0.048 * Math.min(1, intensity) * atten, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  src.connect(bp); bp.connect(g); src.start(t);
}

export function sfxCrashThud(speed = 10, worldPos) {
  const audio = unlockSpatialAudio();
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(118, t);
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.18);
  const atten = connectSpatial(g, audio, worldPos);
  g.gain.setValueAtTime(Math.min(0.18, 0.06 + speed * 0.005) * atten, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(g); osc.start(t); osc.stop(t + 0.22);
}
