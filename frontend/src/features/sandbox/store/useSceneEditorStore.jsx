import { create } from 'zustand';
import {
  applyColorToObject, deleteThreeObject, duplicateThreeObject, extractObjectLabel,
} from '../../editor/sceneEditUtils';
import { useGameStore } from './useGameStore';

function buildMeta(obj) {
  if (!obj) return null;
  const gs = useGameStore.getState();
  const isEntity = Boolean(obj.userData?.smartEntity || obj.userData?.playerEntity);
  const defSpeed = obj.userData?.playerEntity
    ? (gs.currentGame?.game_config?.player?.speed ?? 10)
    : (obj.userData?.editSpeed ?? obj.userData?.speed ?? 6);
  const defHp = obj.userData?.playerEntity ? gs.hp : (obj.userData?.editHp ?? obj.userData?.hp ?? 100);
  return {
    uuid: obj.uuid,
    label: extractObjectLabel(obj),
    scale: Number((obj.scale?.x || 1).toFixed(2)),
    rotationDeg: Math.round(((obj.rotation?.y || 0) * 180) / Math.PI),
    speed: Number(Number(defSpeed).toFixed(1)),
    hp: Math.round(Number(defHp)),
    hasEntityStats: isEntity,
    isPlayer: Boolean(obj.userData?.playerEntity),
    color: obj.userData?.editColor || '#D96B27',
  };
}

export const useSceneEditorStore = create((set, get) => ({
  isEditMode: false,
  isPublishOpen: false,
  sceneRootRef: null,
  selectedObject: null,
  selectedMeta: null,
  inspectorTick: 0,

  setPublishOpen: (isPublishOpen) => set({ isPublishOpen }),
  setSceneRootRef: (sceneRootRef) => set({ sceneRootRef }),
  setEditMode: (isEditMode) => {
    if (isEditMode && !useGameStore.getState().hasStarted) useGameStore.getState().startGame();
    set({ isEditMode, ...(!isEditMode ? { selectedObject: null, selectedMeta: null } : {}) });
  },
  toggleEditMode: () => {
    const next = !get().isEditMode;
    get().setEditMode(next);
  },
  selectObject: (obj) => set({ selectedObject: obj, selectedMeta: buildMeta(obj), inspectorTick: get().inspectorTick + 1 }),
  clearSelection: () => set({ selectedObject: null, selectedMeta: null }),

  updateSelectedScale: (val) => {
    const obj = get().selectedObject;
    if (!obj) return;
    const s = Math.max(0.25, Math.min(4.0, Number(val) || 1));
    obj.scale.setScalar(s);
    set((st) => ({ selectedMeta: buildMeta(obj), inspectorTick: st.inspectorTick + 1 }));
  },

  updateSelectedRotationDeg: (deg) => {
    const obj = get().selectedObject;
    if (!obj) return;
    obj.rotation.y = (Number(deg) * Math.PI) / 180;
    set((st) => ({ selectedMeta: buildMeta(obj), inspectorTick: st.inspectorTick + 1 }));
  },

  updateSelectedStats: ({ speed, hp }) => {
    const obj = get().selectedObject;
    if (!obj) return;
    if (speed !== undefined) {
      obj.userData.editSpeed = Number(speed);
      if (obj.userData?.playerEntity) useGameStore.getState().updatePhysicsParams({ speed: Number(speed) });
    }
    if (hp !== undefined) {
      obj.userData.editHp = Number(hp);
      obj.userData?.setHp?.(Number(hp));
      if (obj.userData?.playerEntity) useGameStore.setState({ hp: Number(hp), maxHp: Math.max(Number(hp), 100) });
    }
    set((st) => ({ selectedMeta: buildMeta(obj), inspectorTick: st.inspectorTick + 1 }));
  },

  applySelectedColor: (hex) => {
    const obj = get().selectedObject;
    if (!obj) return;
    obj.userData.editColor = hex;
    applyColorToObject(obj, hex);
    set((st) => ({ selectedMeta: buildMeta(obj), inspectorTick: st.inspectorTick + 1 }));
  },

  duplicateSelected: () => {
    const clone = duplicateThreeObject(get().selectedObject);
    if (clone) set((st) => ({ selectedObject: clone, selectedMeta: buildMeta(clone), inspectorTick: st.inspectorTick + 1 }));
  },

  deleteSelected: () => {
    deleteThreeObject(get().selectedObject);
    set((st) => ({ selectedObject: null, selectedMeta: null, inspectorTick: st.inspectorTick + 1 }));
  },
}));
