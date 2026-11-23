import * as THREE from 'three';
import { getStudioMatcapMaterial } from './StudioShaderPool';

const UNIT_GEOS = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(0.5, 12, 10),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  torus: new THREE.TorusGeometry(0.5, 0.16, 8, 16),
};
const TEMPLATE_CACHE = new Map();

/**
 * Assembles any custom 3D creature, boss, or vehicle from a parts[] blueprint array,
 * caching templates by hash for instant zero-allocation cloning.
 */
export function buildFromParts(parts, defaultColor = '#D96B27') {
  if (!Array.isArray(parts) || !parts.length) return null;
  const key = `${defaultColor}|${JSON.stringify(parts)}`;
  if (TEMPLATE_CACHE.has(key)) return TEMPLATE_CACHE.get(key).clone();

  const root = new THREE.Group();
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i];
    if (!p) continue;
    const geo = UNIT_GEOS[p.shape] || UNIT_GEOS.box;
    const mat = getStudioMatcapMaterial(p.color || defaultColor, p.metallic ? 'toon_metallic' : 'toon_vibrant');
    const mesh = new THREE.Mesh(geo, mat);
    if (Array.isArray(p.pos)) mesh.position.set(p.pos[0] || 0, p.pos[1] || 0, p.pos[2] || 0);
    if (Array.isArray(p.scale)) mesh.scale.set(p.scale[0] || 1, p.scale[1] || 1, p.scale[2] || 1);
    if (Array.isArray(p.rot)) mesh.rotation.set(p.rot[0] || 0, p.rot[1] || 0, p.rot[2] || 0);
    if (p.anim) {
      mesh.userData.animType = p.anim;
      mesh.userData.baseY = mesh.position.y;
    }
    root.add(mesh);
  }
  if (TEMPLATE_CACHE.size < 128) TEMPLATE_CACHE.set(key, root);
  return root.clone();
}

/** Zero-allocation in-place animation driver for parts marked with anim: flap|spin|bob|wheel. */
export function animateComposedParts(group, t, speed = 8) {
  if (!group?.children) return;
  for (let i = 0; i < group.children.length; i += 1) {
    const c = group.children[i];
    const a = c.userData?.animType;
    if (!a) continue;
    if (a === 'flap') c.rotation.z = Math.sin(t * speed) * 0.48;
    else if (a === 'spin') c.rotation.y = t * speed * 0.6;
    else if (a === 'bob') c.position.y = (c.userData.baseY || 0) + Math.sin(t * speed * 0.7) * 0.14;
    else if (a === 'wheel') c.rotation.x = t * speed * 1.4;
  }
}
