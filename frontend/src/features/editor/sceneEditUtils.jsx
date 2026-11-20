import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { registerCollider } from '../sandbox/sdk/runtime/useArenaPhysics';

export const SWATCH_PALETTE = [
  { name: 'Terracotta', hex: '#D96B27' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Sandstone', hex: '#C89D72' },
  { name: 'Sage', hex: '#4E7052' },
  { name: 'Ochre', hex: '#E5B869' },
  { name: 'Burgundy', hex: '#883634' },
  { name: 'Obsidian', hex: '#27272A' },
  { name: 'Ivory', hex: '#EDE8DF' },
];

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

/** Walk up from raycast hit mesh to the direct editable prop/entity node under `rootGroup`, skipping giant terrain/sky. */
export function findEditableAncestor(hitObj, rootGroup) {
  if (!hitObj || !rootGroup) return null;
  let cur = hitObj;
  let candidate = null;
  while (cur && cur !== rootGroup) {
    if (cur.userData?.ignoreEditSelect) return null;
    if (cur.parent === rootGroup || cur.userData?.smartEntity || cur.userData?.playerEntity || cur.userData?.studioProp) {
      candidate = cur;
      if (cur.userData?.smartEntity || cur.userData?.playerEntity || cur.userData?.studioProp) break;
    }
    cur = cur.parent;
  }
  if (!candidate) return null;
  if (candidate.isPoints || candidate.isInstancedMesh) return null;
  _box.setFromObject(candidate);
  if (_box.isEmpty()) return null;
  _box.getSize(_size);
  if (Math.max(_size.x, _size.z) > 42 || (_size.x > 30 && _size.y < 1.2 && _size.z > 30)) return null;
  return candidate;
}

export function extractObjectLabel(obj) {
  if (!obj) return 'Object';
  if (obj.userData?.entityLabel) return String(obj.userData.entityLabel);
  if (obj.userData?.smartEntity) return 'AI Entity';
  if (obj.userData?.playerEntity) return 'Player Rig';
  if (obj.name) return obj.name;
  return '3D Prop';
}

export function applyColorToObject(obj, hex) {
  if (!obj) return;
  obj.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const nextMats = mats.map((m) => {
      if (!m?.color) return m;
      if (m.transparent && m.opacity < 0.7) return m;
      const cloned = m.userData?._editCloned ? m : m.clone();
      cloned.userData = { ...cloned.userData, _editCloned: true };
      cloned.color.set(hex);
      return cloned;
    });
    child.material = Array.isArray(child.material) ? nextMats : nextMats[0];
  });
}

export function duplicateThreeObject(obj) {
  if (!obj || !obj.parent) return null;
  let clone = null;
  try { clone = SkeletonUtils.clone(obj); } catch { clone = obj.clone(true); }
  clone.position.set(obj.position.x + 2.4, obj.position.y, obj.position.z + 1.8);
  clone.userData = { ...obj.userData, _isDuplicate: true };
  obj.parent.add(clone);
  _box.setFromObject(clone);
  _box.getSize(_size);
  const rad = Math.max(0.5, Math.min(4.5, Math.max(_size.x, _size.z) * 0.45));
  registerCollider(`dup-${clone.uuid}`, { x: clone.position.x, z: clone.position.z, radius: rad }, 'circle');
  return clone;
}

export function deleteThreeObject(obj) {
  if (!obj) return;
  obj.visible = false;
  obj.traverse((c) => { c.raycast = () => {}; });
  if (obj.parent) obj.parent.remove(obj);
}
