import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getContactShadowTexture } from './ProceduralTextureAtlas';

const POOL_SIZE = 28;
const DUMMY = new THREE.Object3D();

/** GPU-instanced crisp contact shadows beneath enemies/vehicles + animated Extraction Portal at 100% objective. */
export function EntityShadowPool({ stRef }) {
  const meshRef = useRef(null);
  const portalRef = useRef(null);
  const shadowMap = useMemo(() => getContactShadowTexture(), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1.9, 1.9), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: 0.48, depthWrite: false }), [shadowMap]);

  useFrame(({ clock }) => {
    const im = meshRef.current;
    const st = stRef.current;
    if (portalRef.current && st?.portal) {
      portalRef.current.visible = Boolean(st.portal.active);
      if (st.portal.active) {
        portalRef.current.position.set(st.portal.x, st.portal.y, st.portal.z);
        portalRef.current.rotation.z = clock.elapsedTime * 2.2;
      }
    }
    if (!im || !st) return;
    im.visible = !st.isSky;
    if (st.isSky) return;

    let idx = 0;
    const pushShadow = (x, y, z, scale) => {
      if (idx >= POOL_SIZE) return;
      const h = Math.max(0, y - 1.0);
      DUMMY.position.set(x, 0.025, z);
      DUMMY.rotation.set(-Math.PI / 2, 0, 0);
      DUMMY.scale.setScalar(THREE.MathUtils.clamp(scale - h * 0.1, 0.35, scale));
      DUMMY.updateMatrix();
      im.setMatrixAt(idx, DUMMY.matrix);
      idx += 1;
    };

    for (let i = 0; i < (st.enemies?.length || 0); i += 1) {
      const e = st.enemies[i]; if (e.alive) pushShadow(e.x, e.y, e.z, 1.0);
    }
    if (st.boss?.alive) pushShadow(st.boss.x, st.boss.y, st.boss.z, 2.2);
    for (let i = 0; i < (st.vehicles?.length || 0); i += 1) {
      const v = st.vehicles[i]; if (v.alive) pushShadow(v.x, 1.0, v.z, 1.9);
    }
    for (; idx < POOL_SIZE; idx += 1) {
      DUMMY.position.set(0, -99, 0); DUMMY.scale.setScalar(0.001); DUMMY.updateMatrix();
      im.setMatrixAt(idx, DUMMY.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geo, mat, POOL_SIZE]} frustumCulled={false} />
      <group ref={portalRef} visible={false}>
        <mesh><torusGeometry args={[2.1, 0.22, 10, 28]} /><meshBasicMaterial color="#D96B27" /></mesh>
        <mesh><circleGeometry args={[1.85, 24]} /><meshBasicMaterial color="#F59E0B" transparent opacity={0.32} side={THREE.DoubleSide} /></mesh>
      </group>
    </group>
  );
}
