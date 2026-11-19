import {
  isAudioMuted,
  playNoiseBurst,
  playTone,
  setAudioMuted,
  setCombatIntensity,
  setMasterVolume,
  startAmbient,
  stopAmbient,
  updateEngineHum,
  updateWindRush,
} from './audioLoops';

let coinStep = 0;
let lastCoinAt = 0;
let lastStepAt = 0;

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function playCoinChime() {
  const now = performance.now();
  coinStep = now - lastCoinAt < 1200 ? Math.min(PENTATONIC.length - 1, coinStep + 1) : 0;
  lastCoinAt = now;
  const freq = PENTATONIC[coinStep];
  playTone({ freqStart: freq, freqEnd: freq, duration: 0.16, type: 'sine', gain: 0.08 });
  playTone({ freqStart: freq * 2, freqEnd: freq * 2, duration: 0.09, type: 'triangle', gain: 0.03 });
}

function playPowerupFanfare() {
  [392.0, 523.25, 659.25].forEach((f, i) => playTone({ freqStart: f, freqEnd: f * 1.02, duration: 0.2, type: 'triangle', gain: 0.06, delay: i * 0.055 }));
}

export const soundEngine = {
  isMuted: isAudioMuted,
  setMuted: setAudioMuted,
  setMasterVolume,
  startAmbient,
  stopAmbient,
  setCombatIntensity,
  engineHum: updateEngineHum,
  windRush: updateWindRush,
  footstepGravel: (speed = 6) => {
    const pitch = 90 + Math.min(48, speed * 2.1) + (Math.random() - 0.5) * 16;
    playTone({ freqStart: pitch, freqEnd: 46, duration: 0.045, type: 'triangle', gain: 0.028 });
    playNoiseBurst({ duration: 0.035, filterFreq: 1900, type: 'bandpass', gain: 0.022 });
  },
  updateMotionAudio: (speed, isGrounded = true, isVehicle = false, altitude = 0) => {
    if (isVehicle) {
      updateEngineHum(speed);
      if (altitude > 1.5) updateWindRush(speed, altitude);
      return;
    }
    if (!isGrounded || speed < 1.8) return;
    const now = performance.now();
    if (now - lastStepAt < Math.max(190, 440 - speed * 14)) return;
    lastStepAt = now;
    soundEngine.footstepGravel(speed);
  },

  uiClick: () => playTone({ freqStart: 540, freqEnd: 680, duration: 0.055, type: 'sine', gain: 0.05 }),
  swordSlash: () => {
    playNoiseBurst({ duration: 0.13, filterFreq: 2400, type: 'bandpass', gain: 0.075 });
    playTone({ freqStart: 420, freqEnd: 140, duration: 0.11, type: 'triangle', gain: 0.045 });
  },
  laserBolt: () => playTone({ freqStart: 960, freqEnd: 240, duration: 0.095, type: 'triangle', gain: 0.06 }),
  heavyCannon: () => {
    playTone({ freqStart: 260, freqEnd: 54, duration: 0.19, type: 'sawtooth', gain: 0.085 });
    playNoiseBurst({ duration: 0.15, filterFreq: 850, type: 'lowpass', gain: 0.08 });
  },
  woodBuild: () => {
    playTone({ freqStart: 165, freqEnd: 78, duration: 0.09, type: 'triangle', gain: 0.085 });
    playNoiseBurst({ duration: 0.07, filterFreq: 750, type: 'bandpass', gain: 0.055 });
  },
  coinChime: playCoinChime,
  shieldHit: () => {
    playTone({ freqStart: 520, freqEnd: 290, duration: 0.14, type: 'sine', gain: 0.08 });
    playTone({ freqStart: 1080, freqEnd: 780, duration: 0.1, type: 'triangle', gain: 0.04 });
  },
  powerupFanfare: playPowerupFanfare,

  playJump: () => playTone({ freqStart: 220, freqEnd: 460, duration: 0.1, type: 'sine', gain: 0.07 }),
  playLaneWhoosh: () => playNoiseBurst({ duration: 0.09, filterFreq: 1400, type: 'bandpass', gain: 0.055 }),
  playLandThump: () => playTone({ freqStart: 115, freqEnd: 42, duration: 0.11, type: 'sine', gain: 0.09 }),
  playDash: () => playTone({ freqStart: 320, freqEnd: 160, duration: 0.12, type: 'triangle', gain: 0.07 }),
  playShoot: () => soundEngine.laserBolt(),
  playCannonFire: () => soundEngine.heavyCannon(),
  playExplosionBoom: () => {
    playTone({ freqStart: 95, freqEnd: 24, duration: 0.52, type: 'sine', gain: 0.16 });
    playNoiseBurst({ duration: 0.48, filterFreq: 380, type: 'lowpass', gain: 0.12 });
  },
  playFootstep: (s) => soundEngine.footstepGravel(s),
  playHit: () => playTone({ freqStart: 920, freqEnd: 640, duration: 0.045, type: 'sine', gain: 0.06 }),
  playDamage: () => soundEngine.shieldHit(),
  playBoost: playPowerupFanfare,
  playCollect: playCoinChime,
  playHoverboardShatter: () => {
    playTone({ freqStart: 420, freqEnd: 190, duration: 0.22, type: 'triangle', gain: 0.09 });
    playNoiseBurst({ duration: 0.24, filterFreq: 3200, type: 'highpass', gain: 0.08 });
  },
  playKeyUnlock: () => playTone({ freqStart: 440, freqEnd: 880, duration: 0.16, type: 'triangle', gain: 0.07 }),
  playCrumble: () => playTone({ freqStart: 120, freqEnd: 75, duration: 0.11, type: 'triangle', gain: 0.05 }),
  playBounce: () => playTone({ freqStart: 170, freqEnd: 560, duration: 0.17, type: 'triangle', gain: 0.09 }),
  playWin: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone({ freqStart: f, freqEnd: f, duration: 0.34, type: 'triangle', gain: 0.07, delay: i * 0.07 })),
  playHighScoreFanfare: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone({ freqStart: f, freqEnd: f, duration: 0.36, type: 'triangle', gain: 0.08, delay: i * 0.08 })),
  playFail: () => {
    playTone({ freqStart: 196, freqEnd: 146.8, duration: 0.22, type: 'triangle', gain: 0.09 });
    playTone({ freqStart: 130.8, freqEnd: 58, duration: 0.38, type: 'sawtooth', gain: 0.07, delay: 0.14 });
  },
};
