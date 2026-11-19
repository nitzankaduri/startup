import { create } from 'zustand';
import { soundEngine } from '../../../shared/audio/soundEngine';

const STORAGE_KEY = 'spawn-settings';

export const QUALITY_PRESETS = {
  low: { label: 'Low', desc: 'Fast native WebGL · 1024px shadows · No PostFX', dpr: [1, 1], shadowRes: 1024, postFx: false },
  balanced: { label: 'Balanced', desc: 'DPR 1.5x · 1024px · Bloom + ACES Filmic', dpr: [1, 1.5], shadowRes: 1024, postFx: true },
  ultra: { label: 'Ultra', desc: 'DPR 2x · 2048px · Crisp Bloom + ACES Filmic', dpr: [1, 2], shadowRes: 2048, postFx: true },
};

function loadInitial() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      quality: QUALITY_PRESETS[raw.quality] ? raw.quality : 'balanced',
      cameraSensitivity: typeof raw.cameraSensitivity === 'number' ? raw.cameraSensitivity : 1.0,
      masterVolume: typeof raw.masterVolume === 'number' ? raw.masterVolume : 0.85,
      dofEnabled: typeof raw.dofEnabled === 'boolean' ? raw.dofEnabled : true,
    };
  } catch {
    return { quality: 'balanced', cameraSensitivity: 1.0, masterVolume: 0.85, dofEnabled: true };
  }
}

const init = loadInitial();
soundEngine.setMasterVolume?.(init.masterVolume);

const persist = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      quality: state.quality,
      cameraSensitivity: state.cameraSensitivity,
      masterVolume: state.masterVolume,
      dofEnabled: state.dofEnabled,
    }));
  } catch { /* Ignore */ }
};

export const useSettingsStore = create((set, get) => ({
  ...init,
  isPaused: false,
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setPaused: (isPaused) => set({ isPaused }),
  setDofEnabled: (dofEnabled) => { set({ dofEnabled }); persist(get()); },
  setQuality: (quality) => {
    if (!QUALITY_PRESETS[quality]) return;
    set({ quality });
    persist(get());
  },
  setCameraSensitivity: (cameraSensitivity) => {
    set({ cameraSensitivity });
    persist(get());
  },
  setMasterVolume: (masterVolume) => {
    soundEngine.setMasterVolume?.(masterVolume);
    set({ masterVolume });
    persist(get());
  },
}));
