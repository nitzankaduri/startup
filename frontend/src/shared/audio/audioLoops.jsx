let audioCtx = null;
let muted = false;
let masterVol = 0.85;
let engineNode = null;
let windNode = null;
let ambientNodes = null;
let loopDecayTimer = null;

export const isAudioMuted = () => muted;

export function setMasterVolume(val) {
  masterVol = Math.max(0, Math.min(1, Number(val) || 0));
  if (ambientNodes && audioCtx && !muted) {
    ambientNodes.master.gain.setTargetAtTime(0.026 * masterVol, audioCtx.currentTime, 0.08);
  }
}

export function getContext() {
  if (muted || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

export function setAudioMuted(value) {
  muted = Boolean(value);
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  if (muted) {
    if (engineNode) engineNode.gain.gain.setTargetAtTime(0, t, 0.04);
    if (windNode) windNode.gain.gain.setTargetAtTime(0, t, 0.04);
    if (ambientNodes) ambientNodes.master.gain.setTargetAtTime(0, t, 0.06);
  } else if (ambientNodes) ambientNodes.master.gain.setTargetAtTime(0.026 * masterVol, t, 0.25);
}

export function playTone({ freqStart, freqEnd, duration, type = 'sine', gain = 0.08, delay = 0 }) {
  try {
    const ctx = getContext(); if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator(); const amp = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    amp.gain.setValueAtTime(0.001, now); amp.gain.linearRampToValueAtTime(gain * masterVol, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp); amp.connect(ctx.destination); osc.start(now); osc.stop(now + duration + 0.02);
  } catch { /* Ignore */ }
}

export function playNoiseBurst({ duration = 0.12, filterFreq = 1200, type = 'bandpass', gain = 0.06 }) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = filterFreq;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain * masterVol, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    src.connect(filter); filter.connect(amp); amp.connect(ctx.destination);
    src.start(ctx.currentTime);
  } catch { /* Ignore */ }
}

function scheduleLoopFade() {
  clearTimeout(loopDecayTimer);
  loopDecayTimer = setTimeout(() => {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    if (engineNode) engineNode.gain.gain.setTargetAtTime(0, t, 0.12);
    if (windNode) windNode.gain.gain.setTargetAtTime(0, t, 0.12);
  }, 220);
}

export function updateEngineHum(speed = 0) {
  const ctx = getContext();
  if (!ctx) return;
  if (!engineNode) {
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 52;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 210;
    const gain = ctx.createGain(); gain.gain.value = 0;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination); osc.start();
    engineNode = { osc, filter, gain };
  }
  const t = ctx.currentTime;
  const norm = Math.min(1, Math.abs(speed) / 28);
  engineNode.osc.frequency.setTargetAtTime(48 + norm * 92, t, 0.08);
  engineNode.filter.frequency.setTargetAtTime(160 + norm * 420, t, 0.08);
  engineNode.gain.gain.setTargetAtTime(speed > 0.8 ? 0.025 + norm * 0.032 : 0.008, t, 0.08);
  scheduleLoopFade();
}

export function updateWindRush(airSpeed = 0, altitude = 0) {
  const ctx = getContext();
  if (!ctx) return;
  if (!windNode) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = 1.4; filter.frequency.value = 420;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start();
    windNode = { filter, gain };
  }
  const t = ctx.currentTime;
  const spdNorm = Math.min(1, Math.abs(airSpeed) / 32);
  const altNorm = Math.min(1, Math.max(0, altitude) / 35);
  windNode.filter.frequency.setTargetAtTime(360 + spdNorm * 950 + altNorm * 350, t, 0.12);
  windNode.gain.gain.setTargetAtTime(spdNorm * 0.038 + altNorm * 0.014, t, 0.12);
  scheduleLoopFade();
}

export function startAmbient() {
  const ctx = getContext();
  if (!ctx || ambientNodes) return;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
  const master = ctx.createGain(); master.gain.value = 0.001;
  filter.connect(master); master.connect(ctx.destination);
  const freqs = [130.81, 196.0, 246.94];
  const oscs = freqs.map((f) => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o.connect(filter); o.start(); return o;
  });
  master.gain.setTargetAtTime(muted ? 0 : 0.026, ctx.currentTime, 0.6);
  ambientNodes = { oscs, filter, master };
}

export function setCombatIntensity(inCombat = false) {
  if (!ambientNodes || !audioCtx) return;
  const t = audioCtx.currentTime;
  const target = inCombat ? [110.0, 164.81, 233.08] : [130.81, 196.0, 246.94];
  ambientNodes.oscs.forEach((o, i) => o.frequency.setTargetAtTime(target[i], t, 0.45));
  ambientNodes.filter.frequency.setTargetAtTime(inCombat ? 740 : 420, t, 0.45);
}

export function stopAmbient() {
  if (!ambientNodes || !audioCtx) return;
  const ref = ambientNodes;
  ambientNodes = null;
  ref.master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.2);
  setTimeout(() => ref.oscs.forEach((o) => { try { o.stop(); } catch { /* Ignore */ } }), 450);
}
