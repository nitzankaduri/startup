import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { applyStudioMatcap, getStudioMatcapMaterial } from './StudioShaderPool';

function findBone(root, candidates) {
  let found = null;
  root.traverse((o) => {
    if (found || (!o.isBone && !o.name)) return;
    const low = o.name.toLowerCase();
    if (candidates.some((c) => low.includes(c))) found = o;
  });
  return found;
}

function buildAccessory(kind, accent = '#D96B27') {
  const grp = new THREE.Group();
  const matDark = getStudioMatcapMaterial('#1E1B4B', 'toon_vibrant');
  const matAcc = getStudioMatcapMaterial(accent, 'toon_metallic');
  if (kind === 'pirate_hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 10), matDark);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.24, 6), matAcc);
    crown.position.y = 0.14; grp.add(brim, crown);
  } else if (kind === 'astronaut_helmet') {
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), getStudioMatcapMaterial('#38BDF8', 'toon_metallic')));
  } else if (kind === 'crown') {
    grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.16, 6), getStudioMatcapMaterial('#FBBF24', 'toon_metallic')));
  } else if (kind === 'horns') {
    [-0.16, 0.16].forEach((x) => {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), matAcc);
      h.position.set(x, 0.1, 0); h.rotation.z = x < 0 ? 0.35 : -0.35; grp.add(h);
    });
  } else if (kind === 'laser_blaster' || kind === 'cannon') {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.55), matAcc);
    barrel.position.set(0, 0, 0.25); grp.add(barrel);
  } else if (kind === 'sword' || kind === 'staff') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), matAcc);
    blade.position.set(0, 0.38, 0.1); grp.add(blade);
  } else if (kind === 'wings') {
    [-0.36, 0.36].forEach((x) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.06), matAcc);
      w.position.set(x, 0.05, -0.15); w.rotation.z = x < 0 ? 0.3 : -0.3; grp.add(w);
    });
  } else {
    [-0.12, 0.12].forEach((x) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), matAcc);
      t.position.set(x, 0, -0.18); grp.add(t);
    });
  }
  return grp;
}

/**
 * Wraps SkeletonUtils.clone + AnimationMixer (0.15s crossFadeTo) and modular bone sockets.
 */
export function createAnimatedRig(gltfScene, animations = [], options = {}) {
  const root = SkeletonUtils.clone(gltfScene);
  applyStudioMatcap(root, options.color || null, options.matcap || 'toon_vibrant');
  const box = new THREE.Box3().setFromObject(root);
  const h = Math.max(0.1, box.max.y - box.min.y);
  const scale = (options.targetHeight || 1.75) / h;
  root.scale.setScalar(scale);
  root.position.y = -box.min.y * scale;

  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  const mapClip = (target, keys) => {
    const clip = animations.find((a) => keys.some((k) => a.name.toLowerCase().includes(k)));
    if (clip) actions[target] = mixer.clipAction(clip);
  };
  mapClip('run', ['sprint', 'run', 'walk']);
  mapClip('idle', ['idle', 'survey', 'static']);
  mapClip('jump', ['jump', 'fall']);
  mapClip('attack', ['attack', 'punch', 'shoot']);
  const current = actions.run || actions.idle || (animations[0] ? mixer.clipAction(animations[0]) : null);
  current?.play();

  const attachToSocket = (kind, candidates, fallbackPos) => {
    if (!kind || kind === 'none') return;
    const node = buildAccessory(kind, options.accentColor || '#D96B27');
    const bone = findBone(root, candidates);
    if (bone) bone.add(node);
    else { node.position.set(...fallbackPos); root.add(node); }
  };
  attachToSocket(options.headAccessory, ['head'], [0, 1.55 / scale, 0]);
  attachToSocket(options.handWeapon, ['righthand', 'hand-r', 'arm-right'], [0.4 / scale, 0.9 / scale, 0.25 / scale]);
  attachToSocket(options.backProp, ['torso', 'spine', 'chest'], [0, 1.0 / scale, -0.25 / scale]);

  return { root, mixer, actions, activeAction: current, currentState: 'run' };
}

export function stepAnimatedRig(rigCtrl, nextState, dt) {
  if (!rigCtrl) return;
  rigCtrl.mixer.update(dt);
  if (nextState && nextState !== rigCtrl.currentState) {
    const nextAct = rigCtrl.actions[nextState] || rigCtrl.actions.run || rigCtrl.actions.idle;
    if (nextAct && nextAct !== rigCtrl.activeAction) {
      nextAct.reset().play();
      if (rigCtrl.activeAction) rigCtrl.activeAction.crossFadeTo(nextAct, 0.15, true);
      rigCtrl.activeAction = nextAct;
    }
    rigCtrl.currentState = nextState;
  }
}

export function applySquashStretch(obj, vy, wasGrounded, isGrounded) {
  if (!obj) return;
  if (!wasGrounded && isGrounded) obj.scale.set(1.24, 0.72, 1.24);
  else if (!isGrounded && vy > 4) obj.scale.set(0.84, 1.22, 0.84);
  else {
    obj.scale.x += (1 - obj.scale.x) * 0.22;
    obj.scale.y += (1 - obj.scale.y) * 0.22;
    obj.scale.z += (1 - obj.scale.z) * 0.22;
  }
}
